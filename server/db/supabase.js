/**
 * Supabase client for server-side storage operations
 * Used for storing TikTok videos temporarily until scheduled upload
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('[Supabase Storage] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
}

export function isSupabaseStorageConfigured() {
    return Boolean(supabaseUrl && supabaseServiceKey);
}

export function getSupabaseStorageClient() {
    if (!isSupabaseStorageConfigured()) {
        throw new Error('Supabase Storage is not configured on the server.');
    }

    return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Upload a video buffer to Supabase Storage
 * @param {Buffer} buffer - Video data
 * @param {string} userId - User ID (for path namespacing)
 * @param {string} uploadId - Upload record ID (used as filename)
 * @param {string} mimeType - Video MIME type
 * @returns {Promise<{ path: string }>} Storage object path
 */
export async function uploadVideoToStorage(buffer, userId, uploadId, mimeType = 'video/mp4') {
    const supabase = getSupabaseStorageClient();
    const ext = mimeType.split('/')[1] || 'mp4';
    const path = `${userId}/${uploadId}.${ext}`;

    const { error } = await supabase.storage
        .from('scheduled-videos')
        .upload(path, buffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    return { path };
}

export async function createSignedVideoUrl(path, expiresIn = 60 * 30) {
    const supabase = getSupabaseStorageClient();

    const { data, error } = await supabase.storage
        .from('scheduled-videos')
        .createSignedUrl(path, expiresIn);

    if (error) throw new Error(`Storage signed URL failed: ${error.message}`);

    return data.signedUrl;
}

/**
 * Delete a video from Supabase Storage after it's been published
 * @param {string} userId - User ID
 * @param {string} uploadId - Upload record ID
 * @param {string} ext - File extension
 */
export async function deleteVideoFromStorage(userId, uploadId, ext = 'mp4') {
    const supabase = getSupabaseStorageClient();
    const path = `${userId}/${uploadId}.${ext}`;
    await supabase.storage.from('scheduled-videos').remove([path]);
}

export async function deleteVideoPathFromStorage(path) {
    const supabase = getSupabaseStorageClient();
    await supabase.storage.from('scheduled-videos').remove([path]);
}

export default getSupabaseStorageClient;
