# Data schema

Every battery is one JSON file in `data/batteries/<id>.json`. Every chemistry is
one file in `data/chemistries/<id>.json`. Both are validated against
`src/lib/schema.mjs` at build; `node scripts/validate.mjs` checks them on demand.
`data/batteries/aa.json` is the reference entry.

## Ground rules

- **No number without a source.** Every value traces to a source in that file's
  `sources` array, and the `sources` list on `dimensions` and on each variant
  names which ones. If no source you actually read gives a value, leave the field
  out. An absent field renders as "not published"; a guessed one is a defect.
- **Primary sources first**: IEC 60086 / ANSI C18 / IEC 61960 tables, then
  manufacturer datasheets (Energizer, Duracell, Panasonic, Maxell, Renata, Murata,
  Varta, Sony, Samsung SDI, LG, Molicel, Seiko, Rayovac, Power One, Saft, Tadiran,
  EVE), then distributor listings (Digi-Key, Mouser), then references
  (Wikipedia, Battery University). Record the URL you fetched and today's date.
- **One entry per physical size.** Chemistries that share a size are `variants`
  of one entry (AA alkaline, AA lithium, AA NiMH are one entry; LR44 and SR44 are
  one entry). Every name and code anyone uses for that size goes in `codes` or
  `aliases`, because search, redirects and the equivalents table read them.
- **Objective.** No "best", "recommended", "premium", "great for". State what a
  thing is and does. American English. No em dashes in prose fields.
- **Devices** are generic categories in sentence case ("Car key fobs", "Digital
  calipers"), never brand products.

## Battery fields

| Field | Notes |
|---|---|
| `id` | Lowercase slug; becomes the URL (`/cr2032`). Use the most widely used retail designation (`cr2032`, `lr44`, `sr626sw`, `18650`, `312`). `/` becomes `-`: `1-2aa`, `cr1-3n`. |
| `name` | Display name, as printed: `CR2032`, `AA`, `CR-P2`, `1/2AA`. |
| `category` | `household` (AA, AAA, AAAA, C, D, N, 9V), `coin` (lithium coin: CR, BR, ML, LIR, VL), `button` (alkaline and silver oxide button and watch cells), `hearing-aid` (zinc-air), `li-ion` (rechargeable lithium-ion and LiFePO4 cylindrical cells), `photo` (lithium photo cells and packs: CR123A, CR2, CR-P2, 2CR5, CR-V3), `specialty` (everything else: A23, A27, 4LR44, lantern, 4.5V, fractional sizes, Li-SOCl2 industrial cells). |
| `form` | Drives the 3D model. `cylinder`, `disc` (coin, button, zinc-air), `prismatic` (9V), `lantern` (6V lantern block), `flatpack` (4.5V 3LR12), `twin` (two-cell photo packs: 2CR5, CR-P2, CR-V3, 2CR1/3N). |
| `status` | `current`, `legacy` (still sold, being phased out), `obsolete` (no longer manufactured; mercury cells). |
| `aliases` | Informal names: `"Double A"`, `"Mignon"`, `"Penlight"`, `"Watch battery"`. |
| `legacy_paths` | Old v1 URLs that should 301 here, e.g. `"/traditional/aa"`. Copy from the brief. |
| `codes` | Every designation: `{ "code": "LR6", "system": "IEC", "chemistry": "alkaline" }`. `system` is `IEC`, `ANSI`, `JIS`, `NEDA`, `Military`, or a manufacturer name exactly as written (`Energizer`, `Duracell`, `Renata`, `Maxell`, `Seiko`, `Varta`, `Rayovac`, `Panasonic`, `Sony`, `Murata`, `GP`, `Citizen`, `Toshiba`, `Kodak`, `Eveready`, `Ucar`, `Bulova`, `Timex`, `Power One`). Add `chemistry` when the code implies one. |
| `dimensions` | Millimeters. `diameter` (cylinder, disc), `height` (always; for discs this is thickness), `width` and `depth` (prismatic, lantern, flatpack, twin: width is the longer horizontal side). Each is `{ nominal, min?, max? }`. `nominal` is the size the datasheet publishes; when a source gives only a maximum, nominal equals max. `min`/`max` are the standard's tolerance limits when published. |
| `geometry` | Hints for the 3D model and drawing, all optional. `positive` / `negative`: `{ style, diameter?, height? }`. Cylinder styles: positive `button` (raised nipple) or `flat`; negative `flat` or `recessed`. Disc: positive `can`, negative `cap` with the cap `diameter` if published. 9V: `snap-male` (+), `snap-female` (−). Lantern: `spring` or `screw`. Flatpack: `strip`. `tab_color` / `tab_color_name` for zinc-air sticker colors (`#FFD100`, `"Yellow"`). `cells` for multi-cell packs. `variant` names a special builder (`2cr5`, `cr-p2`, `cr-v3`, `2cr1-3n`). |
| `variants` | One per chemistry sold in this size. See below. Order by market prevalence. |
| `devices` | 4 to 12 generic device categories. |
| `interchange` | Relations to other entries by id: `equivalent` (drop-in), `same-size` (fits, different behavior, e.g. LR44 vs SR44 discharge curve), `fits-with-caveat` (fits with a caveat, e.g. CR2025 in a CR2032 holder), `do-not-substitute` (dangerous lookalike: 14500 vs AA at 3.7 V). `note` is one plain sentence explaining why. |
| `safety` | Plain sentences. Ingestion hazard for coin and button cells. Li-ion charge and discharge limits. |
| `history` | Optional. Dated facts only (introduction year, standardization), with a source. |
| `notes` | Optional. 1 to 3 sentences of context not captured elsewhere. |
| `sources` | `{ id, title, publisher, url, accessed, kind, covers? }`. `kind`: `standard`, `datasheet`, `catalog`, `reference`, `retailer`, `regulation`. `id` is a slug unique within the file (`energizer-e91`). |
| `updated` | Date of this research pass, `YYYY-MM-DD`. |

## Variant fields

| Field | Notes |
|---|---|
| `chemistry` | One of the ids in `CHEMISTRIES` (`src/lib/schema.mjs`). Li-ion subtypes (NMC, NCA, LCO, LMO) go in `subtype`; LiFePO4 is its own chemistry, `lithium-iron-phosphate`. 1.5 V USB-rechargeable Li-ion AA/AAA cells are `lithium-ion-regulated`. |
| `label` | Optional display label when the chemistry name alone is ambiguous, e.g. `"High drain (INR)"`, `"Protected, button top"`. |
| `rechargeable` | Boolean. |
| `voltage` | `nominal` (required), `open_circuit` (fresh), `cutoff` (end-point used for rated capacity), `charge_max` (rechargeables). |
| `capacity_mah` | `typical` and/or `range` `[low, high]` across products, and `conditions` (load and end voltage: `"25 mA continuous to 0.8 V, 21 °C"`). Capacity without conditions is nearly meaningless for primaries; capture them. |
| `weight_g`, `max_continuous_ma`, `max_pulse_ma`, `internal_resistance_mohm`, `cycle_life`, `shelf_life_years`, `self_discharge`, `lithium_content_g` | As published. `lithium_content_g` matters for lithium metal shipping rules. |
| `temperature_c` | Ranges `[min, max]` in °C: `operating`, `discharge`, `charge`, `storage`. |
| `notes` | One or two sentences. |
| `sources` | Ids from the file's `sources` that support this variant. Required. |
