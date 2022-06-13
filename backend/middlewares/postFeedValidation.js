const { body } = require("express-validator");

const postFeedValidation = () => {
  return [
    body("title", "Please enter a valid title")
      .trim()
      .isString()
      .isLength({ min: 5 }),
    body("content", "Please enter a valid description")
      .trim()
      .isLength({ min: 5 }),
  ];
};

module.exports = {
  postFeedValidation,
};
