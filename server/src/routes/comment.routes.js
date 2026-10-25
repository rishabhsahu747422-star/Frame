import express from "express";
import {
  createComments,
  deleteComment,
  getComments,
  likeComment,
  updateComment,
} from "../controllers/comment.controller.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createComments);
router.post("/", authMiddleware, createComments);

router.patch("/update/:id", authMiddleware, updateComment);
router.patch("/:id", authMiddleware, updateComment);

router.delete("/delete/:id", authMiddleware, deleteComment);
router.delete("/:id", authMiddleware, deleteComment);

router.patch("/like/:id", authMiddleware, likeComment);
router.patch("/:id/like", authMiddleware, likeComment);

router.get("/:id", optionalAuthMiddleware, getComments);

export default router;