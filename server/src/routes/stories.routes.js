import express from "express";
import { upload } from "../config/multer.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import {
  createStories,
  deleteStory,
  getStories,
  viewStories,
} from "../controllers/stories.controller.js";

const router = express.Router();

router.post("/create", authMiddleware, upload.single("file"), createStories);
router.post("/", authMiddleware, upload.single("file"), createStories);

router.get("/get-stories", authMiddleware, getStories);
router.get("/", authMiddleware, getStories);

router.patch("/viewers/:id", authMiddleware, viewStories);
router.post("/:id/view", authMiddleware, viewStories);

router.delete("/delete/:id", authMiddleware, deleteStory);
router.delete("/:id", authMiddleware, deleteStory);

export default router;