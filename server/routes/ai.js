import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { startVideoGeneration, getGenerationStatus } from "../services/replicate.js";
import { generateWithGemini, testGeminiKey, listModels } from "../services/gemini.js";

const ai = new Hono();

ai.use("/*", authMiddleware);

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

ai.post("/generate", async (c) => {
    try {
        const body = await c.req.json().catch(() => null);
        if (!body || !body.prompt) {
            return c.json({ error: "Prompt is required" }, 400);
        }

        const text = await generateWithGemini(body.system, body.prompt);
        return c.json({ text });
    } catch (error) {
        console.error("[AI Route] Generate error:", error.message);
        console.error("[AI Route] Stack:", error.stack);
        return c.json({
            error: `Gemini error: ${error.message}`,
            detail: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, 500);
    }
});

ai.get("/diagnostic", async (c) => {
    const currentModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const result = await testGeminiKey(currentModel);
    return c.json({
        ...result,
        currentModel,
        hasKey: !!process.env.GEMINI_API_KEY,
        keyPrefix: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.slice(0, 6) + "..." : "none",
        nodeEnv: process.env.NODE_ENV,
    });
});

ai.get("/models", async (c) => {
    const result = await listModels();
    return c.json(result);
});

export default ai;