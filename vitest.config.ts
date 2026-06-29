import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      react: resolve(__dirname, '../node_modules/react'),
      'react-dom': resolve(__dirname, '../node_modules/react-dom'),
      '@': resolve(__dirname, './src'),
      '@assets': resolve(__dirname, './assets'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
