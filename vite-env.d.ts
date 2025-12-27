/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL?: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_DISABLE_WEBSOCKET?: string;
  readonly VITE_USE_MOCK?: string; // Ativa modo offline (sem backend)
  readonly DEV?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

