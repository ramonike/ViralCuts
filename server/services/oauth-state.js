import crypto from "node:crypto";
import { getCookieAttributes } from "../config/security.js";

const DEFAULT_TTL_MS = 10 * 60 * 1000;
const oauthStateStore = new Map();

function getCookieName(provider) {
  return `vc_oauth_${provider}_state`;
}

function capitalize(value) {
  if (!value) {
    return value;
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function appendCookie(c, cookie) {
  c.res.headers.append("Set-Cookie", cookie);
}

function setStateCookie(c, provider, value, maxAgeSeconds) {
  const cookieAttributes = getCookieAttributes();
  const parts = [
    `${getCookieName(provider)}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (cookieAttributes.sameSite) {
    parts.push(`SameSite=${capitalize(cookieAttributes.sameSite)}`);
  }

  if (cookieAttributes.secure) {
    parts.push("Secure");
  }

  appendCookie(c, parts.join("; "));
}

function clearStateCookie(c, provider) {
  const cookieAttributes = getCookieAttributes();
  const parts = [
    `${getCookieName(provider)}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
  ];

  if (cookieAttributes.sameSite) {
    parts.push(`SameSite=${capitalize(cookieAttributes.sameSite)}`);
  }

  if (cookieAttributes.secure) {
    parts.push("Secure");
  }

  appendCookie(c, parts.join("; "));
}

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return accumulator;
      }

      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function cleanupExpiredStates() {
  const now = Date.now();

  for (const [state, entry] of oauthStateStore.entries()) {
    if (entry.expiresAt <= now) {
      oauthStateStore.delete(state);
    }
  }
}

function safeEqual(left, right) {
  if (!left || !right) {
    return false;
  }

  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function issueOAuthState(c, provider, initialData = {}, ttlMs = DEFAULT_TTL_MS) {
  cleanupExpiredStates();

  const state = crypto.randomBytes(32).toString("hex");
  oauthStateStore.set(state, {
    provider,
    data: initialData,
    expiresAt: Date.now() + ttlMs,
  });

  setStateCookie(c, provider, state, Math.ceil(ttlMs / 1000));
  return state;
}

export function updateOAuthState(state, updates = {}) {
  const existingState = oauthStateStore.get(state);

  if (!existingState) {
    return false;
  }

  oauthStateStore.set(state, {
    ...existingState,
    data: {
      ...(existingState.data || {}),
      ...updates,
    },
  });

  return true;
}

export function consumeOAuthState(c, provider, state) {
  cleanupExpiredStates();

  const cookies = parseCookies(c.req.header("Cookie") || "");
  const cookieState = cookies[getCookieName(provider)];
  clearStateCookie(c, provider);

  if (!safeEqual(cookieState, state)) {
    return null;
  }

  const existingState = oauthStateStore.get(state);
  oauthStateStore.delete(state);

  if (!existingState || existingState.provider !== provider) {
    return null;
  }

  if (existingState.expiresAt <= Date.now()) {
    return null;
  }

  return existingState.data;
}
