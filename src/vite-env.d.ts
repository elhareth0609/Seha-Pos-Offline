/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron types
interface Window {
  process?: {
    type: string;
  };
}

declare global {
  interface Window {
    electron: any;
    appVersion: any;
  }
}