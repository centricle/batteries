import { deviceIndex } from '../../lib/data';

export function GET() {
  return new Response(JSON.stringify(deviceIndex()), { headers: { 'Content-Type': 'application/json' } });
}
