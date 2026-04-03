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
    test: {
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/cypress/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,playwright}.config.*',
        'tests/visual/**',
        'tests/mobile-final.spec.ts',
        'tests/test-mode-smoke.spec.ts',
      ],
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) return undefined;

            if (
              id.includes('/react-dom/')
              || id.includes('/react/')
              || id.includes('/scheduler/')
            ) {
              return 'vendor-react';
            }

            if (
              id.includes('/react-router/')
              || id.includes('/react-router-dom/')
              || id.includes('/@remix-run/router/')
            ) {
              return 'vendor-router';
            }

            if (
              id.includes('/@supabase/supabase-js/')
              || id.includes('/@supabase/auth-js/')
              || id.includes('/@supabase/functions-js/')
              || id.includes('/@supabase/postgrest-js/')
              || id.includes('/@supabase/realtime-js/')
              || id.includes('/@supabase/storage-js/')
            ) {
              return 'vendor-supabase';
            }

            if (id.includes('/posthog-js/')) {
              return 'vendor-posthog';
            }

            if (id.includes('/@tanstack/react-query/')) {
              return 'vendor-query';
            }

            if (
              id.includes('/motion/')
              || id.includes('/framer-motion/')
              || id.includes('/tailwind-merge/')
            ) {
              return 'vendor-ui';
            }

            if (id.includes('/react-helmet-async/')) {
              return 'vendor-seo';
            }

            if (
              id.includes('/@vercel/analytics/')
              || id.includes('/@vercel/speed-insights/')
            ) {
              return 'vendor-vercel';
            }

            return undefined;
          },
        },
      },
    },
  };
});
