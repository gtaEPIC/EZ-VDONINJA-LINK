export type ClientSocketType = ((ev: ClientEventType, data: unknown, callback?: (res: unknown) => void) => void);

export enum ClientEventType {
    HELLO="HELLO",
    RENAME="RENAME",
    ROOM_JOIN="ROOM_JOIN",
    ROOM_LEAVE="ROOM_LEAVE"
}

export interface ClientI {
    name: string;
    id: string;
}