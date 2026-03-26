import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { Resend } from 'npm:resend@3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type EmailData = Record<string, unknown>;

interface EmailPayload {
  type: string;
  to: string;
  data: EmailData;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resendDomain = Deno.env.get('RESEND_DOMAIN') ?? 'studiolink-paris.fr';
const FROM = `StudioLink <noreply@${resendDomain}>`;

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

const templates: Record<string, (data: EmailData) => EmailTemplate> = {
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!resendApiKey) {
    return new Response(
      JSON.stringify({ error: 'RESEND_API_KEY is not configured' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }

  const resend = new Resend(resendApiKey);

  try {
    const payload = await req.json() as EmailPayload;
    const template = templates[payload.type];

    if (!template) {
      return new Response(
        JSON.stringify({ error: `Unknown template: ${payload.type}` }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { subject, html } = template(payload.data ?? {});
    const result = await resend.emails.send({
      from: FROM,
      to: payload.to,
      subject,
      html,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
