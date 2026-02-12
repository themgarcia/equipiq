

# Fix: Make Primary = Brand Amber in Both Modes

## The Real Problem

The previous fix went the wrong direction. It made `--primary` = slate blue in both modes, but there are **300+ uses** of `text-primary` and `bg-primary` across the app for icons, buttons, highlights, and selection states. These all look best as amber (the brand color). Only the Landing page was updated to use the new `brand` variant -- every other page still uses `primary` and now renders as muted slate blue in dark mode.

Updating 300+ usages across 36 files to switch from `primary` to `accent` is impractical and fragile. The simpler, correct fix: make `--primary` = amber in both modes, since that is what the vast majority of the codebase expects.

## The Fix

Flip the approach: `--primary` becomes the brand amber in both modes. The structural dark slate blue (only needed for the sidebar, which already has its own tokens) stays in sidebar-specific tokens. Everything else "just works" because the 300+ existing `text-primary` and `bg-primary` usages will be amber everywhere.

## What Changes

### 1. `src/index.css` -- Token update

**Light mode:**
- `--primary`: change from `215 50% 23%` (slate blue) to `38 92% 50%` (amber)
- `--primary-foreground`: change to dark text (`215 25% 15%`) for contrast on amber
- `--ring`: update to match amber primary

**Dark mode:**
- `--primary`: change from `215 40% 55%` (slate blue) to `38 92% 50%` (amber) -- same as light
- `--primary-foreground`: dark text for contrast on amber
- `--ring`: amber

Sidebar tokens remain unchanged (they already use their own independent variables).

### 2. `src/components/ui/button.tsx` -- Remove the `brand` variant

Since `default` will now be amber, the `brand` variant is redundant. Remove it to simplify.

### 3. `src/pages/Landing.tsx` -- Revert `brand` to `default`

All `variant="brand"` buttons on the Landing page switch back to using the default variant (or just remove the variant prop entirely since `default` is the default).

### 4. Spot-check: components using `text-primary` for icons

No changes needed -- these will automatically become amber in both modes. Examples:
- Dashboard page icons
- CashflowAnalysis lock/check icons  
- BuyVsRentAnalysis card header icons
- GetStarted rocket icon
- NotificationBell dot and link color
- PageLoader spinner
- AI indicator badge

All of these will look correct with amber as primary.

### 5. What stays the same

- Sidebar colors: already independent tokens, unaffected
- Status colors (success, warning, destructive, info): unchanged
- Chart colors: unchanged
- EquipIQ icon component: already hardcoded amber, unchanged
- MetricCard `primary` variant: `border-primary/20 bg-primary/5` will now be a subtle amber tint in both modes -- looks correct
- `--secondary`: stays as the neutral supporting color in both modes
- `--accent`: stays amber (now same as primary, but that is fine -- accent is used for hover states on ghost/outline buttons and can remain)

### Summary of file changes

| File | Change |
|------|--------|
| `src/index.css` | Update `--primary`, `--primary-foreground`, `--ring` in both `:root` and `.dark` to amber |
| `src/components/ui/button.tsx` | Remove `brand` variant |
| `src/pages/Landing.tsx` | Replace all `variant="brand"` with default |

Three files, and 300+ icon/button usages across the entire app are fixed automatically.
