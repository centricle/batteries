---
title: "Rechargeable vs. disposable AA batteries"
description: "NiMH runs at 1.2 V and recharges hundreds to 2,100 times; alkaline and lithium AA run at 1.5 V once; 1.5 V Li-ion holds 1.5 V until nearly empty."
updated: 2026-11-22
order: 80
related: [aa, aaa, 14500, 9v, c, d]
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
  - title: "Nickel Metal Hydride Handbook and Application Manual (version NiMH02.01)"
    publisher: "Energizer"
    url: "https://data.energizer.com/wp-content/uploads/2020/11/nimhhandbook_ver2-2.pdf"
    accessed: 2026-11-22
  - title: "eneloop Catalogue 2015-2016"
    publisher: "Panasonic"
    url: "https://www.peak-system.com/produktcd/Tools/PCAN-Diag%20FD/Documentation/Addendum%20Batteries/Panasonic_Eneloop_Catalog_2015-2016.pdf"
    accessed: 2026-11-22
  - title: "Li-Ion batteries AA type 2000 (1312-0036) product datasheet"
    publisher: "Ansmann"
    url: "https://shop.ansmann.de/media/datasheets/1312-0036_Li-Ion-batteries-AA-type-2000-(min.-1800-mAh)-4pcs.-paper-blister_DS_EN.pdf"
    accessed: 2026-11-22
  - title: "XTAR 1.5V AA 2500mAh (4150mWh) Li-ion datasheet"
    publisher: "XTAR"
    url: "https://files.batteryjunction.com/frontend/files/xtar/datasheet/XTAR-AA-LI-ION-4150-Datasheet.pdf"
    accessed: 2026-11-22
  - title: "AA battery"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/AA_battery"
    accessed: 2026-11-22
  - title: "BU-302: Series and Parallel Battery Configurations"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-302-series-and-parallel-battery-configurations"
    accessed: 2026-11-22
  - title: "BU-802b: What does Elevated Self-discharge do?"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-802b-what-does-elevated-self-discharge-do"
    accessed: 2026-11-22
---

Alkaline and lithium AA batteries are single-use and rated at 1.5 V; rechargeable NiMH AA batteries are rated at 1.2 V (Energizer lists 1.25 V), and rechargeable lithium-ion AA batteries use a built-in converter to give a regulated 1.5 V. Which one costs less depends on the price, the charger and how many times the batteries are actually recharged, and the formula at the end of this page works it out. The four differ in voltage, in how the voltage holds up, in reuse and in how much charge they lose in storage. Energizer describes the alkaline discharge curve as sloping (the voltage falls steadily as the battery is used) and the lithium curve as flat (it stays level). Panasonic rates its eneloop AA for up to 2,100 charge cycles.

## Side by side

Each column below is a specific product, because published values belong to products rather than to kinds of battery in general.

| Property | Alkaline (Energizer E91) | Lithium iron disulfide (Energizer L91) | NiMH (Panasonic eneloop BK-3MCCE) | 1.5 V lithium-ion (Ansmann 1312-0036; XTAR AA) |
|---|---|---|---|---|
| Voltage (nominal) | 1.5 V | 1.5 V | 1.2 V | 1.5 V, regulated |
| Voltage during discharge | Sloping | Flat | Flat | Holds 1.5 V for about 95% of runtime, then drops to 1.1 V (Ansmann) |
| Capacity | About 2,600 mAh at 25 mA; about 1,350 mAh at 500 mA (to 0.8 V) | Not stated as a single figure in the handbook | 1,900 mAh minimum | 2,000 mAh nominal, 1,800 mAh minimum, 3.26 Wh (Ansmann); 2,500 mAh, 4,150 mWh (XTAR) |
| Recharge cycles | Single use | Single use | Up to 2,100 | Up to 1,500 (Ansmann); 1,200 (XTAR) |
| Storage loss | About 3% per year at 20°C; 10-year shelf life at 21°C | About 95% of capacity retained after 20+ years | 70% of charge retained after up to 10 years | Not stated |
| Operating temperature | -18°C to 55°C | -40°C to 60°C | -5°C to 50°C (discharge); 0°C to 40°C (charge) | -20°C to 60°C; XTAR charge 0°C to 45°C |
| Maximum continuous current | Not stated | Not stated | Not stated | 2 A (both) |
| Weight | 23.0 g | About 33% less than alkaline | Not stated | 19.5 g (XTAR) |

Sources: Energizer E91 datasheet and alkaline handbook; Energizer lithium handbook; Panasonic eneloop catalog 2015-2016; Ansmann and XTAR datasheets. The E91 capacities are approximate readings from Energizer's bar chart. Panasonic's cycle and retention figures come from its internal testing to IEC 61951-2. The NiMH rated voltage is Battery University's figure for nickel-based batteries; Energizer's NiMH handbook rates NiMH at 1.25 V.

## How they behave in a device

Energizer's NiMH handbook summarizes the trade-offs between NiMH and the two single-use kinds:

- **Against alkaline:** NiMH "lasts longer in high drain, less in light drain devices than alkaline," and NiMH discharge is flat where alkaline is sloped.
- **Against single-use lithium:** NiMH "will not last as long as primary lithium (single cycle)," and both have relatively flat discharge curves.
- **Reuse:** "several hundred cycles for NiMH," a figure from Energizer's 2010 handbook.

Wikipedia's AA battery article adds that NiMH and lithium-ion AA batteries "can supply most of their capacity even when under a high current drain (0.5A and higher)," unlike alkaline and zinc-chloride batteries. Energizer's E91 chart shows the alkaline side of that: capacity at 500 mA is roughly half of capacity at 25 mA.

A 1.5 V lithium-ion AA contains a lithium-ion cell and a step-down (buck) converter, according to Wikipedia. The converter holds the output near 1.5 V for most of the discharge. Ansmann's datasheet states that its battery holds 1.5 V for 95% of the runtime and drops to 1.1 V at about 5% remaining capacity "to signal to the user that the battery needs to be replaced." XTAR lists a "voltage at low power" of 1.1 V. Wikipedia describes the output of these batteries as having "virtually no drop over the discharge cycle, unlike other disposable or rechargeable cells."

Plain lithium-ion batteries in the AA size are a different product: Wikipedia notes they are rated 3.6 to 3.7 V and are named [14500](/14500) rather than AA.

## Reading capacity labels

Capacities in mAh compare fairly only at the same voltage and test conditions (see [what mAh and Wh mean](/reference/capacity-explained)). For 1.5 V lithium-ion batteries, Wikipedia notes that some brands advertise milliwatt-hours rather than milliamp-hours, so a label claiming 3,000 mWh or more may correspond to about 2,000 mAh. Converting the datasheet figures shows the basis:

- **Ansmann:** 3.26 Wh / 2.0 Ah = 1.63 V.
- **XTAR:** 4.15 Wh / 2.5 Ah = 1.66 V.

Both results are above the 1.5 V output, so neither datasheet's energy figure is stated at the 1.5 V the device receives, and neither datasheet states the basis.

## After time on a shelf

Single-use batteries are ready after years on a shelf. Energizer states that cylindrical alkaline batteries lose about 3% of capacity per year at 20°C, and that its lithium AA batteries retain about 95% of capacity after more than 20 years.

Standard NiMH loses charge faster. Energizer's NiMH handbook gives typical retention of 50% to 80% after 12 months, and Battery University notes that NiMH "need recharging before use when placed on a shelf for a few weeks." Low self-discharge NiMH narrows the gap: Panasonic states eneloop batteries keep 70% of their charge for up to 10 years. Full figures are in the [storing batteries and shelf life](/reference/shelf-life-and-storage) guide.

## Which costs less: the formula

Prices change and vary by region, so this page does not give a number. The comparison can be calculated from four inputs:

- **P_d:** price of one disposable battery
- **P_r:** price of one rechargeable battery
- **C:** price of the charger, and **k:** the number of batteries it will serve over its life
- **N:** the number of full cycles each rechargeable battery is actually used for before it is retired (at most its rated cycle life, and often fewer)

Then:

- Cost per use, disposable = **P_d**
- Cost per use, rechargeable = **(P_r + C / k) / N**, plus the electricity per charge
- Break-even number of uses = **(P_r + C / k) / P_d**

Two adjustments make the comparison fairer. First, divide each cost by the energy actually delivered per use in the device in question, because alkaline capacity falls as current rises (see the E91 figures above). Second, if a device sits unused between charges, standard NiMH self-discharge reduces the energy available per cycle.

For sizes and other names, see the [AA](/aa) and [AAA](/aaa) pages.
