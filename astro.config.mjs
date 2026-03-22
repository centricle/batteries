// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://batteries.fyi',
  output: 'static',
  integrations: [sitemap()],
  adapter: netlify(),
  vite: {
    plugins: [tailwindcss()]
  },
  server: {
    port: 7006,
    allowedHosts: true,
  },
});