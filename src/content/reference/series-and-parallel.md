---
title: "Batteries in series and parallel"
description: "In series, cell voltages add and capacity stays the same; in parallel, capacity adds and voltage stays the same. Four 1.5 V AA cells in series make 6 V."
updated: 2026-11-22
order: 100
related: [aa, aaa, 9v, 18650, 21700, 26650, cr123a]
sources:
  - title: "BU-302: Series and Parallel Battery Configurations"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-302-series-and-parallel-battery-configurations"
    accessed: 2026-11-22
  - title: "BU-205: Types of Lithium-ion"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-205-types-of-lithium-ion"
    accessed: 2026-11-22
  - title: "BU-304b: Making Lithium-ion Safe"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-304b-making-lithium-ion-safe"
    accessed: 2026-11-22
  - title: "NCR18650B datasheet"
    publisher: "Panasonic"
    url: "https://files.batteryjunction.com/frontend/files/Panasonic-NCR18650B.pdf"
    accessed: 2026-11-22
  - title: "INR18650-30Q specification (version 0.0)"
    publisher: "Samsung SDI"
    url: "https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/196/samsung_5F00_30q_5F00_data_5F00_sheet.pdf"
    accessed: 2026-11-22
  - title: "Alkaline Manganese Dioxide Handbook and Application Manual"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/alkaline_appman.pdf"
    accessed: 2026-11-22
  - title: "Energizer Battery Glossary and FAQs"
    publisher: "Energizer"
    url: "https://data.energizer.com/battery-glossary-faq/"
    accessed: 2026-11-22
  - title: "Battery Care, Use and Disposal"
    publisher: "Duracell"
    url: "https://duracell.com/technology/battery-care-use-and-disposal"
    accessed: 2026-11-22
  - title: "Battery nomenclature"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/Battery_nomenclature"
    accessed: 2026-11-22
  - title: "List of battery sizes"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/List_of_battery_sizes"
    accessed: 2026-11-22
---

Connecting cells in series adds their voltages while the capacity in amp-hours stays the same; connecting them in parallel adds their capacities while the voltage stays the same. Four 1.5 V alkaline AA cells in series give 6 V, and four 3.6 V lithium-ion cells in series give 14.4 V nominal, according to Battery University. Cells in a pack should be the same type, capacity and age, because a weaker cell limits the whole string and is stressed by the others.

## The two rules

Battery University's BU-302 states the rules this way: in a series string, "each cell adds its voltage potential to derive at the total terminal voltage," and in a parallel connection, capacity increases "by adding up the total ampere-hour (Ah)." Written as formulas, for identical cells:

- **Series:** pack voltage = number of cells x cell voltage; pack capacity (Ah) = cell capacity.
- **Parallel:** pack voltage = cell voltage; pack capacity (Ah) = number of cells x cell capacity.
- **Energy, either way:** watt-hours = pack voltage x pack capacity (Ah), which equals the number of cells x the energy of one cell.

Battery University's worked example: one 3.6 V cell rated 3,400 mAh holds 3.6 x 3.4 = 12.24 Wh. Four of them arranged two in series and two in parallel give 7.2 V nominal and 48.96 Wh, and eight give 97.92 Wh.

## Naming a configuration

Pack layouts are written with the series count first and the parallel count second. Battery University gives the example of a laptop pack with four 3.6 V Li-ion cells in series and two in parallel: 4s2p, producing 14.4 V nominal and doubling capacity from 2,400 mAh to 4,800 mAh. It notes that for lithium-ion, the parallel groups are usually built first and then connected in series.

## Common configurations

Per-cell voltages used below: lithium-ion 3.6 V nominal and 4.20 V at full charge (Panasonic NCR18650B and Samsung INR18650-30Q datasheets); lithium iron phosphate 3.2 V nominal and 3.65 V at full charge (Battery University BU-205); NiMH 1.2 V and alkaline 1.5 V nominal (Battery University BU-302). Pack values are the per-cell values multiplied by the number of cells in series.

| Configuration | Cells in series | Nominal voltage | Full-charge voltage |
|---|---|---|---|
| 1S lithium-ion | 1 | 3.6 V | 4.2 V |
| 2S lithium-ion | 2 | 7.2 V | 8.4 V |
| 3S lithium-ion | 3 | 10.8 V | 12.6 V |
| 4S lithium-ion | 4 | 14.4 V | 16.8 V |
| 4S lithium iron phosphate | 4 | 12.8 V | 14.6 V |
| 2 x AA alkaline | 2 | 3.0 V | Not rechargeable |
| 4 x AA alkaline | 4 | 6.0 V | Not rechargeable |
| 4 x AA NiMH | 4 | 4.8 V | Not specified here |

The datasheets above set the lithium-ion discharge cutoff at 2.5 V per cell, which scales the same way: 5.0 V for 2S, 7.5 V for 3S and 10.0 V for 4S.

Some single batteries are series packs inside. In an IEC code, a leading number gives the count of cells in series (Wikipedia, Battery nomenclature), so the alkaline [9-volt](/9v) battery, 6LR61, holds six cells and the 4.5-volt [3LR12](/3lr12) holds three, as listed in Wikipedia's list of battery sizes.

Battery University adds that a pack's voltage does not have to match a device's rating exactly, as long as it is higher than what the device specifies, and that most devices tolerate some overvoltage, but the end-of-discharge voltage must be respected.

## Why cells must be matched

Battery University states that it is important "to use the same battery type with equal voltage and capacity (Ah) and never to mix different makes and sizes," and that this is "especially critical in a series configuration because a battery is only as strong as the weakest link in the chain." It describes what happens to a weak cell in a series string:

- **On charge,** the low-capacity cell fills first and remains in overcharge longer than the others.
- **On discharge,** it empties first and is then stressed by the stronger cells.

Energizer's glossary defines cell reversal as the reversing of a cell's terminal polarity due to over-discharge.

Consumer battery makers give the same instruction for devices that hold several cells. Energizer's alkaline handbook says not to mix old and new batteries, or different types or makes, because this can cause rupture or leakage. Duracell says not to mix old and new batteries, batteries of different brands, or different types (it gives the example of heavy-duty zinc chloride with alkaline) in the same device, and to replace all batteries at the same time. Duracell also cautions that equipment using more than three batteries "may appear to work properly even if one battery is inserted incorrectly."

Replacing a single cell in a used pack creates the same mismatch. Battery University notes that a new cell has a higher capacity than the aged cells around it, causing an imbalance, which is one reason packs are commonly replaced as a unit.

## Parallel connections

Battery University states that most chemistries allow parallel connection "with little side effect." A cell that develops high resistance or goes open-circuit reduces the pack's runtime and load capability without changing its voltage. A shorted cell is more serious: the other cells discharge into it, causing excessive heat and a fire hazard, which is why larger packs often include a fuse to isolate a failing cell.

## Lithium-ion packs need cell monitoring

Battery University's BU-304b states that "each cell in a string needs independent voltage monitoring" in a lithium-ion pack, and BU-302 notes that integrated circuits are available to supervise up to 13 lithium-ion cells in series. Charge limits for single cells are on the [lithium-ion cell safety](/reference/lithium-ion-safety) page.

To calculate the voltage, capacity and watt-hours of a layout, use the [calculators](/calculators).
