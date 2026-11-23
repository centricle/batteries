// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
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

/**
 * lastmod for battery and device pages, from the dates in their data files.
 * Bing (whose index ChatGPT search draws on) uses lastmod to schedule recrawls.
 */
const lastmod = (() => {
  const m = new Map();
  const read = (dir, key, prefix) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const j = JSON.parse(fs.readFileSync(`${dir}/${f}`, 'utf8'));
      const d = key(j);
      if (d) m.set(`${prefix}${j.id}`, d);
    }
  };
  read('data/batteries', (j) => j.updated, '/');
  read('data/devices', (j) => j.source?.accessed, '/devices/');
  return m;
})();

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
  integrations: [
    sitemap({
      filter: (p) => !p.includes('/api/'),
      serialize: (item) => {
        const d = lastmod.get(new URL(item.url).pathname.replace(/\/$/, ''));
        return d ? { ...item, lastmod: d } : item;
      },
    }),
    redirects(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    port: 7006,
    allowedHosts: true,
  },
});
