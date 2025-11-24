import {RoomEventType, type RoomI} from "../../../shared/Room.ts";
import {socketSendRoom} from "../socket.ts";
import type {ClientI} from "../../../shared/Client.ts";

export default class Room implements RoomI {
    private _name: string;
    private _clients: ClientI[];

    constructor(data: RoomI) {
        this._name = data.name;
        this._clients = data.clients;
    }

    static handleEvents(room: Room | null, reactCallback: (room: Room | null) => void, ev: RoomEventType, data: any, callback?: (res: unknown) => void, deviceParams?: {videodevice: string, audiodevice: string}, cameras?: MediaDeviceInfo[], microphones?: MediaDeviceInfo[]) {
        switch (ev) {
            case RoomEventType.CREATE:
                const roomData: RoomI = data;
                console.log("Room created", data);
                const newRoom: Room = new Room(roomData);
                reactCallback(newRoom);
                break;
            case RoomEventType.UPDATE:
                const roomData2: RoomI = data;
                console.log("Room updated", data);
                const updatedRoom = new Room({
                    name: roomData2.name,
                    clients: roomData2.clients
                });
                reactCallback(updatedRoom);
                break;
            case RoomEventType.LEAVE:
                console.log("Left room", data);
                reactCallback(null);
                break;
            case RoomEventType.JOIN:
                const roomData3: RoomI = data;
                console.log("Joined room", data);
                const joinedRoom = new Room(roomData3);
                reactCallback(joinedRoom);
                break;
            case RoomEventType.LINK:
                console.log("Room link received", data);
                if (data && data.link && deviceParams && cameras && microphones) {
                    let finalUrl = data.link;

                    // Add videodevice parameter using label with spaces replaced by underscores
                    if (deviceParams.videodevice === 'disabled') {
                        finalUrl += '&videodevice=0';
                    } else if (deviceParams.videodevice) {
                        const selectedCamera = cameras.find(cam => cam.deviceId === deviceParams.videodevice);
                        if (selectedCamera && selectedCamera.label) {
                            // Convert to lowercase, replace all non-alphanumeric chars with underscores, collapse multiple underscores
                            const formattedLabel = selectedCamera.label
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, '_')
                                .replace(/_+/g, '_');
                            finalUrl += `&videodevice=${formattedLabel}`;
                            console.log('Camera label formatted:', selectedCamera.label, '->', formattedLabel);
                        }
                    }

                    // Add audiodevice parameter using label with spaces replaced by underscores
                    if (deviceParams.audiodevice === 'disabled') {
                        finalUrl += '&audiodevice=0';
                    } else if (deviceParams.audiodevice) {
                        const selectedMic = microphones.find(mic => mic.deviceId === deviceParams.audiodevice);
                        if (selectedMic && selectedMic.label) {
                            // Convert to lowercase, replace all non-alphanumeric chars with underscores, collapse multiple underscores
                            const formattedLabel = selectedMic.label
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, '_')
                                .replace(/_+/g, '_');
                            finalUrl += `&audiodevice=${formattedLabel}`;
                            console.log('Microphone label formatted:', selectedMic.label, '->', formattedLabel);
                        }
                    }

                    console.log("Navigating to VDO.ninja:", finalUrl);
                    // Navigate to the URL in the current tab
                    window.location.href = finalUrl;
                }
                break;
        }
    }

    get name(): string {
        return this._name;
    }

    get clients(): ClientI[] {
        return this._clients;
    }

    toObject(): RoomI {
        return {
            name: this.name,
            clients: this.clients,
        }
    }
}