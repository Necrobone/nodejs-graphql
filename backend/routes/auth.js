const express = require("express");

const authController = require("../controllers/auth");
const isAuth = require("../middlewares/is-auth");
const { putAuthValidation } = require("../middlewares/putAuthValidation");
const { putStatusValidation } = require("../middlewares/putStatusValidation");

const router = express.Router();

router.put("/signup", putAuthValidation(), authController.signup);
router.post("/login", authController.login);
router.get("/status", isAuth, authController.getStatus);
router.patch(
  "/status",
  isAuth,
  putStatusValidation(),
  authController.updateStatus
);

module.exports = router;
