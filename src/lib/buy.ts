// Retail links: how the site can earn from the moment a reader needs a battery,
// without the data bending toward it.
//
// The rule that keeps it objective: a link goes to a retailer's search for the
// exact size, never to a picked product or brand, and no list, order, value or
// device entry on the site depends on whether a link exists.
//
// The Amazon Associates tag comes from the build environment
// (PUBLIC_AMAZON_TAG, set in Netlify). Without it the links are plain
// searches: useful to the reader, earning nothing, and counted in GA as
// `buy_click`, so the decision to join a program rests on measured demand.
// Amazon closes an associate account without three sales in its first 180
// days, which is why the measuring comes first.
import type { Battery } from './data';

export const AMAZON_TAG: string = import.meta.env.PUBLIC_AMAZON_TAG ?? '';
export const paid = AMAZON_TAG.length > 0;

export function shopQuery(b: Battery) {
  if (b.category === 'hearing-aid') return `size ${b.name} hearing aid battery`;
  return `${b.name} battery`;
}

export function amazonUrl(query: string) {
  const u = new URL('https://www.amazon.com/s');
  u.searchParams.set('k', query);
  if (AMAZON_TAG) u.searchParams.set('tag', AMAZON_TAG);
  return u.href;
}

// Loose lithium-ion cells get no store link. Marketplace listings for these
// sizes often claim capacities no cell maker publishes, and a reference should
// not send readers into that. The page states the sourced ceiling instead.
export const sellable = (b: Battery) => b.category !== 'li-ion';

/** The largest rechargeable capacity any source on the page gives for this size. */
export function capacityCeiling(b: Battery) {
  let best = 0;
  for (const v of b.variants) {
    if (!v.rechargeable) continue;
    const c = v.capacity_mah;
    const top = Math.max(c?.typical ?? 0, c?.range?.[1] ?? 0);
    if (top > best) best = top;
  }
  return best || null;
}
