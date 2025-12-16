const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    numberOfLikes:{ type: Number, default: 0},

    // The user who created the post
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      required: true 
    }
  },
  { timestamps: true }
);

const postmodel = mongoose.model("Post", PostSchema);

module.exports = postmodel;
