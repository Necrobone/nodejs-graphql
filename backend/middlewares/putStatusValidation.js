const { body } = require("express-validator");

const putStatusValidation = () => {
  return [
    body("status", "Please enter a valid status").trim().not().isEmpty(),
  ];
};

module.exports = {
  putStatusValidation,
};
