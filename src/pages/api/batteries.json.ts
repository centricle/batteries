import { batteries, chemistries } from '../../lib/data';

// The whole dataset, exactly as validated. Schema: data/SCHEMA.md.
export function GET() {
  const body = {
    name: 'batteries.fyi',
    url: 'https://batteries.fyi',
    license: 'MIT',
    schema: 'https://github.com/centricle/batteries/blob/main/data/SCHEMA.md',
    generated: new Date().toISOString().slice(0, 10),
    count: batteries().length,
    batteries: batteries(),
    chemistries: chemistries(),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } });
}
