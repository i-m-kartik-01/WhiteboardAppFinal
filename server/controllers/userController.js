const User = require("../models/UserModel");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");
const crypto = require("crypto");

/* =========================
   REGISTER
   ========================= */
const registerUser = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    if (!validator.isLength(username, { min: 3, max: 20 })) {
      return res.status(400).json({
        message: "Username must be 3–20 characters long",
      });
    }

    if (!validator.isAlphanumeric(username)) {
      return res.status(400).json({
        message: "Username must contain only letters and numbers",
      });
    }

    if (!validator.isLength(password, { min: 6 })) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const user = await User.register(username, name, email, password);

    const userSafe = user.toObject();
    delete userSafe.passwordHash;

    return res.status(201).json({
      message: "User registered successfully",
      user: userSafe,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(400).json({ message: error.message });
  }
};

/* =========================
   LOGIN
   ========================= */
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.login(email, password);

    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = crypto.randomBytes(40).toString("hex");

    user.refreshToken = refreshToken;
    await user.save();

    // 🔑 CRITICAL FIX HERE
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,        // REQUIRED on Azure
      sameSite: "none",    // REQUIRED for cross-origin
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(401).json({ message: error.message });
  }
};

/* =========================
   REFRESH TOKEN
   ========================= */
const refreshAccessToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({ accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ message: "Refresh failed" });
  }
};

/* =========================
   USERS / PROFILE
   ========================= */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.getUsers();
    return res.status(200).json({ users });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(userId).select("-passwordHash -__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.lastSeenAt = new Date();
    await user.save();

    return res.status(200).json({
      message: "Profile fetched successfully",
      user,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  getAllUsers,
  getProfile,
};
