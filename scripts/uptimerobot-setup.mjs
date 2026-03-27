#!/usr/bin/env node

const API_URL = 'https://api.uptimerobot.com/v2';
const apiKey = process.env.UPTIMEROBOT_API_KEY;

if (!apiKey) {
  console.error('UPTIMEROBOT_API_KEY is required');
  process.exit(1);
}

const monitors = [
  {
    friendly_name: 'StudioLink - Home',
    url: 'https://studiolink-paris.vercel.app',
    interval: 30,
  },
  {
    friendly_name: 'StudioLink - Login',
    url: 'https://studiolink-paris.vercel.app/login',
    interval: 30,
  },
  {
    friendly_name: 'StudioLink - Supabase REST',
    url: 'https://isoshywrmnvxjbnhgcqc.supabase.co/rest/v1/',
    interval: 30,
  },
  {
    friendly_name: 'StudioLink - API Health',
    url: 'https://studiolink-paris.vercel.app/api/health',
    interval: 30,
  },
  {
    friendly_name: 'StudioLink - Health',
    url: 'https://studiolink-paris.vercel.app/health',
    interval: 30,
  },
];

async function formPost(path, body) {
  const response = await fetch(`${API_URL}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });

  if (!response.ok) {
    throw new Error(`${path} failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (payload.stat !== 'ok') {
    throw new Error(`${path} failed: ${payload.error?.message ?? 'unknown error'}`);
  }

  return payload;
}

async function getExistingMonitors() {
  const payload = await formPost('getMonitors', {
    api_key: apiKey,
    format: 'json',
    logs: '0',
  });

  return new Set((payload.monitors ?? []).map((monitor) => monitor.friendly_name));
}

async function createMonitor(config) {
  try {
    await formPost('newMonitor', {
      api_key: apiKey,
      format: 'json',
      type: '1',
      friendly_name: config.friendly_name,
      url: config.url,
      interval: String(config.interval),
    });
    console.log(`created: ${config.friendly_name}`);
    return;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('interval')) {
      await formPost('newMonitor', {
        api_key: apiKey,
        format: 'json',
        type: '1',
        friendly_name: config.friendly_name,
        url: config.url,
        interval: '30',
      });
      console.log(`created (fallback interval 30): ${config.friendly_name}`);
      return;
    }
    throw error;
  }
}

async function main() {
  const existing = await getExistingMonitors();

  for (const monitor of monitors) {
    if (existing.has(monitor.friendly_name)) {
      console.log(`exists: ${monitor.friendly_name}`);
      continue;
    }
    await createMonitor(monitor);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
