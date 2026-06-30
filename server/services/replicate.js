import Replicate from "replicate";

function getClient() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error("REPLICATE_API_TOKEN not configured");
    return new Replicate({ auth: token });
}

export async function startVideoGeneration(prompt, model = "lucataco/hunyuanvideo:8972883c076b47161b47926e8fb26a4270df7f33") {
    const [owner, nameWithVersion] = model.split("/");
    const [name, version] = nameWithVersion.split(":");
    const replicate = getClient();
    const prediction = await replicate.predictions.create({
        model: `${owner}/${name}`,
        version,
        input: { prompt, num_frames: 49, guidance_scale: 6, num_inference_steps: 50 },
    });
    return prediction;
}

export async function getGenerationStatus(predictionId) {
    const replicate = getClient();
    return replicate.predictions.get(predictionId);
}

export async function generateImage({ prompt, aspectRatio = "16:9", safetyLevel = "block_medium_and_above" }) {
    const replicate = getClient();
    const prediction = await replicate.predictions.create({
        model: "google/imagen-4",
        input: {
            prompt,
            aspect_ratio: aspectRatio,
            output_format: "jpg",
            safety_filter_level: safetyLevel,
        },
    });
    return prediction;
}

export async function getPrediction(predictionId) {
    const replicate = getClient();
    return replicate.predictions.get(predictionId);
}
