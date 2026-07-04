import crypto from "node:crypto";

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

export function createRequestId() {
  return crypto.randomUUID();
}

export function logServerError(scope, requestId, error, extra = {}) {
  const payload = {
    requestId,
    message: error?.message,
    code: error?.code,
    ...extra,
  };

  console.error(`${scope} request failed`, payload);

  if (isDevelopment() && error?.stack) {
    console.error(error.stack);
  }
}

export function sendError(c, {
  scope = "Request",
  error,
  status = 500,
  message = "Internal server error",
  exposeDetails = false,
  details,
}) {
  const requestId = createRequestId();
  logServerError(scope, requestId, error, details);

  return c.json({
    error: message,
    requestId,
    ...(isDevelopment() && exposeDetails && error?.message
      ? { detail: error.message }
      : {}),
  }, status);
}
