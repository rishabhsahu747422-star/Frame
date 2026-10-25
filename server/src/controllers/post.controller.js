import PostModel from "../models/post.model.js";
import UserModel from "../models/user.model.js";
import CommentModel from "../models/comment.model.js";
import CollectionModel from "../models/collection.model.js";
import { sendFiles, validateImageFile } from "../services/storage.service.js";
import { createNotification } from "../services/notification.service.js";
import { isValidObjectId } from "../middlewares/error.middleware.js";

/**
 * Format post document with interaction status and counts
 */
const formatPost = (postDoc, currentUserId = null, currentUserSaves = []) => {
  const post = postDoc.toObject ? postDoc.toObject() : postDoc;
  const currentUserIdStr = currentUserId ? currentUserId.toString() : null;

  const isLiked = currentUserIdStr
    ? (post.likes || []).some((id) => (id._id || id).toString() === currentUserIdStr)
    : false;

  const isSaved = currentUserIdStr
    ? currentUserSaves.some((id) => (id._id || id).toString() === post._id.toString())
    : false;

  const images = post.media_urls || post.images || [];
  const userObj = post.user || post.author || null;
  const author = userObj
    ? {
        ...userObj,
        name: userObj.fullName || userObj.name || userObj.username,
      }
    : null;

  return {
    ...post,
    images,
    media_urls: images,
    user: author,
    author,
    likeCount: (post.likes || []).length,
    likesCount: (post.likes || []).length,
    commentCount: (post.comments || []).length,
    commentsCount: (post.comments || []).length,
    isLiked,
    isSaved,
  };
};

/**
 * Create a new post with up to 5 images
 */
export const createPostController = async (req, res, next) => {
  try {
    const { caption, location } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one image is required to create a post",
      });
    }

    if (files.length > 5) {
      return res.status(400).json({
        success: false,
        message: "A maximum of 5 images are allowed per post",
      });
    }

    // Validate all images before uploading
    for (const file of files) {
      validateImageFile(file, 10);
    }

    const uploadResults = await Promise.all(
      files.map((file) => sendFiles(file.buffer, file.originalname, "posts"))
    );

    const mediaUrls = uploadResults.map((r) => r.url);

    const newPost = await PostModel.create({
      caption: caption ? caption.trim() : "",
      location: location ? location.trim() : "",
      user: req.user._id,
      media_urls: mediaUrls,
    });

    // Add to user posts array
    await UserModel.findByIdAndUpdate(req.user._id, {
      $push: { posts: newPost._id },
    });

    const populatedPost = await PostModel.findById(newPost._id).populate(
      "user",
      "username fullName profile_pic"
    );

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: formatPost(populatedPost, req.user._id, req.user.saves || []),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated general feed
 */
export const getAllPostController = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const total = await PostModel.countDocuments();
    const posts = await PostModel.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username fullName profile_pic");

    const currentUserId = req.user ? req.user._id : null;
    const currentUserSaves = req.user?.saves || [];

    const formattedPosts = posts.map((post) =>
      formatPost(post, currentUserId, currentUserSaves)
    );

    return res.status(200).json({
      success: true,
      message: "Posts fetched successfully",
      data: formattedPosts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated Following feed for authenticated user
 */
export const getFollowingFeedController = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const followedUsers = req.user.followings || [];
    // Include followed accounts plus the user's own posts
    const authorIds = [...followedUsers, req.user._id];

    const filter = { user: { $in: authorIds } };
    const total = await PostModel.countDocuments(filter);
    const posts = await PostModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username fullName profile_pic");

    const formattedPosts = posts.map((post) =>
      formatPost(post, req.user._id, req.user.saves || [])
    );

    return res.status(200).json({
      success: true,
      message: "Following feed fetched successfully",
      data: formattedPosts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve single post by ID
 */
export const getSinglePostController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await PostModel.findById(id).populate(
      "user",
      "username fullName profile_pic"
    );

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const currentUserId = req.user ? req.user._id : null;
    const currentUserSaves = req.user?.saves || [];

    return res.status(200).json({
      success: true,
      message: "Post fetched successfully",
      data: formatPost(post, currentUserId, currentUserSaves),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated posts by a specific user (for profile grid)
 */
export const getUserPostsController = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    const total = await PostModel.countDocuments(filter);
    const posts = await PostModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username fullName profile_pic");

    const currentUserId = req.user ? req.user._id : null;
    const currentUserSaves = req.user?.saves || [];

    const formattedPosts = posts.map((post) =>
      formatPost(post, currentUserId, currentUserSaves)
    );

    return res.status(200).json({
      success: true,
      message: "User posts fetched successfully",
      data: formattedPosts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a post (owner only, sanitized fields)
 */
export const updatePostController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caption, location } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await PostModel.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Ownership check
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this post",
      });
    }

    if (caption !== undefined) post.caption = caption.trim();
    if (location !== undefined) post.location = location.trim();

    await post.save();

    const updatedPost = await PostModel.findById(id).populate(
      "user",
      "username fullName profile_pic"
    );

    return res.status(200).json({
      success: true,
      message: "Post updated successfully",
      data: formatPost(updatedPost, req.user._id, req.user.saves || []),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a post (owner only with cascading cleanup)
 */
export const deletePostController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await PostModel.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Ownership check
    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this post",
      });
    }

    // Cascade cleanups
    await UserModel.findByIdAndUpdate(req.user._id, {
      $pull: { posts: post._id },
    });

    await UserModel.updateMany(
      { saves: post._id },
      { $pull: { saves: post._id } }
    );

    await CommentModel.deleteMany({ post: post._id });

    await CollectionModel.updateMany(
      { posts: post._id },
      { $pull: { posts: post._id } }
    );

    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Like or unlike a post (toggle with notification)
 */
export const likePostController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await PostModel.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const alreadyLiked = post.likes.some((uid) => uid.toString() === currentUserIdStr);

    if (alreadyLiked) {
      post.likes = post.likes.filter((uid) => uid.toString() !== currentUserIdStr);
      await post.save();

      return res.status(200).json({
        success: true,
        message: "Post unliked successfully",
        data: {
          isLiked: false,
          likeCount: post.likes.length,
        },
      });
    } else {
      post.likes.push(req.user._id);
      await post.save();

      // Trigger notification for post author
      await createNotification({
        recipient: post.user,
        actor: req.user._id,
        type: "like_post",
        post: post._id,
      });

      return res.status(200).json({
        success: true,
        message: "Post liked successfully",
        data: {
          isLiked: true,
          likeCount: post.likes.length,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Save or unsave a post for the authenticated user
 */
export const savePostController = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID format",
      });
    }

    const post = await PostModel.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const user = await UserModel.findById(req.user._id);
    const postIdStr = post._id.toString();
    const isAlreadySaved = user.saves.some((savedId) => savedId.toString() === postIdStr);

    if (isAlreadySaved) {
      user.saves = user.saves.filter((savedId) => savedId.toString() !== postIdStr);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Post removed from saved",
        data: { isSaved: false },
      });
    } else {
      user.saves.push(post._id);
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Post saved successfully",
        data: { isSaved: true },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated saved posts for authenticated user
 */
export const getSavedPostsController = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const user = await UserModel.findById(req.user._id);
    const savedIds = user.saves || [];

    const total = await PostModel.countDocuments({ _id: { $in: savedIds } });
    const posts = await PostModel.find({ _id: { $in: savedIds } })
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username fullName profile_pic");

    const formattedPosts = posts.map((post) =>
      formatPost(post, req.user._id, user.saves)
    );

    return res.status(200).json({
      success: true,
      message: "Saved posts fetched successfully",
      data: formattedPosts,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        hasNextPage: page * limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};
