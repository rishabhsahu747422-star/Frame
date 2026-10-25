import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "follow",
        "like_post",
        "like_comment",
        "like_reel",
        "comment_post",
        "comment_reel",
      ],
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
      default: null,
    },
    reel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reels",
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "comments",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("notifications", notificationSchema);
export default NotificationModel;
