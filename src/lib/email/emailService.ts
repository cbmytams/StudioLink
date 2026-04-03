import { mockEmail } from '@/config/runtimeFlags';
import { mockEmailAdapter, realEmailAdapter } from '@/lib/email/emailAdapter';

type EmailPayload = Record<string, unknown>;
type UserRole = 'studio' | 'pro';

function getAppOrigin() {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return import.meta.env.VITE_APP_URL ?? 'https://studiolink-paris.vercel.app';
}

function buildUrl(path: string) {
  return new URL(path, getAppOrigin()).toString();
}

async function sendEmail(
  type: string,
  to: string,
  data: EmailPayload,
): Promise<void> {
  const adapter = mockEmail ? mockEmailAdapter : realEmailAdapter;
  await adapter.sendEmail(type, to, data);
}

export const emailService = {
  sendApplicationReceived: (params: {
    studioEmail: string;
    proName: string;
    missionTitle: string;
    missionId: string;
    coverLetter?: string;
  }) => sendEmail('application_received', params.studioEmail, {
    ...params,
    missionUrl: buildUrl(`/missions/${params.missionId}/manage`),
  }),

  sendApplicationAccepted: (params: {
    proEmail: string;
    studioName: string;
    missionTitle: string;
    sessionId: string;
  }) => sendEmail('application_accepted', params.proEmail, {
    ...params,
    sessionUrl: buildUrl(`/chat/${params.sessionId}`),
  }),

  sendApplicationRejected: (params: {
    proEmail: string;
    studioName: string;
    missionTitle: string;
  }) => sendEmail('application_rejected', params.proEmail, params),

  sendNewMessage: (params: {
    recipientEmail: string;
    senderName: string;
    missionTitle: string;
    sessionId: string;
    preview: string;
  }) => sendEmail('new_message', params.recipientEmail, {
    ...params,
    sessionUrl: buildUrl(`/chat/${params.sessionId}`),
  }),

  sendSessionCompletedRating: (params: {
    userEmail: string;
    otherPartyName: string;
    missionTitle: string;
    sessionId: string;
  }) => sendEmail('session_completed_rating', params.userEmail, {
    ...params,
    sessionUrl: buildUrl(`/chat/${params.sessionId}`),
  }),

  sendWelcome: (params: {
    email: string;
    firstName: string;
    role: UserRole;
  }) => sendEmail('welcome', params.email, params),
};
