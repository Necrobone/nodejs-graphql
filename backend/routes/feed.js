const express = require("express");

const feedController = require("../controllers/feed");
const { postFeedValidation } = require("../middlewares/postFeedValidation");
const { putFeedValidation } = require("../middlewares/putFeedValidation");
const isAuth = require("../middlewares/is-auth");

const router = express.Router();

router.get("/posts", isAuth, feedController.getPosts);
router.post("/posts", isAuth, postFeedValidation(), feedController.createPost);
router.get("/posts/:id", isAuth, feedController.getPost);
router.put(
  "/posts/:id",
  isAuth,
  putFeedValidation(),
  feedController.updatePost
);
router.delete("/posts/:id", isAuth, feedController.deletePost);

module.exports = router;
