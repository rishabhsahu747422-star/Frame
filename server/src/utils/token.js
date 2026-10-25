import dotenv from "dotenv";
dotenv.config();
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "kingsta_default_jwt_secret_key_change_in_prod";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;

/**
 * Generate Access Token with type claim
 */
export const generateToken = (id, time = "15m", type = "access") => {
  return jwt.sign(
    { id: id.toString(), type },
    JWT_SECRET,
    { expiresIn: time }
  );
};

/**
 * Generate Refresh Token with refresh type claim
 */
export const generateRefreshToken = (id, time = "7d") => {
  return jwt.sign(
    { id: id.toString(), type: "refresh" },
    JWT_REFRESH_SECRET,
    { expiresIn: time }
  );
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  if (decoded.type && decoded.type !== "access") {
    throw new Error("Invalid token type: expected access token");
  }
  return decoded;
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
  if (decoded.type && decoded.type !== "refresh") {
    throw new Error("Invalid token type: expected refresh token");
  }
  return decoded;
};

/**
 * Cookie options helper for consistent cookie configuration across set & clear
 */
export const getCookieOptions = (maxAgeMs) => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    ...(maxAgeMs ? { maxAge: maxAgeMs } : {}),
  };
};
