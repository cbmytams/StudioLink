export type ChatFileType = 'audio' | 'document' | 'image';

type ChatFileLike = {
  type?: string | null;
  name?: string | null;
};

type ChatMessageRow = {
  id: string;
  session_id: string | null;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name?: string | null;
  file_type?: string | null;
  is_read?: boolean | null;
  read?: boolean | null;
  read_at?: string | null;
  created_at: string;
};

export type NormalizedChatMessage = {
  id: string;
  session_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: ChatFileType | null;
  is_read: boolean;
  created_at: string;
};

export function detectChatFileType(file: ChatFileLike): ChatFileType {
  const mimeType = file.type?.toLowerCase() ?? '';
  const fileName = file.name?.toLowerCase() ?? '';

  if (mimeType.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|webm)$/.test(fileName)) {
    return 'audio';
  }

  if (mimeType.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(fileName)) {
    return 'image';
  }

  return 'document';
}

export function normalizeChatMessageRow(row: ChatMessageRow): NormalizedChatMessage {
  return {
    id: row.id,
    session_id: row.session_id ?? '',
    sender_id: row.sender_id,
    content: row.content ?? null,
    file_url: row.file_url ?? null,
    file_name: row.file_name ?? null,
    file_type: row.file_type === 'audio' || row.file_type === 'document' || row.file_type === 'image'
      ? row.file_type
      : null,
    is_read: row.is_read ?? (Boolean(row.read_at) || Boolean(row.read)),
    created_at: row.created_at,
  };
}
