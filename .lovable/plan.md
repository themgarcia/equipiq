

# Layout.tsx Cleanup & Consistency Fixes

## Overview

This plan addresses the issues identified in the audit, prioritized by impact and grouped for efficient implementation.

## Changes

### 1. Remove Unused Code

**File:** `src/components/Layout.tsx`

| Line | Issue | Fix |
|------|-------|-----|
| 31 | Unused `Separator` import | Remove from imports |
| 104 | Unused `allNavItems` variable | Delete the line |

### 2. Fix Spacing Inconsistencies

**File:** `src/components/Layout.tsx`

| Location | Current | Target | Line |
|----------|---------|--------|------|
| Mobile group label | `mb-2` | `mb-1` | 434 |
| Mobile footer | `space-y-4` | `space-y-3` | 462 |

### 3. Add Missing Accessibility Attributes

**File:** `src/components/Layout.tsx`

| Element | Missing | Line |
|---------|---------|------|
| Mobile menu button | `aria-label="Open menu"` | 409 |
| Mobile Send Feedback button | `aria-label="Send feedback"` | 467-473 |

### 4. Fix Desktop Admin Button Collapsed Width

**File:** `src/components/Layout.tsx`

The Admin link in sidebar footer (lines 241-262) is missing the collapsed width handling that other sidebar items have.

Add: `isCollapsed && 'w-8 justify-center'` to className

## Files Modified

| File | Changes |
|------|---------|
| `src/components/Layout.tsx` | 6 small edits |

## Out of Scope (Future Consideration)

The following items are noted but not included in this plan to keep the scope focused:

- Extracting `PhoneHeader` to separate file (larger refactor)
- Consolidating `useLocation` calls (requires context pattern)
- Adding focus-trap indicator to Sheet (requires testing)
- Removing duplicate `displayName`/`groups` assignments (minor, can be done later)

