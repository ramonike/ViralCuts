const REPLICATE_API_URL = 'https://api.replicate.com/v1';

function getToken() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) throw new Error('REPLICATE_API_TOKEN not configured');
    return token;
}

async function request(method, path, body) {
    const res = await fetch(`${REPLICATE_API_URL}${path}`, {
        method,
        headers: {
            'Authorization': `Token ${getToken()}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(`Replicate API (${res.status}): ${err.detail || res.statusText}`);
    }
    return res.json();
}

export async function startVideoGeneration(prompt, model = 'lucataco/hunyuanvideo:8972883c076b47161b47926e8fb26a4270df7f33') {
    return request('POST', '/predictions', {
        version: model.split(':')[1],
        input: { prompt, num_frames: 49, guidance_scale: 6, num_inference_steps: 50 },
    });
}

export async function getGenerationStatus(predictionId) {
    return request('GET', `/predictions/${predictionId}`);
}

export async function generateImage({ prompt, aspectRatio = '16:9', model = 'google/imagen-4', safetyLevel = 'block_medium_and_above' }) {
    return request('POST', `/models/${model}/predictions`, {
        input: {
            prompt,
            aspect_ratio: aspectRatio,
            safety_filter_level: safetyLevel,
        },
    });
}

export async function getPrediction(predictionId) {
    return request('GET', `/predictions/${predictionId}`);
}
