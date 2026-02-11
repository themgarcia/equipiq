

# Fix Table Column Formatting

Two layout issues across Category Lifespans and FMS Export pages.

---

## Issue 1: Category Lifespans — Header Wrapping

The "Useful Life (yrs)" column header wraps to two lines even though there's plenty of horizontal space. Fix by adding `whitespace-nowrap` to the header cells that shouldn't wrap.

### File: `src/pages/CategoryLifespans.tsx`
- Add `whitespace-nowrap` to "Useful Life (yrs)" and "Resale %" table headers (lines 127-128)
- This prevents unnecessary line breaks when the viewport is wide enough

---

## Issue 2: FMS Export — Misaligned Columns Between Tables

The Field Equipment and Overhead Equipment tables render as separate `<Table>` elements, so the browser sizes each table's columns independently. This causes headers and values to not line up vertically between the two tables.

### File: `src/pages/FMSExport.tsx`
- Add fixed percentage-based widths to all column headers in the `RollupSection` component so both tables use identical column sizing:
  - Category: flexible (no fixed width, takes remaining space)
  - Qty: `w-[80px]` with `text-right`
  - Avg Replacement: `w-[160px]` with `text-right`
  - Life (Yrs): `w-[100px]` with `text-right`
  - Avg End Value: `w-[140px]` with `text-right`
  - Type: `w-[80px]` with `text-center`
- Add `whitespace-nowrap` to all header cells to prevent wrapping
- Apply `table-fixed` to the `<Table>` component so both tables respect the same widths

---

## Technical Details

- Both fixes are CSS-only changes (className updates), no logic or data changes
- The `table-fixed` layout with explicit widths on `<th>` elements forces both Field and Overhead tables to use identical column sizing regardless of content length
- The `whitespace-nowrap` class prevents header text from wrapping when there is sufficient viewport width

