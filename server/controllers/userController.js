const User = require("../models/UserModel");
const validator = require('validator');
const jwt = require("jsonwebtoken");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");
const crypto = require("crypto");
const registerUser = async (req, res) => {
  try {
    const { username, name, email, password } = req.body;

    // Basic empty checks
    if (!username || !name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate username (only letters, numbers, underscores, 3-20 chars)
    if (!validator.isLength(username, { min: 3, max: 20 })) {
      return res.status(400).json({ message: "Username must be 3–20 characters long" });
    }
    if (!validator.isAlphanumeric(username)) {
      return res.status(400).json({ message: "Username must contain only letters and numbers" });
    }

    // Validate password strength
    if (!validator.isLength(password, { min: 6 })) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.register(username, name, email, password);

    const userSafe = user.toObject();
    delete userSafe.passwordHash;

    console.log("User Registered");

    return res.status(201).json({
      message: "User registered successfully",
      user: userSafe,
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(400).json({ message: error.message });
  }
};


const loginUser = async (req, res) => {
  try {

    console.log("logging in")
    const { email, password } = req.body;

    const user = await User.login(email, password);

    // Access token (short-lived)
    const accessToken = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Refresh token (long-lived)
    const newrefreshToken = crypto.randomBytes(40).toString("hex");

    // Store refresh token in DB
    user.refreshToken = newrefreshToken;
    await user.save();
    // Send refresh token as HTTP-only cookie
    res.cookie("refreshToken", newrefreshToken, {
      httpOnly: true,
      secure: (process.env.NODE_ENV === "production"), // true in production (HTTPS)
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    return res.status(200).json({
      message: "Login successful",
      accessToken
    });

  } catch (error) {
    return res.status(401).json({ message: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  console.log("RAW cookie header:", req.headers.cookie);
  console.log("PARSED cookies:", req.cookies);

  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }
    const user = await User
      .findOne({ refreshToken })
      .select("+refreshToken");

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Issue new access token
    const newAccessToken = jwt.sign(
      { userId: user._id.toString() },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.status(200).json({
      accessToken: newAccessToken
    });

  } catch (error) {
    return res.status(401).json({ message: "Refresh failed" });
  }
};


const getAllUsers = async (req, res) => {
  try {
    const users = await User.getUsers();
    // console.log("GetAllUsers called");
    return res.status(200).json({ users });
  } catch (error) {
    console.error("GetUsers error:", error);
    return res.status(400).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    // Get userId from JWT middleware
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // Fetch user from DB (exclude sensitive fields)
    const user = await User.findById(userId).select("-passwordHash -__v");

    console.log(user.name + " Profile accessed ");

    if (!user ) {
      return res.status(404).json({ message: "User not found" });
    }

    //  Update lastSeenAt (optional but recommended)
    user.lastSeenAt = new Date();
    await user.save();

    // Send safe profile data
    return res.status(200).json({
      message: "Profile fetched successfully",
      user
    });

  } catch (error) {
    console.error("GetProfile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
    refreshAccessToken,
    registerUser,
    loginUser,
    getAllUsers,
    getProfile,
}