# JobRadar (Demo)

Aggregateur d offres emploi France avec UX split-view (liste + carte), dedup intelligente, et API routes pretes pour integration des sources officielles.

## Etat actuel

- UI demo split-view operationnelle
- API mock: /api/jobs et /api/jobs/[id]
- Moteur dedup: src/lib/dedup.ts
- Donnees de demonstration: src/lib/mock-jobs.ts

## Lancer en local

```bash
npm install
npm run dev
```

App: http://localhost:3000

## Variables d environnement

Dupliquer .env.example vers .env.local et renseigner les cles.

## Plan de demo GitHub/Vercel

1. Creer le repo GitHub public.
2. Push du dossier web.
3. Importer le repo dans Vercel.
4. Ajouter les variables d environnement dans Vercel.
5. Verifier que /api/jobs repond en production.

## Notes produit

- Prioriser France Travail + APEC pour rester conforme et stable.
- Ajouter les collecteurs scraping ensuite avec garde-fous (rate-limit, robots, retries).
- Voir PROJECT_REVIEW.md pour la critique et les ajustements du brief.
