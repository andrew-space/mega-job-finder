# Deployment runbook (GitHub + Vercel)

## 1) Push sur GitHub

- Creer un repo public: mega-job-finder
- Depuis le dossier web:
  - git add .
  - git commit -m "feat: bootstrap JobRadar demo"
  - git branch -M main
  - git remote add origin https://github.com/<user>/mega-job-finder.git
  - git push -u origin main

## 2) Import Vercel

- Vercel > Add New > Project > Import Git Repository
- Selectionner mega-job-finder
- Framework detecte: Next.js
- Build command: npm run build
- Output: .next

## 3) Variables a configurer dans Vercel

- NEXT_PUBLIC_APP_NAME
- FRANCE_TRAVAIL_CLIENT_ID
- FRANCE_TRAVAIL_CLIENT_SECRET
- FRANCE_TRAVAIL_SCOPE
- FRANCE_TRAVAIL_TOKEN_URL
- FRANCE_TRAVAIL_SEARCH_URL

## 4) Verification apres deploy

- Ouvrir / puis verifier l interface split-view
- Tester API mock: /api/jobs
- Tester API live: /api/jobs?live=1&q=marketing&city=paris
- Verifier que le fallback mock fonctionne si les cles sont absentes

## 5) Checklist de demo

- Mention claire des sources officielles
- Aucun flux de candidature intercepte
- Credits source visibles sur les cards d offres
- Repository public avec CI verte
