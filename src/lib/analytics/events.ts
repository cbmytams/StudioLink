import { track } from './posthog';

// Auth
export const trackUserRegistered = (role: 'studio' | 'pro') =>
  track('user_registered', { role });

export const trackUserLoggedIn = (role: 'studio' | 'pro') =>
  track('user_logged_in', { role });

export const trackUserLoggedOut = () =>
  track('user_logged_out');

// Onboarding
export const trackOnboardingStepCompleted = (step: number, role: string) =>
  track('onboarding_step_completed', { step, role });

export const trackOnboardingCompleted = (role: string, stepsTaken: number) =>
  track('onboarding_completed', { role, steps_taken: stepsTaken });

export const trackOnboardingAbandoned = (role: string, step: number) =>
  track('onboarding_abandoned', { role, step });

// Mission
export const trackMissionCreated = (props: {
  hasDeadline: boolean;
  skillsCount: number;
  budgetType: 'fixed' | 'hourly' | 'negotiable';
}) => track('mission_created', props);

export const trackMissionApplied = (props: {
  fromSearch: boolean;
  missionId: string;
}) => track('mission_applied', props);

export const trackApplicationAccepted = (missionId: string) =>
  track('application_accepted', { mission_id: missionId });

export const trackApplicationRejected = (missionId: string) =>
  track('application_rejected', { mission_id: missionId });

// Session / Chat
export const trackSessionStarted = (sessionId: string) =>
  track('session_started', { session_id: sessionId });

export const trackSessionCompleted = (props: {
  sessionId: string;
  durationDays: number;
}) => track('session_completed', {
  session_id: props.sessionId,
  duration_days: props.durationDays,
});

export const trackFileUploaded = (context: 'mission' | 'delivery' | 'chat') =>
  track('file_uploaded', { context });

// Rating
export const trackRatingGiven = (props: {
  score: number;
  role: 'studio' | 'pro';
  sessionId: string;
}) => track('rating_given', props);

// Recherche
export const trackSearchPerformed = (props: {
  query: string;
  resultsCount: number;
  filtersUsed: string[];
}) => track('search_performed', {
  ...props,
  query: props.query.substring(0, 50),
});

// Notifications
export const trackNotificationClicked = (type: string) =>
  track('notification_clicked', { notification_type: type });
