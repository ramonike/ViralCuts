import { uploadToYouTubeResumable } from "./realUpload";

/**
 * Simula upload de vídeo para YouTube/TikTok ou usa implementação real se arquivo fornecido.
 * @param {Object} item - Dados do vídeo (title, platform, etc)
 * @param {string} [token] - Token de acesso
 * @param {File} [file] - Arquivo de vídeo (necessário para upload real)
 * @returns {Promise<{status: string, url?: string, error?: string}>}
 */
export async function uploadVideo(item, token, file) {
  console.log("[uploadVideo] Platform:", item.platform);
  console.log("[uploadVideo] File:", file?.name);

  // Se for YouTube e tiver arquivo, tenta upload real via Google API cliente
  const isYouTube = item.platform === "YouTube Shorts" || item.platform === "youtube-shorts" || item.platform === "youtube";

  if (isYouTube && token && file) {
    return await uploadToYouTubeResumable({
      file: file,
      title: item.title,
      description: item.description,
      privacyStatus: item.privacyStatus,
      publishAt: item.publishAt, // YouTube scheduling 
      token: token // Adicionando o token recuperado do state local
    });
  }


  // Fallback para simulação
  console.log("Simulando upload (sem token ou arquivo real)...", item);
  await new Promise((res) => setTimeout(res, 2000));

  if (Math.random() < 0.9) {
    return {
      status: "success",
      url: `https://youtube.com/shorts/${Math.random().toString(36).slice(2, 10)}`,
    };
  } else {
    return {
      status: "error",
      error: "Falha no upload simulado. Tente novamente.",
    };
  }
}
