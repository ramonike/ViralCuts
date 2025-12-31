/**
 * Notifications Routes
 * API endpoints for managing user notifications
 * Requirements: 4.3
 */

import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

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
    console.error("[Notifications] Error fetching notifications:", error);
    return c.json({ error: error.message }, 500);
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

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });

    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("[Notifications] Error marking notification as read:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[Notifications] Error marking all notifications as read:", error);
    return c.json({ error: error.message }, 500);
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

    // Verify notification belongs to user
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });

    if (!notification) {
      return c.json({ error: "Notification not found" }, 404);
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("[Notifications] Error deleting notification:", error);
    return c.json({ error: error.message }, 500);
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
    console.error("[Notifications] Error deleting all notifications:", error);
    return c.json({ error: error.message }, 500);
  }
});

export default notifications;
