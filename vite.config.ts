import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const usePolling = env.VITE_USE_POLLING === 'true';
    const parsedPollingInterval = Number(env.VITE_POLLING_INTERVAL);
    const pollingInterval = Number.isFinite(parsedPollingInterval) && parsedPollingInterval > 0
      ? parsedPollingInterval
      : 300;
    const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:3001';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        watch: usePolling
          ? {
              usePolling: true,
              interval: pollingInterval,
            }
          : undefined,
        proxy: {
          '/api': {
            target: proxyTarget,
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [tailwindcss(), react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
