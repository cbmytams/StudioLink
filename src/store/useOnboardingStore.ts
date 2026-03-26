import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

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
      currentStep: 1,
      setCurrentStep: (step) => set({ currentStep: Math.max(1, Math.min(4, step)) }),
      nextStep: () => set((state) => ({ currentStep: Math.min(4, state.currentStep + 1) })),
      prevStep: () => set((state) => ({ currentStep: Math.max(1, state.currentStep - 1) })),

      onboardingComplete: false,
      setOnboardingComplete: (status) => set((state) => ({
        onboardingComplete: status,
        currentStep: status ? 1 : state.currentStep
      })),
      
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
