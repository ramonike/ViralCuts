const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

export async function generateWithGemini(systemPrompt, userPrompt, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured in .env");
    }

    const { maxTokens = 2048, temperature = 0.7 } = options;

    const url = `${GEMINI_API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;

    const body = {
        system_instruction: {
            parts: [{ text: systemPrompt || "Você é um assistente útil." }],
        },
        contents: [
            {
                parts: [{ text: userPrompt }],
            },
        ],
        generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
        },
    };

    console.log(`[Gemini] Calling model=${MODEL} url=${url.replace(apiKey, "***")}`);

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("[Gemini Service] API error:", err);
        throw new Error(`Gemini API error (${response.status}): ${err.slice(0, 500)}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!text) {
        console.warn("[Gemini] Empty response, raw data:", JSON.stringify(data).slice(0, 500));
    }
    return text;
}

export async function testGeminiKey(model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set" };

    const testModel = model || MODEL;
    try {
        const url = `${GEMINI_API_BASE}/models/${testModel}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Say OK" }] }],
                generationConfig: { maxOutputTokens: 10 },
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            return { ok: false, status: res.status, error: err.slice(0, 500), model: testModel };
        }
        return { ok: true, status: res.status, model: testModel };
    } catch (e) {
        return { ok: false, error: e.message, model: testModel };
    }
}

export async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { error: "GEMINI_API_KEY not set" };

    try {
        const url = `${GEMINI_API_BASE}/models?key=${apiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        const models = (data.models || []).filter(m =>
            m.name.includes("gemini") && m.supportedGenerationMethods?.includes("generateContent")
        ).map(m => ({ name: m.name, displayName: m.displayName, version: m.version }));
        return { ok: true, count: models.length, models };
    } catch (e) {
        return { ok: false, error: e.message };
    }
}
