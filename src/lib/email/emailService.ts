import { supabase } from '@/lib/supabase/client';

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
  if (!import.meta.env.VITE_SUPABASE_URL || !supabase || !to) return;

  try {
    const { error } = await supabase.functions.invoke('send-email', {
      body: { type, to, data },
    });

    if (error) {
      console.debug(`[Email] Non envoye (${type}):`, error.message);
    }
  } catch (error) {
    console.debug('[Email] Service indisponible:', error);
  }
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
