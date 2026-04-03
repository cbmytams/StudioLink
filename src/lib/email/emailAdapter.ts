import { supabase } from '@/lib/supabase/client';

type EmailPayload = Record<string, unknown>;

export type MockMailboxMessage = {
  id: string;
  type: string;
  to: string;
  data: EmailPayload;
  created_at: string;
};

export type EmailAdapter = {
  sendEmail: (type: string, to: string, data: EmailPayload) => Promise<void>;
};

const MOCK_MAILBOX_STORAGE_KEY = 'studiolink:test-mode:mailbox:v1';

function readMockMailboxInternal(): MockMailboxMessage[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(MOCK_MAILBOX_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MockMailboxMessage[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeMockMailbox(messages: MockMailboxMessage[]) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(MOCK_MAILBOX_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // Ignore localStorage errors in mock mode.
  }
}

export function readMockMailbox(): MockMailboxMessage[] {
  return readMockMailboxInternal();
}

export function clearMockMailbox() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(MOCK_MAILBOX_STORAGE_KEY);
  } catch {
    // Ignore localStorage errors in mock mode.
  }
}

export const realEmailAdapter: EmailAdapter = {
  async sendEmail(type: string, to: string, data: EmailPayload): Promise<void> {
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
  },
};

export const mockEmailAdapter: EmailAdapter = {
  async sendEmail(type: string, to: string, data: EmailPayload): Promise<void> {
    if (!to) return;

    const nextMessage: MockMailboxMessage = {
      id: `mock-mail-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      to,
      data,
      created_at: new Date().toISOString(),
    };
    const currentMailbox = readMockMailboxInternal();
    writeMockMailbox([nextMessage, ...currentMailbox]);
    console.info('[MockEmail] Message capture', {
      type,
      to,
    });
  },
};

