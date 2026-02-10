

# P0 Step 3: Smart Rollup Engine + v3 Taxonomy

This is a three-part change that transforms the FMS Export from one-row-per-asset to aggregated category-level lines matching how LMN expects data, and replaces the 18-category taxonomy with the 92-category v3 taxonomy.

---

## Part 1: Replace the Category Taxonomy (v3, 92 categories)

### What changes

The `EquipmentCategory` union type (18 values) and `categoryDefaults` array are replaced with the v3 taxonomy: 92 categories across 7 divisions (Construction, Fleet, Irrigation, Lawn, Shop, Snow, Tree).

### Files modified

**`src/types/equipment.ts`**
- Replace the `EquipmentCategory` union type with a `string` type alias (the 92-category list is too large and dynamic for a union type -- category names come from the data file)
- Update the `CategoryDefaults` interface to include new fields: `division`, `unit` (`'Hours' | 'Days'`), `defaultAllocation` (`'operational' | 'overhead_only'`), `maintenancePercent`, `insurancePercent`

**`src/data/categoryDefaults.ts`**
- Replace the 18-entry array with all 92 categories from the uploaded taxonomy document
- Each entry maps the taxonomy columns: `category` (full name like "Construction -- Loader -- Skid Steer"), `division`, `defaultUsefulLife`, `defaultResalePercent` (as whole number, e.g. 25 not 0.25 -- matching existing convention), `unit`, `defaultAllocation`, `notes`
- Add helper functions: `getCategoryDivisions()`, `getCategoriesByDivision()`, `getCategoryByName()`
- Keep `maintenancePercent` and `insurancePercent` with reasonable defaults per division

**`src/components/EquipmentForm.tsx`** and **`src/components/EquipmentFormContent.tsx`**
- Update the category dropdown to use a grouped `<Select>` with division headers (Construction, Fleet, Irrigation, Lawn, Shop, Snow, Tree)
- Categories within each division are listed alphabetically

**`src/pages/BuyVsRentAnalysis.tsx`**
- Update to use the new category list from the updated `categoryDefaults`

**`supabase/functions/parse-equipment-docs/index.ts`** and **`supabase/functions/parse-equipment-spreadsheet/index.ts`**
- Update the hardcoded `EquipmentCategory` type to include all 92 v3 category names so AI parsing can match to the new taxonomy

**`src/pages/EquipmentList.tsx`**
- The category grouping logic already uses dynamic category names from data, so it should work. Expanded categories initialization will adapt to the new list.

### Migration note for existing data
Existing equipment records in the database use old category names (e.g. "Loader -- Skid Steer"). The code will handle unrecognized categories gracefully by falling back to the last entry in `categoryDefaults`. No database migration required -- users can recategorize equipment as needed.

---

## Part 2: Create the Rollup Engine

### New file: `src/lib/rollupEngine.ts`

A pure function that takes `EquipmentCalculated[]` and returns aggregated category-level lines split into Field Equipment and Overhead Equipment sections.

**Grouping key:** `category + allocationType + financingType` (owned vs leased)

This means:
- 3 crew cab trucks in the same category = 1 line, Qty: 3
- 1 owned skid steer + 1 leased skid steer = 2 lines (one Owned, one Leased)
- Owner perk items go to Overhead section

**Per-line calculations:**
- `avgReplacementValue` = average of `replacementCostUsed` across items
- `avgUsefulLife` = average of `usefulLifeUsed`
- `avgEndValue` = average of `expectedResaleUsed`
- `totalAnnualRecovery` = sum of `(replacementCostUsed - expectedResaleUsed) / usefulLifeUsed` per item
- `totalCogs` / `totalOverhead` = sums of `cogsAllocatedCost` / `overheadAllocatedCost`

**Exports:**
- `rollupEquipment(calculatedEquipment)` -> `RollupResult`
- `rollupToCSV(result)` -> CSV string for download

---

## Part 3: Update FMS Export Page

### File modified: `src/pages/FMSExport.tsx`

Replace the per-asset table in the LMN tab with two rolled-up sections:

**Section 1: Field Equipment -- LMN Equipment Budget**
- Table columns: Equipment Name, Qty, Avg Replacement Value, Life (Yrs), Avg End Value, Type (Owned/Leased badge), Unit (Hours/Days), Annual Recovery
- Each row shows the category name, with individual item names listed below in small text
- Footer row with totals

**Section 2: Overhead Equipment -- LMN Overhead Budget**
- Same table structure but without Type column (overhead items don't split by financing in LMN)
- Includes `overhead_only` and `owner_perk` items

**Other changes:**
- CSV export updated to use `rollupToCSV()`
- Per-cell copy buttons retained for each value
- Mobile card view adapted for rolled-up lines
- Empty state messages updated: "No field equipment" / "No overhead equipment" with guidance
- Existing SynkedUp/DynaManage/Aspire tabs unchanged

---

## What Does NOT Change

- No database or schema changes
- No changes to `EquipmentContext` logic (rollup reads from existing `calculatedEquipment`)
- No changes to Dashboard, Insurance, or Cashflow pages
- No changes to the calculation engine (`src/lib/calculations.ts`) -- it already produces the values the rollup consumes

---

## How to Verify

1. Add 3 items in the same category (e.g. 3 "Fleet -- Truck -- Crew Cab 3/4 Ton"). FMS Export should show 1 line with Qty: 3 and averaged values
2. Tag one item as "No -- Overhead". It should appear in the Overhead section
3. Have both an owned and leased item in the same category -- should produce 2 lines
4. Categories should sort A-Z (Construction before Fleet before Lawn, etc.)
5. CSV export should contain both Field and Overhead sections
6. Category dropdown in equipment forms should show grouped divisions

