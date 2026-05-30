import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname),
  base: '/sanidesk/ui/',
  plugins: [vue()],
  resolve: {
    alias: {
      '@sanibase/ui': resolve(__dirname, '../src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['sanigear.ch', 'www.sanigear.ch', 'dev.sanidesk.ch'],
  },
  css: {
    postcss: resolve(__dirname, 'postcss.config.cjs'),
  },
});
