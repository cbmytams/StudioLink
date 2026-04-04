import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ReminderType = 'rating_reminder';

type ReminderRequest = {
  type?: ReminderType;
};

type ReminderSession = {
  session_id: string;
  studio_email: string | null;
  pro_email: string | null;
  mission_title: string;
  pro_name: string;
  studio_name: string;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
};
const CRON_SECRET_HEADER = 'x-cron-secret';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const cronSecret = Deno.env.get('CRON_SECRET');

  if (!supabaseUrl || !serviceRoleKey || !cronSecret) {
    return json({ error: 'Missing Supabase environment variables' }, 500);
  }

  const providedCronSecret = req.headers.get(CRON_SECRET_HEADER);
  if (!providedCronSecret || providedCronSecret !== cronSecret) {
    return json({ error: 'Forbidden' }, 403);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const payload = await req.json().catch(() => ({ type: 'rating_reminder' } as ReminderRequest));
  const type = payload.type ?? 'rating_reminder';

  if (type !== 'rating_reminder') {
    return json({ error: 'Unknown type' }, 400);
  }

  const { data, error } = await supabase.rpc('get_sessions_needing_rating_reminder');

  if (error) {
    return json({ error: error.message }, 500);
  }

  const sessions = (data ?? []) as ReminderSession[];

  let processed = 0;
  let skipped = 0;
  const failures: Array<{ sessionId: string; reason: string }> = [];

  for (const session of sessions) {
    const recipients = [
      {
        to: session.studio_email,
        otherPartyName: session.pro_name,
      },
      {
        to: session.pro_email,
        otherPartyName: session.studio_name,
      },
    ];

    try {
      for (const recipient of recipients) {
        if (!recipient.to) {
          skipped += 1;
          continue;
        }

        const { error: sendError } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'session_completed_rating',
            to: recipient.to,
            data: {
              otherPartyName: recipient.otherPartyName,
              missionTitle: session.mission_title,
              sessionId: session.session_id,
            },
          },
        });

        if (sendError) {
          throw new Error(sendError.message);
        }
      }

      const { error: markError } = await supabase
        .from('sessions')
        .update({ rating_reminder_sent_at: new Date().toISOString() })
        .eq('id', session.session_id);

      if (markError) {
        throw new Error(markError.message);
      }

      processed += 1;
    } catch (sessionError) {
      failures.push({
        sessionId: session.session_id,
        reason: sessionError instanceof Error ? sessionError.message : String(sessionError),
      });
    }
  }

  return json({
    processed,
    skipped,
    failed: failures.length,
    failures,
  });
});
