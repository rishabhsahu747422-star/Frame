import express from "express";
import {
  changePassword,
  followUser,
  getFollowers,
  getFollowing,
  getMe,
  getUserProfile,
  searchUser,
  unfollowUser,
  updateProfile,
  updateProfilePicture,
} from "../controllers/user.controller.js";
import { getUserPostsController } from "../controllers/post.controller.js";
import { upload } from "../config/multer.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

// Specific routes first to prevent collision with :username
router.get("/getMe", authMiddleware, getMe);
router.get("/me", authMiddleware, getMe);
router.patch("/update-profile", authMiddleware, updateProfile);
router.get("/search", optionalAuthMiddleware, searchUser);
router.patch("/follow/:id", authMiddleware, followUser);
router.patch("/unfollow/:id", authMiddleware, unfollowUser);
router.get("/:id/followers", optionalAuthMiddleware, getFollowers);
router.get("/:id/following", optionalAuthMiddleware, getFollowing);
router.get("/:userId/posts", optionalAuthMiddleware, getUserPostsController);
router.patch(
  "/update-profile-pic",
  authMiddleware,
  upload.single("profile_pic"),
  updateProfilePicture
);
router.patch("/change-password", authMiddleware, changePassword);

// Profile lookup by username must come last
router.get("/:username", optionalAuthMiddleware, getUserProfile);

export default router;
