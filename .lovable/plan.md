

# Fix Demo Data Category Separators

## Problem

The category grouping logic uses exact string matching. The `categoryDefaults.ts` taxonomy uses **em-dashes** (`—`) as separators, but the demo data update accidentally used regular **hyphens** (`-`).

For example:
- categoryDefaults.ts: `Construction — Excavator — Compact`
- demoEquipmentData.ts: `Construction - Excavator - Compact`

Since the strings don't match, every demo item falls into the "Other" bucket.

## Fix

**File: `src/data/demoEquipmentData.ts`**

Replace all hyphen separators with em-dashes in the 10 demo equipment category strings:

| Current (wrong) | Corrected |
|---|---|
| `Construction - Excavator - Compact` | `Construction — Excavator — Compact` |
| `Fleet - Truck - 3/4 Ton` | `Fleet — Truck — 3/4 Ton` |
| `Construction - Loader - Skid Steer` | `Construction — Loader — Skid Steer` |
| `Fleet - Trailer - Flat Deck` | `Fleet — Trailer — Flat Deck` |
| `Construction - Excavator - Standard` | `Construction — Excavator — Standard` |
| `Construction - Loader - Backhoe` | `Construction — Loader — Backhoe` |
| `Construction - Loader - Stand-On` | `Construction — Loader — Stand-On` |
| `Fleet - Truck - Cab Over` | `Fleet — Truck — Cab Over` |
| `Fleet - Truck - Dump Tandem` | `Fleet — Truck — Dump Tandem` |

This is a one-line-per-item find-and-replace. No logic changes needed.

