/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE?: string;
  readonly VITE_BYPASS_CAPTCHA?: string;
  readonly VITE_MOCK_EMAIL?: string;
  readonly VITE_DISABLE_ANALYTICS?: string;
  readonly VITE_MOCK_SUPABASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
