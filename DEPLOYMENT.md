# Deployment runbook (JobRadar/web + Vercel)

## 1) Repo et branche

- Repo actuel: `andrew-space/mega-job-finder`
- Application concernee: `JobRadar/web`
- Branche cible de release: `main`

## 2) Point critique: git push ne deploie pas

- Ce projet Vercel n'est pas relie a un auto-deploy GitHub.
- Un `git push` met a jour le code source, mais ne publie pas la nouvelle version en production.
- La release se fait explicitement depuis `JobRadar/web` via la CLI Vercel.

## 3) Pre-flight local

Depuis `JobRadar/web`:

```bash
npm run lint
npm run build
npm run test:smoke
```

Le smoke-test couvre `/`, `/search`, `/api/jobs`, `/api/jobs/jr-001` et `/jobs/jr-001` sans dependre des secrets France Travail.

## 4) Variables attendues en production

Variables coeur:
- `NEXT_PUBLIC_APP_NAME`
- `DATABASE_URL`

Variables France Travail pour le mode live:
- `FRANCE_TRAVAIL_CLIENT_ID`
- `FRANCE_TRAVAIL_CLIENT_SECRET`
- `FRANCE_TRAVAIL_SCOPE`
- `FRANCE_TRAVAIL_TOKEN_URL`
- `FRANCE_TRAVAIL_SEARCH_URL`

Optionnelles:
- `DATABASE_URL_UNPOOLED`
- `NEXT_PUBLIC_MAPBOX_TOKEN`
- `RESEND_API_KEY`

## 5) Cas Neon / Prisma

- Si la base Neon change, ou si la prod pointe vers une base vierge, la presence de `DATABASE_URL` ne suffit pas.
- Il faut appliquer le schema Prisma avant d'attendre un mode `live-db` stable.
- Workflow recommande:

```bash
vercel env pull .env.vercel.production
npx prisma db push
```

- Ensuite retester `/api/jobs/refresh` puis `/api/jobs?live=1&q=react&city=paris`.

## 6) Deploy production

Depuis `JobRadar/web`:

```bash
npx vercel --prod --yes
```

En environnement PowerShell Windows, si `npx.ps1` est bloque, utiliser la variante deja validee dans le projet:

```bash
node -e "require('child_process').execSync('npx vercel --prod --yes 2>&1', {cwd: process.cwd(), stdio: 'inherit', shell: true})"
```

## 7) Verification apres deploy

- Ouvrir `/` et verifier que l'UI charge normalement.
- Tester `/search`.
- Tester `/api/jobs` pour confirmer le mode mock sain.
- Tester `/api/jobs/refresh` pour confirmer l'ingestion.
- Tester `/api/jobs?live=1&q=react&city=paris` pour verifier le mode `live-db`.
- Ouvrir une fiche detail live ou mock pour verifier le rendu App Router.

## 8) Checklist de release

- CI verte sur `main`
- Smoke-test local vert avant deploy
- Variables Vercel presentes
- Schema Prisma applique si la base a change
- Deploy manuel Vercel execute

## 9) Auto-refresh (Stage 3)

- Un cron Vercel est configure via `vercel.json` pour appeler `/api/jobs/refresh?maxResults=100` 1 fois par jour (`0 6 * * *`).
- Ce rythme est compatible avec les limites du plan Hobby.
- L'endpoint accepte maintenant `GET` (cron) et `POST` (manuel), avec la meme logique de refresh.
- En cas de diagnostic, verifier les logs Vercel et tester manuellement:

```bash
curl https://web-xi-plum-29.vercel.app/api/jobs/refresh?maxResults=100
```
