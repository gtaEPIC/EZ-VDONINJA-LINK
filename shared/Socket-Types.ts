import type {ClientSocketType} from "./Client";
import type {RoomSocketType} from "./Room";

export interface ServerToClientEvents {
    // noArg: () => void;
    // basicEmit: (a: number, b: string, c: Buffer) => void;
    // withAck: (d: string, callback: (e: number) => void) => void;
    room: RoomSocketType,
    client: ClientSocketType,
}

export interface ClientToServerEvents {
    // hello: () => void;
    room: RoomSocketType,
    client: ClientSocketType,
}
export type validEventType = "room" | "client";

export interface InterServerEvents {
    ping: () => void;
}

export interface SocketData {
    name: string;
    age: number;
}