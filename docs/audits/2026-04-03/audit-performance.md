# Audit Performance & Core Web Vitals — StudioLink Paris
Date : 2026-04-03
Mode : lecture seule (aucune modification de code)

## LCP (Largest Contentful Paint)
- `high` Payload initial élevé en CSR : `index` + 7 chunks vendor preload + CSS bloquante avant rendu route.
  - [dist/index.html:16](/Users/sasha/Downloads/studiolink-paris/dist/index.html:16)
  - [dist/index.html:17](/Users/sasha/Downloads/studiolink-paris/dist/index.html:17)
  - [dist/index.html:24](/Users/sasha/Downloads/studiolink-paris/dist/index.html:24)
  - [dist/index.html:25](/Users/sasha/Downloads/studiolink-paris/dist/index.html:25)
- `high` Initialisation analytics/monitoring au boot (Sentry, PostHog, Vercel Analytics/Speed Insights).
  - [src/main.tsx:3](/Users/sasha/Downloads/studiolink-paris/src/main.tsx:3)
  - [src/main.tsx:33](/Users/sasha/Downloads/studiolink-paris/src/main.tsx:33)
  - [src/main.tsx:66](/Users/sasha/Downloads/studiolink-paris/src/main.tsx:66)
  - [src/lib/analytics/posthog.ts:30](/Users/sasha/Downloads/studiolink-paris/src/lib/analytics/posthog.ts:30)
- `medium` Home route lazy-loadée : requête chunk additionnelle avant LCP final.
  - [src/App.tsx:22](/Users/sasha/Downloads/studiolink-paris/src/App.tsx:22)
  - [src/App.tsx:145](/Users/sasha/Downloads/studiolink-paris/src/App.tsx:145)
  - [src/App.tsx:147](/Users/sasha/Downloads/studiolink-paris/src/App.tsx:147)
- `medium` Feuille CSS globale bloquante et lourde au premier rendu.
  - [dist/index.html:25](/Users/sasha/Downloads/studiolink-paris/dist/index.html:25)
  - [src/index.css:1](/Users/sasha/Downloads/studiolink-paris/src/index.css:1)
- `medium` Pipeline image chat non optimisé (`img` sans `srcset/sizes`, pièces jointes jusqu’à 10MB).
  - [src/pages/ChatPage.tsx:462](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:462)
  - [src/pages/ChatPage.tsx:713](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:713)
  - [src/components/ui/LazyImage.tsx:10](/Users/sasha/Downloads/studiolink-paris/src/components/ui/LazyImage.tsx:10)

## INP (Interaction to Next Paint)
- `high` `useVisualViewportMetrics` update toutes les 250ms + listeners multiples, provoquant churn de rerender.
  - [src/hooks/useVisualViewport.ts:58](/Users/sasha/Downloads/studiolink-paris/src/hooks/useVisualViewport.ts:58)
  - [src/hooks/useVisualViewport.ts:61](/Users/sasha/Downloads/studiolink-paris/src/hooks/useVisualViewport.ts:61)
  - [src/components/ui/BottomNav.tsx:19](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomNav.tsx:19)
  - [src/components/ui/BottomSheet.tsx:18](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomSheet.tsx:18)
- `high` Saisie chat rerender page complète + mapping de tous les messages ; fetch de messages non borné.
  - [src/pages/ChatPage.tsx:110](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:110)
  - [src/pages/ChatPage.tsx:682](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:682)
  - [src/pages/ChatPage.tsx:844](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:844)
  - [src/lib/chat/chatService.ts:381](/Users/sasha/Downloads/studiolink-paris/src/lib/chat/chatService.ts:381)
- `medium` Auto-scroll `scrollIntoView({ behavior: "smooth" })` à chaque changement message.
  - [src/pages/ChatPage.tsx:147](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:147)
- `medium` Calendar : filtrages répétés + pattern N+1 (requêtes par mission).
  - [src/pages/CalendarPage.tsx:197](/Users/sasha/Downloads/studiolink-paris/src/pages/CalendarPage.tsx:197)
  - [src/pages/CalendarPage.tsx:217](/Users/sasha/Downloads/studiolink-paris/src/pages/CalendarPage.tsx:217)
  - [src/pages/CalendarPage.tsx:315](/Users/sasha/Downloads/studiolink-paris/src/pages/CalendarPage.tsx:315)
  - [src/pages/CalendarPage.tsx:531](/Users/sasha/Downloads/studiolink-paris/src/pages/CalendarPage.tsx:531)
- `low` Effets visuels coûteux (`backdrop-blur`, background fixed) sur mobile low-end.
  - [src/styles/design-system.css:325](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:325)
  - [src/styles/design-system.css:378](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:378)

## CLS (Cumulative Layout Shift)
- `high` Cookie banner modifie dynamiquement l’offset global + animation de padding body.
  - [src/components/shared/CookieBanner.tsx:45](/Users/sasha/Downloads/studiolink-paris/src/components/shared/CookieBanner.tsx:45)
  - [src/components/shared/CookieBanner.tsx:49](/Users/sasha/Downloads/studiolink-paris/src/components/shared/CookieBanner.tsx:49)
  - [src/styles/design-system.css:306](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:306)
  - [src/styles/design-system.css:312](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:312)
- `medium` Images chat sans dimensions intrinsèques réservées (shift à l’affichage).
  - [src/components/ui/LazyImage.tsx:10](/Users/sasha/Downloads/studiolink-paris/src/components/ui/LazyImage.tsx:10)
  - [src/pages/ChatPage.tsx:713](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:713)
  - [src/pages/ChatPage.tsx:716](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:716)
- `low` Éléments fixes mobiles fréquemment repositionnés (cas limites clavier/UI navigateur).
  - [src/hooks/useVisualViewport.ts:92](/Users/sasha/Downloads/studiolink-paris/src/hooks/useVisualViewport.ts:92)
  - [src/components/ui/BottomNav.tsx:42](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomNav.tsx:42)
  - [src/pages/ChatPage.tsx:800](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:800)

## N/A (architectural)
- Contrôles webfont (`@font-face`, `font-display`) : non applicables, pas de webfont chargée explicitement.
  - [src/styles/design-system.css:46](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:46)
- LCP SSR : non applicable, application SPA client-side.
  - [index.html:18](/Users/sasha/Downloads/studiolink-paris/index.html:18)
  - [src/App.tsx:143](/Users/sasha/Downloads/studiolink-paris/src/App.tsx:143)

## Impact estimé
- LCP : **élevé**
- INP : **élevé**
- CLS : **moyen à élevé**
