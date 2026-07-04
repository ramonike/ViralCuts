/**
 * Subscription Routes — server/routes/subscription.js
 *
 * Registrar em server/index.js:
 *   import subscriptionRoutes from './routes/subscription.js';
 *   app.route('/api/subscription', subscriptionRoutes);
 *
 * Variáveis de ambiente necessárias (Render → Environment):
 *   STRIPE_SECRET_KEY      → sk_live_xxx  (ou sk_test_xxx para testes)
 *   STRIPE_WEBHOOK_SECRET  → whsec_xxx    (Stripe Dashboard → Webhooks)
 *   FRONTEND_URL           → https://viral-cuts-20.vercel.app
 */

import { Hono } from 'hono';
import Stripe from 'stripe';
import { authMiddleware } from '../middleware/auth.js';
import { prisma } from '../db/prisma.js';
import { sendError } from '../utils/http-error.js';

const router = new Hono();

// Stripe inicializado com a secret key do ambiente
function getStripe() {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY not set');
    return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
}

// ── Helper: garantir subscription free ao criar usuário ──────────────────────
export async function ensureSubscription(userId) {
    const existing = await prisma.subscription.findUnique({ where: { userId } });
    if (existing) return existing;

    const freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });
    if (!freePlan) throw new Error('Free plan not found — run seed-plans.js first');

    return prisma.subscription.create({
        data: {
            userId,
            planId:       freePlan.id,
            status:       'active',
            billingCycle: 'monthly',
        },
    });
}

// ── GET /api/subscription/me — retorna plano atual ───────────────────────────
router.get('/me', authMiddleware, async (c) => {
    const userId = c.get('userId');
    try {
        let sub = await prisma.subscription.findUnique({
            where:   { userId },
            include: { plan: true },
        });

        // Auto-cria subscription free se não existir
        if (!sub) sub = await ensureSubscription(userId);

        // Busca plan se veio sem include
        if (!sub.plan) {
            const plan = await prisma.plan.findUnique({ where: { id: sub.planId } });
            sub = { ...sub, plan };
        }

        return c.json({
            plan:         sub.plan,
            status:       sub.status,
            billingCycle: sub.billingCycle,
            periodEnd:    sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        });
    } catch (err) {
        console.error('[Subscription] GET /me error:', err);
        return c.json({ error: 'Erro ao buscar assinatura' }, 500);
    }
});

// ── POST /api/subscription/checkout — cria sessão Stripe Checkout ────────────
router.post('/checkout', authMiddleware, async (c) => {
    const userId = c.get('userId');
    const { planName, billingCycle = 'monthly' } = await c.req.json();

    try {
        const stripe = getStripe();
        const user   = await prisma.user.findUnique({ where: { id: userId } });
        const plan   = await prisma.plan.findUnique({ where: { name: planName } });

        if (!plan) return c.json({ error: 'Plano não encontrado' }, 404);
        if (plan.name === 'free') return c.json({ error: 'Plano gratuito não requer checkout' }, 400);

        const priceId = billingCycle === 'yearly'
            ? plan.stripePriceIdYearly
            : plan.stripePriceIdMonthly;

        if (!priceId) return c.json({ error: 'Plano sem Price ID configurado no Stripe' }, 400);

        // Busca ou cria customer no Stripe
        let sub = await prisma.subscription.findUnique({ where: { userId } });
        let stripeCustomerId = sub?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name:  user.name,
                metadata: { userId },
            });
            stripeCustomerId = customer.id;
        }

        const frontendUrl = process.env.FRONTEND_URL || 'https://viral-cuts-20.vercel.app';

        const session = await stripe.checkout.sessions.create({
            customer:   stripeCustomerId,
            mode:       'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${frontendUrl}/dashboard/profile?upgrade=success&plan=${planName}`,
            cancel_url:  `${frontendUrl}/dashboard/profile?upgrade=canceled`,
            metadata:    { userId, planName, billingCycle },
            subscription_data: {
                metadata: { userId, planName },
            },
            // PIX como método de pagamento (Brasil)
            payment_method_types: ['card'],
            locale: 'pt-BR',
        });

        return c.json({ url: session.url });
    } catch (err) {
        return sendError(c, {
            scope: '[Subscription] Checkout',
            error: err,
            message: 'Erro ao criar checkout',
        });
    }
});

// ── POST /api/subscription/portal — portal de gestão Stripe ──────────────────
router.post('/portal', authMiddleware, async (c) => {
    const userId = c.get('userId');
    try {
        const stripe = getStripe();
        const sub    = await prisma.subscription.findUnique({ where: { userId } });

        if (!sub?.stripeCustomerId) {
            return c.json({ error: 'Sem assinatura ativa para gerenciar' }, 400);
        }

        const frontendUrl = process.env.FRONTEND_URL || 'https://viral-cuts-20.vercel.app';
        const session = await stripe.billingPortal.sessions.create({
            customer:   sub.stripeCustomerId,
            return_url: `${frontendUrl}/dashboard/profile`,
        });

        return c.json({ url: session.url });
    } catch (err) {
        console.error('[Subscription] Portal error:', err);
        return c.json({ error: 'Erro ao abrir portal' }, 500);
    }
});

// ── POST /api/subscription/webhook — recebe eventos do Stripe ────────────────
// IMPORTANTE: registrar ANTES do middleware de auth e SEM authMiddleware
// O Stripe assina os eventos com STRIPE_WEBHOOK_SECRET
router.post('/webhook', async (c) => {
    const stripe = getStripe();
    const sig    = c.req.header('stripe-signature');
    const secret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!secret) {
        return sendError(c, {
            scope: '[Webhook] Stripe config',
            error: new Error('STRIPE_WEBHOOK_SECRET not set'),
            message: 'Webhook not configured',
        });
    }

    let event;
    try {
        const body = await c.req.arrayBuffer();
        event = stripe.webhooks.constructEvent(Buffer.from(body), sig, secret);
    } catch (err) {
        console.error('[Webhook] Signature verification failed:', err.message);
        return c.json({ error: 'Invalid signature' }, 400);
    }

    console.log(`[Webhook] Event: ${event.type}`);

    try {
        switch (event.type) {

            // Assinatura criada ou atualizada (upgrade/downgrade)
            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const stripeSub = event.data.object;
                const userId    = stripeSub.metadata?.userId;
                if (!userId) break;

                const priceId   = stripeSub.items.data[0]?.price?.id;
                const plan      = await prisma.plan.findFirst({
                    where: {
                        OR: [
                            { stripePriceIdMonthly: priceId },
                            { stripePriceIdYearly:  priceId },
                        ],
                    },
                });

                if (!plan) {
                    console.error(`[Webhook] No plan found for priceId ${priceId}`);
                    break;
                }

                const billingCycle = stripeSub.items.data[0]?.price?.recurring?.interval === 'year'
                    ? 'yearly' : 'monthly';

                await prisma.subscription.upsert({
                    where:  { userId },
                    update: {
                        planId:              plan.id,
                        status:              stripeSub.status,
                        billingCycle,
                        stripeCustomerId:    stripeSub.customer,
                        stripeSubscriptionId: stripeSub.id,
                        currentPeriodStart:  new Date(stripeSub.current_period_start * 1000),
                        currentPeriodEnd:    new Date(stripeSub.current_period_end   * 1000),
                        cancelAtPeriodEnd:   stripeSub.cancel_at_period_end,
                    },
                    create: {
                        userId,
                        planId:              plan.id,
                        status:              stripeSub.status,
                        billingCycle,
                        stripeCustomerId:    stripeSub.customer,
                        stripeSubscriptionId: stripeSub.id,
                        currentPeriodStart:  new Date(stripeSub.current_period_start * 1000),
                        currentPeriodEnd:    new Date(stripeSub.current_period_end   * 1000),
                        cancelAtPeriodEnd:   stripeSub.cancel_at_period_end,
                    },
                });

                console.log(`[Webhook] Subscription updated: user ${userId} → plan ${plan.name}`);
                break;
            }

            // Assinatura cancelada
            case 'customer.subscription.deleted': {
                const stripeSub = event.data.object;
                const userId    = stripeSub.metadata?.userId;
                if (!userId) break;

                // Downgrade para free
                const freePlan = await prisma.plan.findUnique({ where: { name: 'free' } });
                if (freePlan) {
                    await prisma.subscription.update({
                        where: { userId },
                        data:  {
                            planId:              freePlan.id,
                            status:              'canceled',
                            stripeSubscriptionId: null,
                            cancelAtPeriodEnd:   false,
                        },
                    });
                }
                console.log(`[Webhook] Subscription canceled: user ${userId} → downgraded to free`);
                break;
            }

            // Pagamento falhou
            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const subId   = invoice.subscription;
                if (subId) {
                    await prisma.subscription.updateMany({
                        where: { stripeSubscriptionId: subId },
                        data:  { status: 'past_due' },
                    });
                }
                break;
            }

            // Pagamento bem-sucedido (renovação)
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const subId   = invoice.subscription;
                if (subId) {
                    await prisma.subscription.updateMany({
                        where: { stripeSubscriptionId: subId },
                        data:  { status: 'active' },
                    });
                }
                break;
            }

            default:
                console.log(`[Webhook] Unhandled event: ${event.type}`);
        }
    } catch (err) {
        console.error('[Webhook] Handler error:', err);
        return c.json({ error: 'Webhook handler failed' }, 500);
    }

    return c.json({ received: true });
});

export default router;
