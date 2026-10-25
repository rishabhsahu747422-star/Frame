import express from "express";
import passport from "passport";
import { upload } from "../config/multer.js";
import {
  forgotPassword,
  googleAuth,
  loginController,
  logoutUser,
  refreshToken,
  registerController,
  resetPassword,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", upload.single("image"), registerController);
router.post("/login", loginController);
router.post("/logout", logoutUser);
router.post("/refresh-token", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Safe Google OAuth initiation
router.get("/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
    });
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

// Google OAuth callback
router.get(
  "/google/callback",
  (req, res, next) => {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${clientUrl}/login?error=OAuthFailed`,
    })(req, res, next);
  },
  googleAuth
);

export default router;
