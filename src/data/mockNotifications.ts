export interface NotificationItem {
  id: string;
  type: string;
  icon: string;
  text: string;
  subtext: string;
  time: string;
  isRead: boolean;
  route: string;
}

export const MOCK_PRO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "new_mission",
    icon: "🟣",
    text: "Nouvelle mission",
    subtext: "Mixage RnB · 150€ · 75011 Paris",
    time: "il y a 3 min",
    isRead: false,
    route: "/pro/feed"
  },
  {
    id: "n2",
    type: "urgent",
    icon: "🟠",
    text: "Mission URGENT",
    subtext: "Enregistrement voix demain 10h",
    time: "il y a 15 min",
    isRead: false,
    route: "/pro/feed"
  },
  {
    id: "n3",
    type: "selected",
    icon: "✅",
    text: "Tu as été sélectionné !",
    subtext: "Beatmaking Afrobeat · Studio Grande Armée",
    time: "il y a 2h",
    isRead: true,
    route: "/chat/session-lenzo"
  },
  {
    id: "n4",
    type: "rejected",
    icon: "❌",
    text: "Mission pourvue",
    subtext: "Toplining Pop — Mara J",
    time: "Hier",
    isRead: true,
    route: "/pro/mes-candidatures"
  },
  {
    id: "n5",
    type: "rating",
    icon: "⭐",
    text: "Évalue ta session",
    subtext: "Session avec Studio Grande Armée",
    time: "Hier",
    isRead: false,
    route: "/pro/calendrier"
  }
];

export const MOCK_STUDIO_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "new_application",
    icon: "👤",
    text: "Nouvelle candidature",
    subtext: "Alexandre M. · Mixage EP 5 titres",
    time: "il y a 5 min",
    isRead: false,
    route: "/studio/mission/mission-1/candidatures"
  },
  {
    id: "n2",
    type: "new_application",
    icon: "👤",
    text: "Nouvelle candidature",
    subtext: "Sarah K. · Mixage EP 5 titres",
    time: "il y a 20 min",
    isRead: false,
    route: "/studio/mission/mission-1/candidatures"
  },
  {
    id: "n3",
    type: "expiring",
    icon: "⏰",
    text: "Mission qui expire bientôt",
    subtext: "Enregistrement Voix Lead · dans 2h",
    time: "il y a 1h",
    isRead: true,
    route: "/studio/dashboard"
  },
  {
    id: "n4",
    type: "rating",
    icon: "⭐",
    text: "Évalue ta session",
    subtext: "Session avec Alexandre M.",
    time: "Hier",
    isRead: false,
    route: "/studio/calendrier"
  }
];
