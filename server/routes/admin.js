/**
 * Admin Routes — v2
 * Protegido: apenas role = 'admin'
 * Adicionado: sessão real, canais YouTube, contagem de uploads
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const admin = new Hono();

// ── Middleware de proteção ────────────────────────────────────────────────────
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

          // Sessões: usamos para calcular "último acesso" real
          sessions: {
            select: { expiresAt: true, updatedAt: true, createdAt: true },
            orderBy: { updatedAt: "desc" },
            take: 1,
          },

          // Contas OAuth: filtraremos por providerId = "youtube" no JS
          accounts: {
            where: { providerId: "youtube" },
            select: {
              id: true,
              accountId: true,   // = channelId do YouTube
              accessTokenExpiresAt: true,
              scope: true,
              createdAt: true,
              // idToken guarda o nome do canal que salvamos no callback
              idToken: true,
            },
          },

          // Total de uploads (vídeos agendados/publicados)
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

    // ── Calcular status de sessão real ────────────────────────────────────
    // "Online" = tem sessão não expirada
    // "Ativo recentemente" = última sessão expirou há menos de 24h
    // "Inativo" = mais de 24h sem sessão
    const enriched = users.map((u) => {
      const lastSession = u.sessions?.[0];

      let sessionStatus = "offline"; // sem sessão alguma
      let lastSeenAt = null;

      if (lastSession) {
        const expiresAt = new Date(lastSession.expiresAt).getTime();
        const lastUpdate = new Date(lastSession.updatedAt || lastSession.createdAt).getTime();
        lastSeenAt = lastSession.updatedAt || lastSession.createdAt;

        if (expiresAt > now) {
          sessionStatus = "online"; // sessão ainda válida
        } else if (now - expiresAt < 24 * 60 * 60 * 1000) {
          sessionStatus = "recent"; // expirou há menos de 24h
        } else {
          sessionStatus = "offline";
        }
      }

      // ── Canais YouTube conectados ─────────────────────────────────────
      const youtubeAccounts = (u.accounts || []).map((acc) => {
        const tokenExpired = acc.accessTokenExpiresAt
          ? new Date(acc.accessTokenExpiresAt).getTime() < now
          : true;

        // idToken foi reutilizado para salvar o channelTitle no callback
        // (ver sugestão no youtube.js abaixo)
        const channelName = acc.idToken || acc.accountId;

        return {
          channelId: acc.accountId,
          channelName,
          connected: !tokenExpired,
          connectedAt: acc.createdAt,
        };
      });

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

    return c.json({
      users: enriched,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("[Admin] Error fetching users:", error);
    return c.json({ error: "Erro ao buscar usuários" }, 500);
  }
});

// ── GET /api/admin/stats ──────────────────────────────────────────────────────
admin.get("/stats", async (c) => {
  try {
    const now = new Date();
    const onlineThreshold = new Date(now.getTime() - 0); // sessão ainda válida

    const [totalUsers, verifiedUsers, totalUploads, activeSessions, youtubeConnected] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.upload.count().catch(() => 0),
        // Sessões com expiresAt no futuro = usuários online agora
        prisma.session.count({
          where: { expiresAt: { gt: onlineThreshold } },
        }).catch(() => 0),
        // Usuários com ao menos 1 conta YouTube conectada
        prisma.account.groupBy({
          by: ["userId"],
          where: { providerId: "youtube" },
        }).then((r) => r.length).catch(() => 0),
      ]);

    return c.json({
      totalUsers,
      verifiedUsers,
      pendingUsers: totalUsers - verifiedUsers,
      totalUploads,
      onlineNow: activeSessions,
      youtubeConnected,
    });
  } catch (error) {
    console.error("[Admin] Error fetching stats:", error);
    return c.json({ error: "Erro ao buscar estatísticas" }, 500);
  }
});

export default admin;
