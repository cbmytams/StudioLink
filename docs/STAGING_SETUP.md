# Configuration Staging

## Supabase Staging

1. https://supabase.com/dashboard -> New Project
   Nom : studiolink-staging
   Region : West EU (Paris)
   Password : mot de passe fort

2. Dans le projet staging :
   - Executer toutes les migrations :
     ```bash
     supabase db push --linked
     ```
   - Seed avec des donnees de test

3. Recuperer :
   - SUPABASE_URL_STAGING
   - SUPABASE_ANON_KEY_STAGING

## Vercel Preview

Dans Vercel -> Settings -> Environment Variables
Scope : Preview

Ajouter :
- VITE_SUPABASE_URL = [url staging]
- VITE_SUPABASE_ANON_KEY = [anon key staging]
- VITE_SENTRY_DSN = (peut etre vide en staging)
- VITE_POSTHOG_KEY = (peut etre vide en staging)

## Workflow

- Production : merge sur main -> auto-deploy Vercel
- Staging : merge sur develop -> auto-deploy Vercel Preview
- Feature : feature/xxx -> PR vers develop -> review -> merge
