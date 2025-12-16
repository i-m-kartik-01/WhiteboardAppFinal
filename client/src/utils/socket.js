import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL, {
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Connected to WebSocket:", socket.id);
});

export default socket; // ⭐ THIS LINE WAS MISSING
