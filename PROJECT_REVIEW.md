# JobRadar - Critique et ajustements

## Forces du brief

- Vision produit tres claire et differenciante (UX carte + split-view + dedup).
- Priorisation deja bien structuree pour un MVP progressif.
- Stack moderne et realiste pour un lancement rapide.
- Contraintes business pertinentes: pas d interception de candidature, credit des sources, focus France.

## Risques majeurs a corriger tot

- Risque legal et operationnel sur le scraping de plateformes privees.
- Risque de complexite trop elevee si on lance toutes les sources en meme temps.
- Risque de cout map/geocodage en phase demo si architecture pas borne.
- Risque de glissement produit si on ajoute auth + alertes + isochrone trop tot.

## Ajustement recommande pour la demo GitHub

- Phase Demo V1: France Travail officiel + architecture ATS modulaire (Greenhouse/Lever) + 1 source mock.
- Dedup v1: ton algo score 80 applique sur pipeline normalise.
- UI v1: split-view liste/carte, filtres essentiels, fiche offre simple.
- Deploy v1: Vercel preview + repo GitHub public avec README clair.

## Roadmap conseillee

1. Data model + dedup + seed de donnees.
2. API jobs (recherche + detail).
3. UI split-view avec interactions list/map.
4. Connecteur France Travail officiel.
5. Connecteurs Greenhouse + Lever + registry de sources entreprise.
6. Caching, observabilite, puis alertes.

## Decisions prises dans ce setup initial

- Base Next.js App Router en TypeScript.
- Premier endpoint /api/jobs et /api/jobs/[id] en mode mock.
- Moteur dedup isole dans src/lib/dedup.ts.
- UI split-view de demo prete a brancher sur vraies sources.
