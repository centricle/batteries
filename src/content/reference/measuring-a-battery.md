---
title: "How to measure and identify a battery"
description: "Read the name printed on it first, then measure how wide and how long it is with calipers, and check the voltage. A coin battery that reads 3V is lithium, not a 1.5V button battery."
updated: 2026-11-22
order: 70
related: [aa, aaa, cr2032, cr2025, cr2016, lr44, sr626sw, 18650, 14500]
sources:
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
  - title: "Alkaline Manganese Dioxide Handbook and Application Manual"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/alkaline_appman.pdf"
    accessed: 2026-11-22
  - title: "Primary Lithium Coin Handbook and Application Manual"
    publisher: "Energizer"
    url: "https://data.energizer.com/wp-content/uploads/2026/05/Lithium-Coin-app-manual-0526.pdf"
    accessed: 2026-11-22
  - title: "Zinc Air Handbook and Application Manual"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/zincair_appman.pdf"
    accessed: 2026-11-22
  - title: "Energizer Battery Glossary and FAQs"
    publisher: "Energizer"
    url: "https://data.energizer.com/battery-glossary-faq/"
    accessed: 2026-11-22
  - title: "Button cell"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/Button_cell"
    accessed: 2026-11-22
  - title: "Battery nomenclature"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/Battery_nomenclature"
    accessed: 2026-11-22
  - title: "18650 battery"
    publisher: "Wikipedia"
    url: "https://en.wikipedia.org/wiki/18650_battery"
    accessed: 2026-11-22
  - title: "INR18650-30Q specification (version 0.0)"
    publisher: "Samsung SDI"
    url: "https://e2e.ti.com/cfs-file/__key/communityserver-discussions-components-files/196/samsung_5F00_30q_5F00_data_5F00_sheet.pdf"
    accessed: 2026-11-22
  - title: "NCR18650B datasheet"
    publisher: "Panasonic"
    url: "https://files.batteryjunction.com/frontend/files/Panasonic-NCR18650B.pdf"
    accessed: 2026-11-22
  - title: "BU-702: How to Store Batteries"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-702-how-to-store-batteries"
    accessed: 2026-11-22
  - title: "Used Household Batteries"
    publisher: "U.S. Environmental Protection Agency"
    url: "https://www.epa.gov/recycle/used-household-batteries"
    accessed: 2026-11-22
---

To identify an unknown battery, read any name or number printed on it first. If there is none, measure how wide it is and how long it is from end to end with calipers, then check its voltage with a multimeter. Datasheets measure the length of a cylindrical battery from terminal to terminal, so the raised positive end counts: Energizer's drawing for its E91 AA gives an overall length of 49.50 to 50.50mm and a width of 13.50 to 14.50mm. A coin battery that reads about 3V is lithium (such as a [CR2032](/cr2032)); alkaline and silver oxide button batteries are rated at 1.5V and 1.55V. To match measurements against known sizes, use the [identify tool](/identify).

## Read the name on it first

The EPA notes that battery types "are identified by marking and labeling, not by the battery's shape or the color of the label." A printed name is the most direct way to tell. Standard (IEC) names describe the battery: on a button or coin battery, the first letter gives the kind (C for lithium manganese dioxide, L for alkaline, S for silver oxide) and the digits give the size. The [battery name decoder](/decode) breaks a name into those parts, and the [naming guide](/reference/battery-naming) explains the system.

When the name is worn off, measurements narrow the options.

## Measuring a cylindrical battery

Measure two things:

- **Width (diameter):** across the body of the battery.
- **Overall length (height):** from the tip of the positive terminal to the negative end.

Energizer's E91 drawing shows how a maker measures an AA battery:

| Measurement | E91 value |
|---|---|
| Width (diameter) | 13.50mm minimum, 14.50mm maximum |
| Overall length, terminal to terminal (height) | 49.50mm minimum, 50.50mm maximum |
| How far the positive terminal sticks out (height) | 1.00mm minimum |
| Width of the positive terminal (diameter) | 5.50mm maximum |
| Width of the negative contact (diameter) | 7.00mm minimum |

Wikipedia's battery nomenclature article describes the IEC's battery categories and notes that for cylindrical batteries with a raised positive terminal, the total height of the battery "is not necessarily the same as the total distance between terminals," which accounts for nubs, recesses and casings. Measuring terminal to terminal matches the way datasheets give the length.

Real batteries sit within a tolerance (an allowed range), not exactly on the nominal number in the name. The [18650](/18650) size is named for 18mm by 65.0mm, according to Wikipedia, but Samsung SDI specifies its INR18650-30Q at 18.33 ± 0.07mm by 64.85 ± 0.15mm, and Panasonic gives maximums of 18.5mm and 65.3mm for its NCR18650B. Compare a measurement with the range, not with the name.

The [actual size](/actual-size) page shows batteries at true scale for a quick visual check.

## Measuring a button or coin battery

For button and coin batteries with a three- or four-digit size number in the name, the number is the measurement. Wikipedia's button cell article explains that the first one or two digits give the width (diameter) in whole millimeters, rounded down, and the last two digits give the overall thickness (height) in tenths of a millimeter. Because the standard uses only a few widths, each number maps to one exact value:

| Number in the name | Width (nominal diameter) | Tolerance |
|---|---|---|
| 4 | 4.8mm | ±0.15mm |
| 5 | 5.8mm | ±0.15mm |
| 6 | 6.8mm | ±0.15mm |
| 7 | 7.9mm | ±0.15mm |
| 9 | 9.5mm | ±0.15mm |
| 10 | 10.0mm | ±0.20mm |
| 11 | 11.6mm | ±0.20mm |
| 12 | 12.5mm | ±0.25mm |
| 16 | 16.0mm | ±0.25mm |
| 20 | 20.0mm | ±0.25mm |
| 23 | 23.0mm | ±0.50mm |
| 24 | 24.5mm | ±0.50mm |

Source: Wikipedia, Button cell. A battery measuring 20.0mm across and 3.2mm thick is a 2032 size; 20.0mm and 2.5mm is a 2025 ([CR2025](/cr2025)); 6.8mm and 2.6mm is a 626 ([SR626SW](/sr626sw)).

Older two-digit names do not encode the size. The two-digit number 44 corresponds to 11.6mm across: Energizer's 357/303 silver oxide battery (IEC SR44) is 11.60mm across and 5.40mm thick. Energizer's A76 datasheet adds that its LR44 alkaline battery bulges as it discharges, "but will not exceed the maximum height shown on the battery drawing," so a used battery can measure slightly thicker than a new one.

## A 3-volt coin battery is not a 1.5-volt button battery

Button and coin batteries of different kinds can share a size number. Wikipedia's button cell article states that batteries of different kinds made in the same size fit the same way, but that the kind affects voltage and how long the battery lasts. The rated voltages, from makers' documents:

| First letters | Kind | Voltage | Source |
|---|---|---|---|
| CR | Lithium manganese dioxide | 3V | Energizer lithium coin handbook |
| LR | Alkaline | 1.5V | Energizer A76 (LR44) datasheet |
| SR | Silver oxide | 1.55V | Energizer 357/303 (SR44) datasheet |
| PR (hearing aid) | Zinc-air | 1.4V | Energizer zinc air handbook |

Wikipedia notes that common 3V single-use lithium batteries "are not made in sizes interchangeable with 1.5 volt cells," and that using a battery of significantly higher voltage than a device is designed for can cause permanent damage. A multimeter reading settles which family an unmarked battery belongs to: roughly 3V points to lithium, roughly 1.5V to alkaline or silver oxide. Energizer states that a zinc-air battery is activated by removing its adhesive tab and must have access to air to operate.

## Checking the voltage with a meter

A multimeter set to DC volts and touched to the terminals measures open-circuit voltage (OCV), the voltage with no load. Energizer's glossary defines closed-circuit voltage (CCV) as the voltage of a battery "under a specific discharge load and time interval."

Energizer's alkaline handbook states that measuring OCV to estimate remaining service "can be misleading and at best will only yield a rough estimate," and that measuring CCV is more accurate. Its method for a single 1.5V cylindrical alkaline battery:

1. Place the battery under a load of approximately 10 ohms.
2. Measure the voltage after one to two seconds under load.
3. A fresh battery typically reads about 1.5V CCV; a battery reading 1.1V CCV has approximately 20% of its service remaining.

Energizer also notes that commercial battery testers apply a load and voltage calibrated for each kind and size.

The gap between the two readings comes from internal resistance. Energizer's handbook gives the example of a battery with 1.6V open-circuit and 0.1 ohm internal resistance under a 1A load: 1.0A x 0.1 ohm = 0.1V drop, so the closed-circuit voltage is about 1.5V. Energizer notes that internal resistance generally rises during discharge, which increases the voltage drop under load.

For lithium-ion batteries, OCV after rest is a rough state-of-charge indicator. Battery University's BU-702 states that most lithium-ion batteries read about 3.82V at 40% charge at room temperature, and recommends resting the battery for 90 minutes after charging or discharging before taking the reading. See [lithium-ion battery safety](/reference/lithium-ion-safety) for charge and discharge limits.
