import {ClientEventType, type ClientI} from "../../../shared/Client.ts";
import {socketSendClient} from "../socket.ts";

export default class Client implements ClientI {
    private _name: string;
    private _id: string;

    constructor(data: ClientI) {
        this._name = data.name;
        this._id = data.id;
    }

    static handleEvents(client: Client | null, reactCallback: (client: Client) => void, ev: ClientEventType, data: any, callback?: (res: unknown) => void) {
        switch (ev) {
            case ClientEventType.HELLO:
                const clientData: ClientI = data;
                console.log("Client Data received", data);
                const newClient: Client = new Client(clientData)
                newClient._name = clientData.name;
                newClient._id = clientData.id;
                reactCallback(newClient);
                break;
            case ClientEventType.RENAME:
                if (!client) return console.error("Client Renamed with no client");
                const clientData2: ClientI = data;
                console.log("client renamed", data);
                const updatedClient = new Client({
                    id: client._id,
                    name: clientData2.name
                });
                reactCallback(updatedClient);
                break;
        }
    }


    get name(): string {
        return this._name;
    }

    set name(value: string) {
        this._name = value;
        socketSendClient(ClientEventType.RENAME, this.toObject())
    }

    get id(): string {
        return this._id;
    }

    toObject(): ClientI {
        return {
            name: this.name,
            id: this.id,
        }
    }
}