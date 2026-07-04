import { uploadToYouTubeResumable } from "./realUpload";
import { requireMockMode } from "../config/features";

/**
 * Envia video para YouTube/TikTok ou usa simulacao apenas quando habilitada.
 * @param {Object} item - Dados do video
 * @param {string} [token] - Token de acesso
 * @param {File} [file] - Arquivo de video
 * @returns {Promise<{status: string, url?: string, error?: string}>}
 */
export async function uploadVideo(item, token, file) {
  console.log("[uploadVideo] Platform:", item.platform);
  console.log("[uploadVideo] File:", file?.name);

  const isYouTube = item.platform === "YouTube Shorts" || item.platform === "youtube-shorts" || item.platform === "youtube";

  if (isYouTube && token && file) {
    return uploadToYouTubeResumable({
      file,
      title: item.title,
      description: item.description,
      privacyStatus: item.privacyStatus,
      publishAt: item.publishAt,
      token,
    });
  }

  requireMockMode("Upload simulado desativado. Configure VITE_USE_MOCKS=true apenas em desenvolvimento.");

  console.log("Simulando upload (sem token ou arquivo real)...", item);
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    status: "success",
    url: `https://youtube.com/shorts/mock-${crypto.randomUUID()}`,
  };
}
