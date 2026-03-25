/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** WebSocket server origin (e.g. https://game-api.example.com). Empty = same as page origin. */
  readonly VITE_GAME_SERVER_URL?: string;
  /** Public base path for assets (set in vite.config via VITE_BASE_URL). */
  readonly BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
