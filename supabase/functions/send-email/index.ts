import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3';

type EmailData = Record<string, unknown>;
type EmailType =
  | 'application_received'
  | 'application_accepted'
  | 'application_rejected'
  | 'new_message'
  | 'session_completed_rating'
  | 'welcome';

interface EmailPayload {
  type: EmailType;
  to: string;
  data: EmailData;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

type RateLimitRow = {
  id: number;
  count: number;
};

const DEFAULT_ALLOWED_ORIGINS = [
  'https://studiolink.fr',
  'https://www.studiolink.fr',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

const RATE_LIMIT_ACTION = 'send_email';
const RATE_LIMIT_MAX_PER_HOUR = 10;

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resendDomain = Deno.env.get('RESEND_DOMAIN') ?? 'studiolink-paris.fr';
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const FROM = `StudioLink <noreply@${resendDomain}>`;
const isDev = Deno.env.get('ENVIRONMENT') === 'development' || !resendApiKey;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function configuredOrigins(): string[] {
  const raw = Deno.env.get('ALLOWED_ORIGIN') ?? '';
  const envOrigins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins])];
}

function resolveCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigins = configuredOrigins();
  const allowedOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  };
}

function json(origin: string | null, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...resolveCorsHeaders(origin),
      'Content-Type': 'application/json',
    },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function str(data: EmailData, key: string, fallback = '') {
  const value = data[key];
  if (typeof value === 'string' && value.trim().length > 0) {
    return escapeHtml(value.trim());
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return escapeHtml(value);
  }
  return escapeHtml(fallback);
}

function hourWindowIso(date = new Date()): string {
  const windowDate = new Date(date);
  windowDate.setMinutes(0, 0, 0);
  return windowDate.toISOString();
}

async function enforceRateLimit(userId: string) {
  const windowStart = hourWindowIso();

  const { data: existing, error: existingError } = await supabaseAdmin
    .from('rate_limits')
    .select('id, count')
    .eq('user_id', userId)
    .eq('action', RATE_LIMIT_ACTION)
    .eq('window_start', windowStart)
    .maybeSingle<RateLimitRow>();

  if (existingError) {
    throw existingError;
  }

  if (!existing) {
    const { error: insertError } = await supabaseAdmin
      .from('rate_limits')
      .insert({
        user_id: userId,
        action: RATE_LIMIT_ACTION,
        window_start: windowStart,
        count: 1,
      });

    if (insertError) {
      throw insertError;
    }

    return { allowed: true } as const;
  }

  if (existing.count >= RATE_LIMIT_MAX_PER_HOUR) {
    return { allowed: false } as const;
  }

  const { error: updateError } = await supabaseAdmin
    .from('rate_limits')
    .update({
      count: existing.count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateError) {
    throw updateError;
  }

  return { allowed: true } as const;
}

const templates: Record<EmailType, (data: EmailData) => EmailTemplate> = {
  application_received: (data) => ({
    subject: `${str(data, 'proName', 'Un professionnel')} a postule a "${str(data, 'missionTitle', 'votre mission')}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Nouvelle candidature recue</h2>
        <p><strong>${str(data, 'proName', 'Un professionnel')}</strong> a postule a votre mission
        <strong>"${str(data, 'missionTitle', 'Mission StudioLink')}"</strong>.</p>
        <p>Message : ${str(data, 'coverLetter', 'Aucun message')}</p>
        <a href="${str(data, 'missionUrl', 'https://studiolink-paris.vercel.app')}"
           style="background: #000; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px;
                  display: inline-block; margin-top: 16px;">
          Voir la candidature
        </a>
        <p style="color: #666; font-size: 12px; margin-top: 32px;">
          StudioLink Paris —
          <a href="https://studiolink-paris.vercel.app/legal/privacy">
            Confidentialite
          </a>
        </p>
      </div>
    `,
  }),

  application_accepted: (data) => ({
    subject: 'Votre candidature a ete acceptee',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bonne nouvelle !</h2>
        <p><strong>${str(data, 'studioName', 'Le studio')}</strong> a accepte votre candidature
        pour <strong>"${str(data, 'missionTitle', 'Mission StudioLink')}"</strong>.</p>
        <p>Vous pouvez maintenant acceder a la session et demarrer la collaboration.</p>
        <a href="${str(data, 'sessionUrl', 'https://studiolink-paris.vercel.app')}"
           style="background: #000; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px;
                  display: inline-block; margin-top: 16px;">
          Acceder a la session
        </a>
      </div>
    `,
  }),

  application_rejected: (data) => ({
    subject: 'Retour sur votre candidature',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Votre candidature n'a pas ete retenue</h2>
        <p>${str(data, 'studioName', 'Le studio')} n'a pas retenu votre candidature
        pour <strong>"${str(data, 'missionTitle', 'Mission StudioLink')}"</strong>.</p>
        <p>Ne vous decouragez pas — d'autres missions vous attendent.</p>
        <a href="https://studiolink-paris.vercel.app/missions"
           style="background: #000; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px;
                  display: inline-block; margin-top: 16px;">
          Voir les missions disponibles
        </a>
      </div>
    `,
  }),

  new_message: (data) => ({
    subject: `Nouveau message de ${str(data, 'senderName', 'StudioLink')}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Vous avez un nouveau message</h2>
        <p><strong>${str(data, 'senderName', 'Quelqu’un')}</strong> vous a envoye un message
        dans la session <strong>"${str(data, 'missionTitle', 'Mission StudioLink')}"</strong>.</p>
        <p style="background: #f5f5f5; padding: 12px; border-radius: 6px;
                  font-style: italic;">
          "${str(data, 'preview', '').substring(0, 150)}..."
        </p>
        <a href="${str(data, 'sessionUrl', 'https://studiolink-paris.vercel.app')}"
           style="background: #000; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px;
                  display: inline-block; margin-top: 16px;">
          Repondre
        </a>
      </div>
    `,
  }),

  session_completed_rating: (data) => ({
    subject: `N'oubliez pas de noter ${str(data, 'otherPartyName', 'votre partenaire')}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>La session est terminee</h2>
        <p>Votre session <strong>"${str(data, 'missionTitle', 'Mission StudioLink')}"</strong>
        est terminee. Prenez 2 minutes pour noter
        <strong>${str(data, 'otherPartyName', 'votre partenaire')}</strong>.</p>
        <p>Votre avis aide la communaute StudioLink.</p>
        <a href="${str(data, 'sessionUrl', 'https://studiolink-paris.vercel.app')}"
           style="background: #000; color: #fff; padding: 12px 24px;
                  text-decoration: none; border-radius: 6px;
                  display: inline-block; margin-top: 16px;">
          Laisser un avis
        </a>
      </div>
    `,
  }),

  welcome: (data) => ({
    subject: `Bienvenue sur StudioLink, ${str(data, 'firstName', 'a toi')}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue sur StudioLink !</h2>
        <p>Votre compte a ete cree avec succes.</p>
        ${String(data.role) === 'studio' ? `
          <p>En tant que <strong>Studio</strong>, vous pouvez maintenant
          creer vos premieres missions et trouver les talents creatifs
          dont vous avez besoin.</p>
          <a href="https://studiolink-paris.vercel.app/missions/new"
             style="background: #000; color: #fff; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px;
                    display: inline-block; margin-top: 16px;">
            Creer ma premiere mission
          </a>
        ` : `
          <p>En tant que <strong>Professionnel</strong>, vous pouvez
          maintenant explorer les missions et postuler.</p>
          <a href="https://studiolink-paris.vercel.app/missions"
             style="background: #000; color: #fff; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px;
                    display: inline-block; margin-top: 16px;">
            Explorer les missions
          </a>
        `}
      </div>
    `,
  }),
};

const ALLOWED_EMAIL_TYPES = new Set<EmailType>([
  'application_received',
  'application_accepted',
  'application_rejected',
  'new_message',
  'session_completed_rating',
  'welcome',
]);

serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: resolveCorsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return json(origin, { error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json(origin, { error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return json(origin, { error: 'Unauthorized' }, 401);
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    const user = authData.user;

    if (authError || !user) {
      return json(origin, { error: 'Unauthorized' }, 401);
    }

    const rateLimit = await enforceRateLimit(user.id);
    if (!rateLimit.allowed) {
      return json(origin, { error: 'Too many requests' }, 429);
    }

    const payload = await req.json() as Partial<EmailPayload>;

    if (!payload.type || !ALLOWED_EMAIL_TYPES.has(payload.type as EmailType)) {
      return json(origin, { error: `Unknown template: ${String(payload.type)}` }, 400);
    }

    if (typeof payload.to !== 'string' || payload.to.trim().length === 0) {
      return json(origin, { error: 'Missing recipient' }, 400);
    }

    const emailType = payload.type as EmailType;
    const template = templates[emailType];
    const { subject, html } = template((payload.data ?? {}) as EmailData);

    if (isDev) {
      console.log('DEV EMAIL', JSON.stringify({
        userId: user.id,
        to: payload.to,
        subject,
        type: emailType,
        data: payload.data ?? {},
      }, null, 2));

      return json(origin, {
        id: `dev-mock-${Date.now()}`,
        dev: true,
        message: 'Email logged (dev mode - no Resend key)',
      });
    }

    const resend = new Resend(resendApiKey);
    const result = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject,
      html,
    });

    return json(origin, result, 200);
  } catch (error) {
    return json(origin, { error: String(error) }, 500);
  }
});
