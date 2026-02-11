

# Fix: Owned-Mode Tooltip Missing Comparison When Lease Is Cheaper

## Problem

The cost comparison tooltip on "owned" rows only shows a savings line when `diff > 0` (owned recovery is cheaper than lease). For the Zero Turn mower, the lease ($3,362/yr) is actually cheaper than the owned recovery ($4,072/yr), so the savings line is silently omitted. This makes the tooltip look incomplete compared to Cab Over and 1/2 Ton, which both show savings numbers.

## Root Cause

In `CostComparisonTooltip` (line 138 of FMSExport.tsx), the owned-mode tooltip only renders the savings line when `diff > 0`. When diff is zero or negative (lease is cheaper), nothing is shown — just the generic "modeled as Owned" text.

## Fix

### `src/pages/FMSExport.tsx`

Update the owned-mode tooltip (lines 128-144) to handle both cases:

1. **When owned saves money** (diff > 0): Keep existing green "Saving $X/yr vs lease pass-through" message
2. **When lease is actually cheaper** (diff <= 0): Show the actual numbers and a note that lease would be cheaper, but owned may still be preferred for consistency with LMN budgeting

The updated tooltip will show:
- Owned recovery: $X/yr
- Lease pass-through: $Y/yr
- When owned is cheaper: "Saving $Z/yr vs lease pass-through" (green)
- When lease is cheaper: "Lease would save $Z/yr, but owned recovery keeps your rate consistent" (neutral/muted)

This way every leased item in the Owned table gets a full comparison, matching the experience on Cab Over and 1/2 Ton.

## Files Modified

| File | Change |
|---|---|
| `src/pages/FMSExport.tsx` | Update owned-mode tooltip to show both-direction comparisons with recovery amounts |

