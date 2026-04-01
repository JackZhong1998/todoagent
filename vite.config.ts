import fs from 'node:fs';
import path from 'path';
import { defineConfig, loadEnv, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { buildSitemapXml } from './content/sitemapBuild';

function todoagentSitemapPlugin(siteOrigin: string) {
  let outRoot = path.resolve(__dirname, 'dist');
  return {
    name: 'todoagent-sitemap',
    configResolved(config: ResolvedConfig) {
      outRoot = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const xml = buildSitemapXml(siteOrigin);
      fs.mkdirSync(outRoot, { recursive: true });
      fs.writeFileSync(path.join(outRoot, 'sitemap.xml'), xml, 'utf8');
    },
  };
}

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const siteOrigin = (env.VITE_SITE_URL || 'https://todoagent.cc').replace(/\/$/, '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), todoagentSitemapPlugin(siteOrigin)],
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
