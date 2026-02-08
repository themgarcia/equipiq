

# Streamline Equipment Details Sheet

## What Changes

The details view will be redesigned from a data dump into a focused summary. When a contractor clicks on a piece of equipment, they should immediately see:

1. **What it costs to replace** (hero card -- already done)
2. **Key financial snapshot** -- cost basis, COGS/overhead split, and financing status
3. **Actions** -- Edit, Documents, Attachments, Delete

Everything else (serial numbers, tax line items, freight, purchase condition, asset ID, individual lifecycle fields) moves into the edit form where it belongs. Users only need those details when they are entering or correcting data.

## New Layout (top to bottom)

1. **Status badges** -- Active/Sold + allocation type (unchanged)
2. **Replacement Cost hero card** -- unchanged
3. **Financial snapshot** -- a compact grid with:
   - Total Cost Basis
   - COGS / Overhead split
   - Financing status (Owned, or monthly payment + payments remaining)
4. **Action buttons** -- Edit, Documents, Attachments, Delete

## What Gets Removed from Details View

- Identification section (category, condition, serial/VIN, asset ID) -- visible in the header subtitle and edit form
- Purchase & Cost line-item breakdown (tax, freight, other CapEx lines) -- collapsed into just "Total Cost Basis"
- Lifecycle section (useful life, expected resale) -- already shown in hero card supporting details
- Financing detail grid (deposit, financed amount, term, buyout, start date) -- collapsed into a single status line
- Sale Info section -- only relevant for sold items, available in edit form

## Technical Details

### File: `src/components/equipment/EquipmentDetailsSheet.tsx`

**EquipmentDetailsView** (lines 181-476) will be rewritten to contain only:

1. Status badges block (lines 189-204) -- keep as-is
2. Hero card (lines 206-223) -- keep as-is
3. New compact "Financial Snapshot" section replacing all the granular sections:
   - Single row: Total Cost Basis value
   - Single row: COGS % / Overhead % 
   - Conditional row: Financing status -- "Owned" or "$X/mo -- Y payments left" with payoff context
4. Action buttons (lines 426-474) -- keep as-is, with separators cleaned up

**Sections removed entirely:**
- Identification (lines 227-252)
- Purchase & Cost breakdown (lines 256-297)
- Allocations (lines 301-318)
- Lifecycle (lines 322-346)
- Financing detail grid (lines 348-398)
- Sale Info (lines 400-422)

No other files are modified. All removed data remains accessible in the edit form via `EquipmentFormContent`.
