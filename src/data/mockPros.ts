export interface Review {
  id: string;
  studioName: string;
  date: string;
  rating: number;
  comment: string;
}

export interface ProProfile {
  id: string;
  firstName: string;
  lastName: string;
  roles: string[];
  avatar: string;
  coverImage?: string;
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  bio: string;
  basePrice?: string;
  genres: string[];
  instruments?: string[];
  portfolio: {
    platform: string;
    url: string;
    displayUrl: string;
  }[];
  reviews: Review[];
}

export const MOCK_PROS: Record<string, ProProfile> = {
  "pro1": {
    id: "pro1",
    firstName: "Alexandre",
    lastName: "M.",
    roles: ["Ingénieur mixage"],
    avatar: "https://picsum.photos/seed/alex/200/200",
    coverImage: "https://picsum.photos/seed/studio_alex/800/400",
    isAvailable: true,
    rating: 4.7,
    reviewCount: 8,
    bio: "Ingénieur du son passionné avec 5 ans d'expérience. Spécialisé dans les musiques urbaines (RnB, Afro, Trap). J'ai travaillé sur plusieurs projets d'artistes émergents de la scène parisienne. Mon approche est centrée sur la chaleur analogique et la clarté numérique.",
    basePrice: "À partir de 150 € / titre",
    genres: ["RnB", "Afro", "Trap"],
    portfolio: [
      { platform: "SoundCloud", url: "https://soundcloud.com", displayUrl: "soundcloud.com/alex-mix" },
      { platform: "Instagram", url: "https://instagram.com", displayUrl: "@alex_mixes" }
    ],
    reviews: [
      { id: "r1", studioName: "Studio Grande Armée", date: "Octobre 2025", rating: 5, comment: "Excellent travail sur le mix, très à l'écoute et rapide." },
      { id: "r2", studioName: "Red Bull Studios", date: "Septembre 2025", rating: 4.5, comment: "Super vibe, mix très propre. Je recommande." },
      { id: "r3", studioName: "La Fabrique", date: "Juillet 2025", rating: 4.5, comment: "Très pro, a su capter l'essence du morceau." }
    ]
  },
  "pro2": {
    id: "pro2",
    firstName: "Sarah",
    lastName: "K.",
    roles: ["Ingénieur mixage", "Mastering"],
    avatar: "https://picsum.photos/seed/sarah/200/200",
    coverImage: "https://picsum.photos/seed/studio_sarah/800/400",
    isAvailable: true,
    rating: 4.9,
    reviewCount: 23,
    bio: "Ingénieure du son certifiée avec une solide expérience en studio et en live. Je m'occupe de la chaîne complète, du mixage au mastering final pour les plateformes de streaming.",
    basePrice: "À partir de 200 € / titre",
    genres: ["Pop", "Électro", "RnB"],
    portfolio: [
      { platform: "Spotify", url: "https://spotify.com", displayUrl: "Playlist Crédits" },
      { platform: "Site web", url: "https://example.com", displayUrl: "sarah-k-audio.com" }
    ],
    reviews: [
      { id: "r4", studioName: "Motorbass Studio", date: "Novembre 2025", rating: 5, comment: "Mastering impeccable, dynamique parfaite." },
      { id: "r5", studioName: "Question de Son", date: "Août 2025", rating: 5, comment: "Une oreille absolue. Le mix est incroyable." }
    ]
  },
  "pro3": {
    id: "pro3",
    firstName: "Karim",
    lastName: "D.",
    roles: ["Ingénieur son"],
    avatar: "https://picsum.photos/seed/karim/200/200",
    coverImage: "https://picsum.photos/seed/studio_karim/800/400",
    isAvailable: true,
    rating: 0,
    reviewCount: 0,
    bio: "Jeune ingénieur du son diplômé de la SAE Institute. Je cherche à collaborer sur des projets ambitieux. Très à l'aise avec Pro Tools et Logic Pro.",
    basePrice: "À partir de 80 € / session",
    genres: ["Trap", "Drill", "Rap"],
    portfolio: [
      { platform: "SoundCloud", url: "https://soundcloud.com", displayUrl: "soundcloud.com/karim-audio" }
    ],
    reviews: []
  },
  "pro4": {
    id: "pro4",
    firstName: "Jules",
    lastName: "T.",
    roles: ["Ingénieur mixage"],
    avatar: "https://picsum.photos/seed/jules/200/200",
    coverImage: "https://picsum.photos/seed/studio_jules/800/400",
    isAvailable: false,
    rating: 4.2,
    reviewCount: 5,
    bio: "Mixeur freelance, je travaille principalement in-the-box avec des plugins UAD et FabFilter. Rapide et efficace.",
    basePrice: "À partir de 120 € / titre",
    genres: ["Rock", "Pop", "Indie"],
    instruments: ["Guitare", "Basse"],
    portfolio: [
      { platform: "Instagram", url: "https://instagram.com", displayUrl: "@jules_mix" }
    ],
    reviews: [
      { id: "r6", studioName: "Studio Ferber", date: "Mai 2025", rating: 4, comment: "Bon mix, quelques retouches nécessaires mais très réactif." }
    ]
  }
};
