# Configuration des variables Vercel

## Variables requises

Application:

```bash
NEXT_PUBLIC_APP_NAME=JobRadar
DATABASE_URL=<neon-pooled-connection-string>
```

France Travail pour le mode live:

```bash
FRANCE_TRAVAIL_CLIENT_ID=<ta_cle_ici>
FRANCE_TRAVAIL_CLIENT_SECRET=<ton_secret_ici>
FRANCE_TRAVAIL_SCOPE=api_offresdemploiv2 o2dsoffre
FRANCE_TRAVAIL_TOKEN_URL=https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire
FRANCE_TRAVAIL_SEARCH_URL=https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search
```

Optionnelles:

```bash
DATABASE_URL_UNPOOLED=<neon-direct-connection-string>
NEXT_PUBLIC_MAPBOX_TOKEN=
RESEND_API_KEY=
```

## Mode rapide: dashboard Vercel

1. Ouvrir la page des variables d'environnement du projet `web`.
2. Ajouter au minimum `NEXT_PUBLIC_APP_NAME` et `DATABASE_URL`.
3. Ajouter les variables France Travail si le mode live doit fonctionner en production.
4. Sauvegarder puis redeployer manuellement le projet.

## Mode courant: CLI Vercel

Depuis `JobRadar/web`:

```bash
vercel env pull .env.vercel.local
```

Ensuite copier les valeurs utiles vers `.env.local` si besoin pour tester localement.

## Cas Neon / Prisma a ne pas oublier

- Si `DATABASE_URL` pointe vers une base non initialisee, l'application peut replier vers le mock mais le refresh live echouera.
- Dans ce cas, appliquer le schema Prisma avant de conclure a un probleme applicatif.

Commande type:

```bash
vercel env pull .env.vercel.production
npx prisma db push
```

## Verification apres configuration

1. Tester localement `npm run build` puis `npm run test:smoke`.
2. Redeployer en prod avec `npx vercel --prod --yes`.
3. Verifier `https://web-xi-plum-29.vercel.app/api/jobs/refresh`.
4. Verifier `https://web-xi-plum-29.vercel.app/api/jobs?live=1&q=react&city=paris`.
