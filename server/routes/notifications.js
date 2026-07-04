/**
 * Notifications Routes
 * API endpoints for managing user notifications
 * Requirements: 4.3
 */

import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendError } from "../utils/http-error.js";

const notifications = new Hono();

/**
 * GET /api/notifications
 * Get notifications for the current user
 */
notifications.get("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const limit = parseInt(c.req.query("limit") || "50", 10);
    const unreadOnly = c.req.query("unreadOnly") === "true";

    const whereClause = {
      userId: user.id,
    };

    if (unreadOnly) {
      whereClause.read = false;
    }

    const notificationList = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: user.id,
        read: false,
      },
    });

    return c.json({
      notifications: notificationList,
      unreadCount,
    });
  } catch (error) {
    return sendError(c, { scope: "[Notifications] List", error, message: "Failed to fetch notifications" });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
notifications.put("/:id/read", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const notificationId = c.req.param("id");

    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { read: true },
    });

    if (result.count === 0) {
      return c.json({ error: "Notification not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[Notifications] Mark read", error, message: "Failed to update notification" });
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
notifications.put("/read-all", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[Notifications] Mark all read", error, message: "Failed to update notifications" });
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
notifications.delete("/:id", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const notificationId = c.req.param("id");

    const result = await prisma.notification.deleteMany({
      where: { id: notificationId, userId: user.id },
    });

    if (result.count === 0) {
      return c.json({ error: "Notification not found" }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[Notifications] Delete one", error, message: "Failed to delete notification" });
  }
});

/**
 * DELETE /api/notifications
 * Delete all notifications for the user
 */
notifications.delete("/", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    await prisma.notification.deleteMany({
      where: { userId: user.id },
    });

    return c.json({ success: true });
  } catch (error) {
    return sendError(c, { scope: "[Notifications] Delete all", error, message: "Failed to delete notifications" });
  }
});

export default notifications;
