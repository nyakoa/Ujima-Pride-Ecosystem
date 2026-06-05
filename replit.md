# Ujima SACCO AI Pride Ecosystem

A full production-ready SACCO lending platform with an AI-powered three-agent loan assessment pipeline. Members apply for loans, a Scout → Guardian → Hunter AI pipeline assesses risk and credit, and admins review with full data.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/ujima-sacco run dev` — run the frontend (port 24587, proxied at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Test Credentials

- **Admin**: `admin@ujima.sacco` / `Admin@2024!`
- **Member**: `jane@test.com` / `Test@2024!`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, shadcn/ui, Recharts
- API: Express 5, Pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: JWT (access + refresh tokens), bcrypt, MFA via TOTP (speakeasy)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- AI Pipeline: Scout → Guardian → Hunter agents (deterministic scoring, no external LLM)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/db/src/schema/` — Drizzle ORM schema (7 tables: users, members, loanProducts, loanApplications, loans, documents, aiAssessments)
- `lib/api-client-react/src/` — Generated React Query hooks + Zod schemas + custom-fetch
- `lib/api-zod/` — Server-side Zod schemas
- `artifacts/api-server/src/routes/` — Express route handlers (auth, users, members, loans, documents, ai, admin, analytics)
- `artifacts/api-server/src/lib/aiPipeline.ts` — Scout/Guardian/Hunter AI agent pipeline
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/ujima-sacco/src/pages/` — All React pages (public, auth, member, admin)
- `artifacts/ujima-sacco/src/contexts/AuthContext.tsx` — Auth context + token management

## Architecture decisions

- **Contract-first API**: OpenAPI spec drives Orval codegen → all hooks and Zod schemas are generated, never hand-written
- **AI pipeline is deterministic**: Scout/Guardian/Hunter agents use rule-based scoring (income ratios, document counts, credit formulas) — no external LLM dependency, no API costs
- **JWT with refresh tokens**: Access token (1h) + refresh token (7d) stored in DB for invalidation; admin accounts support TOTP-based MFA via speakeasy
- **Token injected via setAuthTokenGetter**: The custom-fetch layer supports a token getter function, exposed as `setToken()` from `@workspace/api-client-react`
- **No demo data**: Only loan products are seeded; all user/loan data comes from actual signups

## Product

- **Public site**: Home, About, Loan Products, Contact (bilingual EN/SW)
- **Member portal**: Dashboard, 5-step loan application wizard, application tracker with AI pipeline stages, active loans view, KYC + document upload
- **Admin portal**: Dashboard with charts, application review with AI assessment report + approval/rejection, active loans portfolio, member management, analytics (trends, risk distribution, portfolio breakdown, member growth)

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The API server bundles with esbuild at startup, so all new route files must exist before `pnpm run dev` is called — restart the workflow after adding routes
- `setToken()` is a convenience export from `@workspace/api-client-react` wrapping `setAuthTokenGetter`; never import from the `src/custom-fetch` subpath directly as it isn't exported
- AI pipeline runs asynchronously after loan application submission; poll `/api/loan-applications/:id/status` to track progress
- Admin MFA is optional at setup but enforced at login once enabled

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
