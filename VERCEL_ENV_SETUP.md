# Configuration Variables Environment Vercel

## Mode rapide: Dashboard Vercel

1. Ouvrir https://vercel.com/andrewneuburger67-6174s-projects/web/settings/environment-variables
2. Ajouter les variables suivantes pour Production (requis pour live France Travail):

```
FRANCE_TRAVAIL_CLIENT_ID=<ta_cle_ici>
FRANCE_TRAVAIL_CLIENT_SECRET=<ta_secret_ici>
FRANCE_TRAVAIL_SCOPE=api_offresdemploiv2 o2dsoffre
FRANCE_TRAVAIL_TOKEN_URL=https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=/partenaire
FRANCE_TRAVAIL_SEARCH_URL=https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search
```

3. Sauvegarder et attendre le redeploy automatique (~1min).
4. Tester: https://web-xi-plum-29.vercel.app/api/jobs?live=1&q=marketing&city=paris

## Obtenir les clés France Travail

1. Inscris-toi sur https://francetravail.io/partenaires
2. Crée une application API
3. Récupère CLIENT_ID et CLIENT_SECRET
4. Reviens à Vercel et ajoute les valeurs ci-dessus.

## Mode courant: CLI Vercel (local)

```bash
cd web
vercel env pull  # télécharge les env vars locales
# édite .env.local avec les vraies clés
npx next dev      # teste en local
```

## Redeploy production après configuration

```bash
npx vercel --prod --yes
```
