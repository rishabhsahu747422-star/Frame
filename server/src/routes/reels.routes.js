import express from "express";
import { upload } from "../config/multer.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware.js";
import {
  createReel,
  deleteReel,
  getAllReels,
  getReelsByUser,
  getSingleReel,
  likeReel,
  updateReel,
  viewReel,
} from "../controllers/reels.controller.js";

const router = express.Router();

router.post("/", authMiddleware, upload.single("video"), createReel);
router.get("/", optionalAuthMiddleware, getAllReels);
router.get("/user/:userId", optionalAuthMiddleware, getReelsByUser);
router.get("/:id", optionalAuthMiddleware, getSingleReel);
router.patch("/:id", authMiddleware, updateReel);
router.delete("/:id", authMiddleware, deleteReel);
router.patch("/:id/like", authMiddleware, likeReel);
router.post("/:id/view", optionalAuthMiddleware, viewReel);

export default router;