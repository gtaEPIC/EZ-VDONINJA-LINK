import type {ClientI} from "./Client";

export type RoomSocketType = ((ev: RoomEventType, data: unknown, callback?: (res: unknown) => void) => void);

export enum RoomEventType {
    CREATE="CREATE",
    UPDATE="UPDATE",
    JOIN="JOIN",
    LEAVE="LEAVE",
    LINK="LINK"
}

export interface RoomI {
    clients: ClientI[];
    name: string;
}