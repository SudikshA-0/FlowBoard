import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // For GitHub Pages project sites, set VITE_BASE_PATH to '/<repo-name>/' in CI.
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api':      { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io':{ target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
});
