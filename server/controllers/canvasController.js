const Canvas = require("../models/canvasModel");
// const { create } = require("../models/UserModel");
const User = require("../models/UserModel");

const getAllCanvas = async (req, res) => {
    const userId = req.userId;
    try{
        const canvases = await Canvas.getAllCanvas(userId);
        console.log("all canvases related to user sent");
        res.status(200).json(canvases);
    }catch(error){
        res.status(400).json({ message: error.message});
    }
}

const createCanvas = async (req, res) => {
  try {
    const ownerId = req.userId;
    const { title } = req.body;

    const canvas = await Canvas.createCanvas({
      ownerId,
      title,
    });

    res.status(201).json(canvas);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const loadCanvas = async (req, res) => {
  try {
    const { canvasId } = req.params;
    const userId = req.userId;

    const canvas = await Canvas.loadCanvas(canvasId, userId);

    res.status(200).json(canvas);
  } catch (error) {
    res.status(403).json({ message: error.message });
  }
};
const updateCanvas = async (req, res) => {
  const { canvasId, elements } = req.body;

  const canvas = await Canvas.updateCanvas({
    canvasId,
    userId: req.userId,
    elements
  });

  res.json({ success: true, canvas });
};

const shareCanvas = async (req, res) => {
  try {
    const ownerId = req.userId;
    const { canvasId, email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find target user by email
    const targetUser = await User.findOne({ email });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const updatedCanvas = await Canvas.updateSharedWith({
      canvasId,
      ownerId,
      email
    });

    res.status(200).json({
      message: "Canvas shared successfully",
      canvas: updatedCanvas
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


const deleteSharedUser = async (req, res) => {
  try {
    const ownerId = req.userId;
    const { canvasId, targetUserId } = req.body;

    if (!canvasId || !targetUserId) {
      return res.status(400).json({
        message: "canvasId and targetUserId are required"
      });
    }

    const canvas = await Canvas.removeSharedUser({
      ownerId,
      canvasId,
      targetUserId
    });

    res.status(200).json({
      message: "User removed from sharing list",
      canvas
    });

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};



module.exports = {
    getAllCanvas,
    createCanvas,
    loadCanvas,
    updateCanvas,
    shareCanvas,
    deleteSharedUser,
}
