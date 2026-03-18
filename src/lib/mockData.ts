import { Mission } from '@/components/ui/MissionCard';

const now = new Date().getTime();

export const MOCK_MISSIONS: Mission[] = [
  {
    id: "m1",
    isUrgent: true,
    serviceType: "Enregistrement voix",
    artistName: "Confidentiel",
    isConfidential: true,
    genres: ["Trap", "RnB"],
    duration: "2h",
    price: "120 €",
    location: "75011 Paris",
    candidatesCount: 3,
    expiresAt: now + 22 * 60 * 1000, // 22 mins
    createdAt: now - 100000,
    status: "open"
  },
  {
    id: "m2",
    isUrgent: false,
    serviceType: "Mixage",
    artistName: "Lenzo",
    isConfidential: false,
    genres: ["RnB"],
    duration: "4h",
    price: "200 €",
    location: "75018 Paris",
    candidatesCount: 1,
    expiresAt: now + 6 * 60 * 60 * 1000, // 6 hours
    createdAt: now - 200000,
    status: "applied"
  },
  {
    id: "m3",
    isUrgent: false,
    serviceType: "Beatmaking",
    artistName: "Confidentiel",
    isConfidential: true,
    genres: ["Afro", "Trap"],
    duration: "3h",
    price: "À négocier",
    location: "93100 Montreuil",
    candidatesCount: 5,
    expiresAt: now + 23 * 60 * 60 * 1000, // 23 hours
    createdAt: now - 300000,
    status: "open"
  },
  {
    id: "m4",
    isUrgent: false,
    serviceType: "Toplining",
    artistName: "Mara J",
    isConfidential: false,
    genres: ["Pop"],
    duration: "2h",
    price: "90 €",
    location: "75003 Paris",
    candidatesCount: 0,
    expiresAt: now + 47 * 60 * 60 * 1000, // 47 hours
    createdAt: now - 400000,
    status: "open"
  }
];
