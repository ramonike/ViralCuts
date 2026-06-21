const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

export async function generateWithGemini(systemPrompt, userPrompt, options = {}) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not configured in .env");
    }

    const { maxTokens = 2048, temperature = 0.7 } = options;

    const url = `${GEMINI_API_BASE}/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        }),
    });

    if (!response.ok) {
        const err = await response.text();
        console.error("[Gemini Service] API error:", err);
        throw new Error("Erro ao chamar a IA. Tente novamente.");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}
