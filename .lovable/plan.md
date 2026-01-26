

# Equipment Entry Source Tracking + Unified "Add to Equipment" Flow

## Overview

This plan implements two features:
1. **Entry Source Tracking** - Track whether each piece of equipment was added via Manual Entry, AI Document Import, or Spreadsheet Import
2. **Unified "Add to Equipment" Button** - Consolidate the Import and Add Equipment buttons into a single entry point

---

## Part 1: Entry Source Tracking

### Database Change

Add a new column to the `equipment` table:

```sql
ALTER TABLE public.equipment 
ADD COLUMN entry_source TEXT NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN public.equipment.entry_source IS 
  'How the equipment was added: manual, ai_document, or spreadsheet';
```

Valid values:
- `'manual'` - User filled out the form by hand
- `'ai_document'` - Imported via AI document parsing (invoices, PDFs, photos)
- `'spreadsheet'` - Imported via spreadsheet (CSV/Excel)

### Code Changes

**1. Update Equipment Context** (`src/contexts/EquipmentContext.tsx`)

Modify `addEquipment` to accept an optional `entrySource` parameter:

```typescript
addEquipment: (equipment: Omit<Equipment, 'id'>, entrySource?: 'manual' | 'ai_document' | 'spreadsheet') => Promise<string | undefined>;
```

When inserting, include the source:
```typescript
entry_source: entrySource || 'manual'
```

**2. Update Equipment Type** (`src/types/equipment.ts`)

Add the field to the Equipment interface:
```typescript
entrySource?: 'manual' | 'ai_document' | 'spreadsheet';
```

**3. Update Import Review** (`src/components/EquipmentImportReview.tsx`)

Pass the source when adding equipment. The source is determined by how the user got to the review screen:
- From `EquipmentImport` (documents) -> `'ai_document'`
- From `SpreadsheetImportAI` (AI mode) -> `'ai_document'`  
- From `SpreadsheetImportStructured` (table mode) -> `'spreadsheet'`

**4. Update Spreadsheet Import Components**

Pass a prop to indicate the import type (AI vs structured) so the review component knows which source to use.

### Admin Dashboard View

Add a simple "Import Sources" section to the Admin Dashboard showing:

**Per-User Breakdown Table:**
| User | Manual | AI Document | Spreadsheet | Total |
|------|--------|-------------|-------------|-------|
| john@example.com | 5 (33%) | 8 (53%) | 2 (13%) | 15 |
| jane@example.com | 12 (60%) | 6 (30%) | 2 (10%) | 20 |

**Aggregate Stats (cards):**
- Total Equipment: X
- Manual Entry: Y (Z%)
- AI Document Import: Y (Z%)
- Spreadsheet Import: Y (Z%)

This uses a simple query:
```sql
SELECT 
  entry_source,
  COUNT(*) as count
FROM equipment
GROUP BY entry_source
```

---

## Part 2: Unified "Add to Equipment" Button

### Current State
The Equipment page has two separate buttons:
- **Import** - Opens modal with 2 options (Documents, Spreadsheet)
- **Add Equipment** - Opens form directly

### New Flow
Single **"+ Add to Equipment"** button that opens a modal with three options:

```text
┌─────────────────────────────────────────────────┐
│  Add to Equipment                               │
│  Choose how you'd like to add equipment.        │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ 📝 Manual Data Entry                     │   │
│  │ Enter equipment details by hand          >   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ 📄 Import from Documents       [AI]      │   │
│  │ Upload invoices, spec sheets, PDFs       >   │
│  └──────────────────────────────────────────┘   │
│                                                 │
│  ┌──────────────────────────────────────────┐   │
│  │ 📊 Import from Spreadsheet               │   │
│  │ Upload CSV or Excel files                >   │
│  └──────────────────────────────────────────┘   │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Components

**New File**: `src/components/AddEquipmentModal.tsx`
- Shows three options as cards/buttons
- Manual: Opens `EquipmentForm` inline or in nested dialog
- Documents: Opens `EquipmentImport` with back navigation
- Spreadsheet: Opens `SpreadsheetImport` with back navigation

**Update**: `src/pages/EquipmentList.tsx`
- Replace two buttons with single "Add to Equipment" button
- Use new `AddEquipmentModal`
- Handle form open state internally

**Update**: `src/components/EquipmentImportModal.tsx`
- This component becomes optional/deprecated since `AddEquipmentModal` replaces it

---

## Implementation Sequence

### Phase 1: Database
1. Add `entry_source` column to equipment table via migration

### Phase 2: Entry Source Tracking
2. Update `Equipment` type to include `entrySource`
3. Update `EquipmentContext` - `addEquipment` accepts optional source parameter
4. Update `EquipmentImportReview` to pass source when adding equipment
5. Update `SpreadsheetImport` and child components to pass import type

### Phase 3: Admin View
6. Create simple "Entry Sources" section in Admin Dashboard (or a new tab)

### Phase 4: Unified Button
7. Create `AddEquipmentModal` component
8. Update `EquipmentList.tsx` to use unified button

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/AddEquipmentModal.tsx` | Unified entry point for adding equipment |
| `src/components/admin/EntrySourcesTab.tsx` | Admin view showing import source breakdown |

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/equipment.ts` | Add `entrySource` field to Equipment interface |
| `src/contexts/EquipmentContext.tsx` | Accept `entrySource` in `addEquipment`, save to DB |
| `src/components/EquipmentImportReview.tsx` | Pass source when calling `addEquipment` |
| `src/components/SpreadsheetImport.tsx` | Track and pass import type (AI vs structured) |
| `src/pages/EquipmentList.tsx` | Replace two buttons with unified "Add to Equipment" |
| `src/pages/AdminDashboard.tsx` | Add Entry Sources tab/section |

---

## Migration Script

```sql
-- Add entry_source column to track how equipment was added
ALTER TABLE public.equipment 
ADD COLUMN entry_source TEXT NOT NULL DEFAULT 'manual';

-- Add comment for documentation
COMMENT ON COLUMN public.equipment.entry_source IS 
  'How the equipment was added: manual, ai_document, or spreadsheet';

-- Create index for efficient grouping queries
CREATE INDEX idx_equipment_entry_source ON public.equipment(entry_source);
```

---

## Summary

| Feature | What It Does |
|---------|--------------|
| Entry Source Tracking | Each equipment record stores how it was added (manual/ai_document/spreadsheet) |
| Admin Dashboard | Shows breakdown by source per user and aggregate across all users |
| Unified Button | Single "Add to Equipment" button with three clear options |

This gives you the data to understand how different users are adding equipment without the overhead of a complex AI analytics system.

