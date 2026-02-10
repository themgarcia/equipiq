

# Add Lifetime Loss to the Landing Page Calculator

## What Changes

Add a "Total Loss Over Useful Life" figure to the calculator results, multiplying the annual loss by the useful life the user already entered. This makes the financial impact visceral -- seeing a loss compounded over 8 years hits harder than a single year.

## How It Works

The `usefulLife` state variable already exists (line 201, default 8 years). The calculation is simply:

```
totalLifetimeLoss = totalAnnualLoss * usefulLife
```

## UI Update

Below the existing "Total Annual Loss" card (lines 607-620), add a second result card with a slightly different visual treatment:

- Background: `bg-destructive/10` with `border-destructive/20` (slightly softer than the annual card to create hierarchy)
- Label: **"Total Loss Over {usefulLife} Years"**
- Value: The lifetime loss in large bold text (matching the annual card's `text-3xl font-bold text-destructive font-mono` style)
- Subtitle: "That's {usefulLife} years of unrecovered costs eating into your profit."

## What Stays the Same

- No new state or inputs -- uses existing `usefulLife` slider value
- Annual loss card, per-job estimate, and disclaimer text remain unchanged
- No changes to any other page or component

## File Modified

**`src/pages/Landing.tsx`**
- Add one computed variable: `totalLifetimeLoss = totalAnnualLoss * usefulLife` (near line 226)
- Insert a new result card after line 620 (after the Total Annual Loss card's closing div)

