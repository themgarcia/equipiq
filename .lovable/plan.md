

# Improve Equipment Details Sheet UI/UX

## Changes

### 1. Prominent Replacement Cost Hero Card
Replacement Cost is the most important number in EquipIQ. It will be elevated to a visually distinct card near the top of the details view (right after the status badges), styled with a primary border/background tint using the existing `MetricCard` pattern. It will show Replacement Cost as the headline value with Years Left and Expected Resale as supporting details underneath.

### 2. Edit Button in the Sheet Header
Move the Edit (pencil) button into the `SheetHeader` alongside the title, so users can tap it immediately without scrolling. The bottom action section will keep Documents, Attachments, and Delete -- but Edit is removed from there since it now lives in the header.

### 3. AlertDialog for Delete Confirmation
Replace the native `confirm()` call with the project's existing `AlertDialog` component. The dialog will clearly name the equipment being deleted and use a destructive-styled action button. This keeps the experience on-brand and accessible.

### 4. Subtle Section Dividers
Add `Separator` components (from `@/components/ui/separator`) between each content section (Identification, Purchase & Cost, Allocations, Lifecycle, Financing, Sale Info, Actions). This improves visual scanning without adding clutter -- just thin horizontal lines with consistent spacing.

## Technical Details

### File: `src/components/equipment/EquipmentDetailsSheet.tsx`

**Header changes (lines 64-94):**
- In the `sheetView === 'details'` branch, add a `Pencil` icon button next to the `SheetTitle` using `flex items-center justify-between`
- The button calls `setSheetView('edit')`
- Pass `onEdit` up from props or handle directly since `setSheetView` is in scope

**New imports:**
- `Separator` from `@/components/ui/separator`
- `AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger` from `@/components/ui/alert-dialog`
- `useState` move to top of file (currently at line 153)

**Delete confirmation:**
- Remove the `handleDelete` function that uses `confirm()`
- Add `deleteDialogOpen` state
- Wrap the Delete button in `AlertDialogTrigger` or control via state
- AlertDialog content: title "Delete Equipment", description "Are you sure you want to delete {name}? This action cannot be undone.", with Cancel and destructive Delete buttons

**EquipmentDetailsView changes (lines 163-421):**

- Add a hero card after the status badges section for Replacement Cost:
```
<div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
  <p className="text-xs text-muted-foreground">Replacement Cost</p>
  <p className="text-2xl font-bold font-mono-nums">{formatCurrency(...)}</p>
  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
    <span>{yearsLeft} years left</span>
    <span>Resale: {formatCurrency(...)}</span>
  </div>
</div>
```

- Remove Replacement Cost from the Lifecycle grid (it's now in the hero card)
- Add `<Separator />` between each section group
- Remove "Edit Equipment" from the bottom action buttons list
- Wrap the Delete button in an AlertDialog instead of using `confirm()`

