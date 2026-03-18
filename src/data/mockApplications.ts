export interface ProApplication {
  id: string;
  missionId: string;
  missionTitle: string;
  serviceType: string;
  studioName: string;
  studioAddress: string;
  durationHours: number;
  rate: number;
  isNegotiable: boolean;
  status: "pending" | "selected" | "rejected";
  appliedAt: string;
  expiresAt: Date | null;
  sessionId: string | null;
}

export const mockApplications: ProApplication[] = [
  {
    id: "app-1",
    missionId: "mission-mixage-lenzo",
    missionTitle: "Mixage RnB — Lenzo",
    serviceType: "mixage",
    studioName: "Studio Grande Armée",
    studioAddress: "75011 Paris — Rue de la Roquette",
    durationHours: 4,
    rate: 200,
    isNegotiable: false,
    status: "selected",
    appliedAt: "Il y a 3h",
    expiresAt: null,
    sessionId: "session-lenzo"
  },
  {
    id: "app-2",
    missionId: "mission-enreg-voix",
    missionTitle: "Enregistrement Voix Lead",
    serviceType: "enregistrement",
    studioName: "Studio Pigalle Records",
    studioAddress: "75009 Paris",
    durationHours: 3,
    rate: 120,
    isNegotiable: false,
    status: "pending",
    appliedAt: "Il y a 1h",
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // expire dans 8h
    sessionId: null
  },
  {
    id: "app-3",
    missionId: "mission-toplining",
    missionTitle: "Toplining Pop — Mara J",
    serviceType: "toplining",
    studioName: "Studio Opéra",
    studioAddress: "75002 Paris",
    durationHours: 2,
    rate: 90,
    isNegotiable: false,
    status: "pending",
    appliedAt: "Il y a 30min",
    expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000), // expire dans 22h
    sessionId: null
  },
  {
    id: "app-4",
    missionId: "mission-beatmaking",
    missionTitle: "Beatmaking Afrobeat",
    serviceType: "beatmaking",
    studioName: "Studio Grande Armée",
    studioAddress: "75011 Paris",
    durationHours: 3,
    rate: 500,
    isNegotiable: false,
    status: "rejected",
    appliedAt: "Il y a 2 jours",
    expiresAt: null,
    sessionId: null
  }
];
