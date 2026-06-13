/**
 * Admin Routes — v2.1
 * - onlineNow: usuários únicos com sessão atualizada nos últimos 30 min
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const admin = new Hono();

admin.use("/*", authMiddleware);
admin.use("/*", async (c, next) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Acesso negado." }, 403);

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== "admin")
    return c.json({ error: "Acesso negado. Apenas administradores." }, 403);

  await next();
});

// ── GET /api/admin/users ──────────────────────────────────────────────────────
admin.get("/users", async (c) => {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const pageSize = parseInt(c.req.query("pageSize") || "20");
    const search = c.req.query("search") || "";

    const where = search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ]
      }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          emailVerified: true,
          role: true,
          createdAt: true,
          image: true,
          sessions: {
            select: { expiresAt: true, updatedAt: true, createdAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },
          accounts: {
            where: { providerId: "youtube" },
            select: {
              id: true,
              accountId: true,
              accessTokenExpiresAt: true,
              scope: true,
              createdAt: true,
              idToken: true,
            },
          },
          _count: {
            select: { uploads: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    const now = Date.now();
    const thirtyMinAgo = new Date(now - 30 * 60 * 1000);

    const enriched = users.map((u) => {
      const lastSession = u.sessions?.[0];

      let sessionStatus = "offline";
      let lastSeenAt = null;

      if (lastSession) {
        const updatedAt = new Date(lastSession.updatedAt || lastSession.createdAt);
        const expiresAt = new Date(lastSession.expiresAt).getTime();
        lastSeenAt = lastSession.updatedAt || lastSession.createdAt;

        if (expiresAt > now && updatedAt >= thirtyMinAgo) {
          sessionStatus = "online";   // sessão válida + ativa nos últimos 30min
        } else if (expiresAt > now) {
          sessionStatus = "recent";   // sessão válida mas inativa há mais de 30min
        } else {
          sessionStatus = "offline";
        }
      }

      const youtubeAccounts = (u.accounts || []).map((acc) => ({
        channelId: acc.accountId,
        channelName: acc.idToken || acc.accountId,
        connected: acc.accessTokenExpiresAt
          ? new Date(acc.accessTokenExpiresAt).getTime() > now
          : false,
        connectedAt: acc.createdAt,
      }));

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        emailVerified: u.emailVerified,
        role: u.role,
        createdAt: u.createdAt,
        image: u.image,
        sessionStatus,
        lastSeenAt,
        youtubeAccounts,
        totalUploads: u._count.uploads,
      };
    });

    return c.json({ users: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.error("[Admin] Error fetching users:", error);
    return c.json({ error: "Erro ao buscar usuários" }, 500);
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
admin.get("/stats", async (c) => {
  try {
    const now = new Date();
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);

    const [totalUsers, verifiedUsers, totalUploads, onlineNow, youtubeConnected] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.upload.count().catch(() => 0),

        // Usuários únicos com sessão válida E atualizada nos últimos 30 min
        prisma.session.groupBy({
          by: ["userId"],
          where: {
            expiresAt: { gt: now },
            updatedAt: { gt: thirtyMinAgo },
          },
        }).then(r => r.length).catch(() => 0),

        prisma.account.groupBy({
          by: ["userId"],
          where: { providerId: "youtube" },
        }).then(r => r.length).catch(() => 0),
      ]);

    return c.json({
      totalUsers,
      verifiedUsers,
      pendingUsers: totalUsers - verifiedUsers,
      totalUploads,
      onlineNow,
      youtubeConnected,
    });
  } catch (error) {
    console.error("[Admin] Error fetching stats:", error);
    return c.json({ error: "Erro ao buscar estatísticas" }, 500);
  }
});

export default admin;