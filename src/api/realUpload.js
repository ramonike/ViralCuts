/**
 * YouTube Upload API
 * Implements resumable chunked uploads via backend service
 * Requirements: 2.1-2.4
 */

const API_URL = import.meta.env.VITE_API_URL || '';
const DEFAULT_CHUNK_SIZE = 8 * 1024 * 1024; // 8MB chunks

/**
 * Initiate a resumable upload session (Client-Side)
 * Requirements: 2.1
 */
export async function initiateResumableUpload(params) {
  const { title, description, tags, categoryId, privacyStatus, publishAt, playlistId, fileSize, mimeType, accountId, token } = params;

  if (!title) return { status: "error", error: "Título do vídeo é obrigatório." };
  if (!fileSize || fileSize <= 0) return { status: "error", error: "Tamanho do arquivo inválido." };
  if (!token) return { status: "error", error: "Token não fornecido para upload." };

  try {
    const videoResource = {
      snippet: {
        title,
        description: description || "Uploaded via ViralCuts Dashboard",
        tags: tags || ["shorts", "viralcuts"],
        categoryId: categoryId || "22",
      },
      status: {
        privacyStatus: publishAt ? "private" : (privacyStatus || "private"),
        selfDeclaredMadeForKids: false,
      },
    };

    if (publishAt) {
      videoResource.status.publishAt = new Date(publishAt).toISOString();
    }

    const res = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Length': fileSize.toString(),
        'X-Upload-Content-Type': mimeType,
      },
      body: JSON.stringify(videoResource),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { status: "error", error: data.error?.message || "Erro ao iniciar upload no Google." };
    }

    const sessionUri = res.headers.get('location');
    if (!sessionUri) {
        return { status: "error", error: "Nenhum session URI retornado pelo YouTube." };
    }

    return {
      status: "success",
      uploadId: `up_${Date.now()}`,
      sessionUri: sessionUri,
      totalBytes: fileSize,
    };
  } catch (error) {
    console.error("[Initiate Upload] Exception:", error);
    return { status: "error", error: error.message };
  }
}

/**
 * Upload a chunk of the video file (Client-Side)
 * Requirements: 2.2
 */
export async function uploadChunk(params) {
  const { sessionUri, uploadId, chunk, startByte, totalBytes, accountId, token } = params;

  if (!sessionUri) return { status: "error", error: "Session URI é obrigatório." };

  const endByte = startByte + chunk.size - 1;

  try {
    const res = await fetch(sessionUri, {
      method: 'PUT',
      headers: {
        'Content-Range': `bytes ${startByte}-${endByte}/${totalBytes}`,
      },
      body: chunk,
    });

    if (res.status === 308) {
        let bytesUploaded = endByte + 1;
        const rangeHeader = res.headers.get("range");
        if (rangeHeader) {
            const match = rangeHeader.match(/bytes=0-(\d+)/);
            if (match) bytesUploaded = parseInt(match[1], 10) + 1;
        }

        return {
            status: "uploading",
            bytesUploaded,
            totalBytes,
            progress: Math.round((bytesUploaded / totalBytes) * 100),
        };
    }

    if (res.ok) {
      const data = await res.json();
      return {
        status: "complete",
        bytesUploaded: totalBytes,
        totalBytes: totalBytes,
        progress: 100,
        videoId: data.id,
      };
    }

    const data = await res.json().catch(() => ({}));
    return { status: "error", error: data.error?.message || "Erro no upload do chunk.", retryable: res.status >= 500 };

  } catch (error) {
    console.error("[Upload Chunk] Exception:", error);
    return { status: "error", error: error.message, retryable: true };
  }
}

/**
 * Resume an interrupted upload (Client-Side)
 * Requirements: 2.3
 */
export async function resumeUpload(params) {
  const { uploadId, sessionUri, totalBytes, accountId, token } = params;

  if (!sessionUri) return { status: "error", error: "Session URI é obrigatório." };

  try {
    const res = await fetch(sessionUri, {
      method: 'PUT',
      headers: { 'Content-Range': `bytes */${totalBytes}` },
    });

    if (res.status === 308) {
        let bytesUploaded = 0;
        const rangeHeader = res.headers.get("range");
        if (rangeHeader) {
            const match = rangeHeader.match(/bytes=0-(\d+)/);
            if (match) bytesUploaded = parseInt(match[1], 10) + 1;
        }

        return {
            status: "uploading",
            bytesUploaded,
            totalBytes,
            progress: Math.round((bytesUploaded / totalBytes) * 100),
            resumeFrom: bytesUploaded,
        };
    }

    if (res.ok) {
        const data = await res.json();
        return {
            status: "complete",
            bytesUploaded: totalBytes,
            totalBytes,
            progress: 100,
            videoId: data.id,
        };
    }

    return { status: "error", error: "Erro ao retomar upload." };
  } catch (error) {
    console.error("[Resume Upload] Exception:", error);
    return { status: "error", error: error.message };
  }
}

/**
 * Upload file with chunked resumable upload
 * Requirements: 2.1-2.4
 * 
 * @param {Object} params - Upload parameters
 * @param {File} params.file - Video file
 * @param {string} params.title - Video title
 * @param {string} params.description - Video description
 * @param {string[]} params.tags - Video tags
 * @param {string} params.categoryId - YouTube category ID
 * @param {string} params.privacyStatus - Privacy status
 * @param {string} params.publishAt - Scheduled publish time
 * @param {string} params.playlistId - Playlist ID
 * @param {string} params.accountId - YouTube account ID
 * @param {Function} params.onProgress - Progress callback (progress, bytesUploaded, totalBytes)
 * @param {AbortSignal} params.signal - Abort signal for cancellation
 * @returns {Promise<{status: string, url?: string, videoId?: string, error?: string}>}
 */
export async function uploadToYouTubeResumable(params) {
  const { 
    file, title, description, tags, categoryId, privacyStatus, 
    publishAt, playlistId, accountId, onProgress, signal, token 
  } = params;

  if (!file) {
    return { status: "error", error: "Arquivo de vídeo é obrigatório." };
  }

  if (!title) {
    return { status: "error", error: "Título do vídeo é obrigatório." };
  }

  try {
    // Step 1: Initiate upload session
    const initResult = await initiateResumableUpload({
      title,
      description,
      tags,
      categoryId,
      privacyStatus,
      publishAt,
      playlistId,
      fileSize: file.size,
      mimeType: file.type,
      accountId,
      token,
    });

    if (initResult.status === "error") {
      return initResult;
    }

    const { uploadId, sessionUri } = initResult;
    const totalBytes = file.size;
    let bytesUploaded = 0;

    // Step 2: Upload chunks
    while (bytesUploaded < totalBytes) {
      // Check for cancellation
      if (signal?.aborted) {
        return { status: "cancelled", error: "Upload cancelado." };
      }

      const chunkEnd = Math.min(bytesUploaded + DEFAULT_CHUNK_SIZE, totalBytes);
      const chunk = file.slice(bytesUploaded, chunkEnd);

      const chunkResult = await uploadChunk({
        sessionUri,
        uploadId,
        chunk,
        startByte: bytesUploaded,
        totalBytes,
        accountId,
        token,
      });

      if (chunkResult.status === "error") {
        // Retry logic for retryable errors
        if (chunkResult.retryable) {
          // Wait and retry once
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResult = await uploadChunk({
            sessionUri,
            uploadId,
            chunk,
            startByte: bytesUploaded,
            totalBytes,
            accountId,
            token,
          });

          if (retryResult.status === "error") {
            return retryResult;
          }
          bytesUploaded = retryResult.bytesUploaded;
        } else {
          return chunkResult;
        }
      } else {
        bytesUploaded = chunkResult.bytesUploaded;
      }

      // Report progress
      const progress = Math.round((bytesUploaded / totalBytes) * 100);
      onProgress?.(progress, bytesUploaded, totalBytes);

      // Check if complete
      if (chunkResult.status === "complete" || chunkResult.videoId) {
        return {
          status: "success",
          videoId: chunkResult.videoId,
          url: `https://youtube.com/watch?v=${chunkResult.videoId}`,
        };
      }
    }

    return { status: "success" };
  } catch (error) {
    console.error("[YouTube Resumable Upload] Exception:", error);
    return { status: "error", error: error.message };
  }
}

/**
 * Legacy upload function - uses simple multipart upload for small files
 * For larger files, use uploadToYouTubeResumable instead
 * 
 * @deprecated Use uploadToYouTubeResumable for better reliability
 */
export async function uploadToYouTube({ file, title, description, token, privacyStatus = "private", publishAt }) {
  if (!token) {
    return { status: "error", error: "Token de acesso não fornecido. Conecte sua conta nas configurações." };
  }

  // For files larger than 100MB, recommend using resumable upload
  if (file.size > 100 * 1024 * 1024) {
    console.warn("[YouTube Upload] Large file detected. Consider using uploadToYouTubeResumable for better reliability.");
  }

  try {
    const metadata = {
      snippet: {
        title: title,
        description: description || "Uploaded via ViralCuts Dashboard",
        tags: ["shorts", "viralcuts"],
        categoryId: "22",
      },
      status: {
        privacyStatus: publishAt ? "private" : privacyStatus,
        publishAt: publishAt ? new Date(publishAt).toISOString() : undefined,
        selfDeclaredMadeForKids: false,
      },
    };

    console.log("[YouTube Upload] Metadata:", JSON.stringify(metadata, null, 2));

    const form = new FormData();
    form.append(
      "snippet",
      new Blob([JSON.stringify(metadata)], { type: "application/json" })
    );
    form.append("video", file);

    const res = await fetch(
      "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error("YouTube Upload Error Full:", JSON.stringify(data, null, 2));
      return {
        status: "error",
        error: data.error?.message || "Erro desconhecido no upload para o YouTube."
      };
    }

    return {
      status: "success",
      url: `https://youtube.com/shorts/${data.id}`
    };

  } catch (error) {
    console.error("Upload Exception:", error);
    return { status: "error", error: error.message };
  }
}



/**
 * Upload real para TikTok usando TikTok API
 * @param {Object} params - { file, title, token }
 * @returns {Promise<{status: string, url?: string, error?: string}>}
 *
 * Passos:
 * 1. Obtenha o access_token OAuth2 do usuário (veja instruções acima).
 * 2. Inicie upload: POST https://open-api.tiktok.com/video/upload/
 *    Headers: Authorization: Bearer <token>
 *    Body: FormData com o arquivo de vídeo
 * 3. Publique o vídeo: POST https://open-api.tiktok.com/video/publish/
 *    Inclua o video_id retornado e os metadados (title, etc)
 * 4. Trate a resposta e retorne a URL do vídeo.
 */
export async function uploadToTikTok({ file, title, token }) {
  // Exemplo de estrutura (não funcional sem token real):
  // const form = new FormData();
  // form.append('video', file);
  // const res = await fetch('https://open-api.tiktok.com/video/upload/', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${token}` },
  //   body: form,
  // });
  // const data = await res.json();
  // if (data.video_id) {
  //   // Agora publique o vídeo
  //   const publishRes = await fetch('https://open-api.tiktok.com/video/publish/', {
  //     method: 'POST',
  //     headers: { Authorization: `Bearer ${token}` },
  //     body: JSON.stringify({ video_id: data.video_id, title }),
  //   });
  //   const publishData = await publishRes.json();
  //   if (publishData.share_url) return { status: 'success', url: publishData.share_url };
  //   else return { status: 'error', error: publishData.error?.message || 'Erro ao publicar' };
  // } else {
  //   return { status: 'error', error: data.error?.message || 'Erro no upload' };
  // }
  return { status: "error", error: "Função real não implementada. Veja instruções detalhadas no código." };
}

/**
 * Upload de thumbnail para um vídeo do YouTube
 * Requirements: 3.1
 * 
 * @param {Object} params
 * @param {string} params.videoId - ID do vídeo no YouTube
 * @param {File} params.thumbnailFile - Arquivo de imagem da thumbnail
 * @param {string} params.accountId - ID da conta YouTube (opcional)
 * @returns {Promise<{status: string, thumbnails?: Object, error?: string}>}
 */
export async function uploadThumbnail({ videoId, thumbnailFile, accountId }) {
  const API_URL = import.meta.env.VITE_API_URL || '';

  if (!videoId) {
    return { status: "error", error: "ID do vídeo é obrigatório." };
  }

  if (!thumbnailFile) {
    return { status: "error", error: "Arquivo de thumbnail é obrigatório." };
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (!validTypes.includes(thumbnailFile.type)) {
    return { status: "error", error: "Formato inválido. Use JPG, PNG ou GIF." };
  }

  // Validate file size (max 2MB)
  if (thumbnailFile.size > 2 * 1024 * 1024) {
    return { status: "error", error: "Arquivo muito grande. Máximo 2MB." };
  }

  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await thumbnailFile.arrayBuffer();

    const headers = {
      'Content-Type': thumbnailFile.type,
      'X-Video-Id': videoId,
    };

    if (accountId) {
      headers['X-Account-Id'] = accountId;
    }

    const res = await fetch(`${API_URL}/api/youtube/thumbnail`, {
      method: 'POST',
      headers,
      body: arrayBuffer,
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        status: "error",
        error: data.error || "Erro ao fazer upload da thumbnail."
      };
    }

    return {
      status: "success",
      thumbnails: data.items?.[0]?.default || data
    };
  } catch (error) {
    console.error("Thumbnail Upload Exception:", error);
    return { status: "error", error: error.message };
  }
}

/**
 * Buscar categorias de vídeo do YouTube
 * @param {string} regionCode - Código da região (ex: 'BR', 'US')
 * @param {string} accountId - ID da conta YouTube (opcional)
 * @returns {Promise<{status: string, categories?: Array, error?: string}>}
 */
export async function getVideoCategories(regionCode = 'BR', accountId) {
  const API_URL = import.meta.env.VITE_API_URL || '';

  try {
    const params = new URLSearchParams({ regionCode });
    if (accountId) {
      params.append('accountId', accountId);
    }

    const res = await fetch(`${API_URL}/api/youtube/categories?${params}`, {
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        status: "error",
        error: data.error || "Erro ao buscar categorias."
      };
    }

    return {
      status: "success",
      categories: data.categories || []
    };
  } catch (error) {
    console.error("Get Categories Exception:", error);
    return { status: "error", error: error.message };
  }
}

/**
 * Buscar playlists do usuário no YouTube
 * @param {string} accountId - ID da conta YouTube (opcional)
 * @returns {Promise<{status: string, playlists?: Array, error?: string}>}
 */
export async function getUserPlaylists(accountId) {
  const API_URL = import.meta.env.VITE_API_URL || '';

  try {
    const params = new URLSearchParams();
    if (accountId) {
      params.append('accountId', accountId);
    }

    const url = params.toString() 
      ? `${API_URL}/api/youtube/playlists?${params}`
      : `${API_URL}/api/youtube/playlists`;

    const res = await fetch(url, {
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        status: "error",
        error: data.error || "Erro ao buscar playlists."
      };
    }

    return {
      status: "success",
      playlists: data.playlists || []
    };
  } catch (error) {
    console.error("Get Playlists Exception:", error);
    return { status: "error", error: error.message };
  }
}

/**
 * Adicionar vídeo a uma playlist
 * @param {Object} params
 * @param {string} params.videoId - ID do vídeo no YouTube
 * @param {string} params.playlistId - ID da playlist
 * @param {string} params.accountId - ID da conta YouTube (opcional)
 * @returns {Promise<{status: string, error?: string}>}
 */
export async function addVideoToPlaylist({ videoId, playlistId, accountId }) {
  const API_URL = import.meta.env.VITE_API_URL || '';

  if (!videoId || !playlistId) {
    return { status: "error", error: "ID do vídeo e da playlist são obrigatórios." };
  }

  try {
    const res = await fetch(`${API_URL}/api/youtube/playlist/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ videoId, playlistId, accountId }),
      credentials: 'include',
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        status: "error",
        error: data.error || "Erro ao adicionar vídeo à playlist."
      };
    }

    return { status: "success" };
  } catch (error) {
    console.error("Add to Playlist Exception:", error);
    return { status: "error", error: error.message };
  }
}
