# StudioLink

StudioLink est une plateforme React + Supabase qui connecte des studios et des pros audio autour d'un workflow complet: invitation, onboarding, missions, candidatures, chat temps réel, livraisons, notifications, recherche et analytics.

## Stack

- React 19 + TypeScript + Vite 6
- React Router 7
- Supabase Auth, Database, Realtime, Storage
- Tailwind CSS 4
- TanStack Query 5
- Zustand 5
- Playwright pour les scénarios navigateur locaux

## Prérequis

- Node.js 20+
- npm 10+
- Un projet Supabase configuré et lié en CLI
- Variables d'environnement locales configurées

## Installation

```bash
npm install
cp .env.example .env.local
# Remplir les variables Supabase dans .env.local
npm run dev
```

## Variables d'environnement

Variables attendues en local et en production:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_APP_NAME=StudioLink
VITE_APP_URL=https://votre-domaine.app
VITE_ADMIN_EMAIL=admin@example.com
```

Ne pas committer de `.env.production`. Configurez ces variables directement sur l'hébergeur.

## Scripts

- `npm run dev` : lance le serveur Vite local
- `npm run build` : génère le build de production
- `npm run preview` : sert le build localement
- `npm run lint` : exécute TypeScript + ESLint
- `npx tsc --noEmit` : vérification TypeScript stricte

## Structure

```text
src/
  auth/              contexte d'authentification et bootstrap session
  components/        UI, shared, chat, search, feedback
  hooks/             hooks métier (search, dashboard, etc.)
  layouts/           layouts Studio / Pro
  lib/               logique applicative par domaine (auth, chat, files, search...)
  pages/             routes React Router
  services/          accès Supabase orienté CRUD
  store/             stores Zustand
  types/             types partagés
supabase/
  migrations/        migrations SQL appliquées au projet distant
scripts/
  check_phase*.mjs   scénarios de validation navigateur et SQL
public/
  manifest, sw, icônes PWA
```

## Résumé des 8 phases implémentées

1. Auth et parcours de connexion robustes avec invitation et callback email.
2. Workflow complet de candidatures Studio/Pro avec RPC atomiques et RLS.
3. Chat temps réel basé sur `sessions` + `messages` avec redirection post-acceptation.
4. Références mission et livraisons via Supabase Storage privé + URLs signées.
5. Notifications temps réel et système de notation avec moyenne profil.
6. Recherche full-text Postgres, filtres persistés dans l'URL et annuaires.
7. Dashboards analytics Studio/Pro calculés côté Postgres.
8. Polish produit: onboarding wizard, états vides, 404, error boundary, meta tags et PWA.

## Déploiement

Déploiement recommandé: Vercel ou Netlify.

Étapes:

1. Importer le repo.
2. Définir les variables `VITE_*` dans l'interface de l'hébergeur.
3. Vérifier que le projet Supabase distant contient toutes les migrations de `supabase/migrations/`.
4. Lancer un déploiement de preview puis de production.
5. Vérifier le manifest PWA, le service worker et les flows auth en HTTPS.

## Vérification locale avant livraison

```bash
npx tsc --noEmit
npm run lint
npm run build
node scripts/check_phase7_local.mjs
node scripts/check_phase8_local.mjs
```
