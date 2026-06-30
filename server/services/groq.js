const GROQ_API_BASE = "https://api.groq.com/openai/v1";

const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export async function generateWithGroq(systemPrompt, userPrompt, options = {}) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY not configured");
    }

    const { maxTokens = 2048, temperature = 0.7, model = MODEL } = options;

    const body = {
        model,
        messages: [
            { role: "system", content: systemPrompt || "Você é um assistente útil." },
            { role: "user", content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature,
    };

    console.log(`[Groq] Calling model=${model}`);

    const response = await fetch(`${GROQ_API_BASE}/chat/completions`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("[Groq Service] API error:", err);
        throw new Error(`Groq API error (${response.status}): ${err.slice(0, 500)}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}

export async function testGroqKey() {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return { ok: false, error: "GROQ_API_KEY not set" };

    try {
        const res = await fetch(`${GROQ_API_BASE}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: "user", content: "Say OK" }],
                max_tokens: 10,
            }),
        });
        if (!res.ok) {
            const err = await res.text();
            return { ok: false, status: res.status, error: err.slice(0, 500), model: MODEL };
        }
        return { ok: true, status: res.status, model: MODEL, provider: "groq" };
    } catch (e) {
        return { ok: false, error: e.message, model: MODEL };
    }
}
