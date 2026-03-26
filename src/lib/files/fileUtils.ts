import type { ChatFileType, MissionFileType } from '@/types/backend';

type FileLike = {
  size: number;
  type?: string | null;
  name?: string | null;
};

type ValidationOptions = {
  accept: string;
  maxSizeMb: number;
};

type ValidationResult =
  | { ok: true; error?: undefined }
  | { ok: false; error: string };

const AUDIO_EXTENSIONS = /\.(mp3|wav|x-wav|m4a|aac|ogg|flac|aif|aiff|webm)$/i;
const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg)$/i;

function sanitizeFileName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function matchesAcceptToken(file: FileLike, token: string): boolean {
  const normalizedToken = token.trim().toLowerCase();
  const mimeType = file.type?.toLowerCase() ?? '';
  const fileName = file.name?.toLowerCase() ?? '';

  if (!normalizedToken) return true;
  if (normalizedToken.startsWith('.')) {
    return fileName.endsWith(normalizedToken);
  }
  if (normalizedToken.endsWith('/*')) {
    return mimeType.startsWith(normalizedToken.slice(0, -1));
  }
  return mimeType === normalizedToken;
}

export function classifyMissionAsset(file: Pick<FileLike, 'type' | 'name'>): ChatFileType {
  const mimeType = file.type?.toLowerCase() ?? '';
  const fileName = file.name?.toLowerCase() ?? '';

  if (mimeType.startsWith('audio/') || AUDIO_EXTENSIONS.test(fileName)) {
    return 'audio';
  }

  if (mimeType.startsWith('image/') || IMAGE_EXTENSIONS.test(fileName)) {
    return 'image';
  }

  return 'document';
}

export function buildScopedStoragePath(scopeId: string, fileName: string, uniqueId: string): string {
  const safeName = sanitizeFileName(fileName || 'fichier');
  return `${scopeId}/${uniqueId}-${safeName}`;
}

export function getBucketFromMissionFileType(fileType: MissionFileType): 'mission-files' | 'delivery-files' {
  return fileType === 'reference' ? 'mission-files' : 'delivery-files';
}

export function validateStorageFile(file: FileLike, options: ValidationOptions): ValidationResult {
  const maxBytes = options.maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { ok: false, error: `Fichier trop lourd (max ${options.maxSizeMb} Mo).` };
  }

  const tokens = options.accept.split(',').map((token) => token.trim()).filter(Boolean);
  if (tokens.length > 0 && !tokens.some((token) => matchesAcceptToken(file, token))) {
    return { ok: false, error: 'Ce format de fichier n’est pas autorisé.' };
  }

  return { ok: true };
}

export function formatFileSize(size: number | null | undefined): string {
  if (!size || size < 1024) {
    return `${size ?? 0} o`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Ko`;
  }
  return `${(size / (1024 * 1024)).toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Mo`;
}
