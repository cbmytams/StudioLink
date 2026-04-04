# Audit Global — StudioLink Paris
Date : 2026-04-03

## Score par domaine
| Domaine | Score | Issues critiques | Issues importantes | Issues mineures |
|---|---:|---:|---:|---:|
| Design System | 6.9/10 | 0 | 4 | 3 |
| Accessibilité | 5.8/10 | 2 | 5 | 3 |
| Performance | 6.2/10 | 5 | 6 | 3 |
| Sécurité | 5.9/10 | 2 | 3 | 3 |
| Qualité du code | 6.4/10 | 1 | 4 | 2 |
| Mobile | 8.2/10 | 0 | 3 | 0 |

## Top 10 des issues les plus impactantes
1. Secret potentiellement injecté au bundle client (`process.env.GEMINI_API_KEY`) — [vite.config.ts:26](/Users/sasha/Downloads/studiolink-paris/vite.config.ts:26)
2. Session auth en `localStorage` (pas de cookie `httpOnly`) — [src/lib/supabase/client.ts:17](/Users/sasha/Downloads/studiolink-paris/src/lib/supabase/client.ts:17)
3. Fonction `send-email` sans garde d’autorisation applicative explicite — [supabase/functions/send-email/index.ts:179](/Users/sasha/Downloads/studiolink-paris/supabase/functions/send-email/index.ts:179)
4. Fonction `process-reminders` sans garde d’autorisation applicative explicite — [supabase/functions/process-reminders/index.ts:34](/Users/sasha/Downloads/studiolink-paris/supabase/functions/process-reminders/index.ts:34)
5. Contraste CTA principal non conforme WCAG AA (2.80:1) — [src/components/ui/Button.tsx:37](/Users/sasha/Downloads/studiolink-paris/src/components/ui/Button.tsx:37)
6. Accessibilité modales : focus trap/sémantique dialog incomplets — [src/components/ui/BottomSheet.tsx:69](/Users/sasha/Downloads/studiolink-paris/src/components/ui/BottomSheet.tsx:69)
7. Payload initial trop lourd pour LCP (preloads vendor + CSS bloquante) — [dist/index.html:16](/Users/sasha/Downloads/studiolink-paris/dist/index.html:16)
8. Réactivité chat (INP) : rerenders massifs + fetch messages non borné — [src/pages/ChatPage.tsx:682](/Users/sasha/Downloads/studiolink-paris/src/pages/ChatPage.tsx:682)
9. CLS : cookie banner modifie layout global avec offset/padding dynamique — [src/components/shared/CookieBanner.tsx:45](/Users/sasha/Downloads/studiolink-paris/src/components/shared/CookieBanner.tsx:45)
10. Architecture code : stack notifications dupliquée/divergente — [src/components/shared/NotificationBell.tsx:74](/Users/sasha/Downloads/studiolink-paris/src/components/shared/NotificationBell.tsx:74)

## Plan d'action recommandé

### Sprint 1 (critique)
- Supprimer l’injection `GEMINI_API_KEY` du build client.
- Verrouiller `send-email` et `process-reminders` (auth forte + rate limit + secret d’appel interne).
- Définir une stratégie session serveur (BFF + cookies `httpOnly`/`secure`/`sameSite`).
- Corriger le contraste CTA et les modales critiques (dialog/focus trap).

### Sprint 2 (important)
- Réduire le coût LCP/INP (bootstrap, analytics au démarrage, virtualisation/partition du chat, limites fetch).
- Résoudre les écarts Design System (z-index tokenisés + mapping Tailwind complet radius/shadow).
- Harmoniser la couche notifications (un seul service/hook).
- Finaliser les points a11y importants (labels, icon-only, toasts, popup semantics).

### Sprint 3 (polish)
- Unifier totalement le 404 sur tous les chemins.
- Généraliser les audits touch targets width+height sur toutes routes mobile.
- Terminer la migration typographique responsive.
- Durcir CSP vers une politique plus stricte (nonce/hash, suppression `unsafe-eval`).
