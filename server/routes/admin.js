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
          subscription: {
            select: {
              plan: {
                select: { name: true, displayName: true, maxChannels: true },
              },
              status: true,
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

    // Fetch beta requests for these users
    const userIds = users.map((u) => u.id);
    const betaRequests = await prisma.betaRequest.findMany({
      where: { userId: { in: userIds } },
      select: { userId: true, status: true, id: true },
    }).catch(() => []);
    const betaMap = Object.fromEntries(
      betaRequests.map((r) => [r.userId, { status: r.status, id: r.id }])
    );

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

      const planName = u.subscription?.plan?.name || "free";
      const planDisplayName = u.subscription?.plan?.displayName || "Free";

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
        betaStatus: betaMap[u.id]?.status || "none",
        betaRequestId: betaMap[u.id]?.id || null,
        plan: {
          name: planName,
          displayName: planDisplayName,
        },
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

// ── POST /api/admin/users/:userId/beta — admin only ─────────────────────────
admin.post("/users/:userId/beta", async (c) => {
  const { userId } = c.req.param();
  const { status, note } = await c.req.json(); // status: 'approved' | 'rejected' | 'pending'

  if (!["approved", "rejected", "pending"].includes(status)) {
    return c.json({ error: "Status inválido" }, 400);
  }

  try {
    const dbTargetUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!dbTargetUser) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }

    const request = await prisma.betaRequest.upsert({
      where: { userId },
      update: { status, note: note || null, updatedAt: new Date() },
      create: { userId, gmail: dbTargetUser.email.toLowerCase().trim(), status, note: note || null },
    });

    return c.json({ success: true, request });
  } catch (err) {
    console.error("[Admin] Error updating user beta status:", err);
    return c.json({ error: "Erro ao atualizar status beta" }, 500);
  }
});

// ── GET /api/admin/plans — lista todos os planos disponíveis ─────────────────
admin.get("/plans", async (c) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { active: true },
      select: { name: true, displayName: true, maxChannels: true, priceMonthly: true },
      orderBy: { priceMonthly: "asc" },
    });
    return c.json({ plans });
  } catch (error) {
    console.error("[Admin] Error fetching plans:", error);
    return c.json({ error: "Erro ao buscar planos" }, 500);
  }
});

// ── POST /api/admin/users/:userId/plan — admin altera plano do usuário ──────
admin.post("/users/:userId/plan", async (c) => {
  const { userId } = c.req.param();
  const { planName } = await c.req.json();

  const validPlans = ["free", "starter", "pro", "agency"];
  if (!validPlans.includes(planName)) {
    return c.json({ error: "Plano inválido. Use: free, starter, pro ou agency" }, 400);
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!targetUser) {
      return c.json({ error: "Usuário não encontrado" }, 404);
    }

    const plan = await prisma.plan.findUnique({ where: { name: planName } });
    if (!plan) {
      return c.json({ error: "Plano não encontrado no banco" }, 404);
    }

    // Upsert subscription — cria se nao existir, atualiza se existir
    const sub = await prisma.subscription.upsert({
      where: { userId },
      update: {
        planId: plan.id,
        status: "active",
        cancelAtPeriodEnd: false,
      },
      create: {
        userId,
        planId: plan.id,
        status: "active",
        billingCycle: "monthly",
      },
    });

    console.log(`[Admin] Plan updated: user ${userId} → ${planName}`);
    return c.json({ success: true, plan: { name: plan.name, displayName: plan.displayName } });
  } catch (err) {
    console.error("[Admin] Error updating plan:", err);
    return c.json({ error: "Erro ao atualizar plano" }, 500);
  }
});

export default admin;