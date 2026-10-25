import CollectionModel from "../models/collection.model.js";
import PostModel from "../models/post.model.js";
import { isValidObjectId } from "../middlewares/error.middleware.js";

/**
 * Create a new Collection
 */
export const createCollection = async (req, res, next) => {
  try {
    const { title, description, isPublic, coverImage, coverPost } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Collection title is required",
      });
    }

    if (coverPost) {
      if (!isValidObjectId(coverPost)) {
        return res.status(400).json({ success: false, message: "Invalid cover post ID" });
      }
      const postExists = await PostModel.findById(coverPost);
      if (!postExists) {
        return res.status(404).json({ success: false, message: "Cover post not found" });
      }
    }

    const collection = await CollectionModel.create({
      user: req.user._id,
      title: title.trim(),
      description: description ? description.trim() : "",
      isPublic: Boolean(isPublic),
      coverImage: coverImage || "",
      coverPost: coverPost || null,
      posts: coverPost ? [coverPost] : [],
    });

    return res.status(201).json({
      success: true,
      message: "Collection created successfully",
      data: collection,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List authenticated user's collections
 */
export const getMyCollections = async (req, res, next) => {
  try {
    const collections = await CollectionModel.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
      .populate({
        path: "coverPost",
        select: "media_urls caption",
      });

    const data = collections.map((col) => {
      const obj = col.toObject();
      obj.postCount = (col.posts || []).length;
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: "Collections fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve a collection by ID subject to privacy rules
 */
export const getCollectionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID format",
      });
    }

    const collection = await CollectionModel.findById(id)
      .populate("user", "username fullName profile_pic")
      .populate({
        path: "posts",
        populate: {
          path: "user",
          select: "username fullName profile_pic",
        },
      });

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const isOwner = collection.user._id.toString() === currentUserIdStr;

    // Strict privacy enforcement: private collections are only visible to the owner
    if (!collection.isPublic && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "This collection is private",
      });
    }

    const collectionObj = collection.toObject();
    // Filter out deleted posts gracefully
    collectionObj.posts = (collectionObj.posts || []).filter((p) => p !== null);
    collectionObj.postCount = collectionObj.posts.length;
    collectionObj.isOwner = isOwner;

    return res.status(200).json({
      success: true,
      message: "Collection fetched successfully",
      data: collectionObj,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update collection metadata (owner only)
 */
export const updateCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, isPublic, coverImage, coverPost } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID format",
      });
    }

    const collection = await CollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (collection.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this collection",
      });
    }

    if (title !== undefined) collection.title = title.trim();
    if (description !== undefined) collection.description = description.trim();
    if (isPublic !== undefined) collection.isPublic = Boolean(isPublic);
    if (coverImage !== undefined) collection.coverImage = coverImage;
    if (coverPost !== undefined) {
      if (coverPost && !isValidObjectId(coverPost)) {
        return res.status(400).json({ success: false, message: "Invalid cover post ID" });
      }
      collection.coverPost = coverPost || null;
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Collection updated successfully",
      data: collection,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a collection without deleting the original posts (owner only)
 */
export const deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID format",
      });
    }

    const collection = await CollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (collection.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this collection",
      });
    }

    await collection.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Collection deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a post to a collection (owner only, duplicate prevention)
 */
export const addPostToCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { postId } = req.body;

    if (!isValidObjectId(id) || !isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID or post ID",
      });
    }

    const collection = await CollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (collection.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this collection",
      });
    }

    const post = await PostModel.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const alreadyInCollection = (collection.posts || []).some(
      (p) => p.toString() === postId.toString()
    );

    if (alreadyInCollection) {
      return res.status(400).json({
        success: false,
        message: "Post is already in this collection",
      });
    }

    collection.posts.push(post._id);

    // If no cover is set, use this post
    if (!collection.coverPost && !collection.coverImage) {
      collection.coverPost = post._id;
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Post added to collection successfully",
      data: {
        collectionId: collection._id,
        postCount: collection.posts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a post from a collection (owner only)
 */
export const removePostFromCollection = async (req, res, next) => {
  try {
    const { id, postId } = req.params;

    if (!isValidObjectId(id) || !isValidObjectId(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid collection ID or post ID",
      });
    }

    const collection = await CollectionModel.findById(id);

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: "Collection not found",
      });
    }

    if (collection.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to modify this collection",
      });
    }

    collection.posts = (collection.posts || []).filter(
      (p) => p.toString() !== postId.toString()
    );

    if (collection.coverPost && collection.coverPost.toString() === postId.toString()) {
      collection.coverPost = collection.posts[0] || null;
    }

    await collection.save();

    return res.status(200).json({
      success: true,
      message: "Post removed from collection successfully",
      data: {
        collectionId: collection._id,
        postCount: collection.posts.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
