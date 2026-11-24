---
title: "Batteries in series and parallel"
description: "In series, voltages add and capacity stays the same; in parallel, capacity adds and voltage stays the same. Four 1.5V AA batteries in series make 6V."
updated: 2026-11-22
order: 110
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

Use batteries of the same type, capacity and age together, and replace them all at the same time, because a weaker one limits the whole set and is stressed by the others. Connecting batteries in series (end to end, positive to negative) adds their voltages while the capacity in amp-hours stays the same; connecting them in parallel (side by side, positive to positive) adds their capacities while the voltage stays the same. Four 1.5V alkaline AA batteries in series give 6V, and four 3.6V lithium-ion cells in series give 14.4V nominal (the rated voltage), according to Battery University.

On this page, a cell is one single unit that makes electricity. An AA battery is one cell; a 9-volt battery is six cells joined together in one case. A pack is one or more cells wired together, which is why the rules below count cells.

## The two rules

Battery University's BU-302 states the rules this way: in a series string, "each cell adds its voltage potential to derive at the total terminal voltage," and in a parallel connection, capacity increases "by adding up the total ampere-hour (Ah)." Written as formulas, for identical cells:

- **Series:** pack voltage = number of cells x cell voltage; pack capacity (Ah) = cell capacity.
- **Parallel:** pack voltage = cell voltage; pack capacity (Ah) = number of cells x cell capacity.
- **Energy, either way:** watt-hours = pack voltage x pack capacity (Ah), which equals the number of cells x the energy of one cell.

Battery University's worked example: one 3.6V cell rated 3,400mAh holds 3.6 x 3.4 = 12.24Wh. Four of them arranged two in series and two in parallel give 7.2V nominal and 48.96Wh, and eight give 97.92Wh.

## How a pack layout is written

Pack layouts are written with the series count first and the parallel count second. Battery University gives the example of a laptop pack with four 3.6V Li-ion cells in series and two in parallel: 4s2p, producing 14.4V nominal and doubling capacity from 2,400mAh to 4,800mAh. It notes that for lithium-ion, the parallel groups are usually built first and then connected in series.

## Common layouts

Per-cell voltages used below: lithium-ion 3.6V nominal and 4.20V at full charge (Panasonic NCR18650B and Samsung INR18650-30Q datasheets); lithium iron phosphate 3.2V nominal and 3.65V at full charge (Battery University BU-205); NiMH 1.2V and alkaline 1.5V nominal (Battery University BU-302). Pack values are the per-cell values multiplied by the number of cells in series.

| Layout | Cells in series | Voltage (nominal) | Full-charge voltage |
|---|---|---|---|
| 1S lithium-ion | 1 | 3.6V | 4.2V |
| 2S lithium-ion | 2 | 7.2V | 8.4V |
| 3S lithium-ion | 3 | 10.8V | 12.6V |
| 4S lithium-ion | 4 | 14.4V | 16.8V |
| 4S lithium iron phosphate | 4 | 12.8V | 14.6V |
| 2 x AA alkaline | 2 | 3.0V | Not rechargeable |
| 4 x AA alkaline | 4 | 6.0V | Not rechargeable |
| 4 x AA NiMH | 4 | 4.8V | Not specified here |

The datasheets above set the lithium-ion discharge cutoff at 2.5V per cell, which scales the same way: 5.0V for 2S, 7.5V for 3S and 10.0V for 4S.

Some single batteries are series packs inside. In a standard (IEC) battery name, a leading number gives the count of cells in series (Wikipedia, Battery nomenclature), so the alkaline [9-volt](/9v) battery, 6LR61, holds six cells and the 4.5-volt [3LR12](/3lr12) holds three, as listed in Wikipedia's list of battery sizes.

Battery University adds that a pack's voltage does not have to match a device's rating exactly, as long as it is higher than what the device specifies, and that most devices tolerate some overvoltage, but the end-of-discharge voltage must be respected.

## Why the batteries must match

Battery University states that it is important "to use the same battery type with equal voltage and capacity (Ah) and never to mix different makes and sizes," and that this is "especially critical in a series configuration because a battery is only as strong as the weakest link in the chain." It describes what happens to a weak cell in a series string:

- **On charge,** the low-capacity cell fills first and remains in overcharge longer than the others.
- **On discharge,** it empties first and is then stressed by the stronger cells.

Energizer's glossary defines cell reversal as the reversing of a cell's terminal polarity due to over-discharge, so that its positive and negative ends swap.

Consumer battery makers give the same instruction for devices that hold several batteries. Energizer's alkaline handbook says not to mix old and new batteries, or different types or makes, because this can cause rupture or leakage. Duracell says not to mix old and new batteries, batteries of different brands, or different types (it gives the example of heavy-duty zinc chloride with alkaline) in the same device, and to replace all batteries at the same time. Duracell also cautions that equipment using more than three batteries "may appear to work properly even if one battery is inserted incorrectly."

Replacing a single cell in a used pack creates the same mismatch. Battery University notes that a new cell has a higher capacity than the aged cells around it, causing an imbalance, which is one reason packs are commonly replaced as a unit.

## Parallel connections

Battery University states that most kinds of battery allow parallel connection "with little side effect." A cell that develops high resistance or goes open-circuit reduces the pack's runtime and load capability without changing its voltage. A shorted cell is more serious: the other cells discharge into it, causing excessive heat and a fire hazard, which is why larger packs often include a fuse to isolate a failing cell.

## Lithium-ion packs need monitoring

Battery University's BU-304b states that "each cell in a string needs independent voltage monitoring" in a lithium-ion pack, and BU-302 notes that integrated circuits are available to supervise up to 13 lithium-ion cells in series. Charge limits for single batteries are in the [lithium-ion battery safety](/reference/lithium-ion-safety) guide.

To calculate the voltage, capacity and watt-hours of a layout, use the [calculators](/calculators).
