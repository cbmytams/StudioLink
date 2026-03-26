/**
 * Setup UptimeRobot monitors for StudioLink Paris
 *
 * Usage:
 *   UPTIMEROBOT_API_KEY=your_key npm run uptimerobot:setup
 */

const API_KEY = process.env.UPTIMEROBOT_API_KEY;

if (!API_KEY) {
  console.error('❌ UPTIMEROBOT_API_KEY is required.');
  console.error('Usage: UPTIMEROBOT_API_KEY=your_key npm run uptimerobot:setup');
  process.exit(1);
}

const BASE = 'https://api.uptimerobot.com/v2';

const monitors = [
  {
    friendly_name: 'StudioLink — Homepage',
    url: 'https://studiolink-paris.vercel.app',
    type: 1,
    interval: 300,
  },
  {
    friendly_name: 'StudioLink — API Health',
    url: 'https://studiolink-paris.vercel.app/api/health',
    type: 1,
    interval: 60,
  },
  {
    friendly_name: 'StudioLink — App Health',
    url: 'https://studiolink-paris.vercel.app/health',
    type: 1,
    interval: 300,
  },
  {
    friendly_name: 'StudioLink — Login page',
    url: 'https://studiolink-paris.vercel.app/login',
    type: 1,
    interval: 300,
  },
  {
    friendly_name: 'Supabase — REST API',
    url: 'https://isoshywrmnvxjbnhgcqc.supabase.co/rest/v1/',
    type: 1,
    interval: 300,
  },
];

async function createMonitor(monitor) {
  const res = await fetch(`${BASE}/newMonitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      api_key: API_KEY,
      format: 'json',
      friendly_name: monitor.friendly_name,
      url: monitor.url,
      type: String(monitor.type),
      interval: String(monitor.interval),
    }),
  });
  const data = await res.json();
  if (data.stat === 'ok') {
    console.log(`✅ ${monitor.friendly_name} — created (id: ${data.monitor.id})`);
  } else {
    console.error(`❌ ${monitor.friendly_name} — ${data.error?.message || JSON.stringify(data)}`);
  }
}

console.log(`Creating ${monitors.length} monitors...\n`);

for (const monitor of monitors) {
  await createMonitor(monitor);
}

console.log('\n✅ Done.');
