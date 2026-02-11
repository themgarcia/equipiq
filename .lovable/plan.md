

# Taxonomy v5 Migration + FMS Export Cleanup

Three coordinated changes: rename 37 categories, add usage benchmarks, and clean up FMS Export columns.

---

## Change 1: Rename 37 Category Names

Shorten category names for better UI readability. The full mapping covers names like "Construction -- Loader -- Compact Track (CTL)" becoming "Construction -- Loader -- CTL".

### Files modified

**`src/data/categoryDefaults.ts`** -- Update the `category` field for all 37 renamed entries. For example:
- `Construction — Compact Track Loader (CTL)` becomes `Construction — Loader — CTL`
- `Fleet — Truck — Crew Cab 1/2 Ton` becomes `Fleet — Truck — 1/2 Ton`
- (all 37+ renames from the prompt document)

**Database migration** -- A SQL migration to update existing equipment records:
```sql
UPDATE equipment SET category = 'Construction — Loader — CTL' 
  WHERE category = 'Construction — Compact Track Loader (CTL)';
-- ... one UPDATE per renamed category (37 statements)
```

No other file changes needed -- the Equipment form dropdown, Category Lifespans page, and FMS Export all read from `categoryDefaults`, so names flow through automatically.

---

## Change 2: Add Usage Benchmarks

Add reference data showing lifetime hours or miles per category. Informational only -- no calculation changes.

### Data model

**`src/types/equipment.ts`** -- Add two fields to `CategoryDefaults`:
```
benchmarkType: 'hours' | 'miles' | 'calendar'
benchmarkRange: string | null
```

**`src/data/categoryDefaults.ts`** -- Add `benchmarkType` and `benchmarkRange` to every entry. Values come from the taxonomy document. Examples:
- Excavator -- Compact: `benchmarkType: 'hours'`, `benchmarkRange: '3,000-5,000 hrs'`
- Truck -- 3/4 Ton: `benchmarkType: 'miles'`, `benchmarkRange: '150,000-200,000 mi'`
- Trailer -- Landscape: `benchmarkType: 'calendar'`, `benchmarkRange: null`

### UI changes

**`src/pages/CategoryLifespans.tsx`** -- Show benchmark as secondary text below useful life:
- Mobile cards: "Life: 5 yrs" becomes "Life: 5 yrs -- 3,000-5,000 hrs"
- Desktop table: Add a muted secondary line under the useful life number
- Calendar types show "Calendar-based"

**FMS Export tooltips** -- Add a tooltip on the Life (Yrs) column showing the benchmark context, e.g. "Default 5 years based on 3,000-5,000 hrs at commercial production."

---

## Change 3: FMS Export Column Cleanup

Remove columns that don't map to LMN's Equipment Budget.

### Columns removed from both tables
- **Unit** (Hours/Days) -- belongs in Rate Builder, not budget
- **Annual Recovery** -- internal EquipIQ calculation, not an LMN field

### Summary stat bar
Add an info bar above the tables showing total annual recovery:
```
Total Annual Equipment Recovery: $31,613 (Field: $21,483 -- Overhead: $10,130)
```

### Files modified

**`src/pages/FMSExport.tsx`**:
- Remove Unit column header and cells from the desktop table
- Remove Annual Recovery column header and cells from the desktop table
- Remove both from the table footer totals row
- Add summary stat bar between the info card and the first table
- Update mobile card view to remove Annual Recovery display
- Update mobile sheet detail view to remove Unit and Annual Recovery rows

**`src/lib/rollupEngine.ts`** -- Remove Unit and Annual Recovery columns from `rollupToCSV()` function. CSV output columns become: Category, Qty, Avg Replacement Value, Life (Yrs), Avg End Value, Type.

Note: The `RollupLine` interface keeps `unit` and `totalAnnualRecovery` fields since they're used elsewhere (Dashboard, Cashflow Analysis). We only remove them from the FMS Export display and CSV.

---

## Implementation Order

1. Update `CategoryDefaults` interface (add benchmark fields)
2. Update `categoryDefaults.ts` (rename categories + add benchmarks)
3. Database migration (rename categories in existing records)
4. Update `CategoryLifespans.tsx` (show benchmarks)
5. Update `FMSExport.tsx` (remove columns, add summary bar, add life tooltip)
6. Update `rollupToCSV()` in `rollupEngine.ts` (remove columns from CSV)

---

## Technical Details

- The 37 category renames require exact string matching in the SQL migration since categories are stored as plain text in the `equipment` table
- The `benchmarkRange` field uses `string | null` because calendar-based categories have no numeric range
- No database schema changes needed for benchmarks -- they live only in the frontend `categoryDefaults` array
- The rollup engine grouping logic is unaffected since it groups by category name, and both the source data and DB records get renamed together
- The admin UPDATE RLS policy (already in place) is not needed for this migration since we'll use a standard SQL migration

