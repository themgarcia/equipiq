

# Inline Expand Row for Category Item Auditing

## What Changes
Replace the hover-reveal List icon button with a small chevron toggle on category rows that have more than one item. Clicking it expands a sub-row directly beneath, listing the equipment names inline in the table -- no detail sheet needed for a quick audit.

## How It Works
- Rows with `qty > 1` show a small chevron icon next to the category name
- Clicking the chevron toggles open a sub-row beneath, listing the individual equipment names
- Clicking again collapses it
- Rows with `qty === 1` show no chevron (nothing to expand)
- The detail sheet remains available for mobile card views but is no longer the primary desktop audit path

## Technical Details

### `src/pages/FMSExport.tsx`

1. **State**: Add a `Set<string>` state to track which rows are expanded (keyed by `lineId`), with a toggle function.

2. **Remove** the current `List` icon button from both Owned and Leased category cells (the code added in the last diff).

3. **Add chevron toggle** to the category cell for rows where `line.qty > 1`:
   - A small `ChevronRight` icon (already imported) that rotates 90 degrees when expanded
   - Clicking it toggles the lineId in the expanded set

4. **Add expandable sub-row** immediately after each `TableRow` in both Owned and Leased sections:
   - Only rendered when the row is in the expanded set
   - Spans the full column width using `colSpan`
   - Lists `line.itemNames` as a compact comma-separated list or a small bulleted list in a muted style
   - Styled with a subtle background (`bg-muted/20`) to visually nest under the parent row

5. **Import cleanup**: Remove `List` from the lucide-react import (no longer needed). `ChevronRight` is already imported.

### Visual Result

```text
Category          Qty   Repl. Value   Life   Recovery
Skid Steers  >     3    $45,000       5      $27,000
  - Bobcat T770, Bobcat S650, CAT 262D
Excavators         1    $85,000       7      $12,143
```

The chevron (`>`) rotates down when expanded. The sub-row appears directly below with a slightly indented, muted list of item names. Clean, fast, no navigation away from the table.
