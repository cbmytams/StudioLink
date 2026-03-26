import type { NotificationType } from '@/types/backend';

type NotificationTargetInput = {
  type: NotificationType | string;
  data?: Record<string, unknown> | null;
  link?: string | null;
};

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function getNotificationTarget(input: NotificationTargetInput): string {
  const data = input.data ?? {};
  const sessionId = readString(data.sessionId);
  const missionId = readString(data.missionId);
  const explicitLink = readString(data.link) ?? readString(input.link);

  if (sessionId && (
    input.type === 'application_accepted'
    || input.type === 'new_message'
    || input.type === 'delivery_uploaded'
    || input.type === 'session_completed'
    || input.type === 'new_rating'
  )) {
    return `/chat/${sessionId}`;
  }

  if (missionId && input.type === 'new_application') {
    return `/studio/missions/${missionId}/applications`;
  }

  if (missionId && (
    input.type === 'application_rejected'
    || input.type === 'application_selected'
  )) {
    return `/missions/${missionId}`;
  }

  if (explicitLink) {
    return explicitLink;
  }

  return '/notifications';
}
