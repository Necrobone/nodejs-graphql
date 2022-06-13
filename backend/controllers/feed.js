const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");

const io = require("../socket");
const Post = require("../models/post");
const User = require("../models/user");

exports.getPosts = async (request, response, next) => {
  const page = request.query.page || 1;
  const items = 2;

  try {
    const totalItems = await Post.find().countDocuments();
    const posts = await Post.find()
      .populate("creator")
      .sort({ createdAt: -1 })
      .skip((page - 1) * items)
      .limit(items);

    response.status(200).json({
      message: "Fetched posts successfully",
      posts,
      totalItems,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.createPost = async (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw error;
  }

  if (!request.file) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw Error;
  }

  const title = request.body.title;
  const content = request.body.content;
  const imageUrl = request.file.path.replace("\\", "/");
  const creator = request.userId;

  const post = new Post({
    title,
    content,
    imageUrl,
    creator,
  });

  try {
    await post.save();

    const user = await User.findById(creator);
    await user.posts.push(post);
    await user.save();

    io.getIO().emit("posts", {
      action: "create",
      post: { ...post._doc, creator: { _id: request.userId, name: user.name } },
    });

    response.status(201).json({
      message: "Post created successfully!",
      post,
      creator: {
        _id: user._id,
        name: user.name,
      },
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getPost = async (request, response, next) => {
  try {
    const post = await Post.findById(request.params.id);
    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    response.status(200).json({
      message: "Post fetched",
      post,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.updatePost = async (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    throw error;
  }

  const id = request.params.id;
  const title = request.body.title;
  const content = request.body.content;
  let imageUrl = request.body.image;

  if (request.file) {
    imageUrl = request.file.path.replace("\\", "/");
  }

  if (!imageUrl) {
    const error = new Error("No file picked");
    error.statusCode = 422;
    throw error;
  }

  try {
    const post = await Post.findById(id).populate("creator");

    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator._id.toString() !== request.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl) {
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;

    await post.save();

    io.getIO().emit("posts", {
      action: "update",
      post,
    });

    response.status(200).json({
      message: "Post updated successfully!",
      post: post,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.deletePost = async (request, response, next) => {
  const id = request.params.id;

  try {
    const post = await Post.findById(id);

    if (!post) {
      const error = new Error("Could not find post");
      error.statusCode = 404;
      throw error;
    }

    if (post.creator.toString() !== request.userId) {
      const error = new Error("Not authorized");
      error.statusCode = 403;
      throw error;
    }

    clearImage(post.imageUrl);

    await Post.findByIdAndRemove(id);

    const user = await User.findById(request.userId);
    user.posts.pull(id);
    await user.save();

    io.getIO().emit("posts", {
      action: "delete",
      post: id,
    });

    response.status(200).json({
      message: "Post deleted",
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

const clearImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, (error) => console.log(error));
};
