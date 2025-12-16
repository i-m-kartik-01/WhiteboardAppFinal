const mongoose = require("mongoose");
require("dotenv").config(); // to load MONGO_URI from .env

const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing in environment variables");
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("MongoDB Atlas Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
