import express, { urlencoded } from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

import authRoutes from "./routes/auth.routes.js";
import postRoutes from "./routes/post.routes.js";
import userRouter from "./routes/user.routes.js";
import commentRouter from "./routes/comment.routes.js";
import reelsRouter from "./routes/reels.routes.js";
import storyRouter from "./routes/stories.routes.js";
import collectionRouter from "./routes/collection.routes.js";
import notificationRouter from "./routes/notification.routes.js";

import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app = express();

// Normalize origin strings (strip whitespace and trailing slashes)
export const normalizeOrigin = (origin) => {
  if (!origin || typeof origin !== "string") return "";
  return origin.trim().replace(/\/+$/, "");
};

// Retrieve array of normalized allowed origins
export const getAllowedOrigins = () => {
  const defaultOrigins = [
    "https://frame-alpha-six.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
  ];

  const configuredOrigins = (process.env.CLIENT_URL || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);

  return Array.from(new Set([...configuredOrigins, ...defaultOrigins.map(normalizeOrigin)]));
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      const allowedOrigins = getAllowedOrigins();
      const normalizedReqOrigin = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalizedReqOrigin)) {
        return callback(null, true);
      }
      // Safe rejection using cors callback protocol; avoids triggering Express HTTP 500
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(cookieParser());
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10mb" }));
app.use(urlencoded({ extended: true, limit: "10mb" }));

// Initialize Passport for Google OAuth
app.use(passport.initialize());

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:4000/api/auth/google/callback",
      },
      (_, __, profile, done) => {
        return done(null, profile);
      }
    )
  );
} else {
  console.warn("Google OAuth credentials omitted: Google login disabled.");
}

// Health check endpoint (supports both /api/health and /health)
app.get(["/api/health", "/health"], (req, res) => {
  res.status(200).json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/users", userRouter);
app.use("/api/comments", commentRouter);
app.use("/api/stories", storyRouter);
app.use("/api/reels", reelsRouter);
app.use("/api/collections", collectionRouter);
app.use("/api/notifications", notificationRouter);

// 404 and Error handling middlewares
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
