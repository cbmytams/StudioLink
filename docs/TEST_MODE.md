# TEST Mode StudioLink

## But
Le mode `TEST` permet de valider les parcours UX critiques en local sans dépendre de CAPTCHA, emails transactionnels réels, analytics externes, ni configuration Supabase complète.

Ce mode garde les validations UI (format email, mot de passe, étapes onboarding) mais route les dépendances externes vers des mocks contrôlés.

## Variables runtime
À définir dans `.env.test.local` (ou dans `.env.test`):

```env
VITE_APP_MODE=TEST
VITE_BYPASS_CAPTCHA=true
VITE_MOCK_EMAIL=true
VITE_DISABLE_ANALYTICS=true
VITE_MOCK_SUPABASE=true
```

Variables utiles complémentaires:

```env
VITE_APP_URL=http://localhost:3000
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TURNSTILE_SITE_KEY=
VITE_POSTHOG_KEY=
VITE_SENTRY_DSN=
```

## Démarrage (3 commandes)
```bash
npm run seed:test
npm run check:test-mode
npm run dev:test
```

Comptes seedés:
- `phase0.studio.mn5xe7w4@example.com` / `StudioLink!123`
- `phase0.pro.mn5xe7w4@example.com` / `StudioLink!123`

Codes d’invitation test:
- `STUDIO-TEST`
- `PRO-TEST`

Mailbox mock:
- URL: `/dev/mailbox`

## Limites connues
- Les mocks Supabase couvrent prioritairement les parcours `invitation -> register/login -> onboarding`.
- Les pages métier non mockées qui dépendent de données backend profondes peuvent encore afficher des états vides en mode test.
- Le script `seed:test` met à jour le fichier source des fixtures (`src/config/testModeFixtures.ts`) de manière idempotente.

## Checklist avant retour mode normal
1. Revenir sur `npm run dev` (pas `dev:test`).
2. Vérifier que `.env.local` n’active pas de flags `VITE_*` de test.
3. Confirmer que `check:test-mode` échoue si lancé hors contexte test.
4. Vérifier que la build prod n’active aucun flag test (guard runtime actif).
5. Contrôler que les intégrations externes (Turnstile, Supabase, PostHog/Sentry) sont de nouveau branchées.
