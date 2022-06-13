const User = require("../models/user");
const bcrypt = require("bcryptjs");

module.exports = {
  createUser: async function ({ userInput }, request) {
    const email = userInput.email;
    const password = userInput.password;
    const name = userInput.name;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error("User exists already!");
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      name,
    });
    const createdUser = await user.save();

    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
};
