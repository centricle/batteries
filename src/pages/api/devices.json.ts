import { devices } from '../../lib/data';

// Every device entry with its source, as stored in data/devices/.
export function GET() {
  return new Response(JSON.stringify({ license: 'MIT', source: 'https://batteries.fyi/devices', devices: devices() }, null, 1), {
    headers: { 'Content-Type': 'application/json' },
  });
}
