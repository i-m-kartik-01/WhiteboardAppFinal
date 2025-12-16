const Post = require("../models/postModel");

createPost = async (req, res) => {
  try {
    const { title, content} = req.body;

    // Basic validation
    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const post = await Post.create({
      title,
      content,
      author: req.user?._id || req.body.user, // optional: if you use auth middleware
    });

    return res.status(201).json({
      message: "Post created successfully",
      post,
    });
  } catch (err) {
    console.error("Error creating post:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find({})
    //   .sort({ createdAt: -1 })        // newest first
      .populate("author", "username email"); // optional: show some author fields

    return res.status(200).json({
      count: posts.length,
      posts,
    });
  } catch (err) {
    console.error("Error fetching posts:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

