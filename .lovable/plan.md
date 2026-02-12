

# Unify Light/Dark Theme Color System

## The Problem

The root cause of the inconsistency is that `--primary` and `--secondary` **swap roles** between light and dark mode:

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--primary` | Dark slate blue | Amber |
| `--secondary` | Amber | Dark slate blue |

This means every `bg-primary` button is blue in light mode but amber in dark mode. Every `text-primary` heading follows the same swap. The result: buttons, icons, headings, and accents all shift color unpredictably between modes. There is no stable "brand" color.

## The Fix

Stop swapping primary/secondary between modes. Instead, keep the token roles consistent:

- **`--primary`** = Dark slate blue in BOTH modes (adjusted for contrast in dark mode -- lighter slate blue)
- **`--accent`** = Amber in BOTH modes (the brand highlight color, stays amber everywhere)
- **`--secondary`** = A neutral supporting color in both modes

Then introduce a dedicated **`--brand`** token that is always amber -- the EquipIQ signature color -- for CTA buttons, the logo, and key highlights that should look identical in both modes.

## What Changes

### 1. CSS Token Redesign (`src/index.css`)

**Light mode** (stays mostly the same):
- `--primary`: dark slate blue (unchanged)
- `--accent`: amber (unchanged)

**Dark mode** (the big fix):
- `--primary`: lighter slate blue (NOT amber) -- provides contrast on dark backgrounds while keeping the same role
- `--accent`: amber (stays the same as light mode)
- `--secondary`: muted slate (a neutral, not the old blue swap)
- `--ring`: updated to match new primary

### 2. Component-Level Fixes

Audit and update components that rely on the current swap behavior. Key areas:

- **Landing page** (`src/pages/Landing.tsx`): CTA buttons and hero text currently using `text-primary` and `bg-primary` -- update any that need the amber brand color to use `bg-accent text-accent-foreground` instead
- **Sidebar** (`src/components/Layout.tsx`): Sidebar tokens are already independent and stay as-is
- **MetricCard** (`src/components/MetricCard.tsx`): `border-primary/20 bg-primary/5` variant -- will naturally become consistent
- **GetStarted page** (`src/pages/GetStarted.tsx`): Step indicators using `bg-primary text-primary-foreground`
- **EquipIQIcon** (`src/components/EquipIQIcon.tsx`): Already hardcoded to amber -- no change needed
- **Button component**: The default variant (`bg-primary text-primary-foreground`) will now render as slate blue in both modes instead of flipping to amber in dark mode

### 3. CTA / Brand Accent Pattern

For buttons and elements that should always be amber (the "brand action" color):
- Use `bg-accent text-accent-foreground` instead of `bg-primary`
- Or add a new button variant called `"brand"` to the button component that explicitly uses the accent token

This gives two clear button styles:
- **Default (primary)**: Slate blue -- standard actions, navigation
- **Brand (accent)**: Amber -- CTAs, key actions, highlights

## Technical Details

### Files to modify:
1. **`src/index.css`** -- Redesign dark mode tokens so primary stays in the blue family
2. **`src/components/ui/button.tsx`** -- Add a `brand` variant using accent colors
3. **`src/pages/Landing.tsx`** -- Update CTA buttons to use brand/accent
4. **`src/pages/GetStarted.tsx`** -- Update step indicators
5. **`src/components/MetricCard.tsx`** -- Verify variant colors work with new tokens
6. **Other pages** -- Scan for any `bg-primary` / `text-primary` usage that was relying on the amber color in dark mode and update to `accent` or `brand` as appropriate

### What stays the same:
- Sidebar colors (already independent tokens)
- Status colors (success, warning, destructive, info)
- Chart colors (already mode-specific)
- The EquipIQ icon (already hardcoded amber)
- Muted/foreground/background tokens (these are fine)

### The key principle:
"If it should be amber in both modes, use `accent`. If it should be the structural UI color, use `primary`."

