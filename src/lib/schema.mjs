// The batteries.fyi data contract. Every file in data/batteries/ and
// data/chemistries/ is parsed against these schemas at build time, so a bad
// entry fails the build instead of shipping. Plain JS (not TS) so Node scripts
// can import it without a compile step. Field-by-field guidance lives in
// data/SCHEMA.md.
import { z } from 'zod';

export const CHEMISTRIES = [
  'alkaline',
  'zinc-carbon',
  'zinc-chloride',
  'nickel-oxyhydroxide',
  'lithium-iron-disulfide',
  'lithium-manganese-dioxide',
  'lithium-carbon-monofluoride',
  'lithium-thionyl-chloride',
  'silver-oxide',
  'zinc-air',
  'mercury-oxide',
  'nimh',
  'nicd',
  'nickel-zinc',
  'lithium-ion',
  'lithium-iron-phosphate',
  'lithium-ion-regulated',
  'lithium-manganese-rechargeable',
  'lithium-vanadium-rechargeable',
  'lithium-titanate',
];

export const CATEGORIES = [
  'household',
  'coin',
  'button',
  'hearing-aid',
  'li-ion',
  'photo',
  'specialty',
];

export const FORMS = ['cylinder', 'disc', 'prismatic', 'lantern', 'flatpack', 'twin'];

export const SOURCE_KINDS = ['standard', 'datasheet', 'catalog', 'reference', 'retailer', 'regulation'];

const slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase letters, digits and hyphens');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD');
const range = z.tuple([z.number(), z.number()]).refine(([a, b]) => a <= b, 'range must be [low, high]');
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const dimension = z
  .object({
    nominal: z.number().positive(),
    min: z.number().positive().optional(),
    max: z.number().positive().optional(),
  })
  .strict()
  .refine((d) => d.min === undefined || d.min <= d.nominal + 1e-9, 'min above nominal')
  .refine((d) => d.max === undefined || d.max >= d.nominal - 1e-9, 'max below nominal');

export const sourceSchema = z
  .object({
    id: slug,
    title: z.string().min(3),
    publisher: z.string().min(2),
    url: z.string().url().optional(),
    accessed: isoDate,
    kind: z.enum(SOURCE_KINDS),
    covers: z.array(z.string()).optional(),
    note: z.string().optional(),
  })
  .strict();

const terminal = z
  .object({
    style: z.enum(['button', 'flat', 'recessed', 'can', 'cap', 'snap-male', 'snap-female', 'spring', 'screw', 'strip', 'contact']),
    diameter: z.number().positive().optional(),
    height: z.number().nonnegative().optional(),
    note: z.string().optional(),
  })
  .strict();

const variantSchema = z
  .object({
    chemistry: z.enum(CHEMISTRIES),
    label: z.string().optional(),
    subtype: z.string().optional(),
    rechargeable: z.boolean(),
    voltage: z
      .object({
        nominal: z.number().positive(),
        open_circuit: z.number().positive().optional(),
        cutoff: z.number().positive().optional(),
        charge_max: z.number().positive().optional(),
      })
      .strict(),
    capacity_mah: z
      .object({
        typical: z.number().positive().optional(),
        range: range.optional(),
        conditions: z.string().optional(),
      })
      .strict()
      .optional(),
    weight_g: z.number().positive().optional(),
    max_continuous_ma: z.number().positive().optional(),
    max_pulse_ma: z.number().positive().optional(),
    internal_resistance_mohm: z.number().positive().optional(),
    cycle_life: z.number().positive().optional(),
    shelf_life_years: z.number().positive().optional(),
    self_discharge: z.string().optional(),
    lithium_content_g: z.number().positive().optional(),
    temperature_c: z
      .object({
        operating: range.optional(),
        discharge: range.optional(),
        charge: range.optional(),
        storage: range.optional(),
      })
      .strict()
      .optional(),
    notes: z.string().optional(),
    sources: z.array(slug).min(1),
  })
  .strict();

export const batterySchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    category: z.enum(CATEGORIES),
    form: z.enum(FORMS),
    status: z.enum(['current', 'legacy', 'obsolete']).default('current'),
    aliases: z.array(z.string()).default([]),
    legacy_paths: z.array(z.string().regex(/^\/[a-z0-9/-]+$/)).optional(),
    codes: z
      .array(
        z
          .object({
            code: z.string().min(1),
            system: z.string().min(2),
            chemistry: z.enum(CHEMISTRIES).optional(),
            note: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
    dimensions: z
      .object({
        diameter: dimension.optional(),
        height: dimension,
        width: dimension.optional(),
        depth: dimension.optional(),
        note: z.string().optional(),
        sources: z.array(slug).min(1),
      })
      .strict(),
    geometry: z
      .object({
        positive: terminal.optional(),
        negative: terminal.optional(),
        cells: z.number().int().positive().optional(),
        variant: z.string().optional(),
        tab_color: hex.optional(),
        tab_color_name: z.string().optional(),
        note: z.string().optional(),
      })
      .strict()
      .default({}),
    variants: z.array(variantSchema).min(1),
    devices: z.array(z.string()).default([]),
    interchange: z
      .array(
        z
          .object({
            id: slug,
            relation: z.enum(['equivalent', 'same-size', 'fits-with-caveat', 'do-not-substitute']),
            note: z.string(),
          })
          .strict(),
      )
      .default([]),
    safety: z.array(z.string()).default([]),
    history: z.string().optional(),
    notes: z.string().optional(),
    // Optional hand-written plain summary for the top of the page. Without it
    // the page generates one from the data (plainSummary in src/lib/plain.ts).
    plain: z.string().min(20).optional(),
    sources: z.array(sourceSchema).min(1),
    updated: isoDate,
  })
  .strict()
  .superRefine((b, ctx) => {
    const ids = new Set(b.sources.map((s) => s.id));
    const check = (list, path) =>
      list.forEach((id) => {
        if (!ids.has(id)) ctx.addIssue({ code: 'custom', path, message: `unknown source id "${id}"` });
      });
    check(b.dimensions.sources, ['dimensions', 'sources']);
    b.variants.forEach((v, i) => check(v.sources, ['variants', i, 'sources']));
    if (b.form === 'cylinder' || b.form === 'disc') {
      if (!b.dimensions.diameter) ctx.addIssue({ code: 'custom', path: ['dimensions'], message: `${b.form} needs diameter` });
    } else if (!b.dimensions.width || !b.dimensions.depth) {
      ctx.addIssue({ code: 'custom', path: ['dimensions'], message: `${b.form} needs width and depth` });
    }
  });

export const chemistrySchema = z
  .object({
    id: z.enum(CHEMISTRIES),
    name: z.string(),
    short: z.string(),
    // The kind as a person replacing a battery would say it: plain word first,
    // the technical abbreviation in parentheses ("Rechargeable (NiMH)").
    plain_name: z.string().min(3).optional(),
    // One or two sentences in the reader's words, written only from this
    // file's summary, strengths and limitations.
    plain: z.string().min(20).optional(),
    iec_letter: z.string().max(2).optional(),
    rechargeable: z.boolean(),
    anode: z.string().optional(),
    cathode: z.string().optional(),
    electrolyte: z.string().optional(),
    voltage: z
      .object({
        nominal: z.number().positive(),
        open_circuit: range.optional(),
        cutoff: z.number().positive().optional(),
        charge_max: z.number().positive().optional(),
      })
      .strict(),
    energy_density_wh_kg: range.optional(),
    energy_density_wh_l: range.optional(),
    self_discharge: z.string().optional(),
    temperature_c: z.object({ operating: range.optional(), storage: range.optional() }).strict().optional(),
    color: hex,
    summary: z.string().min(40),
    body: z.string().min(200),
    strengths: z.array(z.string()).default([]),
    limitations: z.array(z.string()).default([]),
    safety: z.array(z.string()).default([]),
    status: z.enum(['current', 'legacy', 'obsolete']).default('current'),
    sources: z.array(sourceSchema).min(1),
    updated: isoDate,
  })
  .strict();

// Devices: which battery a product takes, as its maker states it. One file per
// device in data/devices/. The rule is in data/SCHEMA.md: the source is the
// device maker (manual, support page, spec sheet), and `source.quote` carries
// the sentence that says so, so every entry can be checked in one click.
export const DEVICE_CATEGORIES = [
  'tracker',
  'car-key',
  'garage',
  'remote',
  'smart-home',
  'safety',
  'health',
  'fitness',
  'watch',
  'tool',
  'household',
  'computer',
  'camera',
  'audio',
  'toy',
];

export const deviceSchema = z
  .object({
    id: slug,
    name: z.string().min(1),
    maker: z.string().min(1),
    category: z.enum(DEVICE_CATEGORIES),
    models: z.string().optional(),
    years: z.string().regex(/^\d{4}(-(\d{4})?)?$/, 'YYYY, YYYY-YYYY or YYYY-').optional(),
    battery: slug,
    // The code as the maker writes it, when it is not the battery's page name
    // (Mitutoyo says SR44; the size's page is LR44).
    code: z.string().min(1).optional(),
    count: z.number().int().positive(),
    note: z.string().optional(),
    source: z
      .object({
        title: z.string().min(3),
        publisher: z.string().min(2),
        url: z.string().url(),
        accessed: isoDate,
        quote: z.string().min(3).max(300),
      })
      .strict(),
  })
  .strict();
