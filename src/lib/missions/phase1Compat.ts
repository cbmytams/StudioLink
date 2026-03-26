export type MissionStatusValue = string | null;

export type MissionWriteInput = {
  studioId: string
  title: string
  description: string
  category: string
  location: string
  city: string
  date: string
  endDate: string
  dailyRate: string
  skillsRequired: string[]
  status: MissionStatusValue
};

export function normalizeMissionStatus(status: MissionStatusValue): 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' {
  if (status === 'draft') return 'draft';
  if (status === 'open' || status === 'published') return 'open';
  if (status === 'in_progress' || status === 'filled') return 'in_progress';
  if (status === 'completed' || status === 'rated') return 'completed';
  if (status === 'cancelled' || status === 'closed' || status === 'expired') return 'cancelled';
  return 'draft';
}

export function countApplicationRows(
  rows: Array<{ count: number | null }> | { count: number | null } | null | undefined,
): number {
  if (Array.isArray(rows)) {
    return rows[0]?.count ?? 0;
  }
  return rows?.count ?? 0;
}

export function buildMissionWritePayload(input: MissionWriteInput) {
  const title = input.title.trim();
  const description = input.description.trim();
  const category = input.category.trim() || 'Autre';
  const location = input.location.trim();
  const city = input.city.trim() || location;
  const normalizedStatus = normalizeMissionStatus(input.status);
  const rawDailyRate = Number.parseInt(input.dailyRate, 10);
  const dailyRate = Number.isFinite(rawDailyRate) ? rawDailyRate : null;

  return {
    studio_id: input.studioId,
    title,
    description,
    category,
    location,
    city,
    date: input.date || null,
    end_date: input.endDate || null,
    daily_rate: dailyRate,
    skills_required: input.skillsRequired,
    status: normalizedStatus,
    service_type: category,
    genres: input.skillsRequired,
    price: dailyRate !== null ? `${dailyRate} €/j` : null,
  };
}
