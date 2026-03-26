export type StudioRecentMission = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  application_count: number;
  session_id: string | null;
};

export type ProRecentApplication = {
  id: string;
  status: string;
  created_at: string;
  mission_id: string;
  mission_title: string;
  budget: number | null;
  session_id: string | null;
};

export type StudioDashboard = {
  total_missions: number;
  published_missions: number;
  closed_missions: number;
  total_applications: number;
  pending_applications: number;
  active_sessions: number;
  completed_sessions: number;
  total_spent: number;
  rating_avg: number | null;
  rating_count: number;
  recent_missions: StudioRecentMission[];
};

export type ProDashboard = {
  total_applications: number;
  pending_applications: number;
  accepted_applications: number;
  rejected_applications: number;
  active_sessions: number;
  completed_sessions: number;
  total_earned: number;
  rating_avg: number | null;
  rating_count: number;
  success_rate: number;
  recent_applications: ProRecentApplication[];
};

export type TimeSeriesPoint = { day: string; count: number };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return toNumber(value, 0);
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function normalizeStudioRecentMission(value: unknown): StudioRecentMission | null {
  if (!isRecord(value)) return null;

  return {
    id: toStringValue(value.id),
    title: toStringValue(value.title, 'Mission'),
    status: toStringValue(value.status, 'open'),
    created_at: toStringValue(value.created_at),
    application_count: toNumber(value.application_count),
    session_id: typeof value.session_id === 'string' ? value.session_id : null,
  };
}

function normalizeProRecentApplication(value: unknown): ProRecentApplication | null {
  if (!isRecord(value)) return null;

  return {
    id: toStringValue(value.id),
    status: toStringValue(value.status, 'pending'),
    created_at: toStringValue(value.created_at),
    mission_id: toStringValue(value.mission_id),
    mission_title: toStringValue(value.mission_title, 'Mission'),
    budget: toNullableNumber(value.budget),
    session_id: typeof value.session_id === 'string' ? value.session_id : null,
  };
}

export function normalizeStudioDashboard(value: unknown): StudioDashboard {
  const record = isRecord(value) ? value : {};
  return {
    total_missions: toNumber(record.total_missions),
    published_missions: toNumber(record.published_missions),
    closed_missions: toNumber(record.closed_missions),
    total_applications: toNumber(record.total_applications),
    pending_applications: toNumber(record.pending_applications),
    active_sessions: toNumber(record.active_sessions),
    completed_sessions: toNumber(record.completed_sessions),
    total_spent: toNumber(record.total_spent),
    rating_avg: toNullableNumber(record.rating_avg),
    rating_count: toNumber(record.rating_count),
    recent_missions: Array.isArray(record.recent_missions)
      ? record.recent_missions
          .map(normalizeStudioRecentMission)
          .filter((item): item is StudioRecentMission => Boolean(item?.id))
      : [],
  };
}

export function normalizeProDashboard(value: unknown): ProDashboard {
  const record = isRecord(value) ? value : {};
  return {
    total_applications: toNumber(record.total_applications),
    pending_applications: toNumber(record.pending_applications),
    accepted_applications: toNumber(record.accepted_applications),
    rejected_applications: toNumber(record.rejected_applications),
    active_sessions: toNumber(record.active_sessions),
    completed_sessions: toNumber(record.completed_sessions),
    total_earned: toNumber(record.total_earned),
    rating_avg: toNullableNumber(record.rating_avg),
    rating_count: toNumber(record.rating_count),
    success_rate: toNumber(record.success_rate),
    recent_applications: Array.isArray(record.recent_applications)
      ? record.recent_applications
          .map(normalizeProRecentApplication)
          .filter((item): item is ProRecentApplication => Boolean(item?.id))
      : [],
  };
}

function isoDay(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

function toUtcDate(day: string): Date {
  return new Date(`${day}T00:00:00.000Z`);
}

export function fillLastNDays(
  points: Array<{ day: string; count: number }>,
  days = 30,
  now = new Date(),
): TimeSeriesPoint[] {
  const normalized = new Map(
    points
      .filter((point) => point.day)
      .map((point) => [point.day, toNumber(point.count)]),
  );

  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const result: TimeSeriesPoint[] = [];

  for (let index = days - 1; index >= 0; index -= 1) {
    const cursor = new Date(end);
    cursor.setUTCDate(end.getUTCDate() - index);
    const day = isoDay(cursor);
    result.push({
      day,
      count: normalized.get(day) ?? 0,
    });
  }

  return result;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortDate(value: string): string {
  const date = toUtcDate(value.slice(0, 10));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
  }).format(date);
}

export function formatLongDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date inconnue';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function ratingStars(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return '☆☆☆☆☆';
  }

  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return `${'★'.repeat(rounded)}${'☆'.repeat(5 - rounded)}`;
}
