import { defineConfig } from 'vite';

// Served from https://<user>.github.io/gel-view/ on GitHub Pages.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 4000,
  },
});
