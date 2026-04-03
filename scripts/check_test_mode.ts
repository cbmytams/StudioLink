import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const envLocalPath = path.join(repoRoot, '.env.test.local');
const envDefaultPath = path.join(repoRoot, '.env.test');

const REQUIRED_VALUES: Record<string, string> = {
  VITE_APP_MODE: 'TEST',
  VITE_BYPASS_CAPTCHA: 'true',
  VITE_MOCK_EMAIL: 'true',
  VITE_DISABLE_ANALYTICS: 'true',
  VITE_MOCK_SUPABASE: 'true',
};

function normalize(value: string | undefined): string {
  return (value ?? '').trim();
}

async function loadEnvFile(filePath: string) {
  const raw = await readFile(filePath, 'utf8');
  return dotenv.parse(raw);
}

async function resolveEnvPath() {
  try {
    await access(envLocalPath);
    return envLocalPath;
  } catch {
    return envDefaultPath;
  }
}

async function run() {
  const resolvedPath = await resolveEnvPath();
  let envFromFile: Record<string, string>;
  try {
    envFromFile = await loadEnvFile(resolvedPath);
  } catch (error) {
    console.error(`[check:test-mode] Impossible de lire ${path.relative(repoRoot, resolvedPath)}.`);
    console.error(error);
    process.exitCode = 1;
    return;
  }

  const mergedEnv: Record<string, string> = {
    ...envFromFile,
    ...Object.fromEntries(
      Object.entries(process.env).map(([key, value]) => [key, value ?? '']),
    ),
  };

  const failures: string[] = [];
  for (const [key, expectedValue] of Object.entries(REQUIRED_VALUES)) {
    const actualValue = normalize(mergedEnv[key]).toLowerCase();
    if (actualValue !== expectedValue.toLowerCase()) {
      failures.push(`${key} attendu=${expectedValue} actuel=${normalize(mergedEnv[key]) || '<vide>'}`);
    }
  }

  if (failures.length > 0) {
    console.error('[check:test-mode] Configuration invalide:');
    console.error(`- Source: ${path.relative(repoRoot, resolvedPath)}`);
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log('[check:test-mode] OK');
  console.log(`- Source: ${path.relative(repoRoot, resolvedPath)}`);
  for (const key of Object.keys(REQUIRED_VALUES)) {
    console.log(`- ${key}=${normalize(mergedEnv[key])}`);
  }
}

run().catch((error) => {
  console.error('[check:test-mode] Erreur inattendue:', error);
  process.exitCode = 1;
});
