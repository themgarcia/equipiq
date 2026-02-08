

# Fix: Purchase & Cost Section Value Alignment

## Problem

In the Equipment Details Sheet, the "Purchase & Cost" section uses `flex justify-between`, which pushes monetary values and dates all the way to the right edge. On wider panels this creates an unnecessarily large gap between labels and values, making it harder to scan.

## Fix

**File:** `src/components/equipment/EquipmentDetailsSheet.tsx` (~15 lines changed)

Change each row in the Purchase & Cost section from `flex justify-between` to a two-column grid layout that keeps labels and values closer together while still right-aligning the numbers.

Specifically, wrap the section rows in a consistent pattern:
- Labels get `text-left`
- Values get `text-right`
- Use `grid grid-cols-[1fr_auto]` or `flex` with `gap-4` and remove `justify-between`, instead using `ml-auto` on values so they stay near the label rather than flush-right against the sheet edge

The simplest approach: add `max-w-sm` to the `space-y-1.5` container so the rows don't stretch across the full sheet width. This keeps all the existing flex-between logic intact but constrains the width so values stay visually close to their labels.

**Lines affected:** 205-241 (the `space-y-1.5` div and its children)

**Change:** Add `max-w-sm` class to the container div on line 205:
```
<div className="space-y-1.5 max-w-sm">
```

This single class constrains the width of the entire Purchase & Cost block, bringing values closer to labels without changing any row-level layout. The same pattern can be applied to other sections if needed.
