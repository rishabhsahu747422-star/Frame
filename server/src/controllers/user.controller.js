import UserModel from "../models/user.model.js";
import { sendFiles, validateImageFile } from "../services/storage.service.js";
import { createNotification } from "../services/notification.service.js";
import { isValidObjectId } from "../middlewares/error.middleware.js";

/**
 * Get current authenticated user details
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user._id).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userData = user.toObject();
    userData.followersCount = (user.followers || []).length;
    userData.followingCount = (user.followings || []).length;
    userData.postsCount = (user.posts || []).length;
    userData.savesCount = (user.saves || []).length;

    return res.status(200).json({
      success: true,
      message: "Current user retrieved successfully",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile details
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { username, fullName, mobile, dob, bio } = req.body;

    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (username && username.trim() !== user.username) {
      const cleanUsername = username.trim();
      const existing = await UserModel.findOne({ username: cleanUsername });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "Username is already taken",
        });
      }
      user.username = cleanUsername;
    }

    if (fullName !== undefined) user.fullName = fullName.trim();
    if (mobile !== undefined) user.mobile = mobile ? mobile.trim() : undefined;
    if (dob !== undefined) user.dob = dob ? new Date(dob) : undefined;
    if (bio !== undefined) user.bio = bio.trim();

    await user.save();

    const userData = user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedUser: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get public profile by username
 */
export const getUserProfile = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await UserModel.findOne({ username: username.toLowerCase() }).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const isFollowing = currentUserIdStr
      ? (user.followers || []).some((id) => id.toString() === currentUserIdStr)
      : false;

    const isMe = currentUserIdStr === user._id.toString();

    const userData = user.toObject();
    userData.followersCount = (user.followers || []).length;
    userData.followingCount = (user.followings || []).length;
    userData.postsCount = (user.posts || []).length;
    userData.isFollowing = isFollowing;
    userData.isMe = isMe;

    return res.status(200).json({
      success: true,
      message: "User profile fetched successfully",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search users by query
 */
export const searchUser = async (req, res, next) => {
  try {
    const query = req.query.query || req.query.q;

    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const cleanQuery = query.trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(30, Math.max(1, parseInt(req.query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter = {
      $or: [
        { username: { $regex: cleanQuery, $options: "i" } },
        { fullName: { $regex: cleanQuery, $options: "i" } },
      ],
    };

    const total = await UserModel.countDocuments(filter);
    const users = await UserModel.find(filter)
      .select("username fullName profile_pic bio followers")
      .skip(skip)
      .limit(limit);

    const currentUserIdStr = req.user ? req.user._id.toString() : null;

    const formattedUsers = users.map((u) => {
      const obj = u.toObject();
      obj.isFollowing = currentUserIdStr
        ? (u.followers || []).some((id) => id.toString() === currentUserIdStr)
        : false;
      delete obj.followers;
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: formattedUsers,
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
 * Follow a user
 */
export const followUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target user ID format",
      });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User to follow not found",
      });
    }

    const loggedInUser = await UserModel.findById(req.user._id);

    const alreadyFollowing = (loggedInUser.followings || []).some(
      (id) => id.toString() === targetUserId
    );

    if (alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: "You already follow this user",
      });
    }

    loggedInUser.followings.push(targetUser._id);
    targetUser.followers.push(loggedInUser._id);

    await loggedInUser.save();
    await targetUser.save();

    await createNotification({
      recipient: targetUser._id,
      actor: loggedInUser._id,
      type: "follow",
    });

    return res.status(200).json({
      success: true,
      message: "User followed successfully",
      data: {
        isFollowing: true,
        targetFollowersCount: targetUser.followers.length,
        myFollowingCount: loggedInUser.followings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid target user ID format",
      });
    }

    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    const targetUser = await UserModel.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const loggedInUser = await UserModel.findById(req.user._id);

    const alreadyFollowing = (loggedInUser.followings || []).some(
      (id) => id.toString() === targetUserId
    );

    if (!alreadyFollowing) {
      return res.status(400).json({
        success: false,
        message: "You are not following this user",
      });
    }

    loggedInUser.followings = loggedInUser.followings.filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== loggedInUser._id.toString()
    );

    await loggedInUser.save();
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
      data: {
        isFollowing: false,
        targetFollowersCount: targetUser.followers.length,
        myFollowingCount: loggedInUser.followings.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated followers of a user
 */
export const getFollowers = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await UserModel.findById(targetUserId).populate(
      "followers",
      "username fullName profile_pic bio"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const myFollowings = req.user?.followings || [];

    const followers = (user.followers || []).map((f) => {
      const obj = f.toObject ? f.toObject() : f;
      obj.isFollowing = currentUserIdStr
        ? myFollowings.some((id) => id.toString() === obj._id.toString())
        : false;
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: "Followers fetched successfully",
      followers,
      count: followers.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get paginated following accounts of a user
 */
export const getFollowing = async (req, res, next) => {
  try {
    const targetUserId = req.params.id;

    if (!isValidObjectId(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await UserModel.findById(targetUserId).populate(
      "followings",
      "username fullName profile_pic bio"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUserIdStr = req.user ? req.user._id.toString() : null;
    const myFollowings = req.user?.followings || [];

    const following = (user.followings || []).map((f) => {
      const obj = f.toObject ? f.toObject() : f;
      obj.isFollowing = currentUserIdStr
        ? myFollowings.some((id) => id.toString() === obj._id.toString())
        : false;
      return obj;
    });

    return res.status(200).json({
      success: true,
      message: "Following users fetched successfully",
      following,
      count: following.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change account password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;

    if (!password || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    if (password === newPassword) {
      return res.status(409).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    const user = await UserModel.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.password && user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account was created with Google and has no local password",
      });
    }

    const isMatch = user.comparePass(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update profile picture
 */
export const updateProfilePicture = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    validateImageFile(file, 10);

    const user = await UserModel.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const uploadFile = await sendFiles(file.buffer, file.originalname, "profiles");
    user.profile_pic = uploadFile.url;
    await user.save();

    const userData = user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: userData,
    });
  } catch (error) {
    next(error);
  }
};