# StudioLink

Marketplace mobile-first connectant des Studios (recruteurs) et des Pros (talents/freelances) dans le secteur créatif et audiovisuel.

## Stack technique

- **Frontend** : React 19, TypeScript, Vite 6
- **Backend** : Supabase (Auth, Database, Realtime, Storage)
- **Styling** : Tailwind CSS 4
- **Routing** : React Router 7
- **State** : React Query 5, Zustand 5
- **Animations** : Motion (Framer Motion) 12

## Installation

```bash
git clone <repo-url>
cd studiolink-paris
npm install
cp .env.example .env
# Remplir les variables dans .env
npm run dev
```

## Variables d'environnement

Voir `.env.example` :

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clé publique (anon) Supabase |
| `VITE_ADMIN_EMAIL` | Email autorisé pour /admin |
| `VITE_APP_URL` | URL de l'application (ex: http://localhost:3000) |

## Scripts

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm run preview` | Prévisualiser le build |
| `npm run lint` | Linter ESLint |

## Architecture

```
src/
├── auth/          # AuthProvider, contexte d'authentification
├── components/    # Composants réutilisables (UI, shared, skeletons)
├── hooks/         # Hooks React Query + custom
├── layouts/       # StudioLayout, ProLayout
├── lib/           # Client Supabase, utilitaires
├── pages/         # Pages de l'application
├── services/      # Services Supabase (CRUD)
├── store/         # Stores Zustand
└── types/         # Types TypeScript centralisés
```

## Fonctionnalités

- Authentification Supabase avec système d'invitation
- Onboarding progressif (studio / pro)
- Publication et gestion de missions
- Système de candidatures avec workflow complet
- Chat en temps réel avec envoi de fichiers
- Notifications en temps réel (Supabase Realtime)
- Système d'avis / reviews
- Calendrier de sessions (vue semaine / mois)
- Portfolio pro (max 6 éléments)
- Recherche de professionnels avec filtres
- Favoris / missions sauvegardées
- Upload d'avatar
- SEO avec React Helmet
- Code-splitting (React.lazy + Suspense)

## Accès

L'application est accessible uniquement via lien d'invitation (`/invite/:code`).
L'interface admin (`/admin`) est protégée par `VITE_ADMIN_EMAIL`.
