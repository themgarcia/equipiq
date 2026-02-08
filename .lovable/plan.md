

# Sticky Footer for Cancel / Save Buttons in Edit Mode

## Problem
When editing equipment, the Cancel and Save Changes buttons are at the very bottom of a long form. You have to scroll all the way down to find them, which is frustrating -- especially on shorter screens or when making a quick change to a field near the top.

## Solution
Move the Cancel / Save buttons out of the scrollable form area and into a sticky footer that is always visible at the bottom of the sheet, regardless of scroll position.

## Technical Details

### 1. `src/components/EquipmentFormContent.tsx`
- Remove the button row (lines 676-683) from inside the `<form>` element
- Instead, accept an optional `renderFooterPortal` prop or use a different approach: split the component so it exposes the submit trigger externally
- Simpler approach: keep buttons in the form but accept a `stickyFooter` boolean prop. When true, render the buttons via a callback/render prop so the parent can place them outside the scroll area
- **Simplest approach chosen**: Remove the buttons from EquipmentFormContent entirely when used inside the sheet. Add an `id` to the form so external buttons can submit it. Pass a new `footerRef` or simply use `form="equipmentEditForm"` on external buttons.

Specifically:
- Add `id="equipment-edit-form"` to the `<form>` tag when in edit mode
- Accept an optional `hideFooter` prop; when true, don't render the button row
- The parent sheet will render the sticky footer with buttons that reference the form via `form="equipment-edit-form"`

### 2. `src/components/equipment/EquipmentDetailsSheet.tsx`
- When `sheetView === 'edit'`, render a sticky footer div **outside** the `ScrollArea` but still inside `SheetContent`
- The footer contains Cancel and Save Changes buttons
- Cancel calls `setSheetView('details')`
- Save uses `form="equipment-edit-form"` attribute to trigger the form submission
- Footer styling: `shrink-0 border-t p-4 bg-background` to stay pinned at the bottom of the flex column

