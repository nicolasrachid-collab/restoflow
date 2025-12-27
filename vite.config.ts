import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const root = path.resolve('.');
  const env = loadEnv(mode, root, '');
  
  // Proxy só é configurado se VITE_USE_SERVER=true (modo servidor)
  const useServer = env.VITE_USE_SERVER === 'true' || env.VITE_USE_SERVER === 'True' || env.VITE_USE_SERVER === 'TRUE';
  
  const serverConfig: any = {
    port: 5173,
    host: true, // Permite acesso via localhost e IP da rede
    // O Vite já tem suporte nativo para SPA routing, não precisa de historyApiFallback
  };
  
  // Só adiciona proxy se estiver usando servidor
  if (useServer) {
    serverConfig.proxy = {
      '/api': {
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false,
        // Rewrite remove o '/api' antes de mandar para o backend
        // Ex: Frontend pede /api/health -> Backend recebe /health
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    };
  }
  
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
    server: serverConfig,
  };
});