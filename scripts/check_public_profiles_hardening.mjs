import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const repoRoot = process.cwd();

function readEnvFile(filename) {
  const filepath = path.join(repoRoot, filename);
  if (!fs.existsSync(filepath)) return {};
  const content = fs.readFileSync(filepath, 'utf8');
  return Object.fromEntries(
    content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const idx = line.indexOf('=');
        return [line.slice(0, idx), line.slice(idx + 1)];
      }),
  );
}

const env = {
  ...readEnvFile('.env'),
  ...readEnvFile('.env.local'),
  ...process.env,
};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

assert.ok(supabaseUrl, 'VITE_SUPABASE_URL manquante');
assert.ok(supabaseKey, 'VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY manquante');

const forbiddenProfileReaders = [
  'src/pages/MissionDetail.tsx',
  'src/pages/StudioPublicProfile.tsx',
  'src/pages/ProPublicProfile.tsx',
  'src/pages/ConversationList.tsx',
  'src/pages/NotificationsPage.tsx',
  'src/pages/ChatPage.tsx',
  'src/lib/chat/chatService.ts',
  'src/lib/search/searchService.ts',
  'src/services/reviewService.ts',
  'src/pages/ManageApplications.tsx',
];

const forbiddenPatterns = [/from\('profiles'\)/, /profiles!/, /profiles:/];

for (const relativeFile of forbiddenProfileReaders) {
  const absoluteFile = path.join(repoRoot, relativeFile);
  const content = fs.readFileSync(absoluteFile, 'utf8');
  const matched = forbiddenPatterns.find((pattern) => pattern.test(content));
  assert.ok(
    !matched,
    `${relativeFile} utilise encore un accès tiers direct à profiles (${matched})`,
  );
}

const supabase = createClient(supabaseUrl, supabaseKey);
const { data, error, status } = await supabase
  .from('profiles')
  .select('id,email,contact_email,notification_preferences')
  .limit(1);

assert.ok(!error, `Lecture anon profiles a renvoyé une erreur inattendue: ${error?.message ?? 'n/a'}`);
assert.ok(
  (data?.length ?? 0) === 0,
  `Lecture anon profiles fuit encore des colonnes sensibles (status=${status}, rows=${data?.length ?? 0})`,
);

console.log('public_profiles hardening check passed');
