export interface Session {
  id: string;
  missionId: string;
  missionTitle: string;
  serviceType: string;
  artistName: string;
  isConfidential: boolean;
  studioName: string;
  studioAddress: string;
  proName: string;
  proAvatar: string;
  studioAvatar: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  durationHours: number;
  rate: number;
  status: 'confirmed' | 'completed';
  chatSessionId: string;
  studioId: string;
  proId: string;
}

export const mockSessions: Session[] = [
  {
    id: "session-lenzo",
    missionId: "mission-mixage-lenzo",
    missionTitle: "Mixage RnB — Lenzo",
    serviceType: "mixage",
    artistName: "Lenzo",
    isConfidential: false,
    studioName: "Studio Grande Armée",
    studioAddress: "12 Rue de la Roquette, 75011 Paris",
    proName: "Alexandre M.",
    proAvatar: "https://i.pravatar.cc/150?img=3",
    studioAvatar: "https://picsum.photos/seed/studio1/100/100",
    date: new Date(2026, 2, 20), // Vendredi 20 mars
    timeStart: "10:00",
    timeEnd: "14:00",
    durationHours: 4,
    rate: 200,
    status: "confirmed",
    chatSessionId: "session-lenzo",
    studioId: "studio-1",
    proId: "pro-1",
  },
  {
    id: "session-voix",
    missionId: "mission-enreg-voix",
    missionTitle: "Enregistrement Voix Lead",
    serviceType: "enregistrement",
    artistName: "Confidentiel",
    isConfidential: true,
    studioName: "Studio Pigalle Records",
    studioAddress: "8 Rue Frochot, 75009 Paris",
    proName: "Sarah K.",
    proAvatar: "https://i.pravatar.cc/150?img=5",
    studioAvatar: "https://picsum.photos/seed/studio2/100/100",
    date: new Date(2026, 2, 24), // Mardi 24 mars
    timeStart: "14:00",
    timeEnd: "17:00",
    durationHours: 3,
    rate: 120,
    status: "confirmed",
    chatSessionId: "session-voix",
    studioId: "studio-2",
    proId: "pro-2",
  },
  {
    id: "session-completed",
    missionId: "mission-beatmaking",
    missionTitle: "Beatmaking Afrobeat",
    serviceType: "beatmaking",
    artistName: "Confidentiel",
    isConfidential: true,
    studioName: "Studio Grande Armée",
    studioAddress: "12 Rue de la Roquette, 75011 Paris",
    proName: "Karim D.",
    proAvatar: "https://i.pravatar.cc/150?img=8",
    studioAvatar: "https://picsum.photos/seed/studio1/100/100",
    date: new Date(2026, 2, 14), // Samedi 14 mars (passé)
    timeStart: "15:00",
    timeEnd: "18:00",
    durationHours: 3,
    rate: 500,
    status: "completed",
    chatSessionId: "session-beatmaking",
    studioId: "studio-1",
    proId: "pro-1",
  }
];
