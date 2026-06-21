import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { startVideoGeneration, getGenerationStatus } from "../services/replicate.js";
import { generateWithGemini } from "../services/gemini.js";

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
        console.error("[AI Route] Generate error:", error);
        return c.json({ error: error.message || "Erro ao chamar a IA. Tente novamente." }, 500);
    }
});

export default ai;