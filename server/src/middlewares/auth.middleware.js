import UserModel from "../models/user.model.js";
import { isTokenBlacklisted } from "../config/redis.config.js";
import { verifyAccessToken } from "../utils/token.js";

/**
 * Required authentication middleware
 */
export const authMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;

    // Also support Authorization header Bearer token for API clients/tests
    if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Check token revocation blacklist
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: "Token has been revoked",
      });
    }

    // Verify signature, type, and expiry
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token has expired",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid or malformed token",
      });
    }

    const user = await UserModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal authentication error",
    });
  }
};

/**
 * Optional authentication middleware:
 * Attaches user to req.user if a valid token is provided,
 * but allows guests to proceed if unauthenticated.
 */
export const optionalAuthMiddleware = async (req, res, next) => {
  try {
    let token = req.cookies?.accessToken;
    if (!token && req.headers?.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next();
    }

    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }

    const decoded = verifyAccessToken(token);
    const user = await UserModel.findById(decoded.id).select("-password");
    if (user) {
      req.user = user;
    }
  } catch (err) {
    // Ignore invalid/expired tokens for optional auth
  }
  next();
};
