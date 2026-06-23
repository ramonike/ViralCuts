/**
 * Seed dos planos — server/db/seed-plans.js
 * Price IDs extraídos do Stripe Dashboard em 23/06/2026
 *
 * Rodar após a migration:
 *   node server/db/seed-plans.js
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const PLANS = [
    {
        name: 'free',
        displayName: 'Free',
        maxChannels: 1,
        priceMonthly: 0,
        priceYearly: 0,
        stripePriceIdMonthly: null,
        stripePriceIdYearly: null,
    },
    {
        name: 'starter',
        displayName: 'Starter',
        maxChannels: 3,
        priceMonthly: 2900,
        priceYearly: 29000,
        stripePriceIdMonthly: 'price_1TlJEoFzZClRZvlycbJaMPjh',  // R$29,90/mês
        stripePriceIdYearly: 'price_1TlJFNFzZClRZvlyt7mAZoHF',  // R$290,00/ano
    },
    {
        name: 'pro',
        displayName: 'Pro',
        maxChannels: 5,
        priceMonthly: 4900,
        priceYearly: 49000,
        stripePriceIdMonthly: 'price_1TlJFpFzZClRZvly5VjxUX2z',  // R$49,90/mês
        stripePriceIdYearly: 'price_1TlJGJFzZClRZvly4ohMJ8Hm',  // R$490,00/ano
    },
    {
        name: 'agency',
        displayName: 'Agency',
        maxChannels: 10,
        priceMonthly: 8900,
        priceYearly: 89000,
        stripePriceIdMonthly: 'price_1TlJI8FzZClRZvlysQThHapb',  // R$89,90/mês
        stripePriceIdYearly: 'price_1TlJIVFzZClRZvlyEJi7Vgpc',  // R$890,00/ano
    },
];

async function main() {
    console.log('Seeding plans...');
    for (const plan of PLANS) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            update: plan,
            create: plan,
        });
        console.log(`  ✓ ${plan.displayName}`);
    }
    console.log('Done.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());