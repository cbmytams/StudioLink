const TECHNICAL_ERROR_PATTERNS = [
  'relation ',
  'column ',
  'schema ',
  'sqlstate',
  'syntax error',
  'permission denied',
  'failed to fetch',
  'fetch failed',
  'networkerror',
  'jwt',
  'violates row-level security policy',
];

function normalizeErrorMessage(error: unknown): string | null {
  if (typeof error === 'string') {
    return error.trim() || null;
  }
  if (error instanceof Error) {
    return error.message.trim() || null;
  }
  return null;
}

export function toUserFacingErrorMessage(error: unknown, fallback: string): string {
  const message = normalizeErrorMessage(error);
  if (!message) return fallback;

  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Email ou mot de passe incorrect.';
  }

  if (normalized.includes('email not confirmed')) {
    return 'Confirmez votre adresse email avant de vous connecter.';
  }

  if (normalized.includes('user already registered')) {
    return 'Un compte existe déjà avec cette adresse email.';
  }

  if (normalized.includes('password') && normalized.includes('at least')) {
    return 'Le mot de passe ne respecte pas le niveau minimum attendu.';
  }

  if (normalized.includes('fetch failed') || normalized.includes('networkerror')) {
    return 'Connexion impossible. Vérifiez votre connexion et réessayez.';
  }

  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => normalized.includes(pattern))) {
    return fallback;
  }

  return message;
}
