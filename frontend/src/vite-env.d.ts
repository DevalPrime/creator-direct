/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHIBUYA_WS: string
  readonly VITE_APP_NAME: string
  readonly VITE_BLOCK_TIME_MS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
