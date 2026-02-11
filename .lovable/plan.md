

# Fix Qty Column Alignment

## Problem

The copy buttons in table cells use `opacity-0` on desktop (visible on hover), but they still occupy layout space even when invisible. This pushes the numeric values leftward, causing misalignment with the right-aligned headers. The Qty column is most affected because it's the narrowest (80px).

## Solution

Change the copy button wrapper in each table cell from a flex layout with a space-occupying invisible button to using absolute positioning. This way the button overlays on hover without shifting the number.

### File: `src/pages/FMSExport.tsx`

Update the `CopyButton` component styling:
- Wrap each numeric value + copy button in a `relative` container
- Position the copy button absolutely to the right so it doesn't affect the number's alignment
- The number stays right-aligned under its header at all times

Specifically, change each cell's inner `<div className="flex items-center justify-end gap-1.5">` to use `relative` positioning with the copy button absolutely placed, removing the `gap-1.5` that creates the offset.

