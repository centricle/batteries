# batteries.fyi

An open, source-cited reference for consumer battery specifications: dimensions,
chemistries, voltages, capacities, cross-reference codes, and a true-scale 3D model
of every size.

https://batteries.fyi

## What is here

- **One page per physical size** at a flat address (`/aa`, `/cr2032`, `/18650`), with
  every chemistry made in that size, a dimensioned drawing, a rotatable 3D model, every
  IEC, ANSI, JIS and manufacturer code, interchange notes, and the source for every
  number.
- **Every code is an address.** `/lr6`, `/mn1500` and `/377` redirect to their
  canonical page. The redirects are generated at build from the data.
- **Tools:** 3D size comparison, identification by measurement, a code decoder, an
  equivalents table, an actual-size view, and calculators.
- **Reference:** chemistries, naming systems, safety, shipping, and a glossary.
- **Open data:** the full dataset as JSON and CSV, plus a GLB and STL model of every
  battery.

## How it works

```
data/
  batteries/<id>.json     one file per physical size; the id is the URL
  chemistries/<id>.json   one file per chemistry
  SCHEMA.md               field-by-field rules
src/lib/
  schema.mjs              zod schema; the build fails on invalid data
  geometry/               parametric battery geometry (no dependencies)
  viewer.ts               three.js viewer built on the same geometry
  drawing.ts              dimensioned SVG drawings
  data.ts                 loading, derived facts, search index
scripts/
  validate.mjs            schema and cross-reference checks
  build-models.mjs        writes public/models/<id>.glb and .stl
  redirects.mjs           writes dist/_redirects after the build
src/content/reference/    long-form reference articles (Markdown)
```

The 3D models, drawings and silhouettes are generated from the same dimension data
the tables show, so they cannot disagree. Models are regenerated on every build and
are not committed.

## Data rules

- No number without a source. Every value lists the datasheet, standard or catalog it
  came from and the date it was read.
- One entry per physical size; chemistries are variants of it.
- Capacity always carries its rated load and cutoff.
- Objective facts only: no rankings or recommendations.

See [data/SCHEMA.md](data/SCHEMA.md).

## Development

```bash
npm install
npm run dev        # builds models, then serves on port 7006
npm run validate   # check the data without building
npm run build      # validate, build models, build the site
```

## Contributing

A correction is an edit to one JSON file plus a source that supports it. Run
`npm run validate` before opening a pull request.

## License

MIT, for the code, the data and the generated models. See [LICENSE](LICENSE).
