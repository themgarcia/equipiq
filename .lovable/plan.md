
# Fix: Prorate Current-Year Payments in Portfolio Summary

## Problem

The summary cards use `calculatePortfolioCashflow()` which calculates payments as a flat `monthlyPayment * 12` for every active financed item -- ignoring that some items pay off partway through the current year. The projection chart already prorates correctly, causing a mismatch (cards show ~$500 net vs chart showing ~$27k).

## Fix

Update `calculatePortfolioCashflow()` in `src/lib/cashflowCalculations.ts` to prorate current-year payments, mirroring the logic already in `calculateCashflowProjection()`:

For each financed item:
- **Payoff before Jan 1 this year** -- 0 payments (already done)
- **Payoff after Dec 31 this year** -- full 12 months
- **Payoff mid-year** -- only count months until payoff

This is a single function change in one file. The cards already read from `portfolioSummary.totalAnnualPayments` and `netAnnualCashflow`, so they update automatically.

## File Changed

| File | Change |
|------|--------|
| `src/lib/cashflowCalculations.ts` | Replace the `totalAnnualPayments` reduce with prorated logic checking each item's payoff date against the current year |

No other files need changes -- the UI reads from the same summary object.
