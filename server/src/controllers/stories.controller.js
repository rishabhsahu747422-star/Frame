import StoryModel from "../models/story.model.js";
import UserModel from "../models/user.model.js";
import {
  sendFiles,
  validateImageFile,
  validateVideoFile,
} from "../services/storage.service.js";
import { isValidObjectId } from "../middlewares/error.middleware.js";

/**
 * Create a new Story (Image or Video)
 */
export const createStories = async (req, res, next) => {
  try {
    const { caption } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Media file is required to create a story",
      });
    }

    let mediaType;
    if (file.mimetype.startsWith("image/")) {
      validateImageFile(file, 10);
      mediaType = "image";
    } else if (file.mimetype.startsWith("video/")) {
      validateVideoFile(file, 50); // 50MB max for story videos
      mediaType = "video";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Supported formats: JPEG, PNG, WebP, MP4, WebM, QuickTime",
      });
    }

    const uploadResult = await sendFiles(file.buffer, file.originalname, "stories");

    const story = await StoryModel.create({
      user: req.user._id,
      media_type: mediaType,
      media_url: uploadResult.url,
      caption: caption ? caption.trim() : "",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Strict 24-hour expiry
    });

    await UserModel.findByIdAndUpdate(req.user._id, {
      $push: { stories: story._id },
    });

    const populatedStory = await StoryModel.findById(story._id).populate(
      "user",
      "username fullName profile_pic"
    );

    return res.status(201).json({
      success: true,
      message: "Story created successfully",
      story: populatedStory,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve active stories grouped by creator
 * Strict 24-hour server-side expiry filter
 */
export const getStories = async (req, res, next) => {
  try {
    const currentUserIdStr = req.user._id.toString();
    const followings = req.user.followings || [];
    const targetAuthorIds = [...followings, req.user._id];

    const now = new Date();

    // Strict 24h filter: only return stories that have not expired yet
    const activeStories = await StoryModel.find({
      user: { $in: targetAuthorIds },
      expiresAt: { $gt: now },
    })
      .sort({ createdAt: 1 })
      .populate("user", "username fullName profile_pic");

    // Group stories by creator
    const groupedMap = new Map();

    for (const story of activeStories) {
      if (!story.user) continue;
      const creatorIdStr = story.user._id.toString();

      if (!groupedMap.has(creatorIdStr)) {
        groupedMap.set(creatorIdStr, {
          user: story.user,
          hasUnviewedStories: false,
          latestStoryAt: story.createdAt,
          stories: [],
        });
      }

      const isViewed = (story.viewers || []).some(
        (id) => id.toString() === currentUserIdStr
      );

      const group = groupedMap.get(creatorIdStr);
      if (!isViewed && creatorIdStr !== currentUserIdStr) {
        group.hasUnviewedStories = true;
      }
      group.latestStoryAt = story.createdAt;

      const storyObj = story.toObject();
      storyObj.isViewed = isViewed;
      storyObj.viewersCount = (story.viewers || []).length;
      group.stories.push(storyObj);
    }

    const groupedList = Array.from(groupedMap.values()).sort((a, b) => {
      // Put creators with unviewed stories first
      if (a.hasUnviewedStories && !b.hasUnviewedStories) return -1;
      if (!a.hasUnviewedStories && b.hasUnviewedStories) return 1;
      return new Date(b.latestStoryAt) - new Date(a.latestStoryAt);
    });

    return res.status(200).json({
      success: true,
      message: "Active stories fetched successfully",
      data: groupedList,
      // Backward compatibility key
      story: activeStories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Record a story view with duplicate prevention and expiry check
 */
export const viewStories = async (req, res, next) => {
  try {
    const storyId = req.params.id;

    if (!isValidObjectId(storyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID format",
      });
    }

    const story = await StoryModel.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Check strict expiry
    if (new Date() >= new Date(story.expiresAt)) {
      return res.status(410).json({
        success: false,
        message: "This story has expired",
      });
    }

    const currentUserIdStr = req.user._id.toString();
    const isOwner = story.user.toString() === currentUserIdStr;
    const alreadyViewed = (story.viewers || []).some(
      (id) => id.toString() === currentUserIdStr
    );

    if (!isOwner && !alreadyViewed) {
      story.viewers.push(req.user._id);
      await story.save();
    }

    return res.status(200).json({
      success: true,
      message: alreadyViewed || isOwner ? "Story already viewed" : "Story viewed successfully",
      isViewed: true,
      viewersCount: story.viewers.length,
      viewers: story.viewers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a story (owner only)
 */
export const deleteStory = async (req, res, next) => {
  try {
    const storyId = req.params.id;

    if (!isValidObjectId(storyId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID format",
      });
    }

    const story = await StoryModel.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this story",
      });
    }

    await UserModel.findByIdAndUpdate(req.user._id, {
      $pull: { stories: story._id },
    });

    await story.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
