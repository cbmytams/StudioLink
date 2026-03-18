import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  onboardingComplete: boolean;
  setOnboardingComplete: (status: boolean) => void;
  
  // Studio Data
  studioData: {
    name: string;
    address: string;
    district: string;
    phone: string;
    description: string;
    equipment: string[];
    website: string;
    instagram: string;
  };
  setStudioData: (data: Partial<OnboardingState['studioData']>) => void;
  
  // Pro Data
  proData: {
    name: string;
    bio: string;
    phone: string;
    services: string[];
    genres: string[];
    instruments: string[];
    minRate: number;
    showRate: boolean;
    links: { platform: string; url: string }[];
  };
  setProData: (data: Partial<OnboardingState['proData']>) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      onboardingComplete: false,
      setOnboardingComplete: (status) => set({ onboardingComplete: status }),
      
      studioData: {
        name: '',
        address: '',
        district: '75001 Paris',
        phone: '',
        description: '',
        equipment: [],
        website: '',
        instagram: ''
      },
      setStudioData: (data) => set((state) => ({ studioData: { ...state.studioData, ...data } })),
      
      proData: {
        name: '',
        bio: '',
        phone: '',
        services: [],
        genres: [],
        instruments: [],
        minRate: 150,
        showRate: true,
        links: []
      },
      setProData: (data) => set((state) => ({ proData: { ...state.proData, ...data } }))
    }),
    {
      name: 'studiolink-onboarding'
    }
  )
);
