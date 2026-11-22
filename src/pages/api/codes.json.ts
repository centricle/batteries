import { batteries } from '../../lib/data';

// Flat cross-reference: every code -> the battery id that carries it.
export function GET() {
  const out = batteries().flatMap((b) => b.codes.map((c) => ({ code: c.code, system: c.system, chemistry: c.chemistry ?? null, battery: b.id, name: b.name })));
  return new Response(JSON.stringify(out), { headers: { 'Content-Type': 'application/json' } });
}
