import { batteries, batteryById } from '../../../lib/data';

export function getStaticPaths() {
  return batteries().map((b) => ({ params: { id: b.id } }));
}

export function GET({ params }: { params: { id: string } }) {
  return new Response(JSON.stringify(batteryById(params.id), null, 2), { headers: { 'Content-Type': 'application/json' } });
}
