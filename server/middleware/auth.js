import { auth } from "../auth.js";

/**
 * Authentication middleware for protected routes
 * Validates session token and extracts userId
 */
export async function authMiddleware(c, next) {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json({ error: "Unauthorized", message: "Valid session required" }, 401);
    }

    // Attach user info to context for use in route handlers
    c.set("userId", session.user.id);
    c.set("user", session.user);
    c.set("session", session.session);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return c.json({ error: "Unauthorized", message: "Authentication failed" }, 401);
  }
}

export default authMiddleware;
