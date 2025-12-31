import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const settings = new Hono();

// Apply auth middleware to all routes
settings.use("/*", authMiddleware);

// GET /api/settings - Get user settings
settings.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    // Create default settings if not exists
    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: {
          userId,
          theme: "dark",
          notifications: true,
          defaultPrivacy: "private",
        },
      });
    }

    return c.json(userSettings);
  } catch (error) {
    console.error("Error fetching settings:", error.message);
    return c.json({ error: "Failed to fetch settings" }, 500);
  }
});

// PUT /api/settings - Update settings
settings.put("/", async (c) => {
  const userId = c.get("userId");

  try {
    const body = await c.req.json();
    const { theme, notifications, defaultPrivacy } = body;

    const updateData = {};
    if (theme !== undefined) updateData.theme = theme;
    if (notifications !== undefined) updateData.notifications = notifications;
    if (defaultPrivacy !== undefined) updateData.defaultPrivacy = defaultPrivacy;

    const userSettings = await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        theme: theme || "dark",
        notifications: notifications !== undefined ? notifications : true,
        defaultPrivacy: defaultPrivacy || "private",
      },
    });

    return c.json(userSettings);
  } catch (error) {
    console.error("Error updating settings:", error.message);
    return c.json({ error: "Failed to update settings" }, 500);
  }
});

export default settings;
