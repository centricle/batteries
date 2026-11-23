# Font license

IBM Plex Mono is licensed under the [SIL Open Font License
1.1](https://openfontlicense.org). The license text is in
[`OFL-IBMPlexMono.txt`](./OFL-IBMPlexMono.txt), copied unchanged from the
release, with its copyright line: Copyright © 2017 IBM Corp. with Reserved Font
Name "Plex".

The `.woff2` files are IBM's own Latin1 and Pi builds from the
`@ibm/plex-mono@2.5.0` release, byte for byte, unmodified. "Plex" is a Reserved
Font Name, and under OFL section 3 a modified version (which a subset is) may
not use it, so nothing here was subset. `scripts/fonts.mjs` copies them and
checks each file's SHA-256.
