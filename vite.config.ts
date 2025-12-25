import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const root = path.resolve('.');
  const env = loadEnv(mode, root, '');
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": root,
      },
    },
    define: {
      'process.env': env
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
          // Rewrite remove o '/api' antes de mandar para o backend
          // Ex: Frontend pede /api/health -> Backend recebe /health
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    }
  };
});