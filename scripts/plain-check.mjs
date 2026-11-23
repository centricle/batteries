#!/usr/bin/env node
// Asserts for src/lib/plain.ts, the plain-language helpers behind the top of
// every battery page. Run by scripts/validate.mjs with Node's type stripping:
//   node --experimental-strip-types scripts/plain-check.mjs
// Exits 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { batterySchema } from '../src/lib/schema.mjs';
import {
  art, inFrac, coinCompare, plainSize, plainSummary, generatedSummary, longDate, byCommon, list, plainRechargeable, COMMON,
  voltageLines, plainWeight, otherNames, plainVoltsShort, nicknames, tileFacts,
} from '../src/lib/plain.ts';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
let failures = 0;
const eq = (label, got, want) => {
  if (got !== want) {
    failures++;
    console.error(`✗ plain: ${label}\n    got:  ${JSON.stringify(got)}\n    want: ${JSON.stringify(want)}`);
  }
};
const ok = (label, cond) => {
  if (!cond) {
    failures++;
    console.error(`✗ plain: ${label}`);
  }
};

// a or an, by how each current name is said. A name added later is not checked
// here; read the article on its page.
const ARTICLES = {
  '1/2AA': 'a', 10: 'a', 10180: 'a', 10440: 'a', 13: 'a', 14430: 'a', 14500: 'a', 14650: 'a', 16340: 'a', 16650: 'a',
  17500: 'a', 17670: 'a', 18350: 'an', 18490: 'an', 18500: 'an', 18650: 'an', '2/3A': 'a', '2/3AA': 'a', 20700: 'a',
  21700: 'a', 26650: 'a', 26700: 'a', '2CR1/3N': 'a', '2CR5': 'a', 312: 'a', 32650: 'a', 32700: 'a', '3LR12': 'a',
  '4/5A': 'a', 4680: 'a', '4LR44': 'a', 5: 'a', 675: 'a', '9V': 'a', A: 'an', A23: 'an', A27: 'an', AA: 'an', AAA: 'an',
  AAAA: 'an', C: 'a', 'CR-P2': 'a', 'CR-V3': 'a', 'CR1/3N': 'a', CR1025: 'a', CR1130: 'a', CR1216: 'a', CR1220: 'a',
  CR1225: 'a', CR123A: 'a', CR1616: 'a', CR1620: 'a', CR1632: 'a', CR17335: 'a', CR2: 'a', CR2012: 'a', CR2016: 'a',
  CR2020: 'a', CR2025: 'a', CR2032: 'a', CR2320: 'a', CR2325: 'a', CR2330: 'a', CR2354: 'a', CR2412: 'a', CR2430: 'a',
  CR2450: 'a', CR2477: 'a', CR3032: 'a', CR927: 'a', D: 'a', ER14505: 'an', ER26500: 'an', ER34615: 'an', F: 'an',
  '6V Lantern (screw)': 'a', '6V Lantern (spring)': 'a', LR41: 'an', LR43: 'an', LR44: 'an', N: 'an', SR1116SW: 'an',
  SR1120SW: 'an', SR1130SW: 'an', SR1136SW: 'an', SR416SW: 'an', SR421SW: 'an', SR512SW: 'an', SR516SW: 'an',
  SR521SW: 'an', SR527SW: 'an', SR614SW: 'an', SR616SW: 'an', SR621SW: 'an', SR626SW: 'an', SR712SW: 'an',
  SR714SW: 'an', SR716SW: 'an', SR721SW: 'an', SR726SW: 'an', SR731SW: 'an', SR754W: 'an', SR916SW: 'an',
  SR920SW: 'an', SR927SW: 'an', SR936SW: 'an', 'Sub-C': 'a',
  // Not battery pages, but names the helper must also get right.
  11: 'an', 18: 'an', 180: 'a', 8: 'an', 1865: 'an', 'Lantern': 'a', 'E91': 'an', 'MN1500': 'an', 'U9VL': 'a',
};
for (const [name, want] of Object.entries(ARTICLES)) eq(`art(${name})`, art(String(name)), want);

eq('inFrac 50.5', inFrac(50.5), '2 in');
eq('inFrac 14.5', inFrac(14.5), '9/16 in');
eq('inFrac 35', inFrac(35), '1 3/8 in');
eq('inFrac 20', inFrac(20), '13/16 in');
eq('inFrac 3.2', inFrac(3.2), '1/8 in');
eq('inFrac 25.4', inFrac(25.4), '1 in');
eq('inFrac 0.4', inFrac(0.4), 'less than 1/16 in');

eq('coin 20', coinCompare(20), 'a little smaller than a US nickel');
eq('coin 24.5', coinCompare(24.5), 'about the size of a US quarter');
eq('coin 18', coinCompare(18), 'about the size of a US dime');
eq('coin 19.3', coinCompare(19.3), 'about the size of a US penny');
eq('coin 16', coinCompare(16), 'a little smaller than a US dime');
eq('coin 23', coinCompare(23), 'a little smaller than a US quarter');
eq('coin 26', coinCompare(26), 'a little larger than a US quarter');
eq('coin 30', coinCompare(30), 'larger than a US quarter');
eq('coin 11.6', coinCompare(11.6), 'smaller than a US dime');

eq('longDate', longDate('2026-11-22'), 'November 22, 2026');
eq('longDate single digit', longDate('2026-01-05'), 'January 5, 2026');

eq('list 2', list(['a', 'b']), 'a and b');
eq('list 3', list(['a', 'b', 'c']), 'a, b and c');
eq('list last has and', list(['remote controls', 'flashlights', 'wireless mice and keyboards']), 'remote controls, flashlights, wireless mice and keyboards');
eq('list middle has and', list(['film and instant cameras', 'digital cameras', 'camera flashes']), 'film and instant cameras, digital cameras, and camera flashes');

const order = ['n', 'aaaa', 'd', 'aa', 'x1', 'c', 'aaa', 'x2', '9v'].map((id) => ({ id })).sort(byCommon).map((x) => x.id);
eq('byCommon', order.join(' '), 'aa aaa c d 9v n aaaa x1 x2');
ok('COMMON has no duplicates', new Set(COMMON).size === COMMON.length);

// Every battery: the generated summary reads right and repeats the data.
const dir = path.join(root, 'data/batteries');
const all = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => batterySchema.parse(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))));
const byId = Object.fromEntries(all.map((b) => [b.id, b]));
const num = (n) => String(Number(n.toFixed(2)));
for (const b of all) {
  const s = generatedSummary(b);
  const t = `summary ${b.id}`;
  ok(`${t} ends with a period: ${s}`, /\.$/.test(s));
  ok(`${t} says "cell": ${s}`, !/\bcells?\b/i.test(s));
  ok(`${t} has an arrow, slash run or middot: ${s}`, !/[\u2192\u2190\u2197\u203A\u00BB\u00B7]| \/ /.test(s));
  ok(`${t} has a doubled space or stray comma: ${s}`, !/ {2}| ,|,,|\.\./.test(s));
  ok(`${t} uses a banned word: ${s}`, !/\b(nominal|diameter|chemistry|interchangeable|substitute|primary)\b/i.test(s));
  for (const k of ['diameter', 'height', 'width', 'depth']) {
    const v = b.dimensions[k]?.nominal;
    if (v !== undefined) ok(`${t} is missing ${k} ${v} mm: ${s}`, s.includes(`${num(v)} mm`));
  }
  if (b.form === 'disc') ok(`${t} has no coin comparison: ${s}`, / US (dime|penny|nickel|quarter)\b/.test(s));
  // Retelling, not adding: every voltage the summary names is in the data, and
  // the first listed variant's voltage is among them.
  const volts = new Set(b.variants.map((x) => num(x.voltage.nominal)));
  const said = [...s.matchAll(/(?<![\d.])(\d+(?:\.\d+)?)(?=-volt| volts| or \d| to \d)/g)].map((m) => m[1]);
  for (const v of said) ok(`${t} names ${v} volts, which no variant has: ${s}`, volts.has(v));
  ok(`${t} does not name the main voltage ${b.variants[0].voltage.nominal}: ${s}`, said.includes(num(b.variants[0].voltage.nominal)));
  const mms = new Set(['diameter', 'height', 'width', 'depth'].map((k) => b.dimensions[k]?.nominal).filter((x) => x !== undefined).map(num));
  for (const m of s.matchAll(/(\d+(?:\.\d+)?) mm/g)) ok(`${t} names ${m[1]} mm, which is not a dimension: ${s}`, mms.has(m[1]));
  ok(`${t} is too long (${s.length}): ${s}`, s.length <= 420);
}

eq('summary aa', generatedSummary(byId.aa), 'A round battery 50.5 mm long and 14.5 mm across (about 2 in by 9/16 in). Most are 1.5 volts; rechargeable ones are 1.2 volts. Common in remote controls, flashlights, wireless mice and keyboards.');
eq('summary cr2032', generatedSummary(byId.cr2032), 'A flat, round 3-volt lithium battery, 20 mm across and 3.2 mm thick (about 13/16 in by 1/8 in), a little smaller than a US nickel. Common in vehicle key fobs, item trackers and computer motherboards.');
eq('size 9v', plainSize(byId['9v']), '48.5 mm tall, 26.5 mm wide and 17.5 mm thick (about 1 15/16 in by 1 1/16 in by 11/16 in)');
eq('size 9v, mm only', plainSize(byId['9v'], { inches: false }), '48.5 mm tall, 26.5 mm wide and 17.5 mm thick');
eq('rechargeable cr2032', plainRechargeable(byId.cr2032), 'No. The rechargeable version is sold as LIR2032.');
eq('rechargeable aa', plainRechargeable(byId.aa), 'Sold both ways');
eq('rechargeable 18650', plainRechargeable(byId['18650']), 'Yes');

// A battery with no devices listed, and one with a hand-written summary.
const bare = { ...byId.cr2032, devices: [] };
eq('summary with no devices', generatedSummary(bare), 'A flat, round 3-volt lithium battery, 20 mm across and 3.2 mm thick (about 13/16 in by 1/8 in), a little smaller than a US nickel.');
eq('hand-written plain wins', plainSummary({ ...byId.aa, plain: ' Written by hand. ' }), 'Written by hand.');

// At a glance and the tiles. Kinds no longer made drop out of the voltage list,
// as they do on the page.
const cdir = path.join(root, 'data/chemistries');
const chemStatus = Object.fromEntries(fs.readdirSync(cdir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(cdir, f), 'utf8'))).map((c) => [c.id, c.status]));
const isCurrent = (c) => chemStatus[c] === 'current';
const lines = (id) => voltageLines(byId[id], isCurrent).join(' | ');
eq('voltage aa', lines('aa'), '1.5 V alkaline, lithium and heavy duty | 1.2 V rechargeable NiMH | 1.6 V rechargeable NiZn | 1.5 V rechargeable lithium');
eq('voltage cr2032', lines('cr2032'), '3 V lithium | 3.6 V rechargeable, sold as LIR2032');
eq('voltage 9v', lines('9v'), '9 V alkaline, heavy duty and lithium | 8.4 or 9.6 V rechargeable NiMH | 9 V rechargeable lithium');
eq('weight aa', plainWeight(byId.aa), 'About 23 g (0.8 oz), alkaline');
eq('weight 18650', plainWeight(byId['18650']), '45 to 48.5 g (1.6 to 1.7 oz), depending on the product');
eq('other names aa (IEC name first)', otherNames(byId.aa).join(', '), 'LR6, MN1500, E91');
eq('other names cr2032 (no US standard or type number)', otherNames(byId.cr2032).join(', '), 'DL2032, ECR2032');
eq('other names cr2025 (maker names from their own product pages)', otherNames(byId.cr2025).join(', '), 'DL2025, ECR2025');
eq('other names cr1632 (Duracell only: no Energizer page lists an ECR1632)', otherNames(byId.cr1632).join(', '), 'DL1632');
eq('other names cr2430 (none sourced yet)', otherNames(byId.cr2430).join(', '), '');
eq('other names lr44 (IEC, then AG, then brands)', otherNames(byId.lr44).join(', '), 'LR1154, AG13, PX76A, A76');
eq('other names sr416sw (no watchmaker number)', otherNames(byId.sr416sw).join(', '), 'SR416, V337');
eq('other names 312 (IEC name that is also an alias)', otherNames(byId['312']).join(', '), 'PR41, DA312, AC312');
eq('other names sr626sw (no AG name of another kind)', otherNames(byId.sr626sw).join(', '), 'SR626, D377, SR626W');
eq('tile names lr44 (two only)', tileFacts(byId.lr44).names.join(', '), 'LR1154, AG13');
eq('tile volts aa', plainVoltsShort(byId.aa), '1.5 volts; rechargeable 1.2 volts');
eq('tile volts lr44', plainVoltsShort(byId.lr44), '1.5 volts; silver oxide 1.55 volts');
eq('tile volts cr2032', plainVoltsShort(byId.cr2032), '3 volts');
ok('nicknames drop "Coin cell"', !nicknames(byId.cr2032).includes('Coin cell') && nicknames(byId.cr2032).includes('CMOS battery'));
for (const b of all) {
  const f = tileFacts(b);
  const shown = [...voltageLines(b, isCurrent), plainWeight(b), f.size, f.volts, ...f.names, ...nicknames(b)];
  for (const s of shown) {
    ok(`glance ${b.id} says "cell": ${s}`, !/\bcells?\b/i.test(s));
    ok(`glance ${b.id} has an arrow, slash run or middot: ${s}`, !/[\u2192\u2190\u2197\u203A\u00BB\u00B7]| \/ /.test(s));
  }
  ok(`glance ${b.id} has no voltage line`, voltageLines(b, isCurrent).length > 0);
  ok(`tile ${b.id} repeats its own name`, !f.names.includes(b.name));
}

if (failures) {
  console.error(`\n${failures} plain-language check(s) failed`);
  process.exit(1);
}
console.log(`✓ plain-language helpers: ${Object.keys(ARTICLES).length} names, ${all.length} summaries`);
