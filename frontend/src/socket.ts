import { io, Socket } from "socket.io-client";
import {type ServerToClientEvents, type ClientToServerEvents} from "../../shared/Socket-Types.ts";
import {ClientEventType} from "../../shared/Client.ts";
import {RoomEventType} from "../../shared/Room.ts";

// For production (Docker), connect to same origin - nginx will proxy to backend
// For development, use the full URL with port
const URL = import.meta.env.VITE_SERVER
    ? `${window.location.protocol}//${window.location.hostname}:${window.location.port}`
    : `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_PORT || window.location.port}`;

console.log("Socket.IO URL:", URL);
console.log("Path:", import.meta.env.VITE_SERVER || "/socket.io");

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(URL as string, {
    autoConnect: false, // Connect manually when needed
    path: import.meta.env.VITE_SERVER ? "/socket.io/" : "/socket.io/"
});

export function socketSendClient(ev: ClientEventType, data: any, callback?: (res: unknown) => void) {
    socket.emit("client", ev, data, callback);
}

export function socketSendRoom(ev: RoomEventType, data: any, callback?: (res: unknown) => void) {
    socket.emit("room", ev, data, callback);
}