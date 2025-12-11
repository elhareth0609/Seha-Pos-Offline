// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    host: 'localhost',
  },
  base: './',
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['electron', 'fs', 'path', 'url', 'mkdirp', 'axios', 'extract-zip', 'tar'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
