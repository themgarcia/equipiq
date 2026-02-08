

# Fix Edit Button / Close Button Overlap

## Problem
The Edit (pencil) icon button and the Sheet's built-in close (X) button are stacked on top of each other in the top-right corner of the equipment details header.

## Solution
Add right padding to the header's flex container to leave room for the Sheet's absolute-positioned close button, so the Edit button sits to its left without overlapping.

## Technical Details

### File: `src/components/equipment/EquipmentDetailsSheet.tsx`

In the `sheetView === 'details'` header branch (around line 72), the outer `div` currently uses `flex items-start justify-between gap-2`. Add `pr-8` (or `pr-10`) to create space for the close X button that the `SheetContent` component renders in the top-right corner via absolute positioning.

This is a one-line CSS class change -- no structural or logic changes needed.

