

# Codebase Cleanup and Optimization

## Issues Found

### 1. Dead Code: Legacy Document/Attachment Modals in EquipmentList

**File: `src/pages/EquipmentList.tsx`**

Six state variables and two modal components (`EquipmentDocuments`, `EquipmentAttachments`) are declared but **never triggered** -- the setters for `documentsOpen`, `documentsEquipmentId`, `documentsEquipmentName`, `attachmentsOpen`, `attachmentsEquipmentId`, and `attachmentsEquipmentName` are never called. These were made obsolete when document/attachment management moved into the `EquipmentDetailsSheet`.

**Fix:** Remove the 6 state variables, the 2 modal components from JSX, and the 2 corresponding imports (`EquipmentDocuments`, `EquipmentAttachments`).

---

### 2. Dead Code: Unused EquipmentForm State in EquipmentList

**File: `src/pages/EquipmentList.tsx`**

`isFormOpen`, `editingEquipment`, and the `handleFormSubmit` function are declared but never triggered. The `EquipmentForm` modal is rendered but can never be opened because nothing ever calls `setIsFormOpen(true)`. Equipment editing now goes through the `EquipmentDetailsSheet`.

**Fix:** Remove `isFormOpen`, `editingEquipment`, `handleFormSubmit`, the `EquipmentForm` component from JSX, and the `EquipmentForm` import.

---

### 3. Dead Code: Unused UpgradePrompt State in EquipmentList

**File: `src/pages/EquipmentList.tsx`**

`showUpgradePrompt` is declared with `useState(false)` but `setShowUpgradePrompt(true)` is never called anywhere. The `UpgradePrompt` modal is rendered but can never be shown.

**Fix:** Remove `showUpgradePrompt` state, the `UpgradePrompt` component from JSX, and the `UpgradePrompt` import.

---

### 4. Unused Import: `EquipmentCalculated` in EquipmentList

**File: `src/pages/EquipmentList.tsx`**

`EquipmentCalculated` is imported but never referenced in the file.

**Fix:** Remove from the import statement.

---

### 5. Dead Code: `ExtractedEquipment` Interface Duplicated in EquipmentList

**File: `src/pages/EquipmentList.tsx`**

Lines 23-44 define an `ExtractedEquipment` interface locally. This type is already defined in `src/types/equipment.ts` as `ExtractedEquipmentBase`. The local version is only used to type the `extractedEquipment` state and the `handleEquipmentExtracted` callback. It should use the canonical type from the types file.

**Fix:** Replace the local interface with an import of `ExtractedEquipmentBase` from `@/types/equipment`.

---

### 6. Dead State: `mobileMenuOpen` in Landing Page

**File: `src/pages/Landing.tsx`**

`mobileMenuOpen` state is set to false in scroll-to-section callbacks, but the Sheet component manages its own open state internally. `setMobileMenuOpen(false)` has no effect since `mobileMenuOpen` is never passed to the Sheet.

**Fix:** Remove `mobileMenuOpen` state and the `setMobileMenuOpen(false)` calls from the scroll handlers.

---

### 7. Duplicated Utility: `formatPhoneNumber` in Two Insurance Files

**Files: `src/components/insurance/InsuranceSettingsTab.tsx`, `src/components/insurance/InsurancePolicyImportReview.tsx`**

The identical `formatPhoneNumber` function is defined in both files.

**Fix:** Extract to a shared utility (e.g., `src/lib/formatUtils.ts`) and import in both files.

---

### 8. Debug-Only Code: `console.log` Statements in Import Review

**File: `src/components/EquipmentImportReview.tsx`**

Multiple `console.log` calls for document attachment flow (lines ~1260-1414). These are development debug logs that should be cleaned up for production.

**Fix:** Remove or downgrade to `console.debug` so they don't appear in production console.

---

## Summary of Changes

| File | Action |
|---|---|
| `src/pages/EquipmentList.tsx` | Remove 11 dead state variables, 3 unused modal components + imports, unused type import, replace local interface with canonical import |
| `src/pages/Landing.tsx` | Remove dead `mobileMenuOpen` state and ineffective setter calls |
| `src/lib/formatUtils.ts` | Create shared `formatPhoneNumber` utility |
| `src/components/insurance/InsuranceSettingsTab.tsx` | Import shared `formatPhoneNumber` instead of local definition |
| `src/components/insurance/InsurancePolicyImportReview.tsx` | Import shared `formatPhoneNumber` instead of local definition |
| `src/components/EquipmentImportReview.tsx` | Remove or downgrade debug `console.log` statements |

## Impact

- Smaller bundle for the Equipment page (removes 2 unused component imports)
- Cleaner state management (11 fewer useState hooks on the Equipment page)
- Cleaner production console output
- Single source of truth for shared utilities
- No functional changes -- all removed code is confirmed unreachable

