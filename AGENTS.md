<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# JobRadar Web - Agent Wiki

## Scope

This AGENTS file applies to `JobRadar/web` only.

## Current Project State (2026-04-21)

- Stage 1: CI hardening + smoke test done and deployed.
- Stage 2: `/profile` page (candidate readiness) done and deployed.
- Stage 3: Vercel cron + refresh GET support + profile market insights done and deployed.
- Stage 4: `/ops` dashboard + token-secured `/api/ops/refresh` done and deployed.
- Stage 5: profile insights switched to live Prisma data with mock fallback done and deployed.
- Stage 6: APEC collector added, parallelized with France Travail in refresh flow (fallback-safe) done and deployed.

Production URL:
- `https://web-xi-plum-29.vercel.app`

## Key Routes

- `/`
- `/search`
- `/jobs/[id]`
- `/profile`
- `/ops`
- `/api/jobs`
- `/api/jobs/[id]`
- `/api/jobs/refresh` (GET + POST)
- `/api/ops/refresh` (GET + POST, requires ops token)

## Refresh Pipeline

- Core module: `src/server/refresh-jobs.ts`
- Collectors:
	- `src/server/collectors/france-travail.ts`
	- `src/server/collectors/apec.ts`
- Persistence: `src/server/jobs-store.ts`
- Strategy: collectors run in parallel with `Promise.allSettled`, so one source failing does not block the other.

## Environment Variables

Required for core app behavior:
- `DATABASE_URL`

Required for France Travail:
- `FRANCE_TRAVAIL_CLIENT_ID`
- `FRANCE_TRAVAIL_CLIENT_SECRET`

Optional / conditional:
- `APEC_API_KEY` (enables APEC collector; without it, APEC is skipped)
- `ADMIN_OPS_TOKEN` (required for `/api/ops/refresh` and manual refresh from `/ops`)

Reference:
- `.env.example`
- `VERCEL_ENV_SETUP.md`

## Validation Commands

Use PowerShell execution policy bypass in this workspace before npm scripts.

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
npm run lint
npm run build
```

Quick refresh probe:

```powershell
curl.exe -s "https://web-xi-plum-29.vercel.app/api/jobs/refresh?maxResults=2"
```

## Deployment

```powershell
npx.cmd vercel --prod --yes
```

## Non-Regression Checklist For Agents

- Keep `/profile` dynamic (`force-dynamic`) so insights stay live.
- Keep `/api/ops/refresh` token protection intact.
- Keep refresh fallback-safe: no single collector should block refresh completion.
- Avoid removing smoke-test/CI hardening logic.

## Next Recommended Stages

- Add refresh history persistence for `/ops` (last runs timeline).
- Add per-source stats in ops status (FT fetched, APEC fetched, inserted, updated).
- Add lightweight alerting on refresh failures.
