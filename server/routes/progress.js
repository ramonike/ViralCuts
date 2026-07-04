import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendError } from "../utils/http-error.js";

const progress = new Hono();

// Apply auth middleware to all routes
progress.use("/*", authMiddleware);

// GET /api/progress - Get user's journey progress
progress.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    let userProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    // Create default progress if not exists
    if (!userProgress) {
      userProgress = await prisma.userProgress.create({
        data: {
          userId,
          currentStage: "setup",
          completedMilestones: [],
          experienceLevel: "beginner",
          totalPoints: 0,
          currentStreak: 0,
          onboardingCompleted: false,
        },
      });
    }

    return c.json(userProgress);
  } catch (error) {
    return sendError(c, { scope: "[Progress] Get", error, message: "Failed to fetch progress" });
  }
});

// POST /api/progress - Update journey progress
progress.post("/", async (c) => {
  const userId = c.get("userId");

  try {
    const body = await c.req.json();
    const { currentStage, experienceLevel, totalPoints, currentStreak, onboardingCompleted } = body;

    const updateData = {};
    if (currentStage !== undefined) updateData.currentStage = currentStage;
    if (experienceLevel !== undefined) updateData.experienceLevel = experienceLevel;
    if (totalPoints !== undefined) updateData.totalPoints = totalPoints;
    if (currentStreak !== undefined) updateData.currentStreak = currentStreak;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;
    updateData.lastActiveDate = new Date();

    const userProgress = await prisma.userProgress.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        currentStage: currentStage || "setup",
        completedMilestones: [],
        experienceLevel: experienceLevel || "beginner",
        totalPoints: totalPoints || 0,
        currentStreak: currentStreak || 0,
        onboardingCompleted: onboardingCompleted || false,
      },
    });

    return c.json(userProgress);
  } catch (error) {
    return sendError(c, { scope: "[Progress] Update", error, message: "Failed to update progress" });
  }
});

// POST /api/progress/milestone - Complete a milestone
progress.post("/milestone", async (c) => {
  const userId = c.get("userId");

  try {
    const body = await c.req.json();
    const { milestoneId, points } = body;

    if (!milestoneId) {
      return c.json({ error: "milestoneId is required" }, 400);
    }

    // Get current progress
    let userProgress = await prisma.userProgress.findUnique({
      where: { userId },
    });

    // Create if not exists
    if (!userProgress) {
      userProgress = await prisma.userProgress.create({
        data: {
          userId,
          currentStage: "setup",
          completedMilestones: [milestoneId],
          experienceLevel: "beginner",
          totalPoints: points || 0,
          currentStreak: 0,
          onboardingCompleted: false,
        },
      });
      return c.json(userProgress);
    }

    // Check if milestone already completed
    if (userProgress.completedMilestones.includes(milestoneId)) {
      return c.json({ error: "Milestone already completed", progress: userProgress }, 400);
    }

    // Update with new milestone
    const updatedProgress = await prisma.userProgress.update({
      where: { userId },
      data: {
        completedMilestones: [...userProgress.completedMilestones, milestoneId],
        totalPoints: userProgress.totalPoints + (points || 0),
        lastActiveDate: new Date(),
      },
    });

    return c.json(updatedProgress);
  } catch (error) {
    return sendError(c, { scope: "[Progress] Milestone", error, message: "Failed to complete milestone" });
  }
});

export default progress;
