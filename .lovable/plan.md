

# Add Manual Override to Category Migration

## What Happened

The migration already ran successfully -- 36 of 37 items were re-categorized. One item (2025 FORD F150, old category "Vehicle (Light-Duty)") was skipped because the AI returned an invalid category name.

Your equipment list should now show most items in v3 groups. The "Other/Uncategorized" group should only have 1 item left.

## What's Missing

The migration results table is read-only. You need the ability to:
1. **Override** any AI-assigned category that looks wrong
2. **Fix** the 1 skipped item by manually picking its category
3. **See items still needing migration** even after the dialog closes

## Changes

### 1. Add dropdown override to each row in the migration results table

In `src/pages/AdminDashboard.tsx`, replace the plain text "New Category" column with a grouped `<Select>` dropdown (same grouped-by-division pattern used in the equipment form). When changed, it immediately updates the database via a direct Supabase call using the admin's auth.

### 2. Add a "Fix Uncategorized" section

Below the migration results, show any items still using old categories (the skipped ones). Each gets the same dropdown so you can manually assign them a v3 category.

### 3. Persist overrides immediately

When an admin picks a new category from the dropdown, call `supabase.from('equipment').update({ category: newValue }).eq('id', itemId)` directly. No edge function needed since the admin RLS policy already allows viewing all equipment -- but we need to add an admin UPDATE policy for equipment.

### 4. Add admin UPDATE RLS policy for equipment

Currently admins can only SELECT all equipment. Add an UPDATE policy so admins can change the category on any user's equipment.

## Files Modified

- **`src/pages/AdminDashboard.tsx`** -- Add category dropdown to migration results table rows, add "uncategorized items" section, add direct update logic
- **Database migration** -- Add RLS policy: "Admins can update all equipment" for UPDATE on equipment table

## Technical Details

- The dropdown reuses the `categoryDefaults` data grouped by division
- Each row shows: Item Name | Old Category | New Category (dropdown, pre-filled with AI result)
- On dropdown change, immediately updates the DB and shows a success checkmark
- A "Refresh" button lets you re-check for any remaining uncategorized items
- The skipped F150 will appear in the "needs manual assignment" section

