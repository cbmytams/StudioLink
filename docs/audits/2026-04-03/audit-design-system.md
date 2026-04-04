# Audit Design System — StudioLink Paris
Date : 2026-04-03
Mode : lecture seule (aucune modification de code)

## Score
- Score global : **6.9 / 10**
- Conformité estimée : **69%**

Hypothèse de scan : une couleur hardcodée = littéral (`#...`, `rgb(...)`, `hsl(...)`, `color-mix(...)`) hors `src/styles/design-system.css` et `src/index.css`.

## Violations exhaustives

### 1) Z-index locaux hors tokens `--z-*`
- [src/components/ApplyModal.tsx:90](/Users/sasha/Downloads/studiolink-paris/src/components/ApplyModal.tsx:90) — `z-10`
- [src/components/shared/DesktopNav.tsx:62](/Users/sasha/Downloads/studiolink-paris/src/components/shared/DesktopNav.tsx:62) — `z-40`
- [src/components/shared/GlobalSearchBar.tsx:45](/Users/sasha/Downloads/studiolink-paris/src/components/shared/GlobalSearchBar.tsx:45) — `z-40`
- [src/components/shared/NotificationBell.tsx:268](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:268) — `z-50`
- [src/components/ui/BottomNav.tsx:41](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomNav.tsx:41) — `z-50`
- [src/components/ui/BottomSheet.tsx:60](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomSheet.tsx:60) — `z-50`
- [src/components/ui/BottomSheet.tsx:74](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomSheet.tsx:74) — `z-50`
- [src/components/ui/BottomSheet.tsx:80](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomSheet.tsx:80) — `z-10`
- [src/components/ui/Toast.tsx:81](/Users/sasha/Downloads/studiolink-paris/src/components/ui/Toast.tsx:81) — `z-50`
- [src/layouts/ProLayout.tsx:17](/Users/sasha/Downloads/studiolink-paris/src/layouts/ProLayout.tsx:17) — `z-50`
- [src/layouts/StudioLayout.tsx:17](/Users/sasha/Downloads/studiolink-paris/src/layouts/StudioLayout.tsx:17) — `z-50`
- [src/pages/CalendarPage.tsx:428](/Users/sasha/Downloads/studiolink-paris/src/pages/CalendarPage.tsx:428) — `z-30`
- [src/pages/ChatPage.tsx:595](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:595) — `z-30`
- [src/pages/ChatPage.tsx:799](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:799) — `z-40`
- [src/pages/HomePage.tsx:38](/Users/sasha/Downloads/studiolink-paris/src/pages/HomePage.tsx:38) — `z-20`
- [src/pages/MissionDetail.tsx:504](/Users/sasha/Downloads/studiolink-paris/src/pages/MissionDetail.tsx:504) — `z-40`
- [src/pages/MissionForm.tsx:702](/Users/sasha/Downloads/studiolink-paris/src/pages/MissionForm.tsx:702) — `z-40`
- [src/pages/NotificationsPage.tsx:77](/Users/sasha/Downloads/studiolink-paris/src/pages/NotificationsPage.tsx:77) — `z-10`

### 2) Gaps de mapping Tailwind (radius)
- [tailwind.config.ts:60](/Users/sasha/Downloads/studiolink-paris/tailwind.config.ts:60) — mapping limité à `sm|md|lg|xl|full`
- [src/components/shared/DesktopNav.tsx:63](/Users/sasha/Downloads/studiolink-paris/src/components/shared/DesktopNav.tsx:63) — `var(--radius-pill)`
- [src/components/shared/RatingModal.tsx:117](/Users/sasha/Downloads/studiolink-paris/src/components/shared/RatingModal.tsx:117) — `var(--radius-pill)`
- [src/components/ui/GlassCard.tsx:24](/Users/sasha/Downloads/studiolink-paris/src/components/ui/GlassCard.tsx:24) — `var(--radius-2xl)`
- [src/pages/LoginPage.tsx:471](/Users/sasha/Downloads/studiolink-paris/src/pages/LoginPage.tsx:471) — `var(--radius-badge)`
- [src/pages/NotFound.tsx:36](/Users/sasha/Downloads/studiolink-paris/src/pages/NotFound.tsx:36) — `var(--radius-2xl)`
- [src/pages/Onboarding.tsx:495](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:495) — `var(--radius-pill)`
- [src/pages/Onboarding.tsx:520](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:520) — `var(--radius-pill)`
- [src/pages/Onboarding.tsx:592](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:592) — `var(--radius-card)`
- [src/pages/Onboarding.tsx:598](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:598) — `var(--radius-card)`
- [src/pages/Onboarding.tsx:605](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:605) — `var(--radius-card)`
- [src/pages/Onboarding.tsx:609](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:609) — `var(--radius-card)`

### 3) Gaps de mapping Tailwind (shadow)
- [tailwind.config.ts:67](/Users/sasha/Downloads/studiolink-paris/tailwind.config.ts:67) — mapping limité à `sm|md|lg`
- [src/components/ApplyModal.tsx:86](/Users/sasha/Downloads/studiolink-paris/src/components/ApplyModal.tsx:86) — `var(--shadow-overlay-sm)`
- [src/components/ReviewModal.tsx:74](/Users/sasha/Downloads/studiolink-paris/src/components/ReviewModal.tsx:74) — `var(--shadow-overlay-xs)`
- [src/components/shared/CookieBanner.tsx:85](/Users/sasha/Downloads/studiolink-paris/src/components/shared/CookieBanner.tsx:85) — `var(--shadow-banner)`
- [src/components/shared/DesktopNav.tsx:110](/Users/sasha/Downloads/studiolink-paris/src/components/shared/DesktopNav.tsx:110) — `var(--shadow-primary-soft)`
- [src/components/shared/DesktopNav.tsx:63](/Users/sasha/Downloads/studiolink-paris/src/components/shared/DesktopNav.tsx:63) — `var(--shadow-nav)`
- [src/components/shared/DesktopNav.tsx:70](/Users/sasha/Downloads/studiolink-paris/src/components/shared/DesktopNav.tsx:70) — `var(--shadow-primary)`
- [src/components/shared/DesktopNav.tsx:96](/Users/sasha/Downloads/studiolink-paris/src/components/shared/DesktopNav.tsx:96) — `var(--shadow-primary)`
- [src/components/shared/ErrorBoundary.tsx:56](/Users/sasha/Downloads/studiolink-paris/src/components/shared/ErrorBoundary.tsx:56) — `var(--shadow-soft)`
- [src/components/shared/GlobalSearchBar.tsx:50](/Users/sasha/Downloads/studiolink-paris/src/components/shared/GlobalSearchBar.tsx:50) — `var(--shadow-float)`
- [src/components/shared/GlobalSearchBar.tsx:51](/Users/sasha/Downloads/studiolink-paris/src/components/shared/GlobalSearchBar.tsx:51) — `var(--shadow-float)`
- [src/components/shared/NotificationBell.tsx:268](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:268) — `var(--shadow-overlay)`
- [src/main.tsx:77](/Users/sasha/Downloads/studiolink-paris/src/main.tsx:77) — `var(--shadow-screen)`
- [src/pages/HomePage.tsx:45](/Users/sasha/Downloads/studiolink-paris/src/pages/HomePage.tsx:45) — `var(--shadow-primary-glow)`
- [src/pages/LoginPage.tsx:471](/Users/sasha/Downloads/studiolink-paris/src/pages/LoginPage.tsx:471) — `var(--shadow-primary-glow-strong)`
- [src/pages/NotFound.tsx:36](/Users/sasha/Downloads/studiolink-paris/src/pages/NotFound.tsx:36) — `var(--shadow-soft)`
- [src/pages/Onboarding.tsx:382](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:382) — `var(--shadow-primary-outline)`
- [src/pages/Onboarding.tsx:402](/Users/sasha/Downloads/studiolink-paris/src/pages/Onboarding.tsx:402) — `var(--shadow-primary-outline)`
- [src/pages/StudioDashboard.tsx:138](/Users/sasha/Downloads/studiolink-paris/src/pages/StudioDashboard.tsx:138) — `var(--shadow-primary-card)`

### 4) Cohérence dark/light et thème global
- [src/main.tsx:91](/Users/sasha/Downloads/studiolink-paris/src/main.tsx:91) — pas de `ThemeProvider` global
- [src/App.tsx:143](/Users/sasha/Downloads/studiolink-paris/src/App.tsx:143) — routes sans pilotage global de thème
- [src/pages/LoginPage.tsx:641](/Users/sasha/Downloads/studiolink-paris/src/pages/LoginPage.tsx:641) — widget forcé en `theme: 'light'`
- [src/pages/NotificationsPage.tsx:125](/Users/sasha/Downloads/studiolink-paris/src/pages/NotificationsPage.tsx:125) — `tone="light"`
- [src/components/shared/NotificationBell.tsx:172](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:172) — `tone="light"`

## Vérifications sans violation détectée
- Couleurs hardcodées hors fichiers token CSS : **aucune trouvée**.
- Spacing arbitraire fixe inline (`px/rem/em`) : **aucune violation directe**.
- `font-size` / `font-family` hardcodés : **aucune violation directe**.
- Mapping `bg-primary` / `text-muted` présent dans [tailwind.config.ts:7](/Users/sasha/Downloads/studiolink-paris/tailwind.config.ts:7), mais classes sémantiques peu utilisées.

## Limites
- Scan statique (pas de résolution complète des classes construites dynamiquement).
- Le résultat dépend de la politique : si `text-white`, `bg-orange-500`, etc. sont considérés hardcodés, le nombre de violations augmente fortement.
