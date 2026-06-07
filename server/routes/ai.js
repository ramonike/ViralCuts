/**
 * AI Routes
 * Endpoints for AI content creation
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { startVideoGeneration, getGenerationStatus } from "../services/replicate.js";

const ai = new Hono();

// All AI routes require authentication
ai.use("/*", authMiddleware);

/**
 * POST /api/ai/generate-video
 * Trigger video generation from a prompt
 */
ai.post("/generate-video", async (c) => {
    console.log("[AI Route] POST /generate-video received");
    try {
        const body = await c.req.json().catch(err => {
            console.error("[AI Route] JSON Parse Error in Request:", err.message);
            return null;
        });

        if (!body || !body.prompt) {
            return c.json({ error: "Prompt is required and must be valid JSON" }, 400);
        }

        const { prompt, model } = body;
        console.log("[AI Route] Starting generation for prompt:", prompt.substring(0, 50));

        const prediction = await startVideoGeneration(prompt, model);
        console.log("[AI Route] Prediction started:", prediction.id);

        return c.json({
            id: prediction.id,
            status: prediction.status,
            createdAt: prediction.created_at
        });
    } catch (error) {
        console.error("[AI Route] Unexpected error:", error);
        return c.json({
            error: error.message || "Internal Server Error",
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, 500);
    }
});

/**
 * GET /api/ai/status/:id
 * Check the status of a generation
 */
ai.get("/status/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const prediction = await getGenerationStatus(id);

        return c.json({
            id: prediction.id,
            status: prediction.status,
            output: prediction.output, // This will contain the video URL when finished
            error: prediction.error,
            progress: prediction.logs ? "Processing..." : "Queued"
        });
    } catch (error) {
        console.error("[AI Route] Status error:", error.message);
        return c.json({ error: error.message }, 500);
    }
});

export default ai;
