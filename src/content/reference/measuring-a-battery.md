---
title: "How to measure and identify a battery"
description: "Measure diameter and overall height with calipers, read the printed code, then check voltage. A 3 V reading on a coin cell means lithium, not a 1.5 V button."
updated: 2026-11-22
order: 90
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

To identify an unknown battery, measure its diameter and its overall height with calipers, read any code printed on it, and then check its voltage with a multimeter. Datasheet heights for cylindrical cells are measured terminal to terminal, so the positive button counts: Energizer's drawing for its E91 AA gives an overall height of 49.50 to 50.50 mm and a diameter of 13.50 to 14.50 mm. A coin cell that reads about 3 V is a lithium cell (such as a [CR2032](/cr2032)); alkaline and silver oxide button cells are rated at 1.5 V and 1.55 V. To match measurements against known sizes, use the [identify tool](/identify).

## Read the markings first

The EPA notes that battery types "are identified by marking and labeling, not by the battery's shape or the color of the label." A printed code is the most direct identification. IEC codes describe the cell: on a button or coin cell, the first letter gives the chemistry (C for lithium manganese dioxide, L for alkaline, S for silver oxide) and the digits give the size. The [code decoder](/decode) breaks a code into those parts, and the [naming guide](/reference/battery-naming) explains the system.

When the code is worn off, measurements narrow the options.

## Measuring a cylindrical cell

Measure two dimensions:

- **Diameter:** across the body of the cell.
- **Overall height:** from the tip of the positive terminal to the negative end.

Energizer's E91 drawing shows how a manufacturer dimensions an AA cell:

| Dimension | E91 value |
|---|---|
| Diameter | 13.50 mm minimum, 14.50 mm maximum |
| Overall height, terminal to terminal | 49.50 mm minimum, 50.50 mm maximum |
| Positive terminal height | 1.00 mm minimum |
| Positive terminal diameter | 5.50 mm maximum |
| Negative contact diameter | 7.00 mm minimum |

Wikipedia's battery nomenclature article describes the IEC's cell categories and notes that for cylindrical cells with a protruding positive terminal, the total height of the cell "is not necessarily the same as the total distance between terminals," which accounts for nubs, recesses and casings. Measuring terminal to terminal matches the way datasheets give height.

Real cells sit within a tolerance, not on the nominal number. The [18650](/18650) size is named for 18 mm by 65.0 mm, according to Wikipedia, but Samsung SDI specifies its INR18650-30Q at 18.33 ± 0.07 mm by 64.85 ± 0.15 mm, and Panasonic gives maximums of 18.5 mm and 65.3 mm for its NCR18650B. Compare a measurement with the range, not with the name.

The [actual size](/actual-size) page shows cells at true scale for a quick visual check.

## Measuring a button or coin cell

For button and coin cells with a three- or four-digit size code, the code is the measurement. Wikipedia's button cell article explains that the first one or two digits encode the diameter in whole millimeters, rounded down, and the last two digits give the overall height in tenths of a millimeter. Because the standard uses only a few diameters, each code digit maps to one exact value:

| Diameter code | Nominal diameter | Tolerance |
|---|---|---|
| 4 | 4.8 mm | ±0.15 mm |
| 5 | 5.8 mm | ±0.15 mm |
| 6 | 6.8 mm | ±0.15 mm |
| 7 | 7.9 mm | ±0.15 mm |
| 9 | 9.5 mm | ±0.15 mm |
| 10 | 10.0 mm | ±0.20 mm |
| 11 | 11.6 mm | ±0.20 mm |
| 12 | 12.5 mm | ±0.25 mm |
| 16 | 16.0 mm | ±0.25 mm |
| 20 | 20.0 mm | ±0.25 mm |
| 23 | 23.0 mm | ±0.50 mm |
| 24 | 24.5 mm | ±0.50 mm |

Source: Wikipedia, Button cell. A cell measuring 20.0 mm across and 3.2 mm thick is a 2032 size; 20.0 mm and 2.5 mm is a 2025 ([CR2025](/cr2025)); 6.8 mm and 2.6 mm is a 626 ([SR626SW](/sr626sw)).

Older two-digit codes do not encode dimensions. The two-digit code 44 corresponds to an 11.6 mm diameter: Energizer's 357/303 silver oxide cell (IEC SR44) is 11.60 mm in diameter and 5.40 mm high. Energizer's A76 datasheet adds that its LR44 alkaline cell bulges as it discharges, "but will not exceed the maximum height shown on the battery drawing," so a used cell can measure slightly taller than a new one.

## The 3 V coin and 1.5 V button trap

Button and coin cells of different chemistries can share a size code. Wikipedia's button cell article states that cells of different chemistry made in the same size are mechanically interchangeable, but that the chemistry affects voltage and service life. The nominal voltages, from manufacturer documentation:

| Prefix | Chemistry | Nominal voltage | Source |
|---|---|---|---|
| CR | Lithium manganese dioxide | 3 V | Energizer lithium coin handbook |
| LR | Alkaline | 1.5 V | Energizer A76 (LR44) datasheet |
| SR | Silver oxide | 1.55 V | Energizer 357/303 (SR44) datasheet |
| PR (hearing aid) | Zinc-air | 1.4 V | Energizer zinc air handbook |

Wikipedia notes that common 3 V lithium primary cells "are not made in sizes interchangeable with 1.5 volt cells," and that using a battery of significantly higher voltage than a device is designed for can cause permanent damage. A multimeter reading settles which family an unmarked cell belongs to: roughly 3 V points to lithium, roughly 1.5 V to alkaline or silver oxide. Energizer states that a zinc-air cell is activated by removing its adhesive tab and must have access to air to operate.

## Voltage: open circuit versus under load

A multimeter set to DC volts and touched to the terminals measures open-circuit voltage (OCV), the voltage with no load. Energizer's glossary defines closed-circuit voltage (CCV) as the voltage of a cell "under a specific discharge load and time interval."

Energizer's alkaline handbook states that measuring OCV to estimate remaining service "can be misleading and at best will only yield a rough estimate," and that measuring CCV is more accurate. Its method for a single 1.5 V cylindrical alkaline cell:

1. Place the battery under a load of approximately 10 ohms.
2. Measure the voltage after one to two seconds under load.
3. A fresh cell typically reads about 1.5 V CCV; a cell reading 1.1 V CCV has approximately 20% of its service remaining.

Energizer also notes that commercial battery testers apply a load and voltage calibrated for each chemistry and size.

The gap between the two readings comes from internal resistance. Energizer's handbook gives the example of a cell with 1.6 V open-circuit and 0.1 ohm internal resistance under a 1 A load: 1.0 A x 0.1 ohm = 0.1 V drop, so the closed-circuit voltage is about 1.5 V. Energizer notes that internal resistance generally rises during discharge, which increases the voltage drop under load.

For lithium-ion cells, OCV after rest is a rough state-of-charge indicator. Battery University's BU-702 states that most Li-ion cells read about 3.82 V at 40% charge at room temperature, and recommends resting the cell for 90 minutes after charging or discharging before taking the reading. See [lithium-ion cell safety](/reference/lithium-ion-safety) for charge and discharge limits.
