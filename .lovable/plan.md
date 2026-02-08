

# Fix: Equipment Detail Sheet Not Auto-Updating After Edits

## Problem
When you edit equipment and save, the detail sheet still shows the old values. You have to close and reopen it to see the changes. This happens because the selected equipment is stored as a snapshot in local state -- when the data refreshes from the database, the detail sheet still displays the stale copy.

## Solution
Instead of storing the full equipment object in state, store only the selected equipment **ID**. Then derive the displayed equipment from the live `calculatedEquipment` list on every render. This way, when data refreshes after an update, the detail sheet automatically shows the latest values.

## Technical Details

**File:** `src/pages/EquipmentList.tsx`

1. Change `selectedEquipment` state from storing a full object to storing just an ID:
   - `const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null)`

2. Derive the equipment object from the live data:
   - `const selectedEquipment = selectedEquipmentId ? calculatedEquipment.find(e => e.id === selectedEquipmentId) ?? null : null`

3. Update all references:
   - `onClose` sets `setSelectedEquipmentId(null)`
   - `onSelectEquipment` passes `(eq) => setSelectedEquipmentId(eq.id)`
   - Deep-link handler sets the ID instead of the object
   - The `EquipmentDetailsSheet` still receives the full object (derived from live data)

No changes needed to `EquipmentDetailsSheet.tsx` itself -- only the parent page wiring changes.
