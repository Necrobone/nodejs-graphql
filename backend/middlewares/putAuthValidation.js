const { body } = require("express-validator");

const User = require("../models/user");

const putAuthValidation = () => {
  return [
    body("email", "Please enter a valid email")
      .isEmail()
      .custom((value, { req }) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("E-mail address already exists!");
          }
        });
      })
      .normalizeEmail(),
    body("password", "Please enter a valid password")
      .trim()
      .isLength({ min: 5 }),
    body("name", "Please enter a valid name").trim().not().isEmpty(),
  ];
};

module.exports = {
  putAuthValidation,
};
