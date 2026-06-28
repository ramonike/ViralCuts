/**
 * Supabase client for server-side storage operations
 * Used for storing TikTok videos temporarily until scheduled upload
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase Storage] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

/**
 * Upload a video buffer to Supabase Storage
 * @param {Buffer} buffer - Video data
 * @param {string} userId - User ID (for path namespacing)
 * @param {string} uploadId - Upload record ID (used as filename)
 * @param {string} mimeType - Video MIME type
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadVideoToStorage(buffer, userId, uploadId, mimeType = 'video/mp4') {
    const ext = mimeType.split('/')[1] || 'mp4';
    const path = `${userId}/${uploadId}.${ext}`;

    const { error } = await supabase.storage
        .from('scheduled-videos')
        .upload(path, buffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (error) throw new Error(`Storage upload failed: ${error.message}`);

    const { data } = supabase.storage
        .from('scheduled-videos')
        .getPublicUrl(path);

    return data.publicUrl;
}

/**
 * Delete a video from Supabase Storage after it's been published
 * @param {string} userId - User ID
 * @param {string} uploadId - Upload record ID
 * @param {string} ext - File extension
 */
export async function deleteVideoFromStorage(userId, uploadId, ext = 'mp4') {
    const path = `${userId}/${uploadId}.${ext}`;
    await supabase.storage.from('scheduled-videos').remove([path]);
}

export default supabase;