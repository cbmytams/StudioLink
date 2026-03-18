export interface SessionFile {
  id: string;
  name: string;
  type: 'audio' | 'pdf' | 'image';
  size: string;
  date: string;
}

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
  files: SessionFile[];
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
    files: [
      { id: 'f1', name: 'Mix_Final_v3.wav', type: 'audio', size: '48.2 MB', date: '2025-03-15' },
      { id: 'f2', name: 'Brief_Session.pdf', type: 'pdf', size: '1.1 MB', date: '2025-03-14' },
      { id: 'f3', name: 'Cover_Art.jpg', type: 'image', size: '3.4 MB', date: '2025-03-13' },
      { id: 'f4', name: 'Stems_Lead_Vox.wav', type: 'audio', size: '22.7 MB', date: '2025-03-12' },
    ],
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
    files: [
      { id: 'f1', name: 'Session_Brief.pdf', type: 'pdf', size: '0.9 MB', date: '2025-03-18' },
      { id: 'f2', name: 'Voix_Ref.wav', type: 'audio', size: '36.8 MB', date: '2025-03-17' },
      { id: 'f3', name: 'Artwork_Moodboard.jpg', type: 'image', size: '2.8 MB', date: '2025-03-16' },
    ],
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
    files: [
      { id: 'f1', name: 'Afrobeat_Draft.wav', type: 'audio', size: '41.4 MB', date: '2025-03-11' },
      { id: 'f2', name: 'Topline_Notes.pdf', type: 'pdf', size: '1.2 MB', date: '2025-03-10' },
      { id: 'f3', name: 'Cover_Option_A.jpg', type: 'image', size: '2.1 MB', date: '2025-03-09' },
    ],
    status: "completed",
    chatSessionId: "session-beatmaking",
    studioId: "studio-1",
    proId: "pro-1",
  }
];
