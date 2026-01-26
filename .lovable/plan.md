
# Fix: Show AI Indicator on Mobile for Insurance Import Button

## Problem Identified

On the Insurance page (`/insurance`), the "Import from Policy" button has the AI indicator hidden on mobile:

```tsx
<Button variant="outline" onClick={() => setImportModalOpen(true)} className="gap-2">
  <Upload className="h-4 w-4" />
  <span className="hidden sm:inline">Import from Policy</span>
  <span className="sm:hidden">Import</span>
  <AIIndicator size="sm" className="hidden sm:inline-flex" />  // <-- Hidden on mobile
</Button>
```

This was likely done to save horizontal space, but now that we have a compact pill badge design, we should show the AI indicator on mobile too.

---

## Solution

Remove the `hidden sm:inline-flex` class from the `AIIndicator` so it's always visible, regardless of screen size.

---

## File Change

**`src/pages/InsuranceControl.tsx`** (line 109)

Change from:
```tsx
<AIIndicator size="sm" className="hidden sm:inline-flex" />
```

To:
```tsx
<AIIndicator size="sm" />
```

This single change ensures the AI badge appears on both mobile and desktop.

---

## Visual Result

**Before (mobile):**
```
[Upload icon] Import
```

**After (mobile):**
```
[Upload icon] Import [✦ AI]
```

---

## Verification Checklist

After this fix, all AIIndicator usages will be visible on mobile:

| Location | Status |
|----------|--------|
| Insurance "Import from Policy" button | Will be fixed |
| Equipment Import Modal - Documents option | Already visible |
| Spreadsheet Import - AI Mode tab | Already visible |
| Spreadsheet Import AI - Info banner | Already visible |
