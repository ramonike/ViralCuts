import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

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
    console.error("Error fetching achievements:", error.message);
    return c.json({ error: "Failed to fetch achievements" }, 500);
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
    console.error("Error unlocking achievement:", error.message);
    return c.json({ error: "Failed to unlock achievement" }, 500);
  }
});

export default achievements;
