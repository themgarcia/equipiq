

# Replace Category Defaults + Fix km Display

Three changes from the uploaded spec. One (Overhead Type column) is already done.

---

## Change 1: Replace Category Defaults Data

Replace all 92 category data entries in `src/data/categoryDefaults.ts` with the updated values from the spec. The existing `CategoryDefaults` interface in `src/types/equipment.ts` will be kept as-is (with `category`, `defaultUsefulLife`, `defaultResalePercent`, `maintenancePercent`, `insurancePercent` fields) since those fields are used throughout the codebase (Buy vs Rent, calculations, etc.).

The new data from the spec uses a different field naming (`name`, `usefulLife`, `resalePercent` as decimal, no maintenance/insurance). I will **map** the spec's data into the existing interface shape:
- `name` mapped to `category`
- `usefulLife` mapped to `defaultUsefulLife`
- `resalePercent` (decimal like 0.15) mapped to `defaultResalePercent` (integer like 15)
- `maintenancePercent` and `insurancePercent` kept from existing data (these are still used by Buy vs Rent)

### Key data changes in the new array:
- Category names renamed (e.g., "Construction -- Concrete Mixer" becomes "Construction -- Concrete -- Mixer", "Construction -- Backhoe Loader" becomes "Construction -- Loader -- Backhoe")
- Excavator Compact/Mini weight descriptions swapped to correct size ordering
- Many benchmark ranges updated (e.g., Compactor categories now have hours benchmarks instead of calendar)
- Updated notes with more model detail
- Some useful life / resale percent values adjusted (e.g., Fleet -- Truck -- 1/2 Ton: 8 yrs becomes 7 yrs, Fleet -- Truck -- 3/4 Ton: 10 yrs becomes 7 yrs)

### Database migration

A SQL migration will rename category values in the `equipment` table for any records using old names. Based on the current database data, **no records** use the renamed categories (e.g., "Construction -- Concrete Mixer" or "Construction -- Backhoe Loader"), so the migration is a safety net. The rename mapping:

| Old Name | New Name |
|---|---|
| Construction -- Concrete Mixer | Construction -- Concrete -- Mixer |
| Construction -- Concrete Vibrator | Construction -- Concrete -- Vibrator |
| Construction -- Backhoe Loader | Construction -- Loader -- Backhoe |
| Fleet -- Truck -- Dump Single | Fleet -- Truck -- Dump Single (unchanged) |
| Shop -- Welder -- Portable | Shop -- Welder |
| Snow -- Spreader -- V-Box | Snow -- Spreader -- V-Box (unchanged) |

### Files modified:
- `src/data/categoryDefaults.ts` -- replace entire array data, keep helper functions and existing interface import

---

## Change 2: Fix km Display with User Preference

Replace the broken locale-based detection (`useMetricUnits` hook) with a database-backed user preference.

### Database
- Add `distance_unit` column to `profiles` table (type `text`, default `'mi'`, nullable)

### Profile/Settings UI
- Add a "Distance Units" toggle (Miles / Kilometers) to the Profile page in a new "Preferences" card section

### Utility refactor
- Update `src/lib/benchmarkUtils.ts`:
  - Remove the `useMetricUnits()` hook (locale-based detection)
  - Keep `formatBenchmarkRange()` function, rename parameter from `useMetric: boolean` to accept `distanceUnit: 'mi' | 'km'`
- Create a new hook `useDistanceUnit()` that reads the preference from the user's profile in the database
- Update consumers (CategoryLifespans, FMSExport) to use the new hook instead of `useMetricUnits()`

### Default on signup
- When a new account is created, check if the user's region (from signup step) contains a Canadian province code -- if so, default to `'km'`, otherwise `'mi'`

### Files modified:
- `src/lib/benchmarkUtils.ts` -- refactor utility
- `src/hooks/useDistanceUnit.ts` -- new hook
- `src/pages/Profile.tsx` -- add Preferences card with distance unit toggle
- `src/pages/CategoryLifespans.tsx` -- update to use new hook
- `src/pages/FMSExport.tsx` -- update to use new hook

---

## Change 3: Overhead Type Column -- Already Done

Both the Field and Overhead `RollupSection` components already receive `showType={true}`. No changes needed.

---

## Testing Checklist

1. Verify 92 categories appear on Category Lifespans page
2. Spot-check specific values match the spec (e.g., Construction -- Tractor: 15 yrs, 25%, 6,000-10,000 hrs)
3. Change distance unit to km in Profile settings, verify Fleet trucks show km values on Category Lifespans
4. Verify existing equipment records still display correctly (no orphaned categories)
5. CSV export still works from FMS Export page

