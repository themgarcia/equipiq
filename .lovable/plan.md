
# Rename "Avg End Value" to "Avg Resale Value"

## Problem
The column header and labels say "Avg End Value" but the correct user-facing term is "Avg Resale Value" (matching the underlying data field `avgEndValue` which represents expected resale).

## Changes

### 1. `src/pages/FMSExport.tsx`
- **Line 251**: Table header `Avg End Value` → `Avg Resale Value`
- **Line 677**: Detail sheet label `Avg End Value` → `Avg Resale Value`

### 2. `src/lib/rollupEngine.ts` (CSV export headers)
- **Line 239**: CSV header `Avg End Value` → `Avg Resale Value`
- **Line 276**: CSV header `Avg End Value` → `Avg Resale Value`

No logic changes -- just label text updates in 4 locations across 2 files.
