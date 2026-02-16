

# Fix: Show "Payments Complete" in Lease Pass-Through Tooltips Too

## Problem

The lease pass-through tooltip (lines 220-243) still shows full lease cost breakdowns for paid-off items, even though the owned recovery tooltip already handles this correctly.

## Fix

Update the lease pass-through tooltip section (lines 223-229) to check each item's `paidOff` flag:

- **If paid off**: Show the item name and a "Payments complete" message instead of the lease recovery amount and owned comparison
- **If still active**: Show the existing lease recovery, deposit amortization, and owned comparison lines as before

Also update the summary line (line 231) — if ALL items in the category are paid off, show "All payments complete" instead of "No cash gap — recovery matches your payments."

### Single file changed

`src/pages/FMSExport.tsx` — lines 223-231 in the lease pass-through tooltip section.

