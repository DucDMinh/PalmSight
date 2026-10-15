import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, '');
  const proxyTarget = env.API_PROXY_TARGET || process.env.API_PROXY_TARGET || 'http://localhost:4000';
  const rawAllowedHosts = env.DEV_ALLOWED_HOSTS || process.env.DEV_ALLOWED_HOSTS || '';
  const allowedHosts = rawAllowedHosts
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(import.meta.dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api/v1': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
      ...(allowedHosts.length > 0 ? { allowedHosts } : {}),
    },
  };
});
