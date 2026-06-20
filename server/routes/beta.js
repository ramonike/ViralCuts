/**
 * Beta Routes — server/routes/beta.js
 * Gerencia solicitações de acesso ao YouTube durante a fase de testes
 *
 * Registrar em server/index.js:
 *   import beta from './routes/beta.js';
 *   app.route('/api/beta', beta);
 */

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { prisma } from "../db/prisma.js";

const beta = new Hono();

beta.use("/*", authMiddleware);

// ── POST /api/beta/request ────────────────────────────────────────────────────
// Usuário envia o gmail do canal para solicitar acesso
beta.post("/request", async (c) => {
    const userId = c.get("userId");
    const { gmail, channelName } = await c.req.json();

    if (!gmail || !gmail.includes("@")) {
        return c.json({ error: "Email inválido" }, 400);
    }

    try {
        // upsert — se já existe, atualiza o gmail (caso queira corrigir)
        const request = await prisma.betaRequest.upsert({
            where:  { userId },
            update: { gmail: gmail.toLowerCase().trim(), channelName: channelName || null, status: "pending", updatedAt: new Date() },
            create: { userId, gmail: gmail.toLowerCase().trim(), channelName: channelName || null, status: "pending" },
        });

        return c.json({ success: true, status: request.status });
    } catch (err) {
        console.error("[Beta] Error creating request:", err);
        return c.json({ error: "Erro ao registrar solicitação" }, 500);
    }
});

// ── GET /api/beta/status ──────────────────────────────────────────────────────
// Usuário consulta o status do seu pedido
beta.get("/status", async (c) => {
    const userId = c.get("userId");

    try {
        const request = await prisma.betaRequest.findUnique({
            where: { userId },
            select: { status: true, gmail: true, createdAt: true, note: true },
        });

        return c.json({ request: request || null });
    } catch (err) {
        return c.json({ error: "Erro ao consultar status" }, 500);
    }
});

// ── GET /api/beta/requests — admin only ──────────────────────────────────────
// Lista todos os pedidos pendentes para o admin
beta.get("/requests", async (c) => {
    const user = c.get("user");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role !== "admin") return c.json({ error: "Acesso negado" }, 403);

    try {
        const { status = "pending" } = Object.fromEntries(new URL(c.req.url).searchParams);

        const requests = await prisma.betaRequest.findMany({
            where: status === "all" ? {} : { status },
            include: {
                // Busca nome do usuário junto
                // (BetaRequest não tem relação formal com User no schema acima,
                //  fazemos join manual)
            },
            orderBy: { createdAt: "desc" },
        });

        // Enriquecer com dados do user
        const userIds = requests.map(r => r.userId);
        const users   = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
        });
        const userMap = Object.fromEntries(users.map(u => [u.id, u]));

        return c.json({
            requests: requests.map(r => ({ ...r, user: userMap[r.userId] || null })),
        });
    } catch (err) {
        console.error("[Beta] Error fetching requests:", err);
        return c.json({ error: "Erro ao buscar pedidos" }, 500);
    }
});

// ── PATCH /api/beta/requests/:id — admin only ────────────────────────────────
// Aprovar ou rejeitar um pedido
beta.patch("/requests/:id", async (c) => {
    const user = c.get("user");
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
    if (dbUser?.role !== "admin") return c.json({ error: "Acesso negado" }, 403);

    const { id }     = c.req.param();
    const { status, note } = await c.req.json(); // status: 'approved' | 'rejected'

    if (!["approved", "rejected"].includes(status)) {
        return c.json({ error: "Status inválido" }, 400);
    }

    try {
        const updated = await prisma.betaRequest.update({
            where: { id },
            data:  { status, note: note || null, updatedAt: new Date() },
        });
        return c.json({ success: true, request: updated });
    } catch (err) {
        console.error("[Beta] Error updating request:", err);
        return c.json({ error: "Erro ao atualizar pedido" }, 500);
    }
});

export default beta;
