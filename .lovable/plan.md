

# Fix: Mobile Separator Under "Send Feedback" Should Be Inset

## The Issue

You correctly identified that the separator **under "Send Feedback"** has different widths:

| Device | Separator Style | Result |
|--------|----------------|--------|
| Desktop | `SidebarSeparator className="my-1 -mx-1"` | Inset (correct) |
| Tablet | Same as desktop | Inset (correct) |
| Mobile | `<div className="border-t border-sidebar-border -mx-4" />` | Full-width (incorrect) |

The `-mx-4` on mobile extends the line to the edges, making it look like a structural boundary instead of an internal element separator.

## The Fix

Change the mobile separator to match the inset style. Since the mobile footer has `p-4` (16px padding), we need to keep some of that padding to create the inset effect:

```tsx
// Line 476 - Change from:
<div className="border-t border-sidebar-border -mx-4" />

// To:
<div className="border-t border-sidebar-border mx-0" />
```

This removes the negative margin, leaving the separator inset by the parent's `p-4` padding (matching the visual hierarchy of desktop/tablet).

## File to Modify

| File | Line | Change |
|------|------|--------|
| `src/components/Layout.tsx` | 476 | Replace `-mx-4` with `mx-0` |

## Result

After this fix, all three device sizes will have consistent separator hierarchy:
- **Full-width**: Header bottom border, footer top border (structural)
- **Inset**: Separator under "Get Started", separator under "Send Feedback" (internal)

