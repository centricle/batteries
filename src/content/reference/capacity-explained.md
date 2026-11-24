---
title: "What mAh and Wh mean"
description: "mAh measures charge and Wh measures energy (Ah x V). A single-use battery's mAh rating holds only at the load, cutoff voltage and temperature it was tested at."
updated: 2026-11-22
order: 100
related: [aa, aaa, 18650, lr44, 9v]
sources:
  - title: "Energizer E91 product datasheet"
    publisher: "Energizer"
    url: "https://www.farnell.com/datasheets/1968873.pdf"
    accessed: 2026-11-22
  - title: "Alkaline Manganese Dioxide Handbook and Application Manual"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/alkaline_appman.pdf"
    accessed: 2026-11-22
  - title: "Cylindrical Primary Lithium Handbook and Application Manual (L91/L92)"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/lithiuml91l92_appman.pdf"
    accessed: 2026-11-22
  - title: "Energizer Battery Glossary and FAQs"
    publisher: "Energizer"
    url: "https://data.energizer.com/battery-glossary-faq/"
    accessed: 2026-11-22
  - title: "Energizer A76 product datasheet"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/A76.pdf"
    accessed: 2026-11-22
  - title: "BU-402: What Is C-rate?"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-402-what-is-c-rate"
    accessed: 2026-11-22
  - title: "Peukert's law"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/Peukert%27s_law"
    accessed: 2026-11-22
  - title: "NCR18650B datasheet"
    publisher: "Panasonic"
    url: "https://files.batteryjunction.com/frontend/files/Panasonic-NCR18650B.pdf"
    accessed: 2026-11-22
  - title: "INR-18650-P28A product data sheet"
    publisher: "E-One Moli Energy (Molicel)"
    url: "https://www.rosebatteries.com/hubfs/INR18650P28A-V2-80093.pdf"
    accessed: 2026-11-22
  - title: "INR18650-30Q specification (version 0.0)"
    publisher: "Samsung SDI"
    url: "https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/196/samsung_5F00_30q_5F00_data_5F00_sheet.pdf"
    accessed: 2026-11-22
  - title: "eneloop Catalogue 2015-2016"
    publisher: "Panasonic"
    url: "https://www.peak-system.com/produktcd/Tools/PCAN-Diag%20FD/Documentation/Addendum%20Batteries/Panasonic_Eneloop_Catalog_2015-2016.pdf"
    accessed: 2026-11-22
  - title: "XTAR 1.5V AA 2500mAh (4150mWh) Li-ion datasheet"
    publisher: "XTAR"
    url: "https://files.batteryjunction.com/frontend/files/xtar/datasheet/XTAR-AA-LI-ION-4150-Datasheet.pdf"
    accessed: 2026-11-22
---

To compare two batteries' capacity, compare figures taken at the same load, cutoff voltage and temperature, and compare watt-hours when their voltages differ. Milliamp-hours (mAh) measure electric charge; watt-hours (Wh) measure energy, and Wh equals amp-hours multiplied by voltage. A capacity figure for a single-use battery is valid only for the load (how much current the device draws), the cutoff voltage (the voltage at which the device stops working) and the temperature it was measured at. Energizer's E91 alkaline AA datasheet shows roughly 2,600mAh at a 25mA continuous drain but roughly 1,350mAh at 500mA, both measured to 0.8V at 21°C.

## mAh and Wh

Energizer's glossary defines capacity as output capability over a period of time, expressed in ampere-hours, and energy as ampere-hour capacity multiplied by the average closed-circuit discharge voltage, expressed in watt-hours. The distinction matters whenever two batteries have different voltages. A 1.2V NiMH battery and a 1.5V alkaline battery with the same mAh rating do not store the same energy, and a 3.6V lithium-ion battery stores about three times the energy of a 1.2V battery of equal mAh.

Some datasheets give both. Molicel's INR-18650-P28A data sheet lists a typical capacity of 2800mAh (10.3Wh) and a minimum of 2700mAh (9.56Wh), rated at 3.6V.

## Comparing two batteries

A fair comparison holds the test conditions constant:

1. **Same load.** Compare at the same current, power or resistance, or at the same C-rate.
2. **Same cutoff voltage.** A 0.8V and a 1.0V cutoff give different results for the same battery.
3. **Same temperature.** Most ratings are at 20°C to 25°C.
4. **Watt-hours when voltages differ.** Multiply capacity by voltage before comparing kinds of battery.
5. **Like with like.** Minimum against minimum, typical against typical.
6. **Check that the figures agree.** XTAR's 1.5V lithium-ion AA datasheet lists 2500mAh and 4150mWh at a rated 1.5V. Dividing the energy by the capacity gives 1.66V, so the two figures were not measured on the same basis, and the datasheet does not state the basis of either.

To run the arithmetic for packs and runtimes, see the [calculators](/calculators).

## Why capacity depends on the device

Energizer's alkaline handbook defines capacity as the drain rate multiplied by the hours the battery runs before reaching a cutoff voltage. Its example is an AA alkaline battery discharged at 100mA: it runs 25 hours to 0.8V (2,500mAh), but only 15 hours to 1.2V (1,500mAh). The same battery, on the same load, has two different capacities depending on where the device stops working.

The drain rate has a similar effect. Energizer states that "batteries are more efficient at lower drain rates." The bar chart on the E91 datasheet shows the trend for continuous discharge to 0.8V at 21°C:

| Continuous drain | E91 capacity (read from Energizer's chart) |
|---|---|
| 25mA | about 2,600mAh |
| 100mA | about 2,250mAh |
| 250mA | about 1,750mAh |
| 500mA | about 1,350mAh |

Values are approximate readings of a bar chart; Energizer does not print the numbers.

Two mechanisms drive this, per Energizer's handbook. Internal resistance (150 to 300 milliohms for a fresh E91) causes a voltage drop equal to current times resistance, so a heavier load reaches the cutoff voltage sooner. And the chemical reaction depends on how quickly water and hydroxyl ions can move to the electrode surfaces, which limits how fast the battery can deliver its stored charge. Energizer also notes that in pulse applications a very light duty cycle typically allows the battery time to recover, extending service compared with a continuous drain.

The rate effect was first described for lead-acid batteries. Wikipedia's article on Peukert's law notes that Wilhelm Peukert presented the relation in 1897 to approximate how the available capacity of lead-acid batteries falls as the discharge rate rises. Alkaline batteries show the same direction of effect, but Peukert's equation was formulated for lead-acid and is not part of alkaline datasheets.

### The cutoff voltage

Energizer recommends a minimum cutoff of 0.8V per alkaline cell, because deep discharge increases internal gassing, and states that about 95% of an alkaline battery's usable capacity has been removed by the time it reaches 0.8V. A device that shuts off at a higher voltage leaves more of the battery's capacity unused.

Small batteries are rated the same way. Energizer's A76 ([LR44](/lr44)) datasheet gives a typical capacity of 150mAh on a 6.8 kilohm continuous load to 0.9V at 21°C, with the note that capacity "varies according to the applied load, temperature, and cutoff voltage."

## C-rate

C-rate expresses current relative to capacity. Battery University's BU-402 defines 1C as the current that discharges a full battery in one hour: a 1Ah battery delivers 1A for an hour at 1C, 500mA for two hours at 0.5C, and 2A for 30 minutes at 2C. Battery University states that a higher C-rate produces a lower capacity reading, and that makers commonly rate alkaline and lead-acid batteries at 0.05C, a 20-hour discharge.

Rating rates vary by product. Samsung SDI rates its INR18650-30Q at 3,000mAh nominal on a 0.2C discharge to 2.5V. When two datasheets use different C-rates, their capacity figures are not directly comparable.

## Rated, minimum and typical capacity

Many datasheets give more than one number, and the labels do not mean the same thing:

| Battery | Figures given |
|---|---|
| Panasonic NCR18650B | Rated capacity min. 3200mAh (at 20°C); capacity min. 3250mAh, typ. 3350mAh (at 25°C) |
| Molicel INR-18650-P28A | Typical 2800mAh; minimum 2700mAh |
| Samsung INR18650-30Q | Nominal 3,000mAh (0.2C discharge to 2.5V) |
| Panasonic eneloop AA (BK-3MCCE) | Minimum 1900mAh |

A typical value describes an average battery off the production line; a minimum value is the lowest the maker commits to. Comparing one battery's typical figure with another's minimum overstates the difference.

## Temperature

Cold reduces the capacity a battery can deliver. Energizer's alkaline handbook gives a recommended operating range of -18°C to 55°C and explains that low temperature slows ion diffusion and raises internal resistance, so high-drain devices lose more performance in the cold than light-drain devices. Energizer adds that "no capacity is actually lost due to cold temperatures": a battery that warms back up recovers its performance.

Kinds of battery differ in how far they extend into the cold. Energizer rates its lithium iron disulfide L91 and L92 batteries from -40°C to 60°C and states they deliver approximately full rated capacity at -40°C on a 25mA drain. Panasonic rates the NCR18650B for discharge from -20°C to 60°C, and its 2015-2016 eneloop catalog gives a usable discharge range of -5°C to 50°C for eneloop NiMH batteries.
