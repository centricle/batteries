import type { APIRoute } from 'astro';
import { batteries, CATEGORY_META, summary, stats, devices, deviceAnswer, DEVICE_CATEGORY_META, DEVICE_CATEGORY_ORDER } from '../lib/data';

// A plain-text map of the site for language models and answer engines
// (https://llmstxt.org). Every line is generated from the same data as the pages.
export const GET: APIRoute = () => {
  const s = stats();
  const site = 'https://batteries.fyi';
  const out: string[] = [
    '# batteries.fyi',
    '',
    `> Look up any of ${s.batteries} consumer battery sizes by the name printed on it or the device it goes in: its size, kinds, voltages, capacities, ${s.codes.toLocaleString('en-US')} other names in all, what else fits, and a 3D model of each. Every value cites a maker's datasheet or a published standard. MIT licensed.`,
    '',
    'Each battery has one page at a flat address named for its common designation (/aa, /cr2032, /18650). Any other code for the same size (/lr6, /mn1500, /377) redirects to that page.',
    '',
    '## Data',
    '',
    `- [Full dataset (JSON)](${site}/api/batteries.json): every battery and chemistry with sources`,
    `- [Dataset (CSV)](${site}/api/batteries.csv): one row per chemistry variant`,
    `- [Code cross-reference (JSON)](${site}/api/codes.json): every code mapped to its battery`,
    `- [One battery (JSON)](${site}/api/batteries/cr2032.json): /api/batteries/{id}.json`,
    `- [Devices (JSON)](${site}/api/devices.json): which battery each device takes, with the maker's own sentence quoted`,
    `- [Sources](${site}/sources): every datasheet and standard cited`,
    '',
    '## Reference',
    '',
    `- [Other names for every battery](${site}/equivalents): every name for every size`,
    `- [Kinds of battery](${site}/chemistry)`,
    `- [Guides](${site}/reference): swallowed batteries, leaks, flying, disposal, storage, battery names`,
    `- [Glossary](${site}/glossary)`,
    '',
  ];
  for (const c of CATEGORY_META) {
    const list = batteries().filter((b) => b.category === c.id);
    if (!list.length) continue;
    out.push(`## ${c.name}`, '');
    for (const b of list) out.push(`- [${b.name}](${site}/${b.id}): ${summary(b)}`);
    out.push('');
  }
  out.push('## Devices: which battery it takes', '', 'Each answer quotes the device maker (owner\'s manual, support page or spec sheet).', '');
  for (const c of DEVICE_CATEGORY_ORDER) {
    const list = devices().filter((d) => d.category === c);
    if (!list.length) continue;
    out.push(`### ${DEVICE_CATEGORY_META[c].name}`, '');
    for (const d of list) out.push(`- [${deviceAnswer(d).replace(/^The /, '').replace(/ takes .*/, '')}](${site}/devices/${d.id}): ${deviceAnswer(d)}`);
    out.push('');
  }
  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
