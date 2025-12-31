import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";

const videos = new Hono();

// Apply auth middleware to all routes
videos.use("/*", authMiddleware);

// GET /api/videos - List user videos
videos.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    const videoList = await prisma.video.findMany({
      where: { userId },
      include: {
        uploads: {
          select: {
            id: true,
            platform: true,
            status: true,
            scheduledAt: true,
            publishedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json(videoList);
  } catch (error) {
    console.error("Error fetching videos:", error.message);
    return c.json({ error: "Failed to fetch videos" }, 500);
  }
});

export default videos;
