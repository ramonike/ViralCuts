/**
 * Replicate Service
 * Handles communication with Replicate API for video generation
 */

const REPLICATE_API_URL = 'https://api.replicate.com/v1';

/**
 * Start a prediction (video generation)
 * @param {string} prompt - The text prompt
 * @param {string} model - The model ID (default to HunyuanVideo or Kling)
 * @returns {Promise<Object>} The prediction object
 */
export async function startVideoGeneration(prompt, model = 'lucataco/hunyuanvideo:8972883c076b47161b47926e8fb26a4270df7f33') {
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        throw new Error('REPLICATE_API_TOKEN is not configured in .env');
    }

    const response = await fetch(`${REPLICATE_API_URL}/predictions`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            version: model.split(':')[1],
            input: {
                prompt: prompt,
                // Default quality settings
                num_frames: 49,
                guidance_scale: 6,
                num_inference_steps: 50
            },
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Replicate API Error: ${error.detail || response.statusText}`);
    }

    return await response.json();
}

/**
 * Get the status of a prediction
 * @param {string} predictionId - The ID of the prediction
 * @returns {Promise<Object>} The prediction object with current status
 */
export async function getGenerationStatus(predictionId) {
    const token = process.env.REPLICATE_API_TOKEN;

    if (!token) {
        throw new Error('REPLICATE_API_TOKEN is not configured in .env');
    }

    const response = await fetch(`${REPLICATE_API_URL}/predictions/${predictionId}`, {
        headers: {
            'Authorization': `Token ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Replicate API Error: ${response.statusText}`);
    }

    return await response.json();
}
