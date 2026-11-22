import { batteries, chem, categoryById } from '../../lib/data';

// One row per chemistry variant: the flat shape spreadsheets want.
const cols = ['id', 'name', 'category', 'form', 'diameter_mm', 'height_mm', 'width_mm', 'depth_mm', 'chemistry', 'label', 'rechargeable', 'voltage_nominal', 'voltage_open_circuit', 'voltage_cutoff', 'voltage_charge_max', 'capacity_mah_typical', 'capacity_mah_min', 'capacity_mah_max', 'capacity_conditions', 'weight_g', 'max_continuous_ma', 'operating_temp_min_c', 'operating_temp_max_c', 'iec_codes', 'ansi_codes', 'other_codes', 'url'];
const q = (v: unknown) => {
  if (v === undefined || v === null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function GET() {
  const rows = [cols.join(',')];
  for (const b of batteries()) {
    const d = b.dimensions;
    const iec = b.codes.filter((c) => c.system === 'IEC').map((c) => c.code).join(' ');
    const ansi = b.codes.filter((c) => c.system === 'ANSI').map((c) => c.code).join(' ');
    const other = b.codes.filter((c) => c.system !== 'IEC' && c.system !== 'ANSI').map((c) => `${c.system}:${c.code}`).join(' ');
    for (const v of b.variants) {
      const t = v.temperature_c?.operating ?? v.temperature_c?.discharge;
      rows.push([b.id, b.name, categoryById[b.category].name, b.form, d.diameter?.nominal, d.height.nominal, d.width?.nominal, d.depth?.nominal, chem(v.chemistry).name, v.label, v.rechargeable, v.voltage.nominal, v.voltage.open_circuit, v.voltage.cutoff, v.voltage.charge_max, v.capacity_mah?.typical, v.capacity_mah?.range?.[0], v.capacity_mah?.range?.[1], v.capacity_mah?.conditions, v.weight_g, v.max_continuous_ma, t?.[0], t?.[1], iec, ansi, other, `https://batteries.fyi/${b.id}`].map(q).join(','));
    }
  }
  return new Response(rows.join('\n') + '\n', { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
