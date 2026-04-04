# Audit Qualité du Code & Architecture — StudioLink Paris
Date : 2026-04-03
Mode : lecture seule (aucune modification de code)

## Dette technique priorisée

### P1
1. Cohérence state/data layer sur les notifications non respectée (2 stacks parallèles divergentes).
   - [src/components/shared/NotificationBell.tsx:10](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:10)
   - [src/components/shared/NotificationBell.tsx:74](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:74)
   - [src/pages/NotificationsPage.tsx:54](/Users/sasha/Downloads/studiolink-paris/src/pages/NotificationsPage.tsx:54)
   - [src/hooks/useNotifications.ts:3](/Users/sasha/Downloads/studiolink-paris/src/hooks/useNotifications.ts:3)
   - [src/lib/notifications/notificationService.ts:45](/Users/sasha/Downloads/studiolink-paris/src/lib/notifications/notificationService.ts:45)
   - [src/services/notificationService.ts:20](/Users/sasha/Downloads/studiolink-paris/src/services/notificationService.ts:20)

### P2
2. Strictness TypeScript insuffisamment imposé par config/lint (risque de régression, même si l’état actuel est propre).
   - [tsconfig.json:2](/Users/sasha/Downloads/studiolink-paris/tsconfig.json:2)
   - [tsconfig.json:16](/Users/sasha/Downloads/studiolink-paris/tsconfig.json:16)
   - [eslint.config.js:22](/Users/sasha/Downloads/studiolink-paris/eslint.config.js:22)
   - [src/pages/ChatPage.tsx:426](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:426)
3. Data access/fetch encore directement dans des pages volumineuses malgré l’existence d’une couche services.
   - [src/pages/MissionForm.tsx:129](/Users/sasha/Downloads/studiolink-paris/src/pages/MissionForm.tsx:129)
   - [src/pages/MissionForm.tsx:344](/Users/sasha/Downloads/studiolink-paris/src/pages/MissionForm.tsx:344)
   - [src/pages/StudioMissions.tsx:78](/Users/sasha/Downloads/studiolink-paris/src/pages/StudioMissions.tsx:78)
   - [src/pages/ProApplications.tsx:105](/Users/sasha/Downloads/studiolink-paris/src/pages/ProApplications.tsx:105)
   - [src/pages/MissionDetail.tsx:136](/Users/sasha/Downloads/studiolink-paris/src/pages/MissionDetail.tsx:136)
   - [src/services/missionService.ts:54](/Users/sasha/Downloads/studiolink-paris/src/services/missionService.ts:54)
   - [src/services/applicationService.ts:214](/Users/sasha/Downloads/studiolink-paris/src/services/applicationService.ts:214)
4. Composants/pages trop volumineux (>300 lignes) et multi-responsabilités.
   - [src/pages/ChatPage.tsx:87](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:87)
   - [src/pages/MissionForm.tsx:79](/Users/sasha/Downloads/studiolink-paris/src/pages/MissionForm.tsx:79)
   - [src/pages/LoginPage.tsx:99](/Users/sasha/Downloads/studiolink-paris/src/pages/LoginPage.tsx:99)
   - [src/pages/Onboarding.tsx:83](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:83)
5. Gestion d’erreurs async : erreurs silencieuses sur certains chemins.
   - [src/pages/ChatPage.tsx:267](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:267)
   - [src/pages/ChatPage.tsx:301](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:301)
   - [src/pages/MissionForm.tsx:195](/Users/sasha/Downloads/studiolink-paris/src/pages/MissionForm.tsx:195)
   - [src/pages/SettingsPage.tsx:110](/Users/sasha/Downloads/studiolink-paris/src/pages/SettingsPage.tsx:110)
   - [src/components/shared/DeliveryPanel.tsx:101](/Users/sasha/Downloads/studiolink-paris/src/components/shared/DeliveryPanel.tsx:101)
   - [src/components/shared/ErrorBoundary.tsx:43](/Users/sasha/Downloads/studiolink-paris/src/components/shared/ErrorBoundary.tsx:43)

### P3
6. Error boundary uniquement global, pas de boundaries fines par zone critique.
   - [src/main.tsx:93](/Users/sasha/Downloads/studiolink-paris/src/main.tsx:93)
   - [src/App.tsx:146](/Users/sasha/Downloads/studiolink-paris/src/App.tsx:146)
7. Surface legacy potentiellement morte (hooks/services de compatibilité peu ou pas utilisés).
   - [src/hooks/useMissions.ts:17](/Users/sasha/Downloads/studiolink-paris/src/hooks/useMissions.ts:17)
   - [src/hooks/useApplications.ts:28](/Users/sasha/Downloads/studiolink-paris/src/hooks/useApplications.ts:28)
   - [src/hooks/useProfile.ts:12](/Users/sasha/Downloads/studiolink-paris/src/hooks/useProfile.ts:12)
   - [src/services/missionService.ts:147](/Users/sasha/Downloads/studiolink-paris/src/services/missionService.ts:147)
   - [src/services/applicationService.ts:356](/Users/sasha/Downloads/studiolink-paris/src/services/applicationService.ts:356)
   - [src/services/profileService.ts:204](/Users/sasha/Downloads/studiolink-paris/src/services/profileService.ts:204)
   - [src/components/ui/Toast.tsx:63](/Users/sasha/Downloads/studiolink-paris/src/components/ui/Toast.tsx:63)

## Résumé convention/type
- Scan repo : pas de `any`, `@ts-ignore`, `@ts-expect-error` détectés dans `src`/`api`.
- Risque principal : garde-fous non assez stricts pour empêcher les futures dérives.

## Limites
- Audit statique read-only.
- Les usages dynamiques/imports runtime hors `src` peuvent fausser certaines conclusions “dead code”.
