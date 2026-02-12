

# Add "View Items" Hover Button to Category Rows

## Problem
Making the full row clickable would cause frustration — users trying to copy a value could accidentally open the detail sheet.

## Solution
Add a small icon button (e.g., a list/eye icon) that appears **on hover only**, positioned next to the existing copy button in the category cell. This follows the same hover-reveal pattern the copy button already uses, keeping the interaction intentional.

## Technical Details

### `src/pages/FMSExport.tsx`

**Owned section (~line 264):** Inside the category `<TableCell>`, after the `<CopyButton>`, add a hover-visible icon button that calls `onSelectLine(line)`. Only show it when `line.qty > 1` (single-item categories don't need auditing).

```tsx
{line.qty > 1 && (
  <button
    onClick={() => onSelectLine(line)}
    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 hover:bg-muted rounded"
    title="View items in this group"
  >
    <List className="h-3.5 w-3.5 text-muted-foreground" />
  </button>
)}
```

**Leased section (~line 403):** Same change in the leased table's category cell.

**Import:** Add `List` to the existing `lucide-react` import at the top of the file.

The `group` class is already on the `<TableRow>`, so the hover-reveal will work automatically. No row-level `onClick` needed — users click the icon intentionally, not accidentally.

