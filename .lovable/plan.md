

# Fix: Include Deposit in Lease Cost Comparison

## Problem

The cost comparison tooltip calculates lease recovery as `monthlyPayment x 12`, but this ignores the deposit/down payment. For the Zero Turn mower, a deposit was paid upfront, which lowers the monthly payment. The tooltip then shows the lease as "cheaper" than owned recovery -- but that's misleading because the deposit is real money that isn't captured in the monthly figure.

## Solution

Amortize the deposit over the lease term so the comparison is apples-to-apples:

```text
True annual lease cost = (monthlyPayment x 12) + (depositAmount x 12 / termMonths)
```

This spreads the upfront deposit evenly across each year of the lease, giving an honest annual figure.

## Changes

### `src/lib/rollupEngine.ts`

Add two new fields to `RollupLine`:
- `leasedItemDepositTotal: number` -- sum of deposit amounts from leased items only
- `leasedItemAvgTermMonths: number` -- average term in months across leased items

Update `buildLine()` to compute these from the leased items subset.

### `src/pages/FMSExport.tsx`

Update `CostComparisonTooltip` to calculate the true annual lease cost:

```text
amortizedDeposit = (leasedItemDepositTotal / leasedItemCount) * 12 / leasedItemAvgTermMonths
leaseRecovery = (leasedItemMonthlyPayment / leasedItemCount) * 12 + amortizedDeposit
```

When there's a deposit, the tooltip will also note it:
- "Includes $X deposit amortized over Y-month term"

This way the Zero Turn comparison will show the full cost of leasing (payments plus deposit), and the savings number will accurately reflect the real difference.

## Files Modified

| File | Change |
|---|---|
| `src/lib/rollupEngine.ts` | Add `leasedItemDepositTotal` and `leasedItemAvgTermMonths` to RollupLine |
| `src/pages/FMSExport.tsx` | Amortize deposit into lease recovery calculation in tooltip |

