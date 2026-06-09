import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@docs': resolve(__dirname, '../docs'),
    },
  },
  // Serve legacy vanilla JS scripts (speed-reading.js, scripture.js) from docs/
  publicDir: resolve(__dirname, '../docs'),
  server: {
    fs: {
      // Allow imports from the whole memoryforge repo (../../docs/styles.css, ../../../../src/*)
      allow: [resolve(__dirname, '..')],
    },
  },
});
