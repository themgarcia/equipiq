
# AI Indicator Placement Audit - Complete Findings

## Summary

This audit identifies all AI-powered features in the application and verifies whether they have the `AIIndicator` component appropriately placed.

---

## Current AIIndicator Placements (Existing - 5 total)

| Location | File | Component/Button | Status |
|----------|------|------------------|--------|
| Equipment Import Modal | `EquipmentImportModal.tsx` | "Import from Documents" option | Has AIIndicator |
| Spreadsheet Import | `SpreadsheetImport.tsx` | "AI Mode" tab trigger | Has AIIndicator |
| Spreadsheet Import AI | `SpreadsheetImportAI.tsx` | Info banner explaining AI analysis | Has AIIndicator |
| Insurance Control | `InsuranceControl.tsx` | "Import from Policy" button | Has AIIndicator |
| AI Indicator Component | `ui/ai-indicator.tsx` | Component definition | N/A |

---

## AI-Powered Features Needing Review

### 1. Voice Dictation Button (MISSING AI Indicator)
**File:** `src/components/ui/voice-dictation-button.tsx`  
**Used in:** `FeedbackDialog.tsx`  
**AI Technology:** ElevenLabs Scribe (real-time AI transcription)

**Current State:** No AI indicator - just a microphone icon with tooltip saying "Voice input"

**Recommendation:** Add AIIndicator to tooltip or button label to indicate this is AI-powered transcription, not basic browser speech recognition.

---

### 2. Equipment Import Dialog Header (OPTIONAL)
**File:** `src/components/EquipmentImport.tsx`  
**Current State:** Dialog description mentions "AI will extract equipment details" but no visual AI badge in the header

**Recommendation:** Consider adding AIIndicator next to the dialog title "Import Equipment from Documents" for immediate visibility, though the parent modal already has the indicator.

---

### 3. Insurance Policy Import Dialog Header (MISSING AI Indicator)
**File:** `src/components/insurance/InsurancePolicyImport.tsx`  
**Current State:** Dialog description mentions "AI will extract broker contact, policy details" but no visual AI badge in the header

**Recommendation:** Add AIIndicator next to the dialog title "Import from Policy Document" for consistency with the Equipment import modal pattern.

---

## Features That Do NOT Need AI Indicator

| Feature | Reason |
|---------|--------|
| `parse-equipment-docs` edge function | Backend only - UI entry points already have indicators |
| `parse-equipment-spreadsheet` edge function | Backend only - UI already has indicator in AI Mode tab |
| `parse-insurance-docs` edge function | Backend only - button has indicator (after this audit fix) |
| `elevenlabs-scribe-token` edge function | Backend only - but VoiceDictationButton needs indicator |

---

## Implementation Plan

### Priority 1: Voice Dictation Button Enhancement
**File:** `src/components/ui/voice-dictation-button.tsx`

Add AIIndicator to the tooltip content to indicate this is AI-powered:

```tsx
<TooltipContent side="left" className="flex items-center gap-1.5">
  <AIIndicator size="sm" />
  {isListening ? "Stop dictation" : "Voice dictation"}
</TooltipContent>
```

This subtly indicates the feature is AI-powered without cluttering the button itself.

---

### Priority 2: Insurance Policy Import Dialog
**File:** `src/components/insurance/InsurancePolicyImport.tsx`

Add AIIndicator to the dialog title for consistency:

```tsx
<DialogTitle className="flex items-center gap-2">
  Import from Policy Document
  <AIIndicator size="sm" />
</DialogTitle>
```

---

### Priority 3 (Optional): Equipment Import Dialog
**File:** `src/components/EquipmentImport.tsx`

This is optional since the parent `EquipmentImportModal` already shows the AI indicator on the "Import from Documents" option. However, for users who navigate directly to this dialog, adding consistency could help:

```tsx
<DialogTitle className="flex items-center gap-2">
  Import Equipment from Documents
  <AIIndicator size="sm" />
</DialogTitle>
```

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/components/ui/voice-dictation-button.tsx` | Add AIIndicator to tooltip | High |
| `src/components/insurance/InsurancePolicyImport.tsx` | Add AIIndicator to dialog title | High |
| `src/components/EquipmentImport.tsx` | Add AIIndicator to dialog title (optional) | Low |

---

## Visual Consistency Guidelines

After this audit, all AI-powered entry points will follow this pattern:

1. **Buttons that trigger AI features**: AIIndicator badge inline with button text
2. **Tab triggers for AI modes**: AIIndicator badge before tab label
3. **Dialog headers for AI workflows**: AIIndicator badge after dialog title
4. **AI-powered input tools (voice)**: AIIndicator in tooltip
5. **Info banners explaining AI**: AIIndicator at start of banner content

---

## Summary of Changes

| Component | Current | After Fix |
|-----------|---------|-----------|
| Voice Dictation tooltip | "Voice input" | "[AI badge] Voice dictation" |
| Insurance Import dialog title | "Import from Policy Document" | "Import from Policy Document [AI badge]" |
| Equipment Import dialog title | "Import Equipment from Documents" | "Import Equipment from Documents [AI badge]" (optional) |

Total new AIIndicator additions: 2-3 locations
