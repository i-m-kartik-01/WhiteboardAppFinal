const express = require("express");
require("dotenv").config();
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");
const FRONTEND_URL = process.env.FRONTEND_URL;
const connectDB = require("./connection");
const userRouter = require("./routes/userRoutes");
const canvasRouter = require("./routes/canvasRoutes");


const app = express();
const PORT = 5003;

/* =========================
   EXPRESS MIDDLEWARE
   ========================= */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/canvas", canvasRouter);

connectDB();

/* =========================
   HTTP + SOCKET.IO SERVER
   ========================= */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

/* =========================
   IN-MEMORY CANVAS STORE
   ========================= */
// canvasId -> elements[]
const canvases = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  /* =========================
     JOIN CANVAS
     ========================= */
  socket.on("join-canvas", ({ canvasId }) => {
    socket.join(canvasId);

    if (!canvases.has(canvasId)) {
      canvases.set(canvasId, []);
    }

    // send authoritative state
    socket.emit("canvas-sync", {
      elements: canvases.get(canvasId),
    });
  });

  /* =========================
     LIVE PREVIEW (NO STATE)
     ========================= */
  socket.on("drawing-progress", ({ canvasId, element }) => {
    socket.to(canvasId).emit("drawing-progress", {
      userId: socket.id,
      element,
    });
  });

  /* =========================
     FINAL COMMIT (AUTHORITATIVE)
     ========================= */
  socket.on("drawing-commit", ({ canvasId, element }) => {
    if (!canvases.has(canvasId)) {
      canvases.set(canvasId, []);
    }

    const elements = canvases.get(canvasId);
    elements.push(element);

    // broadcast FULL authoritative state
    io.to(canvasId).emit("canvas-sync", {
      elements,
    });
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
   ========================= */
server.listen(PORT, () => {
  console.log(`API + Socket server running on port ${PORT}`);
});
