import crypto from "crypto";
import UserModel from "../models/user.model.js";
import { sendEmail } from "../services/email.service.js";
import { sendFiles, validateImageFile } from "../services/storage.service.js";
import {
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  getCookieOptions,
} from "../utils/token.js";
import { blacklistToken, isTokenBlacklisted } from "../config/redis.config.js";

/**
 * Register a new user
 */
export const registerController = async (req, res, next) => {
  try {
    const { username, fullName, email, mobile, password, bio, dob } = req.body;
    const file = req.file;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Username, full name, email, and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Check if username or email already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const isEmail = existingUser.email === email.toLowerCase();
      return res.status(409).json({
        success: false,
        message: isEmail ? "Email is already registered" : "Username is already taken",
      });
    }

    let profilePicUrl = "";
    if (file) {
      try {
        validateImageFile(file, 10);
        const uploadResult = await sendFiles(file.buffer, file.originalname, "profiles");
        profilePicUrl = uploadResult.url;
      } catch (uploadErr) {
        return res.status(400).json({
          success: false,
          message: uploadErr.message,
        });
      }
    }

    const newUser = await UserModel.create({
      username: username.trim(),
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password,
      mobile: mobile ? mobile.trim() : undefined,
      bio: bio ? bio.trim() : "",
      dob: dob ? new Date(dob) : undefined,
      profile_pic: profilePicUrl,
    });

    // Issue tokens and set secure cookies
    const accessToken = generateToken(newUser._id, "15m");
    const refreshToken = generateRefreshToken(newUser._id, "7d");

    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    const userData = newUser.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User login with credentials
 */
export const loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.password && user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message: "This account was created with Google. Please continue with Google.",
      });
    }

    const isMatch = user.comparePass(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const accessToken = generateToken(user._id, "15m");
    const refreshToken = generateRefreshToken(user._id, "7d");

    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    const userData = user.toObject();
    delete userData.password;
    delete userData.resetPasswordToken;
    delete userData.resetPasswordExpires;

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh access and refresh tokens with token rotation
 */
export const refreshToken = async (req, res, next) => {
  try {
    const currentRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!currentRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    // Check if refresh token has been revoked
    const isRevoked = await isTokenBlacklisted(currentRefreshToken);
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked",
      });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(currentRefreshToken);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    // Rotate refresh token: blacklist previous token and issue fresh pair
    await blacklistToken(currentRefreshToken, 7 * 24 * 60 * 60);

    const newAccessToken = generateToken(user._id, "15m");
    const newRefreshToken = generateRefreshToken(user._id, "7d");

    res.cookie("accessToken", newAccessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", newRefreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    return res.status(200).json({
      success: true,
      message: "Tokens refreshed successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user and invalidate active tokens
 */
export const logoutUser = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers?.authorization?.replace(/^Bearer\s+/i, "");
    const refreshToken = req.cookies?.refreshToken;

    if (accessToken) {
      await blacklistToken(accessToken, 15 * 60);
    }
    if (refreshToken) {
      await blacklistToken(refreshToken, 7 * 24 * 60 * 60);
    }

    res.clearCookie("accessToken", getCookieOptions());
    res.clearCookie("refreshToken", getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiate password reset via secure expiring token
 * Does not leak account existence.
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

    if (user) {
      // Generate unguessable random token and store its sha256 hash
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

      try {
        await sendEmail(
          user.email,
          "Reset Your FRAME Password",
          `Reset your password using this link: ${resetUrl}`,
          `
            <h2>Reset Your FRAME Password</h2>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p><a href="${resetUrl}">Reset Password</a></p>
            <p>This link expires in 10 minutes. If you did not request this, please ignore this email.</p>
          `
        );
      } catch (emailErr) {
        console.error("Failed to deliver reset email:", emailErr.message);
      }
    }

    // Always respond with identical message to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: "If an account with that email exists, a password reset link has been sent",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Complete password reset using single-use token
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired",
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully. You can now log in with your new password.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Passport Google OAuth Callback Handler
 */
export const googleAuth = async (req, res, next) => {
  try {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

    if (!req.user) {
      return res.redirect(`${clientUrl}/login?error=OAuthFailed`);
    }

    const email = req.user.emails?.[0]?.value?.toLowerCase();
    const googleId = req.user.id;
    const displayName = req.user.displayName || "Google User";
    const profilePic = req.user.photos?.[0]?.value || "";

    if (!email) {
      return res.redirect(`${clientUrl}/login?error=NoEmailProvided`);
    }

    let user = await UserModel.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        user.authProvider = "google";
        if (!user.profile_pic && profilePic) {
          user.profile_pic = profilePic;
        }
        await user.save();
      }
    } else {
      // Generate a unique username from display name or email prefix
      const baseUsername = (req.user.name?.givenName || email.split("@")[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "");
      let username = baseUsername;
      let counter = 1;
      while (await UserModel.findOne({ username })) {
        username = `${baseUsername}${counter++}`;
      }

      user = await UserModel.create({
        username,
        fullName: displayName,
        email,
        googleId,
        authProvider: "google",
        profile_pic: profilePic,
      });
    }

    const accessToken = generateToken(user._id, "15m");
    const refreshToken = generateRefreshToken(user._id, "7d");

    res.cookie("accessToken", accessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    // Redirect to allowlisted frontend destination without leaking token in URL
    return res.redirect(`${clientUrl}/oauth-success`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    return res.redirect(`${clientUrl}/login?error=OAuthProcessingError`);
  }
};
