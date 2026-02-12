

# Fix Category Copy Button Positioning

## Problem
The copy button on the Category column is too far from the category name text. It appears at the far right edge of the cell because the wrapper `<div>` uses `className="relative"` (a block element spanning the full cell width), while all other cells use `className="relative inline-flex"` which keeps the button anchored next to the text content.

## Fix

### `src/pages/FMSExport.tsx`

Change the category cell wrapper from `"relative"` to `"relative inline-flex"` in both the Owned and Leased table sections:

**Owned section (~line 266):**
```
"relative"  -->  "relative inline-flex"
```

**Leased section (~line 404):**
```
"relative"  -->  "relative inline-flex"
```

This matches the exact pattern used by every other copyable cell (qty, replacement value, useful life, etc.) and will position the copy icon right next to the category name on hover.

