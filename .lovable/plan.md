

# P0 Step 4: Financing-Aware Split

Add an LMN Recovery Method toggle for leased equipment and split the FMS Export into Owned and Leased sub-tables with cost comparison tooltips.

---

## Change 1: New Database Field

Add `lmn_recovery_method` column to the `equipment` table:
- Type: `text`, default `'owned'`, nullable
- Only meaningful when `financing_type = 'leased'`

**Migration SQL:**
```text
ALTER TABLE public.equipment 
ADD COLUMN lmn_recovery_method text DEFAULT 'owned';
```

---

## Change 2: Data Model Updates

### `src/types/equipment.ts`
- Add `lmnRecoveryMethod: 'owned' | 'leased'` to the `Equipment` interface

### `src/contexts/EquipmentContext.tsx`
- Add `lmn_recovery_method` to `dbToEquipment()` and `equipmentToDb()` mapping functions
- Map to/from `lmnRecoveryMethod` field

### `src/components/EquipmentFormContent.tsx`
- Add `lmnRecoveryMethod` to `defaultFormData` (default: `'owned'`)
- After the buyout amount field (line ~627), when `financingType === 'leased'`, render a radio button group:
  - **Owned Recovery (recommended)** -- "Recover based on replacement value and useful life. Typically produces a more competitive rate."
  - **Lease Payment Recovery** -- "Pass monthly lease payment through to LMN. Simpler, but may inflate your equipment rate."
- When `financingType` changes away from `'leased'`, reset to `'owned'`

---

## Change 3: Rollup Engine Update

### `src/lib/rollupEngine.ts`

Update `RollupLine` interface to add:
- `totalMonthlyPayment: number` -- sum of monthly payments for leased group
- `paymentsPerYear: number` -- default 12
- `monthsUsed: number` -- default 12
- `lmnRecoveryMethod: 'owned' | 'leased'` -- which sub-table this line belongs to

Update grouping logic:
- Determine `recoveryMethod`: if `financingType === 'leased'` AND `lmnRecoveryMethod === 'leased'` then `'leased'`, otherwise `'owned'`
- Include recovery method in group key: `category|allocation|recoveryMethod`

Update `RollupResult`:
- Split field/overhead lines into owned and leased arrays (4 arrays total: `fieldOwnedLines`, `fieldLeasedLines`, `overheadOwnedLines`, `overheadLeasedLines`)
- Compute separate totals for each

Update `rollupToCSV()`:
- Add separate CSV sections for Owned (existing columns) and Leased (Category, Qty, Monthly Payment, Payments/Yr, Months Used)

---

## Change 4: FMS Export Page Update

### `src/pages/FMSExport.tsx`

Split each section (Field, Overhead) into two sub-tables:

```text
Field Equipment -- LMN Equipment Budget
  Owned (X items in Y categories)
    [Category, Qty, Avg Replacement, Life (Yrs), Avg End Value]
  Leased (X items in Y categories)          <-- only if leased items exist
    [Category, Qty, Monthly Payment, Payments/Yr, Months Used]

Overhead Equipment -- LMN Overhead Budget
  (same pattern)
```

- Create a new `LeasedRollupSection` component with the leased-specific columns
- The Leased sub-table only renders when there are items with `lmnRecoveryMethod === 'leased'`
- Reuse the existing `RollupSection` for Owned sub-tables (no column changes)

### Cost Comparison Tooltips

**On Leased sub-table rows:** Info icon showing:
- Lease recovery: $X/yr (monthly x 12)
- Owned recovery: $Y/yr (replacement - end value / life)
- Difference and suggestion to switch

**On Owned sub-table rows that have lease financing:** Subtle confirmation tooltip:
- "This leased item is modeled as Owned for a more competitive rate."
- Shows savings comparison

To support this, `RollupLine` will carry comparison data (avg replacement value, avg useful life, avg end value, total monthly payment) so both sub-tables can compute both sides of the comparison.

### Mobile Sheet

Update the detail sheet to show leased-specific fields (Monthly Payment, Payments/Yr, Months Used) when viewing a leased recovery line.

---

## What This Does NOT Change

- Dashboard, Cashflow Analysis, Buy vs Rent -- unaffected
- Allocation flag (Field/Overhead) -- independent
- Category taxonomy -- unchanged
- Loan-financed equipment -- always treated as Owned

---

## Files Modified

| File | Change |
|---|---|
| `src/types/equipment.ts` | Add `lmnRecoveryMethod` field |
| `src/contexts/EquipmentContext.tsx` | DB mapping for new field |
| `src/components/EquipmentFormContent.tsx` | Radio buttons for lease items |
| `src/lib/rollupEngine.ts` | Leased fields, grouping, CSV export |
| `src/pages/FMSExport.tsx` | Owned/Leased sub-tables, tooltips |
| Database migration | Add `lmn_recovery_method` column |

---

## Verification Checklist

1. Add a leased item -- recovery method radio appears, defaults to Owned
2. Switch financing to loan or owned -- radio disappears, resets to owned
3. Set a leased item to "Lease Payment Recovery" -- appears in Leased sub-table on FMS Export
4. No leased-recovery items -- Leased sub-table hidden entirely
5. Mixed category (1 owned, 1 leased recovery) -- category appears in both sub-tables
6. Cost comparison tooltip shows on both leased and owned-but-leased rows
7. CSV export includes both Owned and Leased sections with correct columns
8. Overhead section follows the same pattern

