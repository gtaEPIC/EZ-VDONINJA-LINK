import { Server } from "socket.io";
import {ClientToServerEvents, InterServerEvents, ServerToClientEvents, SocketData} from "../../shared/Socket-Types";
import Client from "./Client";
import Room from "./Room";

export const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>({
    cors: {
        origin: ["http://localhost:5173", "http://10.0.1.113:5173", "http://10.241.0.1:5173", process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN : ""],
        credentials: true
    }
});

console.log("Starting Socket.IO server on port 3000...");
console.log("CORS_ORIGIN:", process.env.CORS_ORIGIN);

io.listen(3000);

io.engine.on("connection_error", (err) => {
    console.log("Connection error:", err);
});

io.on("connection", (socket) => {
    const client: Client = new Client(socket);
    console.log("New Client connected:", socket.id, client);

    socket.on("room", (...args) => Room.handleEvent(client, ...args))
    socket.on("client", (...args) => Client.handleEvent(client, ...args))

    socket.on('disconnect', () => client.shutdown())
});

