

# Step 5: Lease Cost Education (Updated)

Five changes to improve how users understand the difference between Owned and Lease recovery methods.

---

## Important Data Access Note

The **CashGapSummary** and **restructured tooltips** must compute cash gap amounts from the **individual equipment records** (`calculatedEquipment` from `EquipmentContext`), not from the rollup lines. The rollup engine averages replacement values and sums payments across categories, which would mask per-item gaps. For example, a category with two items -- one with a large cash gap and one without -- would appear fine when averaged.

The FMS Export page already destructures `calculatedEquipment` from `useEquipment()` (line 514), so the raw per-item data is available. The CashGapSummary component will filter this array directly to find leased items where `lmnRecoveryMethod === 'owned'` and compare each item's actual annual lease cost against its individual owned recovery.

---

## Change 1: Restructured Cost Comparison Tooltips

Replace the current `CostComparisonTooltip` in `src/pages/FMSExport.tsx` (lines 92-163).

- Accept `calculatedEquipment` as a prop so it can show per-item breakdowns for the category
- **Leased items modeled as Owned**: Show "Recovery Method: Owned (Replacement Value)" header, per-item owned recovery, actual lease cost with deposit amortization, difference, and warning/success indicator
- **Leased items modeled as Lease pass-through**: Show "Recovery Method: Lease Pass-Through" header, lease recovery, owned comparison, and reassurance message
- Include a toggle link (see Change 3)

## Change 2: Cash Gap Warning Summary Card

Add a `CashGapSummary` component above the Field Equipment table in `src/pages/FMSExport.tsx`.

**Data source**: Iterates over `calculatedEquipment` (raw items), NOT rollup lines. For each active leased item with `lmnRecoveryMethod === 'owned'`:
- Calculates per-item owned recovery: `(replacementCostUsed - expectedResaleUsed) / usefulLifeUsed`
- Calculates per-item actual lease cost: `(monthlyPayment * 12) + (depositAmount * 12 / termMonths)` (with zero-guard on termMonths)
- Flags items where actual lease cost exceeds owned recovery

Displays:
- Total annual recovery (sum of per-item owned recovery for affected items)
- Total annual payments (sum of per-item actual lease costs for affected items)
- Cash gap amount (difference)
- Count of affected items
- Only renders when at least one item has a gap

Uses amber/warning card styling consistent with existing alert cards.

## Change 3: Inline Recovery Toggle in Tooltips

Add a toggle link inside the restructured tooltip from Change 1.

- For single-item categories: immediately updates `lmnRecoveryMethod` via `updateEquipment` from `EquipmentContext`
- For multi-item categories: shows a confirmation dialog (using existing `AlertDialog`) before batch-updating all items
- Styled as a subtle text link
- Page auto-re-renders since it consumes equipment data from context

## Change 4: New Definitions Section

Add a new entry to the `definitions` array in `src/pages/Definitions.tsx`:
- Title: "Owned vs. Leased Recovery in LMN"
- ID: `lease-recovery` (for `#lease-recovery` anchor links)
- Content covers: What is Owned recovery, What is Lease pass-through, Why there's a gap, Which to use, and "The real fix" advice
- Placed after the existing "Equity Ratio" entry, using the `Scale` icon

## Change 5: Equipment Form Label Updates

Update `src/components/EquipmentFormContent.tsx` (around lines 643-669):
- "Owned Recovery (recommended)" becomes "Owned Recovery -- based on replacement value and useful life"
- "Lease Payment Recovery" becomes "Lease Payment Recovery -- based on your actual monthly payments"
- Remove "(recommended)" text
- Add a "Which should I choose?" link below the radio group pointing to `/definitions#lease-recovery`

---

## Files Changed

| File | What |
|------|------|
| `src/pages/FMSExport.tsx` | Restructured tooltip with per-item data (Change 1), CashGapSummary using raw `calculatedEquipment` (Change 2), inline toggle (Change 3) |
| `src/pages/Definitions.tsx` | New accordion section for lease recovery education (Change 4) |
| `src/components/EquipmentFormContent.tsx` | Updated radio labels and help link (Change 5) |

## Technical Details

- `CashGapSummary` receives `calculatedEquipment` as a prop (already available at the page level) and does its own filtering/math per item
- `CostComparisonTooltip` receives both the `RollupLine` (for display context like category name and qty) and the matching subset of `calculatedEquipment` items (filtered by category + allocation type) for accurate per-item cost comparison
- The inline toggle in Change 3 needs `updateEquipment` from context, passed down as a callback prop
- Definitions anchor scroll uses URL hash detection to auto-open the matching accordion item on mount

