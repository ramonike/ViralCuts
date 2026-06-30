const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

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

export async function testGeminiKey() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set" };

    try {
        const url = `${GEMINI_API_BASE}/models/${MODEL}:generateContent?key=${apiKey}`;
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
            return { ok: false, status: res.status, error: err.slice(0, 500), model: MODEL };
        }
        return { ok: true, status: res.status, model: MODEL };
    } catch (e) {
        return { ok: false, error: e.message, model: MODEL };
    }
}
