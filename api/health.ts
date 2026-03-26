export const config = {
  runtime: 'edge',
};

export default function handler() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION ?? process.env.npm_package_version ?? 'unknown',
  });
}
