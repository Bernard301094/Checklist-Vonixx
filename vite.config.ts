import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const appsScriptUrl = env.VITE_APPS_SCRIPT_URL || '';

  // Extract base URL for proxy (everything before /exec)
  let appsScriptBase = '';
  let appsScriptPath = '';
  try {
    if (appsScriptUrl) {
      const u = new URL(appsScriptUrl);
      appsScriptBase = `${u.protocol}//${u.host}`;
      appsScriptPath = u.pathname;
    }
  } catch (_) {}

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: appsScriptBase
        ? {
            '/apps-script-proxy': {
              target: appsScriptBase,
              changeOrigin: true,
              rewrite: () => appsScriptPath,
              secure: true,
            },
          }
        : {},
    },
  };
});
