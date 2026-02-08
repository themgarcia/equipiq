

# P0 Step 1: Valuation Fix for Used Equipment

## Problem

When a contractor buys used equipment (e.g., a 2014 Cormidi for $10,000 in 2020), the system inflates from the **purchase year**, producing a replacement value of ~$11,941. The real new-replacement cost is $25-30K. This undervaluation cascades into equipment rates, causing contractors to under-charge and never build enough reserve to replace the machine.

## Changes

### 1. Fix inflation calculation for used equipment

**File:** `src/lib/calculations.ts` (~5 lines changed)

In the auto-calculated path (when no manual replacement cost is entered), change the inflation base year from `purchaseYear` to `modelYear` when `purchaseCondition === 'used'`. This better approximates the original new price by inflating over a longer period.

| | Before | After |
|---|---|---|
| Inflation base (used) | Purchase year (2020) | Model year (2014) |
| Years of inflation (to 2026) | 6 | 12 |
| Replacement value | $11,941 | $14,258 |

### 2. Add "used purchase" advisory in Add/Edit form

**File:** `src/components/EquipmentForm.tsx` (~25 lines changed)

When `purchaseCondition === 'used'`:
- Show a warning callout explaining why entering a new replacement cost matters
- Change the field label to "New Replacement Cost (Today) -- Recommended"
- Update placeholder text to "What would a new equivalent cost today?"
- Make the field span full width with a subtle warning border when empty

### 3. Same UX change in inline edit form

**File:** `src/components/EquipmentFormContent.tsx` (~25 lines changed)

Identical advisory callout and contextual label/placeholder changes for the details sheet edit view.

## Technical Details

**Calculation change (`calculations.ts`):**

```text
Auto-calculated path (replacementCostNew is 0):
  IF purchaseCondition === 'used'
    inflationBaseYear = modelYear (equipment.year)
  ELSE
    inflationBaseYear = purchaseYear
  
  inflationYears = currentYear - inflationBaseYear
  replacementCostUsed = totalCostBasis * (1.03 ^ inflationYears)
```

**UX advisory (both form files):**

```text
Replacement & Resale section
  IF purchaseCondition === 'used'
    [Warning Box]
    "You bought this used for $X. What would a new equivalent cost today?
     This ensures your rates build enough reserve to actually replace it."
    
    Label: "New Replacement Cost (Today) -- Recommended"
    Placeholder: "What would a new equivalent cost today?"
    Border: warning/50 when empty
  ELSE
    (existing behavior unchanged)
```

**No new dependencies. No database changes. No API costs.**

The `Info` icon is already imported in both form files.

## Impact

- Every piece of used equipment in the system gets a more accurate replacement value immediately (calculation fix)
- Users adding/editing used equipment get prompted to enter the real new-replacement cost (UX fix)
- All downstream values (equipment rates, FMS export, reserve calculations) improve automatically

