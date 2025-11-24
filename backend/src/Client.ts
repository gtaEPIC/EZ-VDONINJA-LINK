import {Socket} from "socket.io";
import {ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData} from "../../shared/Socket-Types";
import Room from "./Room";
import generateWord from "./generateWord";
import {ClientEventType, ClientI} from "../../shared/Client";

export const activeClients: Client[] = [];



export default class Client implements ClientI {
    private readonly _id: string
    private readonly _socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
    private _name: string;
    private _room: Room | undefined;

    constructor(socket: Socket) {
        this._id = socket.id;
        this._socket = socket;
        this._name = "Loading..."
        generateWord().then(name => {
            this._name = name;
            this.socket.emit("client", ClientEventType.HELLO, this.toObject());
            console.log("Name given", this);
            activeClients.push(this);
        })
    }

    shutdown() {
        activeClients.splice(activeClients.indexOf(this), 1);
        if (this.room) {
            this.room.removeClient(this);
        }
        console.log("Client shutdown", this);
        if (this.socket) this.socket.disconnect(true);
        else console.warn("Client disconnected but doesn't have socket")
    }

    private send(ev: ClientEventType, data: any, callback?: (res: unknown) => void) {
        this.socket.emit("client", ev, data, callback);
    }

    static async handleEvent(client: Client, ev: ClientEventType, data: any, callback?: (res: unknown) => void) {
        switch (ev) {
            case ClientEventType.HELLO:
                console.log("HELLO client", data);
                break;
            case ClientEventType.RENAME:
                const newName: string = data ? data.name : await generateWord();
                console.log("RENAME client", newName);
                if (!newName) {
                    if (callback) callback({error: "No Name"});
                    throw new Error("Client requested new name with no new name");
                }
                client._name = newName;
                if (client.room) client.room.sendUpdate();
                if (callback) callback(client.toObject());
                else client.send(ClientEventType.RENAME, client.toObject());
                break;
        }
    }


    get id(): string {
        return this._id;
    }
    get socket(): Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
        return this._socket;
    }
    get name(): string {
        return this._name;
    }
    get room(): Room | undefined {
        return this._room;
    }
    set room(room) {
        if (this.room) {
            this.room.removeClient(this);
        }
        this._room = room;
        if (room)
            this.send(ClientEventType.ROOM_JOIN, room.toObject());
    }

    toObject(): ClientI {
        return {
            name: this.name,
            id: this.id,
        }
    }
}