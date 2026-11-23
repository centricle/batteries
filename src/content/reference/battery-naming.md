---
title: "How battery names work"
description: "Battery codes encode chemistry, shape, size and cell count. AA alkaline is LR6 under IEC, 15A under ANSI, MN1500 at Duracell and E91 at Energizer."
updated: 2026-11-22
order: 10
related: [aa, aaa, 9v, cr2032, lr44, sr626sw, 18650, 14500]
sources:
  - title: "Battery nomenclature"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/Battery_nomenclature"
    accessed: 2026-11-22
  - title: "List of battery sizes"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/List_of_battery_sizes"
    accessed: 2026-11-22
  - title: "Button cell"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/Button_cell"
    accessed: 2026-11-22
  - title: "18650 battery"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/18650_battery"
    accessed: 2026-11-22
  - title: "IEC 60086-1:2026 CMV, Primary batteries, Part 1: General"
    publisher: "International Electrotechnical Commission"
    url: "https://webstore.iec.ch/en/publication/113923"
    accessed: 2026-11-22
  - title: "IEC 60086-2-1:2026 CMV, Physical and electrical specifications of batteries with aqueous electrolyte"
    publisher: "International Electrotechnical Commission"
    url: "https://webstore.iec.ch/en/publication/113924"
    accessed: 2026-11-22
  - title: "IEC 61960-3:2017, Secondary lithium cells and batteries for portable applications"
    publisher: "International Electrotechnical Commission"
    url: "https://webstore.iec.ch/en/publication/29603"
    accessed: 2026-11-22
  - title: "Energizer E91 product datasheet"
    publisher: "Energizer"
    url: "https://www.farnell.com/datasheets/1968873.pdf"
    accessed: 2026-11-22
  - title: "Energizer A76 product datasheet"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/A76.pdf"
    accessed: 2026-11-22
  - title: "Energizer 357/303 product datasheet"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/357-303.pdf"
    accessed: 2026-11-22
  - title: "Silver Oxide Handbook and Application Manual"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/silveroxide_appman.pdf"
    accessed: 2026-11-22
  - title: "INR18650-30Q specification (version 0.0)"
    publisher: "Samsung SDI"
    url: "https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/196/samsung_5F00_30q_5F00_data_5F00_sheet.pdf"
    accessed: 2026-11-22
---

A battery designation is a compressed description of the cell: its chemistry, its shape, its size and, for multi-cell batteries, how many cells are inside. Under the IEC 60086 system, LR6 means an alkaline (L), round (R) cell in size 6, which is the AA size. Newer round cells carry a number built from their dimensions, so a CR2032 is a lithium manganese dioxide cell 20 mm in diameter and 3.2 mm high. One physical size has many names because IEC, ANSI, Japanese standards and each manufacturer number it separately: an alkaline [AA](/aa) is LR6 (IEC), 15A (ANSI), MN1500 (Duracell) and E91 (Energizer).

## The IEC 60086 pattern

IEC 60086-1 is the international standard that sets battery nomenclature, dimensions, markings and test methods for primary (single-use) batteries. The IEC describes its purpose as making batteries from different manufacturers interchangeable "according to standard form, fit and function." The current edition is IEC 60086-1:2026, and the 2026 revision split the physical and electrical specifications into IEC 60086-2-1 (aqueous electrolytes, such as alkaline) and IEC 60086-2-2 (lithium).

A full IEC code reads left to right as follows, with each part optional when it does not apply:

1. **Number of cells in series.** Present only for multi-cell batteries.
2. **Chemistry letter.** No letter means zinc-carbon.
3. **Shape letter.** R for round.
4. **Size code.** A legacy number or a diameter-and-height number.
5. **Modifiers.** Terminal variants, performance grades or a watch-battery suffix.

The 9-volt battery shows the pattern. The alkaline version is 6LR61: six cells in series, alkaline chemistry, round cells, size 61. The carbon-zinc version is 6F22, where F marks flat, layer-built cells, according to Wikipedia's list of battery sizes.

### Chemistry letters

Wikipedia's summary of the IEC chemistry table lists these letters for consumer systems. The letter also implies a nominal voltage.

| Letter | System | Nominal voltage |
|---|---|---|
| (none) | [Zinc-carbon](/chemistry/zinc-carbon) | 1.5 V |
| B | Lithium carbon monofluoride | 3.0 V |
| C | [Lithium manganese dioxide](/chemistry/lithium-manganese-dioxide) | 3.0 V |
| E | [Lithium thionyl chloride](/chemistry/lithium-thionyl-chloride) | 3.6 V |
| F | [Lithium iron disulfide](/chemistry/lithium-iron-disulfide) | 1.5 V |
| L | [Alkaline](/chemistry/alkaline) (zinc, manganese dioxide) | 1.5 V |
| P | [Zinc-air](/chemistry/zinc-air) | 1.4 V |
| S | [Silver oxide](/chemistry/silver-oxide) | 1.55 V |
| Z | Nickel oxyhydroxide | 1.5 V |
| H | [Nickel-metal hydride](/chemistry/nimh) (rechargeable) | 1.2 V |
| K | [Nickel-cadmium](/chemistry/nicd) (rechargeable) | 1.2 V |

Wikipedia notes that NiMH and NiCd cylindrical cells designed to be dimensionally interchangeable with primary batteries use the primary designation with H or K as the system letter, which is why a rechargeable AA is an HR6. The IEC lists a new letter "T" among the changes in the 2026 edition of IEC 60086-1; its public summary does not say what system T denotes.

### Shape letters

The shape codes are R (round, which covers coin, button and cylindrical cells), P (prismatic), F (flat, layer-built) and S (square or rectangular). Wikipedia notes that F and S remain in use for existing batteries but are not used for new definitions.

## Legacy size numbers and dimension codes

Before October 1990, round cells received sequential size numbers from R06 to R70. Those numbers say nothing about dimensions; they are labels. Several survive because the sizes are so common:

| IEC size | Common name | Nominal diameter | Nominal height |
|---|---|---|---|
| R20 | [D](/d) | 34.2 mm | 61.5 mm |
| R14 | [C](/c) | 26.2 mm | 50.0 mm |
| R6 | [AA](/aa) | 14.5 mm | 50.5 mm |
| R1 | [N](/n) | 12.0 mm | 30.2 mm |
| R03 | [AAA](/aaa) | 10.5 mm | 44.5 mm |

Dimensions as listed in Wikipedia's battery nomenclature article.

After 1990, new round cells were named from their dimensions. For cells under 100 mm, the code is the diameter in whole millimeters (truncated) followed by the height in tenths of a millimeter. That rule makes the coin cell family easy to read:

- [CR2032](/cr2032): 20 mm diameter, 3.2 mm height
- [CR2025](/cr2025): 20 mm diameter, 2.5 mm height
- [CR2016](/cr2016): 20 mm diameter, 1.6 mm height

Some button sizes kept two-digit codes. Wikipedia's button cell article gives LR1154 and SR1154 as the dimension codes for the 11.6 mm by 5.4 mm cell that is usually sold as [LR44](/lr44) or SR44.

## Suffixes on silver oxide cells

Watch batteries often end in W or SW. According to Wikipedia's button cell article, SW marks a low-drain type for quartz watches without lights, alarms or chronographs, and W marks a high-drain type for watches, calculators and cameras that complies with IEC 60086-3, the watch battery standard. Energizer's silver oxide handbook describes two electrolyte designs for watch batteries: sodium hydroxide cells are designed for low-drain continuous use, typically up to five years, and potassium hydroxide cells for continuous low drains with periodic high-drain pulses over roughly one to two years. Under heavy drains, Energizer states, potassium hydroxide offers less resistance to current flow. See [SR626SW](/sr626sw) and [SR621SW](/sr621sw).

Wikipedia lists other modifiers: X and Y for terminal styles and variants of the same battery, and suffixes such as C, P, S, CF, HH and HB for performance levels.

## ANSI C18 numbers

The American standard, ANSI C18, uses an arbitrary number for the size and a suffix for the chemistry. Wikipedia lists the size numbers 13 (D), 14 (C), 15 (AA), 24 (AAA) and 25 (AAAA), and notes that the IEC and ANSI sizes are harmonized, so an R20 and an ANSI 13 have the same dimensions.

Common suffixes are A (alkaline), D (carbon-zinc, heavy duty), LF (lithium iron disulfide), LC (lithium manganese dioxide), SO (silver oxide), Z (zinc-air), H (nickel-metal hydride) and K (nickel-cadmium). Reading a code is then mechanical: 15A is an alkaline AA, 24A an alkaline AAA, 15LF a lithium AA and 1604A an alkaline 9-volt.

Button cells use four-digit ANSI numbers. Energizer's datasheets list its A76 as ANSI/NEDA 1166A and IEC LR44, and its 357/303 silver oxide cell as ANSI 1131SO and IEC SR44. The two cells share a physical size and differ in chemistry and voltage (1.5 V and 1.55 V).

## Lithium-ion codes (IEC 61960)

Rechargeable lithium-ion cells follow a separate standard, IEC 61960, whose part 3 covers designations, markings and dimensions for portable cylindrical and prismatic cells. Wikipedia summarizes the letter scheme:

- **First letter:** I for lithium-ion, L for lithium metal or alloy.
- **Second letter:** the positive electrode basis: C (cobalt), N (nickel), M (manganese), V (vanadium) or T (titanium).
- **Third letter:** R for cylindrical, P for prismatic.
- **Numbers:** maximum diameter (or thickness) and maximum height in millimeters, as in ICR19/66.

Retail cells usually pair those letters with a five-digit size code instead. The [18650](/18650) is 18 mm in diameter and 65.0 mm long; Wikipedia notes that the number describes only the physical size, not the chemistry. Samsung SDI's specification for its INR18650-30Q lists a diameter of 18.33 ± 0.07 mm, a height of 64.85 ± 0.15 mm and a 3.6 V nominal rating; under the IEC 61960 letters, its INR prefix stands for lithium-ion, nickel-based positive electrode, round. Other five-digit sizes include [21700](/21700) and [26650](/26650).

## Why one size has many names

The AA size alone carries these designations, drawn from Wikipedia's list of battery sizes and Energizer's E91 datasheet:

| System | Alkaline | Other chemistries in the same size |
|---|---|---|
| IEC | LR6 | R6 (zinc-carbon), FR6 (lithium iron disulfide), HR6 (NiMH), KR6 (NiCd), ZR6 (nickel oxyhydroxide) |
| ANSI | 15A | 15D (carbon-zinc), 15LF (lithium iron disulfide), 1.2H2 (NiMH) |
| JIS | AM-3 | UM 3 (carbon-zinc) |
| Manufacturer | MN1500 (Duracell), E91 (Energizer) | Varies by brand and line |

Sharing a size does not make cells interchangeable in every device. Wikipedia's nomenclature article states that physical interchangeability is not the only factor in substitution, and the voltages above show why: an HR6 is rated at 1.2 V, an LR6 at 1.5 V. A [14500](/14500) lithium-ion cell is named for roughly AA proportions (14 mm by 50.0 mm under the naming rule), but lithium-ion cells such as Samsung's INR18650-30Q are rated at 3.6 V nominal, so a 14500 is not a drop-in replacement for an alkaline AA.

To decode a printed code on a specific cell, use the [code decoder](/decode).
