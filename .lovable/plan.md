

# Add "Construction — Vacuum Lifter" Category

## What

Add one new entry to the equipment taxonomy for battery-powered vacuum lifting equipment used in hardscape and natural stone installation (MQuip, WiMAG, Probst, etc.). This brings the Construction division from 20 to 21 categories and the total taxonomy to 93.

## Changes

### `src/data/categoryDefaults.ts`

1. Update the Construction section comment from "20 categories" to "21 categories"
2. Insert the new entry after "Construction -- Tractor" (alphabetical order within Construction):

| Field | Value |
|-------|-------|
| category | Construction -- Vacuum Lifter |
| division | Construction |
| defaultUsefulLife | 7 |
| defaultResalePercent | 15 |
| unit | Days |
| defaultAllocation | operational |
| notes | Vacuum lifter, stone lifter, paver lifter, suction lifter, MQuip, MK2, Grizzly, Moose, Blizzard, Micro, WiMAG, Probst, stone clamp, slab lifter. Battery-powered self-contained units for natural stone and paver installation |
| maintenancePercent | 5 |
| insurancePercent | 1.0 |
| benchmarkType | hours |
| benchmarkRange | 2,000--3,500 hrs |

No other files need changes. The category dropdown, Category Lifespans page, and AI document parsing all read from `categoryDefaults` dynamically.

## Verification

- Category Lifespans page shows "Construction -- Vacuum Lifter" with 7 yrs useful life and 2,000--3,500 hrs benchmark
- Equipment form category dropdown includes the new entry under Construction
- AI document parser can match keywords like "MQuip", "vacuum lifter", "stone lifter" to this category

