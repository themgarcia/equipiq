

# Remove Category Migration UI

Migration is done, so we'll clean up all the migration-related code from the Admin Dashboard and optionally remove the edge function.

## Changes

### 1. `src/pages/AdminDashboard.tsx`
- Remove the "Migrate Categories" button from the header (lines 624-633)
- Remove the entire Category Migration Dialog (lines 635-771)
- Remove all migration-related state variables: `migrationOpen`, `migrating`, `migrationResults`, `migrationMessage`, `uncategorizedItems`, `updatedIds`, `loadingUncategorized` (lines 67-73)
- Remove the `runCategoryMigration`, `fetchUncategorizedItems`, and `handleCategoryOverride` functions (lines 526-594)
- Remove the top-level `v3Categories` and `categoryByDivision` constants (lines 36-41)
- Remove unused imports: `Wand2`, `Check`, `RefreshCw`, `Dialog`/`DialogContent`/etc., `Table`/`TableBody`/etc., `Progress`, `Select`/`SelectContent`/etc., `categoryDefaults`, `useCallback`

### 2. `supabase/functions/migrate-categories/index.ts`
- Delete this edge function entirely -- it was a one-time tool

### 3. `supabase/config.toml`
- Remove the `migrate-categories` function registration (if present)

No database changes needed -- the admin UPDATE RLS policy on equipment can stay since it's useful for future admin operations.

