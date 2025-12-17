import { io } from "socket.io-client";

const socket = io("https://whiteboardapp-c4e7akaea7a6hndk.centralindia-01.azurewebsites.net", {
  path: "/socket.io",
  transports: ["websocket"],
  withCredentials: true,
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);
});

export default socket;
