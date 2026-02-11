

# Fix Remaining Stale Category References

## Problem

The v6 taxonomy update was applied to `categoryDefaults.ts` and `demoEquipmentData.ts`, but three other files still use the **old category names**. This causes mismatches in the insurance demo data, the legacy import review component, and an unused mock data file.

## Files to Fix

### 1. `src/data/demoInsuranceData.ts` -- Old categories in demo insurance records

All `InsuredEquipment` and `InsuredEquipment` (unreviewed) entries still use old category strings. These need updating to v6:

| Old | New (v6) |
|---|---|
| `Excavator – Compact (≤ 6 ton)` | `Construction — Excavator — Compact` |
| `Loader – Skid Steer` | `Construction — Loader — Skid Steer` |
| `Vehicle (Light-Duty)` | `Fleet — Truck — 3/4 Ton` |
| `Excavator – Large (12+ ton)` | `Construction — Excavator — Standard` |
| `Loader – Mid-Size` | `Construction — Loader — Backhoe` |
| `Trailer` | `Fleet — Trailer — Flat Deck` |

Approximately 15 occurrences across the free/professional/business/beta tiers.

### 2. `src/components/EquipmentImportReview.tsx` -- Hardcoded old category list + guessCategory function

Two problems in this file:

**a) Lines 112-131**: A hardcoded `CATEGORIES` array with 18 old category names. This needs to be replaced with the v6 taxonomy categories (imported from `categoryDefaults.ts`).

**b) Lines 247-298**: The `guessCategory()` function returns old category strings like `'Vehicle (Light-Duty)'`, `'Loader – Skid Steer Mini'`, `'Excavator – Compact (≤ 6 ton)'`, etc. All return values need updating to v6 equivalents.

### 3. `src/data/mockEquipment.ts` -- Unused legacy mock data

This file is **not imported anywhere** in the codebase. It contains 10 equipment items all using old category names. Since it's dead code, the cleanest fix is to **delete it entirely**.

### 4. `src/types/equipment.ts` line 201 -- Minor comment reference

A comment says `"Mini Skid paid off"` as an example. This is cosmetic but should say `"Stand-On paid off"` for consistency.

## Summary of Changes

| File | Action |
|---|---|
| `src/data/demoInsuranceData.ts` | Update ~15 category strings to v6 format |
| `src/components/EquipmentImportReview.tsx` | Replace hardcoded CATEGORIES with import from categoryDefaults; update all guessCategory return values to v6 |
| `src/data/mockEquipment.ts` | Delete (unused, no imports) |
| `src/types/equipment.ts` | Update comment on line 201 from "Mini Skid" to "Stand-On" |

