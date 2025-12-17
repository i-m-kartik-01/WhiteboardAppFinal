import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL, {
  path: "/socket.io",
  transports: ["websocket"],
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

export default socket;
