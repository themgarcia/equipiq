

# Fix: Exclude Paid-Off Leases from Cash Gap Warning

## Problem

The `CashGapSummary` and `CostComparisonTooltip` flag every leased item modeled as "Owned Recovery" — even those that have finished making payments. A zero-turn mower that completed its lease term months ago still shows a cash gap warning because the code never checks whether payments are actually still happening.

## Root Cause

The current filter logic (line 114-116 of FMSExport.tsx) checks:
1. Is it Active?
2. Is it a lease?
3. Is it modeled as "Owned"?

It does NOT check whether the lease term has ended. The annual lease cost is calculated as `(monthlyPayment * 12) + depositAmortization` regardless of whether payments are still being made.

## Fix

Add a "payments complete" check to both the `CashGapSummary` and `CostComparisonTooltip` components. An item's payments are complete when:

```text
financingStartDate exists
  AND termMonths > 0
  AND months since financingStartDate >= termMonths
```

This is the same logic the cashflow engine already uses to compute `paymentsCompleted` and `remainingPayments`.

### Changes in `src/pages/FMSExport.tsx`

**CashGapSummary (around line 113-126)**: After the existing `financingType` and `lmnRecoveryMethod` checks, add:

- If `financingStartDate` and `termMonths` are set, calculate months elapsed since start
- If elapsed months >= termMonths, skip the item (payments are done, no ongoing cash gap)

**CostComparisonTooltip (around line 170+)**: Apply the same paid-off check so tooltips for fully-paid leases show a "Payments complete" status instead of a cash gap warning. The tooltip should still render (the item is still a lease), but should show that there is no active cash gap since payments have ended.

### No other files change

The Equipment type already has `financingStartDate` and `termMonths` on every item, so no new data is needed.

## Result

- Paid-off leases no longer appear in the Cash Gap Warning card
- Tooltips for paid-off leases show a neutral "Payments complete" message instead of a warning
- Leases still actively being paid continue to show warnings as before
