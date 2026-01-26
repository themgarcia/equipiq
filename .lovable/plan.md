

# Spreadsheet Import + AI Visual Indicator System

## Overview

This plan implements a comprehensive spreadsheet import feature with two modes (Structured and AI-assisted) and introduces a reusable AI visual indicator system across the application.

**Key UI Change**: The import button remains a simple button that opens a unified "Import Equipment" modal where users select their import method.

---

## 1. New Components and Files

### 1.1 AI Indicator Component

**File: `src/components/ui/ai-indicator.tsx`**

A reusable component that displays an AI indicator (sparkle icon + optional "AI" badge).

```
Props:
- showBadge: boolean (default: true) - Whether to show the "AI" text pill
- size: 'sm' | 'md' (default: 'sm') - Icon size
- className: string - Additional CSS classes

Visual: Sparkles icon + gradient purple/blue "AI" pill badge
```

### 1.2 Equipment Import Modal (Updated)

**File: `src/components/EquipmentImportModal.tsx`**

New unified import modal that presents import method options:

```
Props:
- open: boolean
- onOpenChange: (open: boolean) => void

Structure:
- Title: "Import Equipment"
- Description: "Choose how you'd like to import your equipment data."
- Option Cards:
  1. "Import from Documents" with AI indicator
     - Icon: FileText
     - Description: "Upload photos, PDFs, or scans of invoices, spec sheets, or purchase documents."
     - Opens existing EquipmentImport flow
  
  2. "Import from Spreadsheet"
     - Icon: Sheet/Table
     - Description: "Upload a CSV or Excel file with your equipment list."
     - Opens new SpreadsheetImport flow
```

### 1.3 Spreadsheet Import Modal

**File: `src/components/SpreadsheetImport.tsx`**

Modal for spreadsheet import with tabbed interface for two modes.

```
Props:
- open: boolean
- onOpenChange: (open: boolean) => void
- onEquipmentExtracted: (equipment: ExtractedEquipment[], ...) => void

State:
- activeMode: 'structured' | 'ai'
- file: File | null
- selectedSheet: string (for XLSX)
- sheets: string[] (available sheets in XLSX)
- parsedData: any[][] (2D grid)
- headerRowIndex: number
- columnMappings: Record<string, number | null>
- validationErrors: ValidationError[]
- isProcessing: boolean
```

### 1.4 Structured Import Components

**File: `src/components/SpreadsheetImportStructured.tsx`**

Multi-step structured import flow:
1. File upload (CSV/XLSX)
2. Sheet selection (XLSX only)
3. Header row selection
4. Column mapping
5. Validation preview
6. Confirm and send to review

**File: `src/components/SpreadsheetColumnMapper.tsx`**

Column mapping UI component:
- Lists all mappable EquipIQ fields
- Dropdown for each field to select spreadsheet column
- Shows preview of first few values
- Highlights required vs optional fields

### 1.5 AI Spreadsheet Import Components

**File: `src/components/SpreadsheetImportAI.tsx`**

AI-assisted import for messy spreadsheets:
1. File upload (XLSX primarily)
2. Sheet selection
3. Range selection (optional)
4. Grid preview with guardrails
5. Process with AI

---

## 2. Edge Function

### 2.1 parse-equipment-spreadsheet

**File: `supabase/functions/parse-equipment-spreadsheet/index.ts`**

```
Input:
{
  sheetName: string,
  grid: any[][] (2D array of cell values),
  range?: { startRow?: number, endRow?: number, startCol?: number, endCol?: number },
  fileName?: string
}

Output (matches existing ExtractedEquipment shape):
{
  success: boolean,
  equipment: ExtractedEquipment[],
  warnings: string[],
  processingNotes: string,
  confidence: 'high' | 'medium' | 'low'
}

AI Prompt Instructions:
- Extract equipment records from tabular data
- Ignore total/subtotal/summary rows
- Handle multiple tables within one sheet
- Normalize currency formatting ($, commas, parentheses for negatives)
- Return confidence notes when data is ambiguous
- Suggest categories using same logic as parse-equipment-docs
```

---

## 3. UI Changes

### 3.1 Equipment List Page - Import Button Flow

**File: `src/pages/EquipmentList.tsx`**

The import button stays as a simple button, but now opens the new unified import modal:

```
Before:
<Button variant="outline" onClick={() => setIsImportOpen(true)}>
  <Upload className="h-4 w-4" />
  Import
</Button>
→ Opens EquipmentImport directly

After:
<Button variant="outline" onClick={() => setImportModalOpen(true)}>
  <Upload className="h-4 w-4" />
  Import
</Button>
→ Opens EquipmentImportModal (method selection)
  → User picks "Documents" → Opens EquipmentImport
  → User picks "Spreadsheet" → Opens SpreadsheetImport
```

### 3.2 Import Modal Option Cards Design

```
┌─────────────────────────────────────────────────────────┐
│  Import Equipment                                    ✕  │
│  Choose how you'd like to import your equipment data.   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📄  Import from Documents              [AI]    │   │
│  │      Upload photos, PDFs, or scans of invoices, │   │
│  │      spec sheets, or purchase documents.        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📊  Import from Spreadsheet                    │   │
│  │      Upload a CSV or Excel file with your       │   │
│  │      equipment list.                            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 Insurance Control Page - AI Indicator

**File: `src/pages/InsuranceControl.tsx`**

Add AI indicator to the "Import from Policy" button:

```
<Button variant="outline" onClick={() => setImportModalOpen(true)}>
  <Upload className="h-4 w-4 sm:mr-2" />
  <span className="hidden sm:inline">Import from Policy</span>
  <span className="sm:hidden">Import</span>
  <AIIndicator className="ml-2" showBadge={false} />
</Button>
```

---

## 4. Dependencies

### 4.1 NPM Packages to Add

```
papaparse - CSV parsing (client-side)
xlsx - XLSX/XLS parsing (client-side)
```

Both are well-established libraries:
- papaparse: ~1.4MB, handles streaming, encoding detection
- xlsx (SheetJS): ~2.5MB, full Excel compatibility

---

## 5. Detailed Implementation

### 5.1 AI Indicator Component

```tsx
// src/components/ui/ai-indicator.tsx
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIIndicatorProps {
  showBadge?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function AIIndicator({ 
  showBadge = true, 
  size = 'sm',
  className 
}: AIIndicatorProps) {
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1",
      className
    )}>
      <Sparkles className={cn(iconSize, "text-purple-500")} />
      {showBadge && (
        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full 
                         bg-gradient-to-r from-purple-500/10 to-blue-500/10 
                         text-purple-600 dark:text-purple-400">
          AI
        </span>
      )}
    </span>
  );
}
```

### 5.2 Equipment Import Modal (Method Selection)

```tsx
// src/components/EquipmentImportModal.tsx

interface EquipmentImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EquipmentImportModal({ open, onOpenChange }: EquipmentImportModalProps) {
  const [documentImportOpen, setDocumentImportOpen] = useState(false);
  const [spreadsheetImportOpen, setSpreadsheetImportOpen] = useState(false);

  const handleDocumentSelect = () => {
    onOpenChange(false);
    setDocumentImportOpen(true);
  };

  const handleSpreadsheetSelect = () => {
    onOpenChange(false);
    setSpreadsheetImportOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Equipment</DialogTitle>
            <DialogDescription>
              Choose how you'd like to import your equipment data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {/* Document Import Option */}
            <button
              onClick={handleDocumentSelect}
              className="w-full p-4 rounded-lg border bg-card text-left 
                         hover:bg-accent hover:border-accent-foreground/20 
                         transition-colors group"
            >
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 mt-0.5 text-muted-foreground 
                                     group-hover:text-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Import from Documents</span>
                    <AIIndicator />
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload photos, PDFs, or scans of invoices, spec sheets, 
                    or purchase documents.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground 
                                         group-hover:text-foreground" />
              </div>
            </button>

            {/* Spreadsheet Import Option */}
            <button
              onClick={handleSpreadsheetSelect}
              className="w-full p-4 rounded-lg border bg-card text-left 
                         hover:bg-accent hover:border-accent-foreground/20 
                         transition-colors group"
            >
              <div className="flex items-start gap-3">
                <Table className="h-5 w-5 mt-0.5 text-muted-foreground 
                                  group-hover:text-foreground" />
                <div className="flex-1">
                  <span className="font-medium">Import from Spreadsheet</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a CSV or Excel file with your equipment list.
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground 
                                         group-hover:text-foreground" />
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Existing Document Import */}
      <EquipmentImport 
        open={documentImportOpen} 
        onOpenChange={setDocumentImportOpen}
        onEquipmentExtracted={...}
      />

      {/* New Spreadsheet Import */}
      <SpreadsheetImport
        open={spreadsheetImportOpen}
        onOpenChange={setSpreadsheetImportOpen}
        onEquipmentExtracted={...}
      />
    </>
  );
}
```

### 5.3 Spreadsheet Import Modal Structure

```tsx
// src/components/SpreadsheetImport.tsx

interface SpreadsheetImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentExtracted: (equipment: ExtractedEquipment[], ...) => void;
}

export function SpreadsheetImport({ open, onOpenChange, onEquipmentExtracted }) {
  const [activeMode, setActiveMode] = useState<'structured' | 'ai'>('structured');
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import from Spreadsheet</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import equipment data.
          </DialogDescription>
        </DialogHeader>
        
        {/* Mode Tabs */}
        <Tabs value={activeMode} onValueChange={setActiveMode}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="structured">
              <Table className="h-4 w-4 mr-2" />
              Structured (Table)
            </TabsTrigger>
            <TabsTrigger value="ai">
              <AIIndicator showBadge={false} className="mr-2" />
              AI (Messy Spreadsheet)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="structured">
            <SpreadsheetImportStructured 
              onEquipmentExtracted={onEquipmentExtracted}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>
          
          <TabsContent value="ai">
            <SpreadsheetImportAI
              onEquipmentExtracted={onEquipmentExtracted}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

### 5.4 Structured Import Flow

Step-by-step flow with state management:

```
Step 1: Upload
- Accept .csv, .xlsx, .xls
- Validate file size (max 10MB)
- Parse immediately on upload

Step 2: Sheet Selection (XLSX only)
- List all available sheets
- Default to first sheet
- Re-parse on sheet change

Step 3: Header Row Selection
- Show first 10 rows as preview
- Clickable rows to select header
- Default to first non-empty row

Step 4: Column Mapping
- Left side: EquipIQ fields (name, category, make, model, year, etc.)
- Right side: Dropdown with spreadsheet columns
- Show sample value from first data row
- Required fields highlighted

Step 5: Validation
- Parse all rows using mappings
- Show validation errors inline
- Count: valid rows, invalid rows, skipped
- Allow fixing mappings or skipping rows

Step 6: Confirm
- Transform to ExtractedEquipment[]
- Pass to existing review flow
```

### 5.5 AI Spreadsheet Import Flow

```
Step 1: Upload
- Primary: XLSX
- Parse to get sheet list

Step 2: Sheet Selection
- List sheets with row/col counts

Step 3: Range Selection (Optional)
- Default: "Analyze entire sheet"
- Option: Limit to first N rows/cols
- Option: Specify row range (start/end)
- Guardrails: 200 rows x 30 cols max

Step 4: Grid Preview
- Show bounded grid preview
- Highlight if truncation applied
- Show cell count warning if large

Step 5: Process
- Call parse-equipment-spreadsheet edge function
- Handle 429/402 rate limit errors
- Show processing status

Step 6: Review
- Pass results to existing review flow
```

### 5.6 Field Mapping Configuration

```typescript
// Mappable fields for structured import
const SPREADSHEET_MAPPABLE_FIELDS = [
  { key: 'name', label: 'Name', required: true },
  { key: 'category', label: 'Category', required: false },
  { key: 'make', label: 'Make', required: true },
  { key: 'model', label: 'Model', required: true },
  { key: 'year', label: 'Year', required: false },
  { key: 'serialVin', label: 'Serial / VIN', required: false },
  { key: 'purchasePrice', label: 'Purchase Price', required: false },
  { key: 'purchaseDate', label: 'Purchase Date', required: false },
  { key: 'financingType', label: 'Financing Type', required: false },
  { key: 'monthlyPayment', label: 'Monthly Payment', required: false },
  { key: 'isInsured', label: 'Is Insured', required: false },
  { key: 'insuranceDeclaredValue', label: 'Insurance Value', required: false },
];
```

### 5.7 Edge Function Implementation

```typescript
// supabase/functions/parse-equipment-spreadsheet/index.ts

const systemPrompt = `You are an equipment data extraction assistant.
You are analyzing a spreadsheet grid that may contain equipment asset data.

TASK: Extract equipment records from the provided 2D grid.

RULES:
1. Each row typically represents one equipment item
2. IGNORE rows that are:
   - Headers/column labels
   - Subtotals, totals, or summary rows
   - Empty or mostly empty
   - Section headers or category labels
3. If multiple tables exist in the grid, extract from ALL tables
4. Normalize values:
   - Currency: Remove $, commas, handle (parentheses) as negative
   - Dates: Convert to YYYY-MM-DD format
   - Year: Extract 4-digit year
5. For each item, suggest a category from the valid list
6. Set confidence based on data quality

OUTPUT: Array of equipment records matching the schema.
Include warnings array for any issues detected.`;

// Tool definition similar to parse-equipment-docs
// Input: grid (2D array), Output: ExtractedEquipment[]
```

---

## 6. Integration Points

### 6.1 Reusing Existing Review Flow

Both structured and AI modes output `ExtractedEquipment[]` and route to:
- `EquipmentImportReview` component (existing)
- Same duplicate detection, category mapping, merge/update logic
- Same database write flow

### 6.2 Onboarding Integration

Both import methods trigger:
```typescript
markStepComplete('step_equipment_imported');
```

### 6.3 Subscription Check

Same pattern as document import:
```typescript
const { canUseAIParsing } = useSubscription();
// AI mode requires subscription, structured mode is free
```

---

## 7. Error Handling

### 7.1 File Errors
- Invalid file type: Toast with supported formats
- File too large: Toast with size limit
- Parse error: Toast with specific error message
- Empty file: Toast prompting to check file

### 7.2 AI Processing Errors
- Rate limit (429): "Rate limit exceeded, please try again later"
- Payment required (402): "Please add credits to continue"
- Timeout: "Processing took too long. Try selecting a smaller range."
- No equipment found: "No equipment data could be extracted"

---

## 8. Guardrails and Limits

| Limit | Value | Applied In |
|-------|-------|------------|
| Max file size | 10 MB | Client-side |
| Max grid rows (AI mode) | 200 | Client-side |
| Max grid columns (AI mode) | 30 | Client-side |
| Max total cells (AI mode) | 6,000 | Client-side |
| Preview rows (structured) | 100 | Client-side |
| All rows imported (structured) | No limit | After mapping |

---

## 9. File Structure Summary

```
src/
  components/
    ui/
      ai-indicator.tsx (NEW)
    EquipmentImportModal.tsx (NEW - method selection)
    SpreadsheetImport.tsx (NEW)
    SpreadsheetImportStructured.tsx (NEW)
    SpreadsheetImportAI.tsx (NEW)
    SpreadsheetColumnMapper.tsx (NEW)
  pages/
    EquipmentList.tsx (MODIFIED - opens EquipmentImportModal)
    InsuranceControl.tsx (MODIFIED - AI indicator on button)

supabase/
  functions/
    parse-equipment-spreadsheet/
      index.ts (NEW)
```

---

## 10. Implementation Order

1. **Phase 1: Foundation**
   - Create `ai-indicator.tsx` component
   - Add papaparse and xlsx dependencies

2. **Phase 2: Modal Flow**
   - Create `EquipmentImportModal.tsx` (method selection)
   - Modify `EquipmentList.tsx` to use new modal
   - Add AI indicator to Insurance page button

3. **Phase 3: Spreadsheet Modal Shell**
   - Create `SpreadsheetImport.tsx` with tabs

4. **Phase 4: Structured Import**
   - Create `SpreadsheetImportStructured.tsx`
   - Create `SpreadsheetColumnMapper.tsx`
   - Implement CSV/XLSX parsing
   - Implement validation and preview
   - Connect to existing review flow

5. **Phase 5: AI Import**
   - Create `parse-equipment-spreadsheet` edge function
   - Create `SpreadsheetImportAI.tsx`
   - Implement grid extraction and range selection
   - Connect to existing review flow

6. **Phase 6: Polish**
   - Error handling refinement
   - Mobile responsive testing
   - Guardrail messaging

