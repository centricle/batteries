---
title: "Lithium-ion cell safety"
description: "Most lithium-ion cells charge to 4.2 V by constant current, then constant voltage, and discharge to 2.5 V. LFP cells charge to 3.65 V."
updated: 2026-11-22
order: 40
related: [18650, 21700, 26650, 14500, 16340, 18350, 10440, 4680]
sources:
  - title: "BU-409: Charging Lithium-ion"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-409-charging-lithium-ion"
    accessed: 2026-11-22
  - title: "BU-205: Types of Lithium-ion"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-205-types-of-lithium-ion"
    accessed: 2026-11-22
  - title: "BU-410: Charging at High and Low Temperatures"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-410-charging-at-high-and-low-temperatures"
    accessed: 2026-11-22
  - title: "BU-304a: Safety Concerns with Li-ion"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-304a-safety-concerns-with-li-ion"
    accessed: 2026-11-22
  - title: "BU-304b: Making Lithium-ion Safe"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-304b-making-lithium-ion-safe"
    accessed: 2026-11-22
  - title: "BU-702: How to Store Batteries"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-702-how-to-store-batteries"
    accessed: 2026-11-22
  - title: "BU-802b: What does Elevated Self-discharge do?"
    publisher: "Battery University"
    url: "https://batteryuniversity.com/article/bu-802b-what-does-elevated-self-discharge-do"
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
  - title: "Lithium-ion Battery Safety: Hazards"
    publisher: "Occupational Safety and Health Administration"
    url: "https://www.osha.gov/lithium-ion-battery-safety/hazards"
    accessed: 2026-11-22
  - title: "PackSafe: Lithium Batteries"
    publisher: "Federal Aviation Administration"
    url: "https://www.faa.gov/hazmat/packsafe/lithium-batteries"
    accessed: 2026-11-22
  - title: "Used Lithium-Ion Batteries"
    publisher: "U.S. Environmental Protection Agency"
    url: "https://www.epa.gov/recycle/used-lithium-ion-batteries"
    accessed: 2026-11-22
  - title: "Safety"
    publisher: "The Battery Network (formerly Call2Recycle)"
    url: "https://www.call2recycle.org/safety"
    accessed: 2026-11-22
  - title: "Li-Ion batteries AA type 2000 (1312-0036) product datasheet"
    publisher: "Ansmann"
    url: "https://shop.ansmann.de/media/datasheets/1312-0036_Li-Ion-batteries-AA-type-2000-(min.-1800-mAh)-4pcs.-paper-blister_DS_EN.pdf"
    accessed: 2026-11-22
  - title: "XTAR 1.5V AA 2500mAh (4150mWh) Li-ion datasheet"
    publisher: "XTAR"
    url: "https://files.batteryjunction.com/frontend/files/xtar/datasheet/XTAR-AA-LI-ION-4150-Datasheet.pdf"
    accessed: 2026-11-22
  - title: "Cylindrical Primary Lithium Handbook and Application Manual (L91/L92)"
    publisher: "Energizer"
    url: "https://data.energizer.com/pdfs/lithiuml91l92_appman.pdf"
    accessed: 2026-11-22
---

Most lithium-ion cells with cobalt, nickel, manganese or aluminum cathodes are charged to 4.20 V per cell using a constant-current, then constant-voltage (CC/CV) method, and discharged no lower than 2.5 V. Lithium iron phosphate (LFP) cells charge to 3.65 V. Manufacturers prohibit trickle charging after full charge and specify temperature windows for charging. A cell with a damaged sleeve, a dented or swollen can, or an electrolyte smell should not be used, according to Samsung SDI's cell specification.

## Charging: constant current, then constant voltage

Battery University's BU-409 describes Li-ion charging in two stages. In the first, the charger supplies a constant current until the cell reaches its voltage limit. In the second, the charger holds that voltage while the current falls; the cell is full when the current drops to between 3 and 5 percent of its Ah rating. Battery University states that Li-ion "cannot absorb overcharge": once full, charging must stop, because a continuous trickle charge can plate metallic lithium and compromise safety.

Manufacturer datasheets state the same method with specific numbers:

| Cell | Charge method | Charge voltage | Charge termination | Discharge cutoff | Charge temperature |
|---|---|---|---|---|---|
| Panasonic NCR18650B | CC-CV, 0.5C max | 4.20 V | 65 mA | 2.50 V | 0 to 45°C |
| Molicel INR-18650-P28A | CC-CV, 2.8 A standard | 4.2 V | 50 mA | 2.5 V | 0 to 60°C |
| Samsung INR18650-30Q | CC-CV, 1.5 A standard | 4.20 ± 0.05 V | 150 mA | 2.5 V | 0 to 50°C |

Panasonic's datasheet adds that below 10°C the NCR18650B should be charged at a 0.25C rate. Battery University gives the general tolerance for 4.20 V chemistries as ±50 mV per cell and notes that some high-capacity cells are rated to 4.30 V; the cell's own datasheet governs.

### Lithium iron phosphate

[LFP](/chemistry/lithium-iron-phosphate) cells use a lower voltage window. Battery University's BU-205 lists LFP at 3.20 to 3.30 V nominal, with a typical operating range of 2.5 to 3.65 V per cell, and states that LFP "charges to 3.65V." A charger set for 4.2 V cells is not set correctly for LFP. Battery University also notes that lithium systems, LFP included, should not receive the float charge that lead-acid chargers apply.

### Temperature limits

Battery University's BU-410 states that Li-ion can be fast-charged from 5°C to 45°C (41°F to 113°F), that charge current should be reduced below 5°C, and that "no charging is permitted at freezing temperatures." Discharge is allowed across a wider range: Molicel rates the P28A for discharge from -40°C to 60°C, and Panasonic rates the NCR18650B from -20°C to 60°C.

## Discharge cutoff

All three datasheets above set the end of discharge at 2.5 V. Battery University's BU-802b states that lithium-ion should not be discharged below 2.50 V per cell, that the protection circuit in a pack turns off below that point, and that copper dendrites can grow if a cell dwells at low voltage for longer than a week, raising self-discharge and potentially compromising safety.

## Protected and unprotected cells

A cell datasheet sets limits; something else has to enforce them. Battery University's BU-304b calls a protection circuit mandatory for Li-ion packs and lists some or all of these safeguards, with safety governed by IEC 62133:

- an electronic circuit that keeps any cell from exceeding 4.30 V on charge;
- a control circuit that cuts the current at about 2.20 V per cell to prevent over-discharge;
- a fuse that opens if a cell's skin temperature approaches 90°C; and
- inside the cell, a PTC device and a circuit interrupt device (CID) that opens at a cell pressure of 1,000 kPa (145 psi).

Battery University adds that protection circuits only guard against outside abuse such as a short or a faulty charger; they cannot stop an internal defect once it starts. Samsung SDI's specification for the INR18650-30Q states that the battery "should be designed to be connected only to the specified charger and system."

Some single cells sold at retail carry their own circuit. Ansmann's datasheet for its 1.5 V lithium-ion AA (1312-0036) lists integrated protective circuitry against overcharging, overload, short circuit and deep discharge, and XTAR's datasheet for its 1.5 V AA lists the cell as protected. A cell without such a circuit relies on the charger and the device to keep it within its datasheet limits.

## The sleeve and the can

The plastic sleeve on a cylindrical cell is electrical insulation. Samsung SDI's specification states that the cell "equips with an insulating sleeve to protect short-circuit," that a damaged sleeve "may cause short-circuit with some wiring inside the battery," and that a cell "should not be used if sleeve-damage, can-distorsion and/or electrolyte-smell is detected." Energizer makes the same point about the label on its lithium primary cells: heat above 60°C can shrink the label and expose the steel can to external short circuits.

## Thermal runaway

OSHA defines thermal runaway as a chain reaction in which heat released by one failing cell damages nearby cells. OSHA lists internal short circuits from manufacturing defects, mechanical damage, excessive heat or cold, and improper charging as causes, and identifies a rise in battery temperature, fire, or venting of gas, vapor or smoke as indicators. The FAA lists damage, overheating, water exposure, overcharging, improper packing and manufacturing defects, and notes that thermal runaway "can occur without warning."

Battery University's BU-304a reports that the gas from a venting Li-ion cell is mainly carbon dioxide, with hydrogen fluoride at 20 to 200 mg per Wh and phosphoryl fluoride at 15 to 22 mg per Wh, and that a pack can fail in seconds or over several hours as cells ignite in sequence. OSHA lists hydrogen fluoride, hydrogen chloride, hydrogen cyanide and carbon monoxide among the hazards of a lithium-ion fire.

## Storage state of charge

Published storage guidance points to a partial charge, a cool location and a dry environment:

- **Battery University (BU-702):** store at around 40 percent state of charge, which most Li-ion cells show as about 3.82 V open-circuit at room temperature after a 90-minute rest; the recommended storage temperature for most batteries is 15°C (59°F).
- **Samsung SDI (INR18650-30Q):** cells ship at 50 ± 5 percent state of charge, and for storage of 3 months or more the specification "strongly" recommends a dry, low-temperature location.
- **Panasonic (NCR18650B):** storage temperature range -20°C to 50°C.

Battery University notes that Li-ion loses more capacity when stored fully charged than at 40 percent. Self-discharge figures by chemistry are on the [shelf life and storage](/reference/shelf-life-and-storage) page.

## Swollen, damaged or recalled cells

Published guidance for a swollen, leaking, punctured or overheating lithium-ion battery:

- **Stop using it.** Samsung SDI: do not use a cell with sleeve damage, a distorted can or an electrolyte smell.
- **Move it away from anything that burns.** Battery University: if a battery overheats, hisses or bulges, move the device away from flammable materials onto a non-combustible surface.
- **Isolate it.** The Battery Network (formerly Call2Recycle): isolate the battery immediately and place it in non-flammable material such as sand or kitty litter.
- **Keep it out of the trash.** The Battery Network: never put a damaged battery in the trash, in water, in home recycling bins or in its collection boxes.
- **Contact the manufacturer.** The EPA and The Battery Network both direct owners to the battery or device manufacturer for handling, shipping and disposal instructions. The Battery Network notes that trained drop-off sites in Illinois, New York, Vermont and Washington, D.C. may accept damaged batteries.

The FAA prohibits damaged or recalled batteries on passenger aircraft unless the battery has been removed or made safe. Disposal rules are on the [recycling and disposal](/reference/recycling-and-disposal) page.
