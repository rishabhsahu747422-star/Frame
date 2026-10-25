import NotificationModel from "../models/notification.model.js";

/**
 * Creates a notification if recipient is not the actor.
 * Prevents duplicate unread notifications for repeated actions (e.g. likes/follows).
 */
export const createNotification = async ({
  recipient,
  actor,
  type,
  post = null,
  reel = null,
  comment = null,
}) => {
  try {
    if (!recipient || !actor || !type) return null;

    // Do not notify a user about their own actions
    if (recipient.toString() === actor.toString()) {
      return null;
    }

    // Check for existing unread notification of the same event to prevent duplicate spam
    const existing = await NotificationModel.findOne({
      recipient,
      actor,
      type,
      post: post || null,
      reel: reel || null,
      comment: comment || null,
      read: false,
    });

    if (existing) {
      return existing;
    }

    const notification = await NotificationModel.create({
      recipient,
      actor,
      type,
      post,
      reel,
      comment,
    });

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error.message);
    return null;
  }
};
