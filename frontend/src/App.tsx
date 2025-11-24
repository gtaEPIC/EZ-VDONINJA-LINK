import './App.css';
import Card from 'react-bootstrap/Card';
import {BsFillCameraVideoFill} from "react-icons/bs";
import {FaMicrophone} from "react-icons/fa6";
import {useEffect, useRef, useState} from "react";
import {socket, socketSendClient, socketSendRoom} from "./socket.ts";
import Client from "./classes/Client.ts";
import Room from "./classes/Room.ts";
import Spinner from 'react-bootstrap/Spinner'
import {ClientEventType, ClientI} from "../../shared/Client.ts";
import {RoomEventType} from "../../shared/Room.ts";
import Form from "react-bootstrap/Form";
import InputGroup from "react-bootstrap/InputGroup";
import Button from "react-bootstrap/Button";
import ListGroup from "react-bootstrap/ListGroup";
import {TbReload} from "react-icons/tb";

function App() {
    const [isConnected, setIsConnected] = useState(socket.connected);

    const [localClient, setLocalClient] = useState<Client | null>(null);
    const localClientRef = useRef<Client | null>(null);
    const [clientData, setClientData] = useState<ClientI | null>(null);

    const [room, setRoom] = useState<Room | null>(null);
    const roomRef = useRef<Room | null>(null);
    const [roomNameInput, setRoomNameInput] = useState<string>("");

    const [selectedCamera, setSelectedCamera] = useState<string>("disabled");
    const [selectedMicrophone, setSelectedMicrophone] = useState<string>("disabled");
    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);

    const selectedDevicesRef = useRef({videodevice: "disabled", audiodevice: "disabled"});
    const camerasRef = useRef<MediaDeviceInfo[]>([]);
    const microphonesRef = useRef<MediaDeviceInfo[]>([]);

    useEffect(() => {
        function onConnect() {
            setIsConnected(true);
        }
        function onDisconnect() {
            setIsConnected(false);
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        socket.on('client', (ev, data, cb) => Client.handleEvents(localClientRef.current, setLocalClient, ev, data, cb))
        socket.on('room', (ev, data, cb) => Room.handleEvents(
            roomRef.current,
            setRoom,
            ev,
            data,
            cb,
            selectedDevicesRef.current,
            camerasRef.current,
            microphonesRef.current
        ))

        socket.connect();


        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('client')
            socket.off('room')
            socket.disconnect();
        }
    }, []);

    useEffect(() => {
        localClientRef.current = localClient;
        if (localClient)
            setClientData(localClient.toObject());
        else
            setClientData(null);
    }, [localClient]);

    useEffect(() => {
        roomRef.current = room;
    }, [room]);

    useEffect(() => {
        selectedDevicesRef.current = {
            videodevice: selectedCamera,
            audiodevice: selectedMicrophone
        };
    }, [selectedCamera, selectedMicrophone]);

    useEffect(() => {
        camerasRef.current = cameras;
    }, [cameras]);

    useEffect(() => {
        microphonesRef.current = microphones;
    }, [microphones]);

    useEffect(() => {
        async function requestPermissionsAndEnumerate() {
            try {
                // Request permissions to access camera and microphone
                // This will trigger browser permission prompt
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                // Stop all tracks immediately - we only needed permission
                stream.getTracks().forEach(track => track.stop());

                // Now enumerate devices with full labels
                await enumerateDevices();
            } catch (error) {
                console.error('Error requesting permissions:', error);
                // Still try to enumerate devices even if permission denied
                await enumerateDevices();
            }
        }

        async function enumerateDevices() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                const audioDevices = devices.filter(device => device.kind === 'audioinput');
                setCameras(videoDevices);
                setMicrophones(audioDevices);
            } catch (error) {
                console.error('Error enumerating devices:', error);
            }
        }

        requestPermissionsAndEnumerate();

        try {
            navigator.mediaDevices.addEventListener('devicechange', enumerateDevices);
        }catch (e) {
            console.error(e);
        }

        return () => {
            try {
                navigator.mediaDevices.removeEventListener('devicechange', enumerateDevices);
            }catch (e) {
                console.error(e);
            }
        };
    }, []);

  return (
    <div className="container-lg">
        <Card className="m-4">
            <center>
                <Card.Body>
                    <Card.Title as={"h1"}><BsFillCameraVideoFill /> EZ VDO Link <FaMicrophone /></Card.Title>
                    <Card>
                        {!isConnected && (<Card.Body>
                            <Spinner animation={"border"} role={"status"} className={"mt-2 mb-1"}>
                                <span className={"visually-hidden"}>Loading...</span>
                            </Spinner>
                            <label className={"ms-2"} style={{position: "relative", top:-12}}>Connecting to server...</label>
                        </Card.Body>)}
                        {isConnected && !localClient && (<Card.Body>
                            <Spinner animation={"border"} role={"status"} className={"mt-2 mb-1"}>
                                <span className={"visually-hidden"}>Loading...</span>
                            </Spinner>
                            <label className={"ms-2"} style={{position: "relative", top:-12}}>Getting Client Information...</label>
                        </Card.Body>)}
                        {isConnected && localClient && clientData && (<Card.Body>
                            <Card.Title as={"h3"}>This device info</Card.Title>
                            <InputGroup className={"mb-1"}>
                                <InputGroup.Text id={"client-name"}>Name</InputGroup.Text>
                                <Form.Control
                                  key={localClient.id + localClient.name}
                                  aria-describedby={"client-name"}
                                  as={"input"}
                                  value={clientData.name}
                                  onChange={event =>
                                    setClientData({
                                        ...clientData,
                                        name: event.target.value
                                    })
                                } onBlur={() => {
                                    if (clientData.name !== localClient.name) {
                                        localClient.name = clientData.name
                                    }
                                }} />
                                <Button variant={"primary"} onClick={() => {
                                    socketSendClient(ClientEventType.RENAME, null);
                                }}>
                                    <TbReload size={25} />
                                </Button>
                            </InputGroup>

                            <InputGroup className={"mb-1"}>
                                <InputGroup.Text id={"camera-select"}>Camera</InputGroup.Text>
                                <Form.Select
                                    aria-describedby={"camera-select"}
                                    value={selectedCamera}
                                    onChange={event => setSelectedCamera(event.target.value)}
                                >
                                    <option value="disabled">Disabled</option>
                                    {cameras.map((camera) => (
                                        <option key={camera.deviceId} value={camera.deviceId}>
                                            {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </Form.Select>
                            </InputGroup>

                            <InputGroup className={"mb-3"}>
                                <InputGroup.Text id={"microphone-select"}>Microphone</InputGroup.Text>
                                <Form.Select
                                    aria-describedby={"microphone-select"}
                                    value={selectedMicrophone}
                                    onChange={event => setSelectedMicrophone(event.target.value)}
                                >
                                    <option value="disabled">Disabled</option>
                                    {microphones.map((microphone) => (
                                        <option key={microphone.deviceId} value={microphone.deviceId}>
                                            {microphone.label || `Microphone ${microphone.deviceId.slice(0, 8)}`}
                                        </option>
                                    ))}
                                </Form.Select>
                            </InputGroup>

                            <Card.Title as={"h3"} className={"mt-4"}>Room</Card.Title>
                            {!room && (
                                <>
                                    <Button
                                        variant={"success"}
                                        className={"mb-3 w-100"}
                                        onClick={() => socketSendRoom(RoomEventType.CREATE, null)}
                                    >
                                        Create New Room
                                    </Button>
                                    <InputGroup className={"mb-3"}>
                                        <InputGroup.Text id={"room-name"}>Name</InputGroup.Text>
                                        <Form.Control
                                            aria-describedby={"room-name"}
                                            as={"input"}
                                            placeholder={"Enter room name..."}
                                            value={roomNameInput}
                                            onChange={event => setRoomNameInput(event.target.value)}
                                        />
                                        <Button
                                            variant={"primary"}
                                            onClick={() => {
                                                if (roomNameInput.trim()) {
                                                    socketSendRoom(RoomEventType.JOIN, {name: roomNameInput});
                                                }
                                            }}
                                        >
                                            Join
                                        </Button>
                                    </InputGroup>
                                </>
                            )}
                            {room && (
                                <>
                                    <div className={"mb-3"}>
                                        <strong>Room Name: </strong>{room.name}
                                    </div>
                                    <ListGroup className={"mb-3"}>
                                        {room.clients.map((client) => (
                                            <ListGroup.Item key={client.id}>
                                                {client.name}
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                    <div className={"d-flex gap-2"}>
                                        <Button
                                            variant={"danger"}
                                            className={"flex-fill"}
                                            onClick={() => socketSendRoom(RoomEventType.LEAVE, null)}
                                        >
                                            Leave Room
                                        </Button>
                                        <Button
                                            variant={"primary"}
                                            className={"flex-fill"}
                                            onClick={() => {
                                                socketSendRoom(RoomEventType.LINK, null);
                                            }}>
                                            Send Link
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Card.Body>)}
                    </Card>
                </Card.Body>
            </center>
        </Card>
    </div>
  )
}

export default App
