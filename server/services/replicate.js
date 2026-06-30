import Replicate from "replicate";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

function getClient() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("REPLICATE_API_TOKEN not configured");
    return new Replicate({ auth: token });
}

function getToken() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("REPLICATE_API_TOKEN not configured");
    return token;
}

async function rawGet(path) {
    const res = await fetch(`${REPLICATE_API_URL}${path}`, {
        headers: { Authorization: `Token ${getToken()}` },
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(`Replicate API (${res.status}): ${err.detail || res.statusText}`);
    }
    return res.json();
}

async function rawPost(path, body) {
    const res = await fetch(`${REPLICATE_API_URL}${path}`, {
        method: "POST",
        headers: {
            Authorization: `Token ${getToken()}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(`Replicate API (${res.status}): ${err.detail || res.statusText}`);
    }
    return res.json();
}

export async function startVideoGeneration(prompt, model = "lucataco/hunyuanvideo:8972883c076b47161b47926e8fb26a4270df7f33") {
    const [owner, nameWithVersion] = model.split("/");
    const [name, version] = nameWithVersion.split(":");
    const replicate = getClient();
    return replicate.predictions.create({
        model: `${owner}/${name}`,
        version,
        input: { prompt, num_frames: 49, guidance_scale: 6, num_inference_steps: 50 },
    });
}

export async function getGenerationStatus(predictionId) {
    return rawGet(`/predictions/${predictionId}`);
}

export async function generateImage({ prompt, aspectRatio = "16:9", safetyLevel = "block_medium_and_above" }) {
    return rawPost(`/models/google/imagen-4/predictions`, {
        input: {
            prompt,
            aspect_ratio: aspectRatio,
            output_format: "jpg",
            safety_filter_level: safetyLevel,
        },
    });
}

export async function getPrediction(predictionId) {
    return rawGet(`/predictions/${predictionId}`);
}
