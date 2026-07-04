import { Hono } from "hono";
import { prisma } from "../db/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { sendError } from "../utils/http-error.js";

const uploads = new Hono();

// Helper: converte campos BigInt para Number (JSON.stringify não suporta BigInt)
function serializeUpload(upload) {
  return {
    ...upload,
    fileSize: upload.fileSize != null ? Number(upload.fileSize) : null,
    bytesUploaded: upload.bytesUploaded != null ? Number(upload.bytesUploaded) : 0,
  };
}

// Apply auth middleware to all routes
uploads.use("/*", authMiddleware);

// GET /api/uploads - List upload queue with platform statuses
uploads.get("/", async (c) => {
  const userId = c.get("userId");

  try {
    const uploadList = await prisma.upload.findMany({
      where: { userId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        platformStatuses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json(uploadList.map(serializeUpload));
  } catch (error) {
    console.error("Error fetching uploads:", error.message);
    return c.json({ error: "Failed to fetch uploads" }, 500);
  }
});

// POST /api/uploads - Add to upload queue with multi-platform support
uploads.post("/", async (c) => {
  const userId = c.get("userId");

  try {
    const body = await c.req.json();
    const { videoId, platform, platforms, status, scheduledAt, metadata } = body;

    // Normalize platforms to array
    const platformList = platforms || (platform ? [platform] : ['youtube']);

    if (platformList.length === 0) {
      return c.json({ error: "At least one platform is required" }, 400);
    }

    // Create upload with platform statuses
    const upload = await prisma.upload.create({
      data: {
        userId,
        videoId: videoId || null,
        platform: platformList[0],
        platforms: platformList,
        status: status || "pending",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        metadata: metadata || null,
        platformStatuses: {
          create: platformList.map(p => ({
            platform: p,
            status: "pending",
            scheduledAt: metadata?.platformSchedules?.[p]
              ? new Date(metadata.platformSchedules[p])
              : (scheduledAt ? new Date(scheduledAt) : null),
          })),
        },
      },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        platformStatuses: true,
      },
    });

    return c.json(serializeUpload(upload), 201);
  } catch (error) {
    console.error("Error creating upload:", error.message);
    return c.json({ error: "Failed to create upload" }, 500);
  }
});

// PUT /api/uploads/:id - Update upload status
uploads.put("/:id", async (c) => {
  const userId = c.get("userId");
  const uploadId = c.req.param("id");

  try {
    // Verify ownership
    const existing = await prisma.upload.findFirst({
      where: { id: uploadId, userId },
    });

    if (!existing) {
      return c.json({ error: "Upload not found" }, 404);
    }

    const body = await c.req.json();
    const { status, scheduledAt, publishedAt, metadata, platforms } = body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (platforms !== undefined) {
      updateData.platforms = platforms;
      updateData.platform = platforms[0];
    }

    await prisma.upload.updateMany({
      where: { id: uploadId, userId },
      data: updateData,
    });

    const upload = await prisma.upload.findFirst({
      where: { id: uploadId, userId },
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
          },
        },
        platformStatuses: true,
      },
    });

    if (!upload) {
      return c.json({ error: "Upload not found" }, 404);
    }

    return c.json(serializeUpload(upload));
  } catch (error) {
    console.error("Error updating upload:", error.message);
    return c.json({ error: "Failed to update upload" }, 500);
  }
});

// PUT /api/uploads/:id/platform/:platform - Update platform-specific status
uploads.put("/:id/platform/:platform", async (c) => {
  const userId = c.get("userId");
  const uploadId = c.req.param("id");
  const platform = c.req.param("platform");

  try {
    // Verify ownership
    const existing = await prisma.upload.findFirst({
      where: { id: uploadId, userId },
      include: { platformStatuses: true },
    });

    if (!existing) {
      return c.json({ error: "Upload not found" }, 404);
    }

    const body = await c.req.json();
    const { status, platformVideoId, platformVideoUrl, error, scheduledAt, publishedAt, metadata } = body;

    const updateData = {};
    if (status !== undefined) updateData.status = status;
    if (platformVideoId !== undefined) updateData.platformVideoId = platformVideoId;
    if (platformVideoUrl !== undefined) updateData.platformVideoUrl = platformVideoUrl;
    if (error !== undefined) updateData.error = error;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    if (metadata !== undefined) updateData.metadata = metadata;

    const platformStatus = await prisma.platformUploadStatus.upsert({
      where: {
        uploadId_platform: {
          uploadId,
          platform,
        },
      },
      update: updateData,
      create: {
        uploadId,
        platform,
        ...updateData,
      },
    });

    // Update overall upload status based on platform statuses
    const allStatuses = await prisma.platformUploadStatus.findMany({
      where: { uploadId },
    });

    const statusCounts = {
      pending: 0,
      uploading: 0,
      processing: 0,
      published: 0,
      failed: 0,
    };

    allStatuses.forEach(s => {
      if (statusCounts[s.status] !== undefined) {
        statusCounts[s.status]++;
      }
    });

    let overallStatus = 'pending';
    if (statusCounts.published === allStatuses.length) {
      overallStatus = 'completed';
    } else if (statusCounts.failed === allStatuses.length) {
      overallStatus = 'failed';
    } else if (statusCounts.uploading > 0 || statusCounts.processing > 0) {
      overallStatus = 'uploading';
    } else if (statusCounts.published > 0 || statusCounts.failed > 0) {
      overallStatus = 'processing';
    }

    await prisma.upload.updateMany({
      where: { id: uploadId, userId },
      data: { status: overallStatus },
    });

    return c.json(platformStatus);
  } catch (error) {
    console.error("Error updating platform status:", error.message);
    return c.json({ error: "Failed to update platform status" }, 500);
  }
});

// DELETE /api/uploads/:id - Remove from queue
uploads.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const uploadId = c.req.param("id");

  try {
    // Verify ownership
    const existing = await prisma.upload.findFirst({
      where: { id: uploadId, userId },
    });

    if (!existing) {
      return c.json({ error: "Upload not found" }, 404);
    }

    await prisma.upload.deleteMany({
      where: { id: uploadId, userId },
    });

    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting upload:", error.message);
    return c.json({ error: "Failed to delete upload" }, 500);
  }
});

// POST /api/uploads/store-video - Save video to Supabase Storage for TikTok scheduling
uploads.post("/store-video", async (c) => {
  const userId = c.get("userId");

  try {
    const formData = await c.req.formData();
    const file = formData.get("file");
    const uploadId = formData.get("uploadId");

    if (!file || !uploadId) {
      return c.json({ error: "file e uploadId são obrigatórios" }, 400);
    }

    // Verificar que o upload pertence ao usuário
    const existing = await prisma.upload.findFirst({ where: { id: uploadId, userId } });
    if (!existing) return c.json({ error: "Upload não encontrado" }, 404);

    const { isSupabaseStorageConfigured, uploadVideoToStorage } = await import("../db/supabase.js");

    if (!isSupabaseStorageConfigured()) {
      return c.json({ error: "Storage service unavailable" }, 503);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "video/mp4";

    const fileUrl = await uploadVideoToStorage(buffer, userId, uploadId, mimeType);

    return c.json({ success: true, fileUrl });
  } catch (error) {
    return sendError(c, {
      scope: "[Uploads] Store video",
      error,
      message: "Failed to store video",
    });
  }
});

export default uploads;
