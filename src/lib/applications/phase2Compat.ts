import { toUserFacingErrorMessage } from '@/lib/errors/userFacing';

export type CanonicalApplicationStatus = 'pending' | 'accepted' | 'rejected';

type BuildApplicationWritePayloadInput = {
  missionId: string;
  proId: string;
  coverLetter?: string | null;
};

type ApplicationInsertErrorLike = {
  code?: string | null;
  message?: string | null;
};

export function normalizeApplicationStatus(status: string | null | undefined): CanonicalApplicationStatus {
  if (status === 'accepted' || status === 'selected') return 'accepted';
  if (status === 'rejected') return 'rejected';
  return 'pending';
}

export function buildApplicationWritePayload({
  missionId,
  proId,
  coverLetter,
}: BuildApplicationWritePayloadInput) {
  const normalizedCoverLetter = coverLetter?.trim() ?? '';

  return {
    mission_id: missionId,
    pro_id: proId,
    cover_letter: normalizedCoverLetter,
    message: normalizedCoverLetter,
    status: 'pending' as const,
  };
}

export function formatApplicationInsertError(error: ApplicationInsertErrorLike): string {
  if (error.code === '23505') {
    return 'Vous avez déjà candidaté à cette mission.';
  }

  return toUserFacingErrorMessage(error.message, 'Impossible d’envoyer la candidature.');
}
