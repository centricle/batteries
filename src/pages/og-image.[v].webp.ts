import type { APIRoute } from 'astro';
import { ogCard, ogVersion } from '../lib/og';

// Writes the card again as /og-image.<hash>.webp; see src/lib/og.ts.
export const getStaticPaths = () => [{ params: { v: ogVersion } }];
export const GET: APIRoute = () => new Response(ogCard, { headers: { 'content-type': 'image/webp' } });
