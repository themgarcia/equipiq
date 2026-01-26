
# Import Modal Navigation + Unified AI Icon Design

## Overview

This plan addresses two UX improvements:
1. Add breadcrumb/back navigation to return to import method selection
2. Redesign the AI indicator to be a single unified icon with "AI" text inside the star shape

---

## 1. Breadcrumb/Back Navigation

### Problem
When a user clicks "Import from Documents" or "Import from Spreadsheet" from the selection modal, they can only click "Cancel" to exit - which closes everything. They then have to click the Import button again to select a different option.

### Solution
Add a "Back" button/link at the top of both import dialogs that returns to the method selection modal.

### Implementation

**Changes to `EquipmentImportModal.tsx`:**
- Add a new prop `onBack` callback to pass to child modals
- When child modal's back button is clicked, close child and reopen selection modal

**Changes to `EquipmentImport.tsx`:**
- Add optional `onBack` prop
- Add a breadcrumb-style back link at the top of the dialog header
- Visual: "← Import Equipment" or a ChevronLeft + "Back to options" link

**Changes to `SpreadsheetImport.tsx`:**
- Add optional `onBack` prop
- Add same breadcrumb-style back link at the top

### Visual Design

```
┌────────────────────────────────────────────────────┐
│  ← Back to import options                          │
├────────────────────────────────────────────────────┤
│  Import Equipment from Documents                   │
│  Upload purchase orders, invoices...               │
│                                                    │
│  [Upload zone]                                     │
│                                                    │
│                          [Cancel]  [Process]       │
└────────────────────────────────────────────────────┘
```

The "Back" link appears above the dialog title, making it clear this is navigation, not an action button.

---

## 2. Unified AI Icon Design

### Problem
Current design uses two separate elements:
- A sparkle icon (Sparkles from lucide-react)
- A separate "AI" text badge next to it

User wants: A single unified icon that's a star/sparkle shape large enough to have "AI" text inside it.

### Solution
Redesign `AIIndicator` to render a custom SVG that combines the star shape with "AI" text centered inside, creating one cohesive icon.

### Design Options

**Option A: Star with centered text (recommended)**
A 4-point star shape with "AI" text rendered inside the center. The star is the container, text is centered within.

```
     ★
    /|\
   / | \
  /  AI  \
  \     /
   \   /
    \ /
     ★
```

**Option B: Sparkle badge**
A rounded rectangle with a small sparkle accent in the corner and "AI" text.

### Recommended Approach: Custom SVG Component

Create a custom SVG that:
- Draws a 4-point star/sparkle shape as the background
- Places "AI" text centered inside
- Scales proportionally based on size prop
- Uses the existing purple gradient/color scheme

### Updated Component

```tsx
// src/components/ui/ai-indicator.tsx

interface AIIndicatorProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function AIIndicator({ 
  size = 'sm',
  className 
}: AIIndicatorProps) {
  // Size mappings
  const dimensions = {
    sm: { width: 24, height: 24, fontSize: 6 },
    md: { width: 32, height: 32, fontSize: 8 },
    lg: { width: 40, height: 40, fontSize: 10 },
  };
  
  const { width, height, fontSize } = dimensions[size];
  
  return (
    <svg 
      viewBox="0 0 24 24" 
      width={width} 
      height={height}
      className={cn("inline-block", className)}
    >
      {/* 4-point star path with gradient fill */}
      <defs>
        <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" /> {/* purple-500 */}
          <stop offset="100%" stopColor="#3b82f6" /> {/* blue-500 */}
        </linearGradient>
      </defs>
      <path 
        d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"
        fill="url(#ai-gradient)"
      />
      {/* AI text centered */}
      <text 
        x="12" 
        y="12" 
        textAnchor="middle" 
        dominantBaseline="central"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        AI
      </text>
    </svg>
  );
}
```

### Updated Props
- Remove `showBadge` prop (no longer needed - text is always inside)
- Keep `size` prop with updated values: 'sm' | 'md' | 'lg'
- Keep `className` prop

### Update All Usages

**Files to update:**
- `EquipmentImportModal.tsx` - Update AIIndicator usage
- `SpreadsheetImport.tsx` - Update AIIndicator usage (tab trigger)
- `SpreadsheetImportAI.tsx` - Update AIIndicator usage (info banner)
- `InsuranceControl.tsx` - Update AIIndicator usage (button)

Remove `showBadge` prop from all usages since it's no longer applicable.

---

## 3. File Changes Summary

| File | Change |
|------|--------|
| `src/components/ui/ai-indicator.tsx` | Rewrite as unified star+text SVG |
| `src/components/EquipmentImportModal.tsx` | Add back navigation logic |
| `src/components/EquipmentImport.tsx` | Add `onBack` prop + back link UI |
| `src/components/SpreadsheetImport.tsx` | Add `onBack` prop + back link UI, update AIIndicator |
| `src/components/SpreadsheetImportAI.tsx` | Update AIIndicator usage |
| `src/pages/InsuranceControl.tsx` | Update AIIndicator usage |

---

## 4. Technical Details

### Back Navigation Flow

```
User clicks "Import" button
    ↓
EquipmentImportModal opens (method selection)
    ↓
User clicks "Import from Documents"
    ↓
EquipmentImportModal closes, EquipmentImport opens
    ↓
User clicks "← Back" link
    ↓
EquipmentImport closes, EquipmentImportModal reopens
```

### State Management in EquipmentImportModal

```tsx
const handleBackFromDocuments = () => {
  setDocumentImportOpen(false);
  onOpenChange(true); // Reopen selection modal
};

const handleBackFromSpreadsheet = () => {
  setSpreadsheetImportOpen(false);
  onOpenChange(true); // Reopen selection modal
};
```

### AIIndicator SVG Path Explanation

The path `M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z` creates a 4-point star:
- Center at (12, 12) in a 24x24 viewBox
- Points extend to edges (top: 2, right: 22, bottom: 22, left: 2)
- Inner points create the star indentations

---

## 5. Implementation Order

1. **Update AIIndicator component** - New unified SVG design
2. **Update all AIIndicator usages** - Remove deprecated `showBadge` prop
3. **Add back navigation to EquipmentImportModal** - State + callbacks
4. **Add back link to EquipmentImport** - UI + prop
5. **Add back link to SpreadsheetImport** - UI + prop
