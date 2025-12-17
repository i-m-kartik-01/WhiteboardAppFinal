const express = require("express");
require("dotenv").config();
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const connectDB = require("./connection");
const userRouter = require("./routes/userRoutes");
const canvasRouter = require("./routes/canvasRoutes");

const app = express();
const PORT = process.env.PORT || 5003;

/* =========================
   CONSTANTS (IMPORTANT)
   ========================= */
const FRONTEND_ORIGIN = "https://calm-mud-013ba4c00.3.azurestaticapps.net";

/* =========================
   GLOBAL CORS FALLBACK (CRITICAL FOR AZURE)
   ========================= */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

/* =========================
   EXPRESS MIDDLEWARE
   ========================= */
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);
console.log("FRONTEND_URL =", process.env.FRONTEND_URL);
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
   SOCKET.IO (AZURE SAFE CONFIG)
   ========================= */
const io = new Server(server, {
  path: "/socket.io",
  transports: ["websocket"], // 🚀 avoid polling issues
  cors: {
    origin: FRONTEND_ORIGIN,
    methods: ["GET", "POST"],
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

    io.to(canvasId).emit("canvas-sync", {
      elements,
    });
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
