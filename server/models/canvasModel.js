const mongoose = require("mongoose");
const User = require("./UserModel"); // adjust path if needed

const CanvasSchema = new mongoose.Schema(
  {
    // Owner of the canvas
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
      index: true
    },

    // Canvas metadata
    title: {
      type: String,
      required: true,
      trim: true,
      default: "Untitled Canvas"
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    // Canvas state (source of truth)
    elements: [{ type: mongoose.Schema.Types.Mixed, default: [] }]
    ,
    shared_with: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Users',
        }
    ]
  },
  {
    timestamps: true // createdAt, updatedAt
  }
);

CanvasSchema.statics.getAllCanvas = async function (userId) {
  try {
    const canvases = await this.find({
      $or: [
        { owner: userId },
        { shared_with: userId }
      ]
    })
      .select("title description owner shared_with createdAt updatedAt")
      .populate("owner", "username email")
      .sort({ updatedAt: -1 });

    return canvases;

  } catch (error) {
    throw new Error("Error fetching canvases: " + error.message);
  }
};

CanvasSchema.statics.createCanvas = async function ({
  ownerId,
  title,
}) {
  try {
    if (!ownerId) {
      throw new Error("Owner is required");
    }

    const canvas = await this.create({
      owner: ownerId,
      title: title,
      elements: [],
      shared_with: []
    });

    return canvas;

  } catch (error) {
    throw new Error("Error creating canvas: " + error.message);
  }
};

CanvasSchema.statics.loadCanvas = async function (canvasId, userId) {
  try {
    if (!canvasId) {
      throw new Error("Canvas ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }

    const canvas = await this.findOne({
      _id: canvasId,
      $or: [
        { owner: userId },
        { shared_with: userId }
      ]
    })
      .populate("owner", "username email")
      .populate("shared_with", "username email");

    if (!canvas) {
      throw new Error("Canvas not found or access denied");
    }

    return canvas;

  } catch (error) {
    throw new Error("Error loading canvas: " + error.message);
  }
};
CanvasSchema.statics.updateCanvas = async function ({
  canvasId,
  userId,
  elements
}) {
  return await this.findOneAndUpdate(
    {
      _id: canvasId,
      $or: [{ owner: userId }, { shared_with: userId }]
    },
    { $set: { elements } },
    { new: true }
  );
};

CanvasSchema.statics.updateSharedWith = async function ({
  canvasId,
  ownerId,
  email
}) {
  if (!canvasId) {
    throw new Error("Canvas ID is required");
  }
  if (!ownerId) {
    throw new Error("Owner ID is required");
  }
  if (!email) {
    throw new Error("Email is required");
  }

  // Find user by email
  const targetUser = await User.findOne({ email });
  if (!targetUser) {
    throw new Error("User with this email does not exist");
  }

  // Find canvas and ensure caller is owner
  const canvas = await this.findOne({
    _id: canvasId,
    owner: ownerId
  });

  if (!canvas) {
    throw new Error("Canvas not found or not owned by user");
  }

  // Prevent sharing with owner
  if (canvas.owner.toString() === targetUser._id.toString()) {
    throw new Error("Owner cannot be added to shared list");
  }

  // Prevent duplicates
  const alreadyShared = canvas.shared_with.some(
    id => id.toString() === targetUser._id.toString()
  );

  if (alreadyShared) {
    throw new Error("Canvas already shared with this user");
  }

  // Add user
  canvas.shared_with.push(targetUser._id);
  await canvas.save();

  return canvas;
};

CanvasSchema.statics.removeSharedUser = async function ({
  canvasId,
  ownerId,
  targetUserId
}) {
  const canvas = await this.findOne({
    _id: canvasId,
    owner: ownerId
  });

  if (!canvas) {
    throw new Error("Canvas not found or not owned by user");
  }

  canvas.shared_with = canvas.shared_with.filter(
    id => id.toString() !== targetUserId.toString()
  );

  await canvas.save();
  return canvas;
};



const canvas = mongoose.model("Canvas", CanvasSchema);
module.exports = canvas;
