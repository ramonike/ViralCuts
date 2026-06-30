import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { startVideoGeneration, getGenerationStatus, generateImage, getPrediction } from "../services/replicate.js";
import { generateWithGroq, testGroqKey } from "../services/groq.js";
import { generateWithGemini, testGeminiKey, listModels } from "../services/gemini.js";

const ai = new Hono();

ai.use("/*", authMiddleware);

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function generateText(systemPrompt, userPrompt) {
    const provider = process.env.AI_PROVIDER || "groq";
    console.log(`[AI Route] Using provider=${provider}`);
    if (provider === "groq") {
        return await generateWithGroq(systemPrompt, userPrompt);
    }
    return await generateWithGemini(systemPrompt, userPrompt);
}

// ─── Video Generation ────────────────────────────────────────────────────────

ai.post("/generate-video", async (c) => {
    try {
        const body = await c.req.json().catch(() => null);
        if (!body || !body.prompt) {
            return c.json({ error: "Prompt is required" }, 400);
        }
        const { prompt, model } = body;
        const prediction = await startVideoGeneration(prompt, model);
        return c.json({
            id: prediction.id,
            status: prediction.status,
            createdAt: prediction.created_at
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

ai.get("/status/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const prediction = await getGenerationStatus(id);
        return c.json({
            id: prediction.id,
            status: prediction.status,
            output: prediction.output,
            error: prediction.error,
            progress: prediction.logs ? "Processing..." : "Queued"
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// ─── Image Generation (Thumbnails) ───────────────────────────────────────────

ai.post("/generate-thumbnail", async (c) => {
    try {
        const body = await c.req.json().catch(() => null);
        if (!body || !body.prompt) {
            return c.json({ error: "Prompt is required" }, 400);
        }
        const prediction = await generateImage({
            prompt: body.prompt,
            aspectRatio: body.aspectRatio || "16:9",
            safetyLevel: body.safetyLevel || "block_medium_and_above",
        });
        return c.json({
            id: prediction.id,
            status: prediction.status,
            urls: prediction.urls,
            createdAt: prediction.created_at,
        });
    } catch (error) {
        console.error("[AI Route] Thumbnail error:", error.message);
        return c.json({ error: error.message }, 500);
    }
});

ai.get("/thumbnail-status/:id", async (c) => {
    try {
        const id = c.req.param("id");
        const prediction = await getPrediction(id);
        return c.json({
            id: prediction.id,
            status: prediction.status,
            output: prediction.output,
            error: prediction.error,
        });
    } catch (error) {
        return c.json({ error: error.message }, 500);
    }
});

// ─── Text Generation ─────────────────────────────────────────────────────────

ai.post("/generate", async (c) => {
    try {
        const body = await c.req.json().catch(() => null);
        if (!body || !body.prompt) {
            return c.json({ error: "Prompt is required" }, 400);
        }

        const text = await generateText(body.system, body.prompt);
        return c.json({ text });
    } catch (error) {
        console.error("[AI Route] Generate error:", error.message);
        console.error("[AI Route] Stack:", error.stack);
        return c.json({
            error: `${process.env.AI_PROVIDER || "groq"} error: ${error.message}`,
            detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, 500);
    }
});

// ─── Diagnostics ─────────────────────────────────────────────────────────────

ai.get("/diagnostic", async (c) => {
    const provider = process.env.AI_PROVIDER || "groq";

    if (provider === "gemini") {
        const currentModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        const result = await testGeminiKey(currentModel);
        return c.json({
            ...result,
            provider: "gemini",
            currentModel,
            hasKey: !!process.env.GEMINI_API_KEY,
            nodeEnv: process.env.NODE_ENV,
        });
    }

    const result = await testGroqKey();
    return c.json({
        ...result,
        provider: "groq",
        hasKey: !!process.env.GROQ_API_KEY,
        nodeEnv: process.env.NODE_ENV,
    });
});

ai.get("/models", async (c) => {
    const result = await listModels();
    return c.json(result);
});

export default ai;