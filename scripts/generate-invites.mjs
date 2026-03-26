import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.VITE_APP_URL ?? 'https://studiolink-paris.vercel.app';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Variables requises: VITE_SUPABASE_URL (ou SUPABASE_URL) + SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

function generateCode(prefix) {
  const random = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${random}`;
}

function buildCodes(role, count) {
  const prefix = role === 'studio' ? 'STUDIO' : 'PRO';
  return Array.from({ length: count }, () => generateCode(prefix));
}

async function insertInvitationsRoleSchema(role, codes, maxUses) {
  const payload = codes.map((code) => ({
    code,
    role,
    max_uses: maxUses,
    uses: 0,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('invitations')
    .insert(payload)
    .select();

  if (error) throw error;
  return (data ?? []).map((row) => ({
    code: row.code,
    maxUses: Number(row.max_uses ?? maxUses),
  }));
}

async function insertInvitationsLegacySchema(role, codes, maxUses) {
  const payload = codes.map((code) => ({
    code,
    type: role,
    used: false,
    expires_at: null,
    created_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('invitations')
    .insert(payload)
    .select();

  if (error) throw error;
  return (data ?? []).map((row) => ({
    code: row.code,
    maxUses,
  }));
}

async function generateInvites({ role, count, maxUses = 1 }) {
  const codes = buildCodes(role, count);
  let inserted = [];

  try {
    inserted = await insertInvitationsRoleSchema(role, codes, maxUses);
  } catch {
    inserted = await insertInvitationsLegacySchema(role, codes, maxUses);
  }

  console.log(`\n${count} code(s) ${role} generes:\n`);
  inserted.forEach((invitation) => {
    console.log(`  ${invitation.code}  (max ${invitation.maxUses} usage${invitation.maxUses > 1 ? 's' : ''})`);
  });

  const normalizedAppUrl = appUrl.replace(/\/$/, '');
  console.log('\nURLs d inscription:');
  inserted.forEach((invitation) => {
    console.log(`  ${normalizedAppUrl}/register?code=${invitation.code}`);
  });
}

await generateInvites({ role: 'studio', count: 5, maxUses: 1 });
await generateInvites({ role: 'pro', count: 10, maxUses: 1 });
