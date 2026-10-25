import express from "express";
import {
  createPostController,
  getAllPostController,
  getFollowingFeedController,
  getSavedPostsController,
  getSinglePostController,
  getUserPostsController,
  likePostController,
  savePostController,
  updatePostController,
  deletePostController,
} from "../controllers/post.controller.js";
import { upload } from "../config/multer.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Specific routes first to prevent collision with :id
router.post(
  "/create",
  authMiddleware,
  upload.array("images", 5),
  createPostController
);

router.get("/feed/following", authMiddleware, getFollowingFeedController);
router.get("/saved/me", authMiddleware, getSavedPostsController);
router.get("/user/:userId", optionalAuthMiddleware, getUserPostsController);

// General feed
router.get("/", optionalAuthMiddleware, getAllPostController);

// Post by ID and actions
router.get("/:id", optionalAuthMiddleware, getSinglePostController);
router.put("/update/:id", authMiddleware, updatePostController);
router.put("/:id", authMiddleware, updatePostController);
router.patch("/:id", authMiddleware, updatePostController);
router.delete("/:id", authMiddleware, deletePostController);
router.patch("/:id/like", authMiddleware, likePostController);
router.patch("/:id/save", authMiddleware, savePostController);

export default router;
