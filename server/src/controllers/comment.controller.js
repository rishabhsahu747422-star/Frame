import CommentModel from "../models/comment.model.js";
import PostModel from "../models/post.model.js";
import ReelModel from "../models/reels.model.js";
import { createNotification } from "../services/notification.service.js";
import { isValidObjectId } from "../middlewares/error.middleware.js";

/**
 * Format comment with interaction state and counts
 */
const formatComment = (commentDoc, currentUserId = null) => {
  const comment = commentDoc.toObject ? commentDoc.toObject() : commentDoc;
  const currentUserIdStr = currentUserId ? currentUserId.toString() : null;

  const isLiked = currentUserIdStr
    ? (comment.likes || []).some((id) => (id._id || id).toString() === currentUserIdStr)
    : false;

  return {
    ...comment,
    likeCount: (comment.likes || []).length,
    isLiked,
  };
};

/**
 * Create a comment on a Post or Reel
 */
export const createComments = async (req, res, next) => {
  try {
    const { postId, reelId, text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    if (!postId && !reelId) {
      return res.status(400).json({
        success: false,
        message: "Either postId or reelId is required",
      });
    }

    let targetPost = null;
    let targetReel = null;

    if (postId) {
      if (!isValidObjectId(postId)) {
        return res.status(400).json({ success: false, message: "Invalid post ID format" });
      }
      targetPost = await PostModel.findById(postId);
      if (!targetPost) {
        return res.status(404).json({ success: false, message: "Target post not found" });
      }
    } else if (reelId) {
      if (!isValidObjectId(reelId)) {
        return res.status(400).json({ success: false, message: "Invalid reel ID format" });
      }
      targetReel = await ReelModel.findById(reelId);
      if (!targetReel) {
        return res.status(404).json({ success: false, message: "Target reel not found" });
      }
    }

    const comment = await CommentModel.create({
      text: text.trim(),
      post: postId || undefined,
      reel: reelId || undefined,
      user: req.user._id,
    });

    if (targetPost) {
      targetPost.comments.push(comment._id);
      await targetPost.save();

      await createNotification({
        recipient: targetPost.user,
        actor: req.user._id,
        type: "comment_post",
        post: targetPost._id,
        comment: comment._id,
      });
    } else if (targetReel) {
      targetReel.comments.push(comment._id);
      await targetReel.save();

      await createNotification({
        recipient: targetReel.user,
        actor: req.user._id,
        type: "comment_reel",
        reel: targetReel._id,
        comment: comment._id,
      });
    }

    const populatedComment = await CommentModel.findById(comment._id).populate(
      "user",
      "username fullName profile_pic"
    );

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: formatComment(populatedComment, req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated comments for a Post or Reel
 */
export const getComments = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    if (!isValidObjectId(targetId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid resource ID format",
      });
    }

    // Query comments targeting either post or reel with that ID
    const filter = {
      $or: [{ post: targetId }, { reel: targetId }],
    };

    const total = await CommentModel.countDocuments(filter);
    const comments = await CommentModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username fullName profile_pic");

    const currentUserId = req.user ? req.user._id : null;
    const formattedComments = comments.map((c) => formatComment(c, currentUserId));

    return res.status(200).json({
      success: true,
      message: "Comments fetched successfully",
      data: formattedComments,
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
 * Update a comment (owner only)
 */
export const updateComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const text = req.body.text || req.body.updatedText;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID format",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Ownership check
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this comment",
      });
    }

    comment.text = text.trim();
    await comment.save();

    const populated = await CommentModel.findById(commentId).populate(
      "user",
      "username fullName profile_pic"
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      data: formatComment(populated, req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a comment (owner of comment or owner of post/reel)
 */
export const deleteComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID format",
      });
    }

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const isCommentAuthor = comment.user.toString() === currentUserIdStr;

    // Check if requester owns the parent post or reel
    let isParentAuthor = false;
    if (comment.post) {
      const parentPost = await PostModel.findById(comment.post);
      if (parentPost && parentPost.user.toString() === currentUserIdStr) {
        isParentAuthor = true;
      }
    } else if (comment.reel) {
      const parentReel = await ReelModel.findById(comment.reel);
      if (parentReel && parentReel.user.toString() === currentUserIdStr) {
        isParentAuthor = true;
      }
    }

    if (!isCommentAuthor && !isParentAuthor) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    // Pull from parent references
    if (comment.post) {
      await PostModel.findByIdAndUpdate(comment.post, {
        $pull: { comments: comment._id },
      });
    }
    if (comment.reel) {
      await ReelModel.findByIdAndUpdate(comment.reel, {
        $pull: { comments: comment._id },
      });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Like or unlike a comment (toggle with notification)
 */
export const likeComment = async (req, res, next) => {
  try {
    const commentId = req.params.id;

    if (!isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID format",
      });
    }

    const comment = await CommentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const alreadyLiked = (comment.likes || []).some(
      (uid) => uid.toString() === currentUserIdStr
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter((uid) => uid.toString() !== currentUserIdStr);
      await comment.save();

      return res.status(200).json({
        success: true,
        message: "Comment unliked successfully",
        data: {
          isLiked: false,
          likeCount: comment.likes.length,
        },
      });
    } else {
      comment.likes.push(req.user._id);
      await comment.save();

      await createNotification({
        recipient: comment.user,
        actor: req.user._id,
        type: "like_comment",
        comment: comment._id,
      });

      return res.status(200).json({
        success: true,
        message: "Comment liked successfully",
        data: {
          isLiked: true,
          likeCount: comment.likes.length,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};