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

/**
 * POST /api/ai/generate
 * Generate text content (scripts, titles, descriptions) using Anthropic Claude
 */
ai.post("/generate", async (c) => {
    console.log("[AI Route] POST /generate received");
    try {
        const body = await c.req.json().catch(() => null);

        if (!body || !body.prompt) {
            return c.json({ error: "Prompt is required" }, 400);
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return c.json({ error: "ANTHROPIC_API_KEY not configured" }, 500);
        }

        const { prompt, system } = body;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
                model: "claude-haiku-4-5-20251001",
                max_tokens: 2048,
                system: system || "Você é um assistente especialista em criação de conteúdo para redes sociais brasileiras.",
                messages: [{ role: "user", content: prompt }],
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("[AI Route] Anthropic API error:", err);
            return c.json({ error: "Erro ao chamar a IA. Tente novamente." }, 500);
        }

        const data = await response.json();
        const text = data.content?.[0]?.text || "";

        return c.json({ text });
    } catch (error) {
        console.error("[AI Route] Generate error:", error);
        return c.json({ error: error.message || "Internal Server Error" }, 500);
    }
});

export default ai;