const DEFAULT_TRUSTED_ORIGINS = [
  "https://viral-cuts-20.vercel.app",
  "https://viral-cuts-20-git-main-ramons-projects-9aa5c4f1.vercel.app",
  "http://localhost:5173",
];

export function getTrustedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS || process.env.TRUSTED_ORIGINS;

  if (!configuredOrigins) {
    return DEFAULT_TRUSTED_ORIGINS;
  }

  return configuredOrigins
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function isTrustedOrigin(origin) {
  if (!origin) {
    return null;
  }

  const trustedOrigins = getTrustedOrigins();
  return trustedOrigins.includes(origin) ? origin : null;
}

export function getCookieAttributes() {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    return {
      sameSite: "lax",
      secure: false,
    };
  }

  return {
    sameSite: "none",
    secure: true,
  };
}
