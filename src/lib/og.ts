import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// The share card is committed once, at public/og-image.webp. The meta tags
// point at a copy whose name carries its content hash, so a new card is a new
// image URL and platforms that cache images by URL fetch it again. The hash
// goes in the filename, not a query string: LinkedIn serves a 160px rendition
// of an og:image whose URL has a query string (rig/runbooks/OG_META.md).
export const ogCard = readFileSync('public/og-image.webp');
export const ogVersion = createHash('md5').update(ogCard).digest('hex').slice(0, 8);
export const ogImage = `https://batteries.fyi/og-image.${ogVersion}.webp`;
