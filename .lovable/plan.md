

# Tooltip Language Fix + Category Rename

## Fix 1: Tooltip Wording

Replace "Saving" / "saves" language with "more competitive" across all cost comparison tooltips on the FMS Export page.

**Changes in `src/pages/FMSExport.tsx`:**

- Line 127: `Lease saves $X/yr vs owned recovery` --> `$X/yr more competitive vs owned recovery`
- Line 152: `Saving $X/yr vs lease pass-through` --> `$X/yr more competitive vs lease pass-through`
- Line 154: `Lease would save $X/yr, but owned recovery keeps your rate consistent` --> `Lease is $X/yr cheaper, but owned recovery keeps your rate consistent`

## Fix 2: Rename "Mini Skid Steer" to "Stand-On"

**Database:** Update 2 equipment records that currently use `Construction — Loader — Mini Skid Steer`:
- 2011 Cormidi C50
- 2022 Toro Dingo TX 1000

SQL migration to rename category on these records.

**Taxonomy file (`src/data/categoryDefaults.ts`):** Rename the category string from `Construction — Loader — Mini Skid Steer` to `Construction — Loader — Stand-On` on line 22.

## Fix 3: Category Mismatch Sweep

Add a temporary console log in the equipment loading path that checks every equipment record's category against the 92 valid names in `categoryDefaults.ts`. Any mismatches will be logged to the browser console so you can spot other stragglers.

This will be added in `src/contexts/EquipmentContext.tsx` (where equipment data is loaded), comparing each record's category against the exported list from `categoryDefaults.ts`.

---

## Technical Details

| File | Change |
|---|---|
| `src/pages/FMSExport.tsx` | Update 3 tooltip text strings to use "more competitive" instead of "Saving/saves" |
| `src/data/categoryDefaults.ts` | Rename category on line 22 from "Mini Skid Steer" to "Stand-On" |
| Database migration | `UPDATE equipment SET category = 'Construction — Loader — Stand-On' WHERE category = 'Construction — Loader — Mini Skid Steer'` |
| `src/contexts/EquipmentContext.tsx` | Add category validation sweep that logs mismatches to console |
