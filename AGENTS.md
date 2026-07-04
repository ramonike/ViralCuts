# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the Vite React client. Keep page-level screens in `src/pages/`, reusable UI in `src/components/`, shared hooks in `src/hooks/`, API helpers in `src/api/`, and test utilities in `src/tests/`. Static assets live in `public/`. The Hono backend lives in `server/` with routes in `server/routes/`, services in `server/services/`, middleware in `server/middleware/`, and database helpers in `server/db/`. Prisma schema and migrations are in `prisma/`. Use `docs/` for operational notes.

## Build, Test, and Development Commands
Install dependencies with `bun install` or `npm install`. Use `bun run dev` to start the frontend and backend together, `bun run dev:frontend` for Vite only, and `bun run server` for the API server. Build the client with `bun run build` and preview it with `bun run preview`. Prisma workflows use `bun run prisma:generate`, `bun run prisma:migrate`, `bun run prisma:push`, and `bun run prisma:studio`. Production startup is `bun run start`.

## Coding Style & Naming Conventions
Follow the existing module style: ES modules, React function components, and colocated tests. Use PascalCase for components (`ScheduleVideoModal.jsx`), camelCase for hooks and utilities (`useDashboardState.js`), and lowercase route filenames in `server/routes/`. Prefer 2-space indentation in JSX and JS files. Keep imports explicit and local. No linter or formatter is currently enforced, so preserve the surrounding file style when editing.

## Testing Guidelines
Vitest runs in a `jsdom` environment with setup from `src/tests/setup.js`. Place tests beside the code they cover using `*.test.js`, `*.test.jsx`, or `*.spec.*`; examples already exist in `src/hooks/` and `src/components/`. Run `bun run test` for the full suite, `bun run test:watch` during development, and `bun run test:coverage` before larger merges. Add or update tests for hooks, API helpers, and UI behavior whenever logic changes.

## Commit & Pull Request Guidelines
Recent history follows Conventional Commit prefixes such as `feat:`. Continue using `feat:`, `fix:`, `refactor:`, `test:`, or `docs:` with a short imperative summary. Pull requests should describe user-visible impact, list backend or schema changes, link the relevant issue or roadmap item, and include screenshots for UI changes. Call out any required `.env` updates, Prisma migrations, or manual verification steps.

## Security & Configuration Tips
Secrets belong in `.env`; do not commit keys, tokens, or production URLs. Review changes touching `server/config/security.js`, auth flows, upload routes, or scheduled jobs carefully. When adding integrations, document required environment variables in `docs/` and validate fail-safe behavior locally before merging.
