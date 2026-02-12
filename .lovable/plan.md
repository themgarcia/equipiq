
# Add Copy Button to Category Name Cell

## Problem
Every data cell in the FMS Export table has a copy button except the **Category** column. Users need to copy the category name into LMN when transferring data, so it should be copyable like all other cells.

## Change

### `src/pages/FMSExport.tsx`

Update the category `TableCell` to include a `CopyButton`, matching the pattern used by all other cells. This applies to both the **Owned** table rows (around line 265) and the **Leased** table rows (which likely have the same omission).

The category name text will be wrapped in the same `relative inline-flex` pattern used by the other cells, with a `CopyButton` positioned alongside it.

**Before:**
```tsx
<TableCell className="font-medium">
  <div>
    <span>{line.category}<CostComparisonTooltip ... /></span>
    ...
  </div>
</TableCell>
```

**After:**
```tsx
<TableCell className="font-medium">
  <div className="relative">
    <span>{line.category}<CostComparisonTooltip ... /></span>
    <CopyButton cellId={`${lineId}-cat`} value={line.category} copiedCell={copiedCell} onCopy={onCopyCell} />
    ...
  </div>
</TableCell>
```

Both owned and leased table sections will be updated to ensure consistency across the entire export view.
