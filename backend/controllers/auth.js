const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/user");

exports.signup = async (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const email = request.body.email;
  const password = request.body.password;
  const name = request.body.name;

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });
    await user.save();

    response.status(201).json({
      message: "User created successfully!",
      user: user._id,
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.login = async (request, response, next) => {
  const email = request.body.email;
  const password = request.body.password;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error("Email could not be found");
      error.statusCode = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Wrong password");
      error.statusCode = 401;
      throw error;
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      "secret",
      {
        expiresIn: "1h",
      }
    );

    response.status(200).json({
      token,
      userId: user._id.toString(),
    });
  } catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};

exports.getStatus = (request, response, next) => {
  User.findById(request.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User could not be found");
        error.statusCode = 404;
        throw error;
      }

      response.status(200).json({
        status: user.status,
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};

exports.updateStatus = (request, response, next) => {
  const errors = validationResult(request);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed, entered data is incorrect");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }

  const status = request.body.status;

  User.findById(request.userId)
    .then((user) => {
      if (!user) {
        const error = new Error("User could not be found");
        error.statusCode = 404;
        throw error;
      }

      user.status = status;
      return user.save();
    })
    .then(() => {
      response.status(200).json({
        message: "Status Updated",
      });
    })
    .catch((error) => {
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    });
};
