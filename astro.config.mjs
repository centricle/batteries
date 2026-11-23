// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import { buildRedirects } from './scripts/redirects.mjs';

/** Writes dist/_redirects from the data after every build. */
const redirects = () => ({
  name: 'batteries-redirects',
  hooks: {
    'astro:build:done': ({ dir, logger }) => {
      const n = buildRedirects(process.cwd(), fileURLToPath(dir));
      logger.info(`_redirects: ${n} alias redirects plus legacy paths`);
    },
  },
});

// https://astro.build/config
export default defineConfig({
  // Astro 7 defaults this to 'jsx', which strips the whitespace between a text
  // node and an adjacent element and silently glues words together ("Built
  // byksmith"). `true` restores the v5 behavior byte for byte, at a few
  // percent more HTML before gzip.
  compressHTML: true,
  site: 'https://batteries.fyi',
  output: 'static',
  devToolbar: { enabled: false },
  // 'file' writes aa.html, which Netlify serves at /aa with no redirect. The
  // default 'directory' output makes Netlify 301 every /aa to /aa/, an extra
  // hop on every internal link and on every code redirect.
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [sitemap({ filter: (p) => !p.includes('/api/') }), redirects()],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 7006,
    allowedHosts: true,
  },
});
