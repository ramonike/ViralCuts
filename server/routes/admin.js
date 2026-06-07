/**
 * Admin Routes
 * Protegido — apenas usuários com role = 'admin'
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const admin = new Hono();

// Middleware: autenticação + verificação de role admin
admin.use("/*", authMiddleware);
admin.use("/*", async (c, next) => {
  const user = c.get("user");
  if (!user || user.role !== "admin") {
    return c.json({ error: "Acesso negado. Apenas administradores." }, 403);
  }
  await next();
});

/**
 * GET /api/admin/users
 * Lista todos os usuários com paginação e busca
 */
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
        ],
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
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    return c.json({
      users,
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

/**
 * GET /api/admin/stats
 * Estatísticas gerais da plataforma
 */
admin.get("/stats", async (c) => {
  try {
    const [totalUsers, verifiedUsers, totalUploads] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.upload.count().catch(() => 0),
    ]);

    return c.json({
      totalUsers,
      verifiedUsers,
      pendingUsers: totalUsers - verifiedUsers,
      totalUploads,
    });
  } catch (error) {
    console.error("[Admin] Error fetching stats:", error);
    return c.json({ error: "Erro ao buscar estatísticas" }, 500);
  }
});

export default admin;
