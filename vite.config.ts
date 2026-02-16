import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function getEnvVar(name: string): string {
  for (const file of ['.env.local', '.env']) {
    try {
      const content = fs.readFileSync(path.resolve(__dirname, file), 'utf-8');
      const match = content.match(new RegExp(`${name}=(.+)`));
      if (match) return match[1].trim();
    } catch {}
  }
  return '';
}

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      define: {
        '__MAPBOX_TOKEN__': JSON.stringify(getEnvVar('MAPBOX_TOKEN')),
        '__GEMINI_API_KEY__': JSON.stringify(getEnvVar('GEMINI_API_KEY')),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
