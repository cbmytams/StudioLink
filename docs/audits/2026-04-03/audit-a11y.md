# Audit Accessibilité (WCAG AA) — StudioLink Paris
Date : 2026-04-03
Mode : lecture seule (aucune modification de code)

## Critique
- Modales/dialogues incomplets : sémantique `dialog` absente sur certains flux, et pas de focus trap explicite.
  - [src/components/ReviewModal.tsx:73](/Users/sasha/Downloads/studiolink-paris/src/components/ReviewModal.tsx:73)
  - [src/components/ReviewModal.tsx:75](/Users/sasha/Downloads/studiolink-paris/src/components/ReviewModal.tsx:75)
  - [src/components/shared/RatingModal.tsx:114](/Users/sasha/Downloads/studiolink-paris/src/components/shared/RatingModal.tsx:114)
  - [src/pages/SettingsPage.tsx:247](/Users/sasha/Downloads/studiolink-paris/src/pages/SettingsPage.tsx:247)
  - [src/components/ApplyModal.tsx:77](/Users/sasha/Downloads/studiolink-paris/src/components/ApplyModal.tsx:77)
  - [src/components/ui/BottomSheet.tsx:69](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomSheet.tsx:69)
- Contraste CTA principal non conforme : texte blanc sur `--color-primary` (orange) = **2.80:1** (< 4.5:1).
  - [src/styles/design-system.css:17](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:17)
  - [src/styles/design-system.css:357](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:357)
  - [src/components/ui/Button.tsx:37](/Users/sasha/Downloads/studiolink-paris/src/components/ui/Button.tsx:37)
  - [src/pages/ChatPage.tsx:850](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:850)
  - [src/components/shared/GlobalSearchBar.tsx:64](/Users/sasha/Downloads/studiolink-paris/src/components/shared/GlobalSearchBar.tsx:64)

## Important
- Champs de formulaire sans label programmatique (placeholder-only).
  - [src/pages/StudioProfile.tsx:348](/Users/sasha/Downloads/studiolink-paris/src/pages/StudioProfile.tsx:348)
  - [src/pages/StudioProfile.tsx:366](/Users/sasha/Downloads/studiolink-paris/src/pages/StudioProfile.tsx:366)
  - [src/pages/ProProfile.tsx:459](/Users/sasha/Downloads/studiolink-paris/src/pages/ProProfile.tsx:459)
  - [src/pages/ProProfile.tsx:562](/Users/sasha/Downloads/studiolink-paris/src/pages/ProProfile.tsx:562)
  - [src/pages/ProsPage.tsx:51](/Users/sasha/Downloads/studiolink-paris/src/pages/ProsPage.tsx:51)
  - [src/pages/ProsPage.tsx:70](/Users/sasha/Downloads/studiolink-paris/src/pages/ProsPage.tsx:70)
- Contrôles icon-only sans nom accessible.
  - [src/pages/CalendarPage.tsx:455](/Users/sasha/Downloads/studiolink-paris/src/pages/CalendarPage.tsx:455)
  - [src/pages/CalendarPage.tsx:463](/Users/sasha/Downloads/studiolink-paris/src/pages/CalendarPage.tsx:463)
  - [src/pages/ChatPage.tsx:597](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:597)
- Toasts non annoncés aux technologies d’assistance (`aria-live`/`role=status|alert` manquants).
  - [src/components/ui/Toast.tsx:125](/Users/sasha/Downloads/studiolink-paris/src/components/ui/Toast.tsx:125)
  - [src/components/ui/Toast.tsx:131](/Users/sasha/Downloads/studiolink-paris/src/components/ui/Toast.tsx:131)
  - [src/components/ui/Toast.tsx:138](/Users/sasha/Downloads/studiolink-paris/src/components/ui/Toast.tsx:138)
- Popup notifications desktop sans sémantique d’ouverture/fermeture explicite (`aria-expanded`, `aria-controls`, rôle popup/focus).
  - [src/components/shared/NotificationBell.tsx:235](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:235)
  - [src/components/shared/NotificationBell.tsx:266](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:266)
  - [src/components/shared/NotificationBell.tsx:100](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:100)
- Texte secondaire utilisé pour information importante avec contraste insuffisant.
  - [src/pages/HomePage.tsx:201](/Users/sasha/Downloads/studiolink-paris/src/pages/HomePage.tsx:201)
  - [src/pages/ConversationList.tsx:297](/Users/sasha/Downloads/studiolink-paris/src/pages/ConversationList.tsx:297)
  - [src/pages/NotificationsPage.tsx:134](/Users/sasha/Downloads/studiolink-paris/src/pages/NotificationsPage.tsx:134)
  - [src/styles/design-system.css:430](/Users/sasha/Downloads/studiolink-paris/src/styles/design-system.css:430)

## Mineur
- Landmarks incomplets : wrappers `<div>` là où un `<main>` unique serait attendu.
  - [src/layouts/ProLayout.tsx:13](/Users/sasha/Downloads/studiolink-paris/src/layouts/ProLayout.tsx:13)
  - [src/layouts/StudioLayout.tsx:13](/Users/sasha/Downloads/studiolink-paris/src/layouts/StudioLayout.tsx:13)
  - [src/pages/StudioDashboard.tsx:123](/Users/sasha/Downloads/studiolink-paris/src/pages/StudioDashboard.tsx:123)
  - [src/pages/ProDashboard.tsx:97](/Users/sasha/Downloads/studiolink-paris/src/pages/ProDashboard.tsx:97)
- Cartes de navigation implémentées en boutons plutôt qu’en liens.
  - [src/components/search/ProCard.tsx:20](/Users/sasha/Downloads/studiolink-paris/src/components/search/ProCard.tsx:20)
  - [src/components/search/MissionCard.tsx:27](/Users/sasha/Downloads/studiolink-paris/src/components/search/MissionCard.tsx:27)
- Alt text : pas d’absence détectée, mais qualité parfois générique.
  - [src/components/ui/AvatarUpload.tsx:84](/Users/sasha/Downloads/studiolink-paris/src/components/ui/AvatarUpload.tsx:84)

## Contrastes calculés (échantillon)
- `--color-text` / `--color-bg` : **19.66:1** (OK)
- `--color-text-muted` / `--color-bg` : **9.70:1** (OK)
- `--color-text-faint` / `--color-bg` : **4.52:1** (OK limite)
- `white` / `--color-primary` : **2.80:1** (KO)
- `--color-text-on-soft-muted` / `--color-surface-soft` : **4.10:1** (KO)
- `--color-text-on-soft-faint` / `--color-surface-soft` : **2.17:1** (KO)

## Limites
- Audit statique uniquement (pas de parcours clavier/screen reader live).
- Pas d’inspection runtime des styles calculés en DOM.
- Les dégradés/overlays peuvent modifier le contraste réel selon viewport/état.
