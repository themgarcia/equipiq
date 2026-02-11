

# v5 Fix Pass + Locale-Aware Mileage

Three fixes from reviewing the v5 taxonomy migration output.

---

## Fix 1: Data Accuracy Corrections

Known issues confirmed in `categoryDefaults.ts`:

| Line | Category | Fix |
|------|----------|-----|
| 39 | Fleet -- Truck -- Cab Over Body | Rename to "Fleet -- Truck -- Cab Over" |
| 34 | Fleet -- Other | Change benchmarkType to 'calendar', benchmarkRange to null |
| 31 | Construction -- Tractor | benchmarkRange '4,000-6,000 hrs' to '6,000-10,000 hrs' |
| 27 | Construction -- Saw -- Cut-Off | benchmarkRange '1,000-2,000 hrs' to '1,000-1,500 hrs' |
| 38 | Fleet -- Trailer -- Landscape | usefulLife 12 to 15, resalePercent 20 to 25 |

A full audit of all 92 categories will be done against the uploaded taxonomy document. Any additional mismatches will be corrected.

A database migration will rename "Fleet -- Truck -- Cab Over Body" to "Fleet -- Truck -- Cab Over" for existing equipment records.

### Files modified
- `src/data/categoryDefaults.ts` -- fix all mismatched values
- SQL migration -- rename Cab Over in equipment table

---

## Fix 2: Overhead Table Type Column

Currently `FMSExport.tsx` passes `showType={false}` to the Overhead RollupSection. Change to `showType={true}` so both Field and Overhead tables show the Owned/Leased badge column.

### Files modified
- `src/pages/FMSExport.tsx` -- change one prop from false to true (line ~265)

---

## Fix 3: Locale-Aware Mileage Display

Store benchmarks in miles (source of truth). Convert to km on display for Canadian/metric users.

### New utility: `src/lib/benchmarkUtils.ts`
- `useMetricUnits()` hook -- checks browser locale for Canadian/metric signals (en-CA, fr-CA, non-US locales), returns boolean
- `formatBenchmarkRange(benchmarkType, benchmarkRange, useMetric)` -- returns display string. For miles benchmarks with metric=true, parses the range, multiplies by 1.609, rounds to nearest 5,000 km

### UI updates
- `src/pages/CategoryLifespans.tsx` -- use `useMetricUnits()` + `formatBenchmarkRange()` for benchmark display
- `src/pages/FMSExport.tsx` -- same for Life column tooltips

---

## Implementation Order

1. Fix data in `categoryDefaults.ts` (all known + audited issues)
2. Database migration for Cab Over rename
3. Change `showType={true}` for Overhead section in FMSExport
4. Create `src/lib/benchmarkUtils.ts` with metric detection and formatting
5. Wire up locale-aware display in CategoryLifespans and FMSExport

