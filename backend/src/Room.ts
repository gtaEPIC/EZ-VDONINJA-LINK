import Client from "./Client";
import generateWord from "./generateWord";
import {io} from "./index";
import {RoomEventType, RoomI} from "../../shared/Room";

export const rooms: Room[] = [];


export default class Room implements RoomI {
    private _clients: Client[] = [];
    private _name: string;
    private readonly _id: string;

    constructor(clients: Client[], name?: string) {
        if (!clients || clients.length < 1) throw new Error("There must be at least 1 client to make a room")
        this._clients.push(...clients);
        this._name = name ? name : "loading..."
        this._id = Date.now().toFixed();
        rooms.push(this);
        console.log("New Room", this)

        if (!name)
            generateWord().then(name => {
                this._name = name;
                for (let client of clients) {
                    this.newClient(client);
                }
            })
        else {
            for (let client of clients) {
                this.newClient(client);
            }
        }
    }

    closeRoom() {
        console.log("Closing Room", this);
        this._clients.forEach((client: Client) => {
            client.socket.leave(this.name)
        });
        rooms.splice(rooms.indexOf(this), 1);
    }

    newClient(client: Client) {
        console.log("New Client in room", this, client);
        client.socket.join(this.name);
        client.room = this;
        if (this.clients.indexOf(client) == -1) this._clients.push(client);
        this.sendUpdate();
    }

    removeClient(client: Client) {
        console.log("Removing client from room", this, client);
        client.socket.leave(this.name);
        this._clients.splice(this._clients.indexOf(client), 1);
        if (this._clients.length === 0) this.closeRoom();
        else this.sendUpdate();
    }

    private broadcast(ev: RoomEventType, data: unknown, callback?: (res: unknown) => void) {
        io.to(this.name).emit("room", ev, data, callback);
    }

    sendUpdate() {
        this.broadcast(RoomEventType.UPDATE, this.toObject())
    }

    sendLink() {
        this.broadcast(RoomEventType.LINK, {link: `https://vdo.ninja/?room=${this.name}&autostart&wc&ee&od&proaudio=1`})
    }

    static findRoom(client: Client): Room | undefined {
        return rooms.find(r => r.clients.find(c => c.id === client.id));
    }

    static handleEvent(client: Client, ev: RoomEventType, data: any, callback?: (res: unknown) => void) {
        switch (ev) {
            case RoomEventType.CREATE:
                if (data) new Room([client], data.name);
                else new Room([client]);
                break;
            case RoomEventType.UPDATE:
                if (callback) {
                    const room = this.findRoom(client);
                    console.log("Room find", room);
                    if (room) callback(room.toObject());
                    else callback(undefined);
                }
                break;
            case RoomEventType.JOIN:
                if (!data) return client.shutdown();
                const { name } = data;
                if (!name) return client.shutdown();
                const room = rooms.find(r => r.name === name);
                if (!room) return client.socket.emit("room", RoomEventType.UPDATE, {error: "Not Found"});
                room.newClient(client);
                break;
            case RoomEventType.LEAVE:
                client.socket.emit("room", RoomEventType.LEAVE, null);
                client.room = undefined;
                break;
            case RoomEventType.LINK:
                const room2 = this.findRoom(client);
                console.log("Room find", room2);
                if (room2) room2.sendLink();
                break;
        }
    }



    get clients(): Client[] {
        return this._clients;
    }
    get name(): string {
        return this._name;
    }
    get id(): string {
        return this._id;
    }
    toObject(): RoomI {
        return {
            clients: this.clients.map(c => c.toObject()),
            name: this.name,
        }
    }
}