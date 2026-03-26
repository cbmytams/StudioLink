// KPIs beta - 30 premiers jours
// A monitorer dans PostHog

export const BETA_KPIS = {
  targets: {
    totalRegistrations: 20, // J+30
    onboardingCompletion: 0.70, // 70% completent l'onboarding
    firstMissionCreated: 3, // J+3 apres 1er studio inscrit
    firstApplication: 5, // J+5 apres 1ere mission
    firstSessionCompleted: 14, // J+14 apres 1ere candidature acceptee
    npsScore: 7, // Sur 10, apres 14 jours
  },

  events: [
    'user_registered',
    'onboarding_completed',
    'onboarding_abandoned',
    'mission_created',
    'mission_applied',
    'application_accepted',
    'session_started',
    'session_completed',
    'rating_given',
  ],

  funnels: {
    acquisition: [
      'user_registered',
      'onboarding_completed',
      'mission_created', // ou mission_applied selon le role
    ],
    activation: [
      'mission_applied',
      'application_accepted',
      'session_started',
    ],
    retention: [
      'session_completed',
      'rating_given',
    ],
  },
} as const;
