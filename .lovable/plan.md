

# Fix: Unify `--secondary` Token Across Light and Dark Modes

## The Problem

The `--primary` and `--accent` tokens are now correctly amber in both modes. But the `--secondary` token still flips:

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--secondary` | `38 92% 50%` (amber) | `215 25% 22%` (slate) |
| `--secondary-foreground` | `215 25% 15%` (dark text) | `210 40% 96%` (light text) |

This means every `Badge variant="secondary"`, `Button variant="secondary"`, progress bar track, and slider track is amber in light mode but changes to dark slate in dark mode -- exactly the inconsistency you're seeing.

## The Fix

Update the dark mode `--secondary` to match light mode (amber), so that secondary elements stay amber in both modes. This is a one-line CSS change.

For structural/neutral elements that currently rely on `secondary` being slate in dark mode (slider tracks, progress bars), amber actually works fine since those components also overlay `bg-primary` on top for the filled portion.

## What Changes

### `src/index.css`

In the `.dark` block, change:
- `--secondary` from `215 25% 22%` to `38 92% 50%` (amber)
- `--secondary-foreground` from `210 40% 96%` to `215 25% 15%` (dark text for contrast on amber)

## Impact

This automatically fixes all 216 occurrences of `secondary` usage across the app:
- Badge `variant="secondary"` (item counts, status labels, "Coming Soon" badges)
- Button `variant="secondary"` (feedback dialog, insurance actions)
- Slider and progress bar tracks
- All will now be consistently amber in both modes

## What stays the same
- `--primary`, `--accent`, `--ring` -- already amber in both modes
- Sidebar tokens -- independent, unaffected
- All other semantic tokens (success, warning, destructive, info)
