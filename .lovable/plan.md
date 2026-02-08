

# Fix: Purchase Date Showing One Day Off (Timezone Bug)

## Problem
Dates like "2014-01-01" stored in the database are parsed by `new Date("2014-01-01")` as UTC midnight. In North American timezones, this converts to the previous evening (Dec 31, 2013), so the displayed date is one day behind.

This affects every date displayed using `new Date(dateString)` throughout the app -- purchase dates, sale dates, financing start dates, and replacement cost as-of dates.

## Solution
Replace `new Date(dateString)` with a timezone-safe parser that treats date-only strings as local dates. The simplest approach: append `T00:00:00` to date-only strings so JavaScript parses them as local time instead of UTC.

Create a small utility function and use it everywhere dates are displayed.

## Technical Details

### 1. Add utility function in `src/lib/utils.ts`

```typescript
/** Parse a date string as local time (avoids UTC timezone shift for date-only strings like "2014-01-01") */
export function parseLocalDate(dateStr: string): Date {
  // Date-only strings (YYYY-MM-DD) are parsed as UTC by JS.
  // Adding T00:00:00 forces local-time interpretation.
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(dateStr + 'T00:00:00');
  }
  return new Date(dateStr);
}
```

### 2. Update `src/components/equipment/EquipmentDetailsSheet.tsx`

Replace all `new Date(equipment.someDate)` calls with `parseLocalDate()`:
- Purchase Date (line ~207)
- Financing Start Date (line ~299)
- Sale Date (line ~345)

### 3. Update `src/lib/calculations.ts`

Replace date parsing for:
- `purchaseDate` (line ~50)
- `replacementCostAsOfDate` (line ~63)

### 4. Audit other files for the same pattern

Check and fix any other files that parse date strings with `new Date()`:
- `EquipmentFormContent.tsx`
- `EquipmentTableRow.tsx`
- `EquipmentMobileCard.tsx`
- Any other components displaying equipment dates
