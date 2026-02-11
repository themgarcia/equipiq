

# Fix: Zero Turn Cost Comparison Tooltip

## Problem

The cost comparison tooltip on the FMS Export page shows incorrect data for categories with mixed financing types. The "Lawn -- Mower -- Zero Turn" category has 6 items: 1 leased, 2 financed, 3 owned. The tooltip math sums ALL items' monthly payments (including financed ones) and divides by total qty, producing a meaningless comparison number.

Other categories (1/2 Ton Truck, Cab Over) work correctly because the leased item is the only item in the group.

## Root Cause

In `src/lib/rollupEngine.ts`, `buildLine()` sets `totalMonthlyPayment` to the sum of ALL items' monthly payments (line 111). The `CostComparisonTooltip` in `FMSExport.tsx` then divides by total qty to get a per-unit "lease recovery" — but this mixes financed payments with lease payments and dilutes across non-leased items.

## Fix

### `src/lib/rollupEngine.ts`

Add two new fields to `RollupLine`:
- `leasedItemCount: number` — count of items where `financingType === 'leased'`
- `leasedItemMonthlyPayment: number` — sum of monthly payments only from leased items

Update `buildLine()` to compute these from the items array.

### `src/pages/FMSExport.tsx`

Update `CostComparisonTooltip` to use the leased-only fields:
- `leaseRecovery = (line.leasedItemMonthlyPayment / line.leasedItemCount) * 12` (per leased item)
- `ownedRecovery` stays the same (replacement-based, per item avg)
- Only show the tooltip when `line.leasedItemCount > 0` (instead of checking `line.financingType === 'leased'`)

This means the zero turn tooltip will correctly compare $280.17/mo x 12 = $3,362/yr (lease) vs the owned recovery for that category, and show the accurate savings.

## Files Modified

| File | Change |
|---|---|
| `src/lib/rollupEngine.ts` | Add `leasedItemCount` and `leasedItemMonthlyPayment` to `RollupLine`, compute in `buildLine()` |
| `src/pages/FMSExport.tsx` | Update `CostComparisonTooltip` to use leased-only fields for accurate comparison |

