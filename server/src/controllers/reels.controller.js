import ReelModel from "../models/reels.model.js";
import UserModel from "../models/user.model.js";
import CommentModel from "../models/comment.model.js";
import { sendFiles, validateVideoFile } from "../services/storage.service.js";
import { createNotification } from "../services/notification.service.js";
import { isValidObjectId } from "../middlewares/error.middleware.js";

/**
 * Helper to format reel document with interaction states and counts
 */
const formatReel = (reelDoc, currentUserId = null) => {
  const reel = reelDoc.toObject ? reelDoc.toObject() : reelDoc;
  const currentUserIdStr = currentUserId ? currentUserId.toString() : null;

  const isLiked = currentUserIdStr
    ? (reel.likes || []).some((id) => (id._id || id).toString() === currentUserIdStr)
    : false;

  const viewCount = typeof reel.views === "number" && reel.views > 0
    ? reel.views
    : (reel.viewers || []).length;

  return {
    ...reel,
    likeCount: (reel.likes || []).length,
    commentCount: (reel.comments || []).length,
    viewCount,
    isLiked,
  };
};

/**
 * Create a new Reel
 */
export const createReel = async (req, res, next) => {
  try {
    const { caption } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required to create a reel",
      });
    }

    validateVideoFile(file, 100);

    const uploadResult = await sendFiles(file.buffer, file.originalname, "reels");

    const newReel = await ReelModel.create({
      user: req.user._id,
      media_url: uploadResult.url,
      caption: caption ? caption.trim() : "",
    });

    await UserModel.findByIdAndUpdate(req.user._id, {
      $push: { reels: newReel._id },
    });

    const populatedReel = await ReelModel.findById(newReel._id).populate(
      "user",
      "username fullName profile_pic"
    );

    return res.status(201).json({
      success: true,
      message: "Reel created successfully",
      data: formatReel(populatedReel, req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated Reel feed
 */
export const getAllReels = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const total = await ReelModel.countDocuments();
    const reels = await ReelModel.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username fullName profile_pic");

    const currentUserId = req.user ? req.user._id : null;
    const formattedReels = reels.map((r) => formatReel(r, currentUserId));

    return res.status(200).json({
      success: true,
      message: "Reels fetched successfully",
      data: formattedReels,
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
 * Retrieve single Reel by ID
 */
export const getSingleReel = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reel ID format",
      });
    }

    const reel = await ReelModel.findById(id).populate(
      "user",
      "username fullName profile_pic"
    );

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    const currentUserId = req.user ? req.user._id : null;

    return res.status(200).json({
      success: true,
      message: "Reel fetched successfully",
      data: formatReel(reel, currentUserId),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve Reels by a specific creator
 */
export const getReelsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 12));
    const skip = (page - 1) * limit;

    const filter = { user: userId };
    const total = await ReelModel.countDocuments(filter);
    const reels = await ReelModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "username fullName profile_pic");

    const currentUserId = req.user ? req.user._id : null;
    const formattedReels = reels.map((r) => formatReel(r, currentUserId));

    return res.status(200).json({
      success: true,
      message: "User reels fetched successfully",
      data: formattedReels,
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
 * Update Reel metadata (owner only)
 */
export const updateReel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reel ID format",
      });
    }

    const reel = await ReelModel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this reel",
      });
    }

    if (caption !== undefined) {
      reel.caption = caption.trim();
    }

    await reel.save();

    const updated = await ReelModel.findById(id).populate(
      "user",
      "username fullName profile_pic"
    );

    return res.status(200).json({
      success: true,
      message: "Reel updated successfully",
      data: formatReel(updated, req.user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a Reel (owner only with cascading cleanup)
 */
export const deleteReel = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reel ID format",
      });
    }

    const reel = await ReelModel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    if (reel.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this reel",
      });
    }

    await UserModel.findByIdAndUpdate(req.user._id, {
      $pull: { reels: reel._id },
    });

    await CommentModel.deleteMany({ reel: reel._id });

    await reel.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Reel deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Like or unlike a Reel (toggle with notification)
 */
export const likeReel = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reel ID format",
      });
    }

    const reel = await ReelModel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const alreadyLiked = (reel.likes || []).some(
      (uid) => uid.toString() === currentUserIdStr
    );

    if (alreadyLiked) {
      reel.likes = reel.likes.filter((uid) => uid.toString() !== currentUserIdStr);
      await reel.save();

      return res.status(200).json({
        success: true,
        message: "Reel unliked successfully",
        data: {
          isLiked: false,
          likeCount: reel.likes.length,
        },
      });
    } else {
      reel.likes.push(req.user._id);
      await reel.save();

      await createNotification({
        recipient: reel.user,
        actor: req.user._id,
        type: "like_reel",
        reel: reel._id,
      });

      return res.status(200).json({
        success: true,
        message: "Reel liked successfully",
        data: {
          isLiked: true,
          likeCount: reel.likes.length,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Record a Reel view
 */
export const viewReel = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reel ID format",
      });
    }

    const reel = await ReelModel.findById(id);

    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found",
      });
    }

    reel.views = (reel.views || 0) + 1;

    if (req.user) {
      const currentUserIdStr = req.user._id.toString();
      const alreadyViewed = (reel.viewers || []).some(
        (uid) => uid.toString() === currentUserIdStr
      );
      if (!alreadyViewed) {
        reel.viewers.push(req.user._id);
      }
    }

    await reel.save();

    return res.status(200).json({
      success: true,
      message: "Reel view recorded",
      data: {
        viewCount: reel.views,
        uniqueViewersCount: reel.viewers.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
