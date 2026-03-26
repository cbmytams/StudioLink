import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(sentryAuthToken
        ? [
          sentryVitePlugin({
            org: 'studiolink',
            project: 'studiolink-paris',
            authToken: sentryAuthToken,
          }),
        ]
        : []),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-query': ['@tanstack/react-query'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-ui': ['motion'],
          },
        },
      },
    },
  };
});
