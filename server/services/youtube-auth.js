/**
 * YouTube OAuth 2.0 Authentication Service
 * Implements refresh token flow for long-lived sessions
 * Requirements: 1.1, 1.2
 */

const GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Required scopes for YouTube upload, management, and analytics
const YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/youtubepartner",
  "https://www.googleapis.com/auth/yt-analytics.readonly", // Analytics API scope
].join(" ");

/**
 * Get OAuth 2.0 configuration from environment
 */
function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.YOUTUBE_REDIRECT_URI || 
    `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/auth/youtube/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
  }

  return { clientId, clientSecret, redirectUri };
}

/**
 * Generate OAuth 2.0 authorization URL
 * @param {string} state - Optional state parameter for CSRF protection
 * @returns {string} Authorization URL
 */
export function getAuthUrl(state = null) {
  const { clientId, redirectUri } = getOAuthConfig();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: YOUTUBE_SCOPES,
    access_type: "offline", // Required for refresh token
    prompt: "consent", // Force consent to get refresh token
  });

  if (state) {
    params.append("state", state);
  }

  return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 * @param {string} code - Authorization code from OAuth callback
 * @returns {Promise<TokenResponse>} Token response with access and refresh tokens
 */
export async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Token exchange failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  };
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token from previous authorization
 * @returns {Promise<TokenResponse>} New token response
 */
export async function refreshToken(refreshToken) {
  const { clientId, clientSecret } = getOAuthConfig();

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(`Token refresh failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: refreshToken, // Refresh token doesn't change
    expires_in: data.expires_in,
    token_type: data.token_type,
    scope: data.scope,
  };
}

/**
 * Revoke OAuth token
 * @param {string} token - Access or refresh token to revoke
 * @returns {Promise<void>}
 */
export async function revokeToken(token) {
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${token}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token revocation failed: ${error}`);
  }
}

/**
 * Validate if access token is still valid
 * @param {string} accessToken - Access token to validate
 * @returns {Promise<boolean>} True if token is valid
 */
export async function validateToken(accessToken) {
  try {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

export default {
  getAuthUrl,
  exchangeCode,
  refreshToken,
  revokeToken,
  validateToken,
  YOUTUBE_SCOPES,
};
