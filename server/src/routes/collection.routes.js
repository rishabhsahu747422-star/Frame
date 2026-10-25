import express from "express";
import {
  addPostToCollection,
  createCollection,
  deleteCollection,
  getCollectionById,
  getMyCollections,
  removePostFromCollection,
  updateCollection,
} from "../controllers/collection.controller.js";
import {
  authMiddleware,
  optionalAuthMiddleware,
} from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createCollection);
router.get("/me", authMiddleware, getMyCollections);
router.get("/:id", optionalAuthMiddleware, getCollectionById);
router.patch("/:id", authMiddleware, updateCollection);
router.delete("/:id", authMiddleware, deleteCollection);
router.post("/:id/posts", authMiddleware, addPostToCollection);
router.delete("/:id/posts/:postId", authMiddleware, removePostFromCollection);

export default router;
