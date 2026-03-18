# StudioLink Paris

Plateforme de mise en relation entre studios et professionnels créatifs, avec invitation, onboarding, missions, candidatures, chat, notifications et profils publics.

## Prérequis

- Node.js 20+
- npm 10+
- Projet Supabase configuré

## Installation

1. Installer les dépendances

```bash
npm install
```

2. Créer votre fichier d’environnement

```bash
cp .env.example .env
```

3. Renseigner les variables dans `.env`

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ADMIN_EMAIL`
- `VITE_APP_URL`

## Lancement local

```bash
npm run dev
```

Application disponible sur `http://localhost:3000`.

## Build production

```bash
npm run build
```

## Vérifications qualité

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Structure projet (principale)

- `src/pages` : pages applicatives et auth
- `src/components` : composants UI et partagés
- `src/hooks` : hooks React Query
- `src/services` : couche Supabase
- `src/layouts` : layouts studio/pro avec navigation basse
- `src/lib/supabase` : client et auth
- `supabase/migrations` : schéma SQL + RLS

## Notes sécurité

- Les routes sont protégées côté front (`ProtectedRoute`) mais la sécurité repose côté Supabase sur les policies RLS.
- Les données sensibles d’invitation sont nettoyées de `sessionStorage` après onboarding.

