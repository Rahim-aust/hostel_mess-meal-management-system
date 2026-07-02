import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  // Local dev => /
  // Production build => GitHub Pages repo path
  base:
    command === 'serve'
      ? '/'
      : '/hostel_mess-meal-management-system/',

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));