const express = require('express');
const PORT = 5001;
const cors = require('cors')
const connectDB = require("./connection");
const userRouter = require('./routes/userRoutes');
const canvasRouter = require('./routes/canvasRoutes');
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();

app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/canvas", canvasRouter);

connectDB();

app.listen(PORT, () => console.log(`Server Started at Port: ${PORT}`));
