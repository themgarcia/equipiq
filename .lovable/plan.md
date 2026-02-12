

# Clean Up Category Rows — Remove Inline Item Names

## What Changes
Remove the inline equipment name list that appears below category names in the FMS Export table. The detail sheet (slide-out panel) already shows "Items in this group" when you click any row, so the audit capability is preserved -- just one click away.

## Technical Details

### `src/pages/FMSExport.tsx`

**Owned section (~lines 272-276):** Remove the conditional block that renders `line.itemNames.join(', ')` below the category name.

**Leased section (~lines 410-414):** Remove the same conditional block in the leased table rows.

The category cell will simplify to just the category name, tooltip, and copy button -- no more cramped item-name text running across the row.

