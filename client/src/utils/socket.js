import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL, {
  path: "/socket.io",
  withCredentials: true,
  transports: ["websocket", "polling"],
});

socket.on("connect", () => {
  console.log("Connected to WebSocket:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("Socket error:", err.message);
});

export default socket;
