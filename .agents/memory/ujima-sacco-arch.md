---
name: Ujima SACCO architecture
description: Key non-obvious patterns for auth, AI pipeline, token injection, and subpath import restrictions
---

## Token injection
`setToken(token)` is a convenience export from `@workspace/api-client-react` (the main package index). It wraps `setAuthTokenGetter`. Never import from the subpath `@workspace/api-client-react/src/custom-fetch` — it is not declared in the package exports and will break Vite's dep-scan.

**Why:** The design subagent used the subpath import, which caused a build error. The fix was to add `setToken()` to the index.ts of api-client-react and update AuthContext.tsx.

**How to apply:** Any new code needing to set or clear the auth token: `import { setToken } from '@workspace/api-client-react'`.

## AI pipeline is async + deterministic
The Scout → Guardian → Hunter pipeline runs asynchronously after loan submission and writes to `ai_assessments`. There is no external LLM. Pipeline stages: application_received → profile_analysis → risk_assessment → recommendation_generation → administrator_review → decision_issued.

**Why:** Keeps the system operational without API keys or LLM cost. The deterministic scoring produces realistic outputs (credit score 300-850, risk levels, approval probabilities).

**How to apply:** Poll `/api/loan-applications/:id/status` every 5s on the frontend while pipeline is running. The pipeline takes ~6-7 seconds total.

## API server must rebuild after adding new route files
The API server bundles with esbuild at workflow startup. If new route .ts files are added, the running workflow won't pick them up — must restart the workflow to trigger a rebuild.

**Why:** The dev script is `build && start`, not a watch mode.

## Admin account seeding
The first registered user gets `role = 'applicant'`. To create an admin, register normally via POST /api/auth/register then UPDATE users SET role = 'admin' WHERE email = '...' in the DB. Test credentials: admin@ujima.sacco / Admin@2024!
