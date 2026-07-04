# ViralCuts

Aplicacao full-stack para criacao, agendamento e publicacao de videos.

## Stack

- Frontend: React + Vite, deploy na Vercel.
- Backend: Hono + Node.js, deploy no Render.
- Banco e storage: Supabase + Prisma.
- Integracoes: Google/YouTube OAuth, TikTok OAuth, Stripe.

## Instalar

```bash
npm install
```

## Rodar local

Frontend e backend juntos:

```bash
npm run dev
```

Apenas frontend:

```bash
npm run dev:frontend
```

Apenas backend:

```bash
npm run server
```

## Validar

```bash
npm run build
npm test
npm run prisma:generate
```

## Prisma

```bash
npm run prisma:migrate
npm run prisma:push
npm run prisma:studio
```

Em producao, o start aplica migrations antes de iniciar o backend:

```bash
npm run start
```

## Variaveis principais

Backend:

```bash
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
FRONTEND_URL=
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

Frontend:

```bash
VITE_API_URL=
VITE_GOOGLE_CLIENT_ID=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TIKTOK_CLIENT_KEY=
```

Flag legado, desabilitada por padrao:

```bash
ALLOW_LEGACY_BROWSER_YOUTUBE_TOKEN=true
```

## Deploy atual

- Vercel serve o frontend.
- Render serve o backend oficial.
- Supabase guarda banco e arquivos temporarios de uploads agendados.
- `api/[[...route]].js` existe como superficie serverless secundaria.

## Plano tecnico

O backlog de hardening e correcoes esta em `docs/production-action-plan.md`.
