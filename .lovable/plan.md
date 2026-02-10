

# AI-Powered Category Migration

## The Problem

37 equipment items across 3 users use old category names that don't exist in the v3 taxonomy. You can't manually edit other users' items. We need an automated migration that's smart enough to pick the right v3 category based on the item's make, model, and old category name.

## The Approach

Build a one-time admin migration tool: a backend function that reads all equipment with old categories, sends them to AI in a single batch to pick the best v3 category for each, then updates the database directly using the service role (bypassing RLS so it works across all users).

## Changes

### 1. New backend function: `supabase/functions/migrate-categories/index.ts`

- Requires admin authentication (checks `user_roles` for admin role)
- Queries all equipment where `category` is NOT in the v3 category list
- Sends the list to Lovable AI (Gemini Flash) with the full v3 taxonomy as context
- Prompt: "Given this equipment item (old category, make, model, year), pick the single best v3 category name from this list"
- Uses tool calling to get structured output (array of `{id, newCategory}`)
- Updates each item's `category` column using the service role client
- Returns a summary of what was migrated

### 2. New admin UI: button on the Admin Dashboard

- Add a "Migrate Categories" button in the admin area (only visible to admins)
- Shows a confirmation dialog explaining what will happen
- Calls the edge function, shows progress/results
- Displays a table of changes made: item name, old category, new category
- One-time use -- button disables or hides once no items need migration

### 3. Clean up legacy code

- Remove `LEGACY_CATEGORY_MAP` from `src/contexts/EquipmentContext.tsx` (lines 39-44)
- Update `dbToEquipment` to pass category through without mapping (line 48)

## Files

- **Create**: `supabase/functions/migrate-categories/index.ts`
- **Modify**: `src/pages/AdminDashboard.tsx` -- add migration button/UI
- **Modify**: `src/contexts/EquipmentContext.tsx` -- remove legacy map
- **Modify**: `supabase/config.toml` -- register the new function

## How It Works (Technical)

1. Admin clicks "Migrate Categories" on the admin dashboard
2. Frontend calls the `migrate-categories` edge function
3. Edge function queries: `SELECT id, name, category, make, model, year FROM equipment WHERE category NOT IN (...v3 list...)`
4. Sends batch to Lovable AI with structured tool calling:
   - Input: `{id, name, oldCategory, make, model, year}` for each item
   - Tool schema: returns `{id, newCategory}` array
5. Edge function updates each item: `UPDATE equipment SET category = $newCategory WHERE id = $id` (service role, no RLS)
6. Returns results to frontend for display

## What This Does NOT Change

- No schema changes
- No changes to the v3 taxonomy
- Equipment list, FMS Export, forms all stay the same
- Only the `category` column value changes on affected rows

## Expected Mappings (for reference)

Based on the 37 items in the database:

| Old Category | Example Items | Likely v3 Category |
|---|---|---|
| Lawn (Commercial) | Exmark Lazer Z, John Deere Z955R | Lawn -- Mower -- Zero-Turn |
| Vehicle (Light-Duty) | Ford F-150 type trucks | Fleet -- Truck -- Crew Cab 1/2 Ton |
| Vehicle (Commercial) | Larger trucks | Fleet -- Truck -- Crew Cab 3/4 Ton |
| Trailer | Miska Dump, Sure Trac | Fleet -- Trailer -- various |
| Loader -- Skid Steer | Wacker Neuson ST50 Track | Construction -- Compact Track Loader (CTL) |
| Loader -- Skid Steer Mini | Toro Dingo, Cormidi C50 | Construction -- Compact Utility (Stand-On) |
| Snow Equipment | Boss Snorator | Snow -- Spreader -- Walk-Behind |
| Compaction (Light) | Bartell BR1570, BT1600H | Construction -- Compactor -- Plate/Rammer |
| Excavator -- Compact | Bobcat 324 | Construction -- Excavator -- Compact |
| Large Demo & Specialty Tools | IQ 362 Masonry Saw, blower | Construction -- Saw -- Masonry/Tile (varies) |

The AI will make better individual decisions than a static map because it can look at the specific make and model.

