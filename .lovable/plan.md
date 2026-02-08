

# Fix: Overhead Allocation Display Bug

## Problem

The Equipment Details Sheet shows **-99%** for Overhead because of a math error on line 258 of `EquipmentDetailsSheet.tsx`:

```
formatPercent(1 - equipment.cogsPercent)
```

`cogsPercent` is a whole number (e.g., 100), not a decimal. So `1 - 100 = -99`, which displays as `-99%`.

The correct value is already calculated in `calculations.ts` as `equipment.overheadPercent` (which is `100 - cogsPercent`).

## Fix

**File:** `src/components/equipment/EquipmentDetailsSheet.tsx` (1 line changed)

Replace:
```
formatPercent(1 - equipment.cogsPercent)
```
With:
```
formatPercent(equipment.overheadPercent)
```

This uses the pre-calculated `overheadPercent` field that already handles the math correctly, including the owner-perk zero-out logic.

No other files affected. No dependencies. No database changes.
