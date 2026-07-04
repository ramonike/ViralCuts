import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendError } from "../utils/http-error.js";

const achievements = new Hono();

// Apply auth middleware to all routes
achievements.use("/*", authMiddleware);

// GET /api/achievements - List user achievements
achievements.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    const achievementList = await prisma.achievement.findMany({
      where: { userId },
      orderBy: { unlockedAt: "desc" },
    });

    return c.json(achievementList);
  } catch (error) {
    return sendError(c, { scope: "[Achievements] List", error, message: "Failed to fetch achievements" });
  }
});

// POST /api/achievements - Unlock achievement
achievements.post("/", async (c) => {
  const userId = c.get("userId");

  try {
    const body = await c.req.json();
    const { achievementId } = body;

    if (!achievementId) {
      return c.json({ error: "achievementId is required" }, 400);
    }

    // Check if already unlocked (unique constraint will also catch this)
    const existing = await prisma.achievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId,
        },
      },
    });

    if (existing) {
      return c.json({ error: "Achievement already unlocked", achievement: existing }, 400);
    }

    const achievement = await prisma.achievement.create({
      data: {
        userId,
        achievementId,
      },
    });

    return c.json(achievement, 201);
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return c.json({ error: "Achievement already unlocked" }, 400);
    }
    return sendError(c, { scope: "[Achievements] Unlock", error, message: "Failed to unlock achievement" });
  }
});

export default achievements;
