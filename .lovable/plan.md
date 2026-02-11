

# Fix Demo Equipment Data to Match v6 Taxonomy

## Problem

All 10 demo equipment items use **old category names** that no longer exist in the v6 taxonomy. Two items (Volvo A25G articulated hauler, CAT D6T bulldozer) are heavy civil machines that don't belong in a landscape contractor's fleet and have no matching category. Leased items are also missing the new `lmnRecoveryMethod` field.

## Changes

### 1. Update all category strings to v6 format

| Demo Item | Old Category | New v6 Category |
|---|---|---|
| Kubota KX040-4 | `Excavator - Compact (<=6 ton)` | `Construction - Excavator - Compact` |
| Ford F-250 XL | `Vehicle (Light-Duty)` | `Fleet - Truck - 3/4 Ton` |
| Bobcat S570 | `Loader - Skid Steer` | `Construction - Loader - Skid Steer` |
| Big Tex 14ET | `Trailer` | `Fleet - Trailer - Flat Deck` |
| CAT 320 | `Excavator - Large (12+ ton)` | `Construction - Excavator - Standard` |
| John Deere 310SL | `Loader - Mid-Size` | `Construction - Loader - Backhoe` |
| Kenworth T880 | `Vehicle (Commercial)` | `Fleet - Truck - Dump Tandem` |
| Case CX80C | `Excavator - Mid-Size (6-12 ton)` | `Construction - Excavator - Standard` |

### 2. Replace two items that don't fit the taxonomy

**Volvo A25G (demo-7)** -- Replace with a realistic landscape machine, e.g.:
- **2022 Toro Dingo TX 1000** -- `Construction - Loader - Stand-On` (stand-on track loader, very common for landscape crews, showcases the renamed Stand-On category)

**CAT D6T (demo-8)** -- Replace with something landscape contractors actually own, e.g.:
- **2023 Isuzu NPR-HD** -- `Fleet - Truck - Cab Over` (landscape body truck, extremely common in the industry)

These replacements give better category coverage and are machines landscape contractors actually own.

### 3. Add `lmnRecoveryMethod` to leased items

The Ford F-250 (demo-2) and the replacement for demo-7 (if leased) need `lmnRecoveryMethod: 'owned'` (default) or `'leased'` added to show off the new FMS Export split.

Set the F-250 to `lmnRecoveryMethod: 'leased'` so the demo data demonstrates the Owned vs. Leased sub-table split on the FMS Export page.

## File Modified

| File | Change |
|---|---|
| `src/data/demoEquipmentData.ts` | Update all 8 category strings to v6 format; replace demo-7 and demo-8 with landscape-appropriate equipment; add `lmnRecoveryMethod` to leased items |

## What This Fixes

- Demo data will pass the category mismatch validation sweep without console warnings
- All demo equipment will match `categoryDefaults.ts` for correct useful life, resale, and benchmark lookups
- FMS Export demo will show the new Owned vs. Leased sub-table split
- Equipment shown represents a realistic small landscape contractor fleet

