

# P0 Step 2: Allocation Flag UI (Three Cards)

## What Changes

Replace the technical "Allocation Type" dropdown with three intuitive selectable cards under the plain-language question: **"Do you charge clients for this equipment?"**

## The Three Options

1. **Yes -- Field Equipment** (maps to `operational`, Truck icon)
   - "Goes on estimates. Recovered through COGS and overhead."
   - This is the default for most equipment.

2. **No -- Overhead** (maps to `overhead_only`, Building2 icon)
   - "Business cost not tied to specific jobs. Recovered through overhead budget."
   - Shop tools, office equipment, general fleet vehicles, etc.

3. **No -- Owner Perk** (maps to `owner_perk`, UserCircle icon)
   - "Personal use on company books. Included in insurance but excluded from job costing and FMS export."
   - The contractor's spouse's vehicle, personal-use equipment that lives on the P&L and insurance policy but shouldn't touch operational budgets. Comes out of net profit.

## UI Design

- Three cards in a responsive grid (3 columns on desktop, stacked on mobile)
- Selected state: `border-primary bg-primary/5`
- Each card shows icon, title, and one-line description
- When `owner_perk` is selected, COGS % is disabled and set to 0 (existing behavior preserved)
- COGS % and Overhead % fields remain below the cards (unchanged)

## What Stays the Same

- No database or schema changes
- No changes to calculations, FMS Export, Dashboard, or EquipmentContext
- The `owner_perk` exclusion logic throughout the app is untouched

## Technical Details

### Files Modified

**1. `src/components/EquipmentForm.tsx`** (Add Equipment modal)
- Add `Truck`, `Building2`, `UserCircle` to lucide-react imports
- Replace the Allocation section (lines 374-428) with:
  - Header: "LMN Allocation"
  - Label: "Do you charge clients for this equipment?"
  - Three selectable cards in `grid-cols-1 sm:grid-cols-3`
  - Keep COGS % and Overhead % inputs below, unchanged

**2. `src/components/EquipmentFormContent.tsx`** (Edit form in side sheet)
- Add `Truck`, `Building2`, `UserCircle` to lucide-react imports
- Replace the Allocation section (lines 355-409) with the same three-card layout
  - Use `grid-cols-1 md:grid-cols-3` (adapts to sheet width)
  - Keep COGS % and Overhead % inputs below, unchanged

Both files already define the `allocationTypes` array (lines 35-39) which will be replaced with a richer structure containing icons and updated descriptions.

