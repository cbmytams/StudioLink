// vite.config.ts
import tailwindcss from "file:///Users/sasha/Downloads/studiolink-paris/node_modules/@tailwindcss/vite/dist/index.mjs";
import react from "file:///Users/sasha/Downloads/studiolink-paris/node_modules/@vitejs/plugin-react/dist/index.js";
import { sentryVitePlugin } from "file:///Users/sasha/Downloads/studiolink-paris/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import path from "path";
import { defineConfig, loadEnv } from "file:///Users/sasha/Downloads/studiolink-paris/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "/Users/sasha/Downloads/studiolink-paris";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  const sentryAuthToken = env.SENTRY_AUTH_TOKEN || process.env.SENTRY_AUTH_TOKEN;
  return {
    plugins: [
      react(),
      tailwindcss(),
      ...sentryAuthToken ? [
        sentryVitePlugin({
          org: "studiolink",
          project: "studiolink-paris",
          authToken: sentryAuthToken
        })
      ] : []
    ],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true"
    },
    build: {
      sourcemap: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes("node_modules")) return void 0;
            if (id.includes("/react-dom/") || id.includes("/react/") || id.includes("/scheduler/")) {
              return "vendor-react";
            }
            if (id.includes("/react-router/") || id.includes("/react-router-dom/") || id.includes("/@remix-run/router/")) {
              return "vendor-router";
            }
            if (id.includes("/@supabase/supabase-js/") || id.includes("/@supabase/auth-js/") || id.includes("/@supabase/functions-js/") || id.includes("/@supabase/postgrest-js/") || id.includes("/@supabase/realtime-js/") || id.includes("/@supabase/storage-js/")) {
              return "vendor-supabase";
            }
            if (id.includes("/posthog-js/")) {
              return "vendor-posthog";
            }
            if (id.includes("/@tanstack/react-query/")) {
              return "vendor-query";
            }
            if (id.includes("/motion/") || id.includes("/framer-motion/") || id.includes("/tailwind-merge/")) {
              return "vendor-ui";
            }
            if (id.includes("/react-helmet-async/")) {
              return "vendor-seo";
            }
            if (id.includes("/@vercel/analytics/") || id.includes("/@vercel/speed-insights/")) {
              return "vendor-vercel";
            }
            return void 0;
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvc2FzaGEvRG93bmxvYWRzL3N0dWRpb2xpbmstcGFyaXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9zYXNoYS9Eb3dubG9hZHMvc3R1ZGlvbGluay1wYXJpcy92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvc2FzaGEvRG93bmxvYWRzL3N0dWRpb2xpbmstcGFyaXMvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnO1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0JztcbmltcG9ydCB7IHNlbnRyeVZpdGVQbHVnaW4gfSBmcm9tICdAc2VudHJ5L3ZpdGUtcGx1Z2luJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHtkZWZpbmVDb25maWcsIGxvYWRFbnZ9IGZyb20gJ3ZpdGUnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHttb2RlfSkgPT4ge1xuICBjb25zdCBlbnYgPSBsb2FkRW52KG1vZGUsICcuJywgJycpO1xuICBjb25zdCBzZW50cnlBdXRoVG9rZW4gPSBlbnYuU0VOVFJZX0FVVEhfVE9LRU4gfHwgcHJvY2Vzcy5lbnYuU0VOVFJZX0FVVEhfVE9LRU47XG5cbiAgcmV0dXJuIHtcbiAgICBwbHVnaW5zOiBbXG4gICAgICByZWFjdCgpLFxuICAgICAgdGFpbHdpbmRjc3MoKSxcbiAgICAgIC4uLihzZW50cnlBdXRoVG9rZW5cbiAgICAgICAgPyBbXG4gICAgICAgICAgc2VudHJ5Vml0ZVBsdWdpbih7XG4gICAgICAgICAgICBvcmc6ICdzdHVkaW9saW5rJyxcbiAgICAgICAgICAgIHByb2plY3Q6ICdzdHVkaW9saW5rLXBhcmlzJyxcbiAgICAgICAgICAgIGF1dGhUb2tlbjogc2VudHJ5QXV0aFRva2VuLFxuICAgICAgICAgIH0pLFxuICAgICAgICBdXG4gICAgICAgIDogW10pLFxuICAgIF0sXG4gICAgZGVmaW5lOiB7XG4gICAgICAncHJvY2Vzcy5lbnYuR0VNSU5JX0FQSV9LRVknOiBKU09OLnN0cmluZ2lmeShlbnYuR0VNSU5JX0FQSV9LRVkpLFxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIC8vIEhNUiBpcyBkaXNhYmxlZCBpbiBBSSBTdHVkaW8gdmlhIERJU0FCTEVfSE1SIGVudiB2YXIuXG4gICAgICAvLyBEbyBub3QgbW9kaWZ5XHUwMEUyXHUwMDgwXHUwMDk0ZmlsZSB3YXRjaGluZyBpcyBkaXNhYmxlZCB0byBwcmV2ZW50IGZsaWNrZXJpbmcgZHVyaW5nIGFnZW50IGVkaXRzLlxuICAgICAgaG1yOiBwcm9jZXNzLmVudi5ESVNBQkxFX0hNUiAhPT0gJ3RydWUnLFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3M6IChpZCkgPT4ge1xuICAgICAgICAgICAgaWYgKCFpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHJldHVybiB1bmRlZmluZWQ7XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9yZWFjdC1kb20vJylcbiAgICAgICAgICAgICAgfHwgaWQuaW5jbHVkZXMoJy9yZWFjdC8nKVxuICAgICAgICAgICAgICB8fCBpZC5pbmNsdWRlcygnL3NjaGVkdWxlci8nKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXJlYWN0JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFxuICAgICAgICAgICAgICBpZC5pbmNsdWRlcygnL3JlYWN0LXJvdXRlci8nKVxuICAgICAgICAgICAgICB8fCBpZC5pbmNsdWRlcygnL3JlYWN0LXJvdXRlci1kb20vJylcbiAgICAgICAgICAgICAgfHwgaWQuaW5jbHVkZXMoJy9AcmVtaXgtcnVuL3JvdXRlci8nKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXJvdXRlcic7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9Ac3VwYWJhc2Uvc3VwYWJhc2UtanMvJylcbiAgICAgICAgICAgICAgfHwgaWQuaW5jbHVkZXMoJy9Ac3VwYWJhc2UvYXV0aC1qcy8nKVxuICAgICAgICAgICAgICB8fCBpZC5pbmNsdWRlcygnL0BzdXBhYmFzZS9mdW5jdGlvbnMtanMvJylcbiAgICAgICAgICAgICAgfHwgaWQuaW5jbHVkZXMoJy9Ac3VwYWJhc2UvcG9zdGdyZXN0LWpzLycpXG4gICAgICAgICAgICAgIHx8IGlkLmluY2x1ZGVzKCcvQHN1cGFiYXNlL3JlYWx0aW1lLWpzLycpXG4gICAgICAgICAgICAgIHx8IGlkLmluY2x1ZGVzKCcvQHN1cGFiYXNlL3N0b3JhZ2UtanMvJylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1zdXBhYmFzZSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3Bvc3Rob2ctanMvJykpIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItcG9zdGhvZyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL0B0YW5zdGFjay9yZWFjdC1xdWVyeS8nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1xdWVyeSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgaWQuaW5jbHVkZXMoJy9tb3Rpb24vJylcbiAgICAgICAgICAgICAgfHwgaWQuaW5jbHVkZXMoJy9mcmFtZXItbW90aW9uLycpXG4gICAgICAgICAgICAgIHx8IGlkLmluY2x1ZGVzKCcvdGFpbHdpbmQtbWVyZ2UvJylcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci11aSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnL3JlYWN0LWhlbG1ldC1hc3luYy8nKSkge1xuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1zZW8nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGlkLmluY2x1ZGVzKCcvQHZlcmNlbC9hbmFseXRpY3MvJylcbiAgICAgICAgICAgICAgfHwgaWQuaW5jbHVkZXMoJy9AdmVyY2VsL3NwZWVkLWluc2lnaHRzLycpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItdmVyY2VsJztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9LFxuICB9O1xufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVTLE9BQU8saUJBQWlCO0FBQy9ULE9BQU8sV0FBVztBQUNsQixTQUFTLHdCQUF3QjtBQUNqQyxPQUFPLFVBQVU7QUFDakIsU0FBUSxjQUFjLGVBQWM7QUFKcEMsSUFBTSxtQ0FBbUM7QUFNekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBQyxLQUFJLE1BQU07QUFDdEMsUUFBTSxNQUFNLFFBQVEsTUFBTSxLQUFLLEVBQUU7QUFDakMsUUFBTSxrQkFBa0IsSUFBSSxxQkFBcUIsUUFBUSxJQUFJO0FBRTdELFNBQU87QUFBQSxJQUNMLFNBQVM7QUFBQSxNQUNQLE1BQU07QUFBQSxNQUNOLFlBQVk7QUFBQSxNQUNaLEdBQUksa0JBQ0E7QUFBQSxRQUNBLGlCQUFpQjtBQUFBLFVBQ2YsS0FBSztBQUFBLFVBQ0wsU0FBUztBQUFBLFVBQ1QsV0FBVztBQUFBLFFBQ2IsQ0FBQztBQUFBLE1BQ0gsSUFDRSxDQUFDO0FBQUEsSUFDUDtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sOEJBQThCLEtBQUssVUFBVSxJQUFJLGNBQWM7QUFBQSxJQUNqRTtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBO0FBQUE7QUFBQSxNQUdOLEtBQUssUUFBUSxJQUFJLGdCQUFnQjtBQUFBLElBQ25DO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsTUFDWCx1QkFBdUI7QUFBQSxNQUN2QixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixjQUFjLENBQUMsT0FBTztBQUNwQixnQkFBSSxDQUFDLEdBQUcsU0FBUyxjQUFjLEVBQUcsUUFBTztBQUV6QyxnQkFDRSxHQUFHLFNBQVMsYUFBYSxLQUN0QixHQUFHLFNBQVMsU0FBUyxLQUNyQixHQUFHLFNBQVMsYUFBYSxHQUM1QjtBQUNBLHFCQUFPO0FBQUEsWUFDVDtBQUVBLGdCQUNFLEdBQUcsU0FBUyxnQkFBZ0IsS0FDekIsR0FBRyxTQUFTLG9CQUFvQixLQUNoQyxHQUFHLFNBQVMscUJBQXFCLEdBQ3BDO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBRUEsZ0JBQ0UsR0FBRyxTQUFTLHlCQUF5QixLQUNsQyxHQUFHLFNBQVMscUJBQXFCLEtBQ2pDLEdBQUcsU0FBUywwQkFBMEIsS0FDdEMsR0FBRyxTQUFTLDBCQUEwQixLQUN0QyxHQUFHLFNBQVMseUJBQXlCLEtBQ3JDLEdBQUcsU0FBUyx3QkFBd0IsR0FDdkM7QUFDQSxxQkFBTztBQUFBLFlBQ1Q7QUFFQSxnQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLHFCQUFPO0FBQUEsWUFDVDtBQUVBLGdCQUFJLEdBQUcsU0FBUyx5QkFBeUIsR0FBRztBQUMxQyxxQkFBTztBQUFBLFlBQ1Q7QUFFQSxnQkFDRSxHQUFHLFNBQVMsVUFBVSxLQUNuQixHQUFHLFNBQVMsaUJBQWlCLEtBQzdCLEdBQUcsU0FBUyxrQkFBa0IsR0FDakM7QUFDQSxxQkFBTztBQUFBLFlBQ1Q7QUFFQSxnQkFBSSxHQUFHLFNBQVMsc0JBQXNCLEdBQUc7QUFDdkMscUJBQU87QUFBQSxZQUNUO0FBRUEsZ0JBQ0UsR0FBRyxTQUFTLHFCQUFxQixLQUM5QixHQUFHLFNBQVMsMEJBQTBCLEdBQ3pDO0FBQ0EscUJBQU87QUFBQSxZQUNUO0FBRUEsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
