# Audit Sécurité & Données — StudioLink Paris
Date : 2026-04-03
Mode : lecture seule (aucune modification de code)
Portée : frontend Vite + API edge `api/*` + Supabase Edge Functions + migrations SQL

## Risque Critique
1. Exposition potentielle de secret build-time via `vite.config.ts`.
   - La config injecte `process.env.GEMINI_API_KEY` dans le bundle via `define`.
   - Preuve : [vite.config.ts:25](/Users/sasha/Downloads/studiolink-paris/vite.config.ts:25), [vite.config.ts:26](/Users/sasha/Downloads/studiolink-paris/vite.config.ts:26)
   - Impact : si `GEMINI_API_KEY` est défini au build, il peut fuiter côté client.
   - Remédiation : supprimer ce `define`; tout secret doit rester côté serveur uniquement.

2. Sessions auth stockées côté client (localStorage), pas en cookie `httpOnly`.
   - Preuve : [src/lib/supabase/client.ts:17](/Users/sasha/Downloads/studiolink-paris/src/lib/supabase/client.ts:17), [src/auth/AuthProvider.tsx:54](/Users/sasha/Downloads/studiolink-paris/src/auth/AuthProvider.tsx:54), [src/auth/AuthProvider.tsx:66](/Users/sasha/Downloads/studiolink-paris/src/auth/AuthProvider.tsx:66)
   - Impact : vol de session en cas de XSS.
   - Remédiation : migrer vers BFF/session cookies `httpOnly`, `secure`, `sameSite=strict/lax`.

## Risque Haut
1. Edge Function `send-email` sans contrôle d’autorisation applicatif explicite.
   - CORS permissif (`*`) + aucun check d’identité/role dans le handler.
   - Preuve : [supabase/functions/send-email/index.ts:5](/Users/sasha/Downloads/studiolink-paris/supabase/functions/send-email/index.ts:5), [supabase/functions/send-email/index.ts:179](/Users/sasha/Downloads/studiolink-paris/supabase/functions/send-email/index.ts:179), [supabase/functions/send-email/index.ts:185](/Users/sasha/Downloads/studiolink-paris/supabase/functions/send-email/index.ts:185)
   - Remédiation : vérifier JWT + role métier dans la fonction, ajouter rate limit et allowlist des types.

2. Edge Function `process-reminders` sans contrôle d’autorisation applicatif explicite, avec client service-role interne.
   - Preuve : [supabase/functions/process-reminders/index.ts:20](/Users/sasha/Downloads/studiolink-paris/supabase/functions/process-reminders/index.ts:20), [supabase/functions/process-reminders/index.ts:34](/Users/sasha/Downloads/studiolink-paris/supabase/functions/process-reminders/index.ts:34), [supabase/functions/process-reminders/index.ts:46](/Users/sasha/Downloads/studiolink-paris/supabase/functions/process-reminders/index.ts:46), [supabase/functions/process-reminders/index.ts:55](/Users/sasha/Downloads/studiolink-paris/supabase/functions/process-reminders/index.ts:55)
   - Impact : déclenchements non désirés/spam si endpoint invoquable sans garde forte.
   - Remédiation : restreindre à appel scheduler interne (secret header signé), refuser toute requête non autorisée.

3. CSP trop permissive (`unsafe-inline`, `unsafe-eval`, `https:` global pour scripts).
   - Preuve : [vercel.json:8](/Users/sasha/Downloads/studiolink-paris/vercel.json:8)
   - Impact : surface XSS plus large.
   - Remédiation : CSP nonce/hash stricte, suppression de `unsafe-eval`, restrictions de domaines explicites.

## Risque Moyen
1. Protection des routes uniquement côté client (pas de SSR/BFF gate).
   - Preuve : [src/components/ProtectedRoute.tsx:35](/Users/sasha/Downloads/studiolink-paris/src/components/ProtectedRoute.tsx:35), [src/components/AdminRoute.tsx:29](/Users/sasha/Downloads/studiolink-paris/src/components/AdminRoute.tsx:29)
   - Impact : dépendance forte au contrôle RLS backend (correct mais défensivement incomplet).
   - Remédiation : ajouter une couche serveur (BFF/middleware) pour sécuriser l’accès aux pages sensibles.

2. `or(...)` PostgREST construit par interpolation de string.
   - Preuve : [src/pages/NewConversation.tsx:74](/Users/sasha/Downloads/studiolink-paris/src/pages/NewConversation.tsx:74), [src/services/notificationService.ts:59](/Users/sasha/Downloads/studiolink-paris/src/services/notificationService.ts:59), [src/lib/chat/chatService.ts:513](/Users/sasha/Downloads/studiolink-paris/src/lib/chat/chatService.ts:513)
   - Impact : risque logique si paramètres non validés strictement.
   - Remédiation : valider/normaliser UUIDs avant interpolation, préférer filtres structurés quand possible.

3. API edge `/api/health` sans `Cache-Control` explicite.
   - Preuve : [api/health.ts:5](/Users/sasha/Downloads/studiolink-paris/api/health.ts:5)
   - Remédiation : ajouter `Cache-Control: no-store` (ou stratégie explicite selon besoin observabilité).

## Contrôles positifs
- Aucune clé service role trouvée dans les fichiers suivis Git (`.env.local` non tracké).
  - Preuve tracking : [/.gitignore](/Users/sasha/Downloads/studiolink-paris/.gitignore), `git ls-files` montre `.env.example`, `.env.production`, `.env.test` uniquement.
- Headers de sécurité présents côté Vercel : CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`.
  - Preuve : [vercel.json:7](/Users/sasha/Downloads/studiolink-paris/vercel.json:7), [vercel.json:11](/Users/sasha/Downloads/studiolink-paris/vercel.json:11), [vercel.json:15](/Users/sasha/Downloads/studiolink-paris/vercel.json:15), [vercel.json:23](/Users/sasha/Downloads/studiolink-paris/vercel.json:23)
- Pas de `dangerouslySetInnerHTML` trouvé.
- Uploads mission/delivery encadrés côté storage policies (mime + size), avec durcissement message-files dans migration follow-up.
  - Preuve : [supabase/migrations/202603251700_phase4_storage_files.sql:1](/Users/sasha/Downloads/studiolink-paris/supabase/migrations/202603251700_phase4_storage_files.sql:1), [supabase/migrations/202603262130_storage_file_size_limits.sql:1](/Users/sasha/Downloads/studiolink-paris/supabase/migrations/202603262130_storage_file_size_limits.sql:1), [supabase/migrations/202603252245_security_hardening_followup.sql:6](/Users/sasha/Downloads/studiolink-paris/supabase/migrations/202603252245_security_hardening_followup.sql:6)

## Dépendances (`npm audit`)
Commande exécutée : `npm audit --audit-level=high --json` (2026-04-03)
- High : **0**
- Critical : **0**
- Moderate : **5** (vitest/vite/esbuild/brace-expansion chain)

## Synthèse
- Critique : **2**
- Haut : **3**
- Moyen : **3**
