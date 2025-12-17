const express = require("express");
require("dotenv").config();
const http = require("http");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const connectDB = require("./connection");
const userRouter = require("./routes/userRoutes");
const canvasRouter = require("./routes/canvasRoutes");

const app = express();
const PORT = process.env.PORT || 5003;

/* =========================
   ALLOWED ORIGINS
   ========================= */
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://calm-mud-013ba4c00.3.azurestaticapps.net",
];

/* =========================
   GLOBAL CORS + PREFLIGHT (AZURE SAFE)
   ========================= */
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* =========================
   EXPRESS MIDDLEWARE
   ========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* =========================
   ROUTES
   ========================= */
app.use("/api/users", userRouter);
app.use("/api/canvas", canvasRouter);

/* =========================
   DATABASE
   ========================= */
connectDB();

/* =========================
   HTTP SERVER
   ========================= */
const server = http.createServer(app);

/* =========================
   SOCKET.IO (CORRECT AZURE CONFIG)
   ========================= */
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
});

/* =========================
   IN-MEMORY CANVAS STORE
   ========================= */
const canvases = new Map();

/* =========================
   SOCKET EVENTS
   ========================= */
io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("join-canvas", ({ canvasId }) => {
    socket.join(canvasId);

    if (!canvases.has(canvasId)) {
      canvases.set(canvasId, []);
    }

    socket.emit("canvas-sync", {
      elements: canvases.get(canvasId),
    });
  });

  socket.on("drawing-progress", ({ canvasId, element }) => {
    socket.to(canvasId).emit("drawing-progress", {
      userId: socket.id,
      element,
    });
  });

  socket.on("drawing-commit", ({ canvasId, element }) => {
    if (!canvases.has(canvasId)) {
      canvases.set(canvasId, []);
    }

    const elements = canvases.get(canvasId);
    elements.push(element);

    io.to(canvasId).emit("canvas-sync", { elements });
  });

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
   ========================= */
server.listen(PORT, () => {
  console.log(`🚀 API + Socket server running on port ${PORT}`);
});
