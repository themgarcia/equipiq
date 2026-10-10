# 9C-Budget, revised: send full values and let LMN do the division math

No build yet. This plan covers the gap analysis, answers to points 3–5, and the new shape and order for 9C-Budget.

## 1. Cancelling option (a)

Agreed. Each budget row sends the machine's full replacement value and full end value, with the quantity as a whole number. The two LMN months fields carry the division split. This removes the "5/12 of $180,000" label requirement from the spec. Not scaling the dollars ourselves also means a row can't be split twice if the user fills in the months fields too.

## 2. Gap analysis: what we send vs. LMN's Owned Equipment Calculator

What we send today (from `rollupEngine` and the FMS Export page): Category, Qty, Avg Replacement Value, Life (Yrs), Avg Resale Value, and Type (Owned/Leased, Field section only). Leased rows send Monthly Payment, Payments/Yr and Months Used. Both of those last two are hardcoded to 12.

| LMN calculator field | What we send today | Status |
|---|---|---|
| Replacement value | Avg Replacement Value: replacement cost today, plus attachments | Covered. How it handles tax is answered in point 4 |
| Additional purchase fees, taxes, admin | Nothing | Missing. Whether it's included depends on how replacement cost was set (point 4) |
| Years you expect to own/use it | Life (Yrs): full useful life (override or category default) | Covered. It's full life, not years left, which is correct for a replacement budget |
| Estimated value at end of life | Avg Resale Value (override, or category resale % × replacement today) | Covered |
| Months per year you use it | Nothing on owned rows. Leased rows send "Months Used", hardcoded to 12 | Missing on owned rows. A placeholder on leased rows |
| Months in this division | Nothing. The export has no division dimension | Missing. Needs the division rows |
| Inflation/interest rate | Nothing | Missing. Candidate source: market finance rate (point 3) |
| Interest value, Monthly ROI, Annual ROI | Not sent | LMN computes these, so we must not send them. Our "Annual Recovery" figure is ours, not LMN's |

Other things the field list doesn't mention but the export needs to handle:
- **Attachments** are folded into the parent's replacement value. That's correct for LMN, but the page should say so (it already does in a footnote).
- **Averaging.** Each row is a category average, and the months field will be averaged too. A category whose machines have different months (for example 3 blowers at 5 months and 1 at 12) gives an average that doesn't describe any one machine. Proposal: group rows by category and months-per-year, so units with different months become separate rows. That keeps the quantity whole and the months value true.
- **Owner perks.** They stay where they are now (overhead section, zero allocated cost). Nothing changes.
- **Leased rows.** Months Used = 12 is a placeholder today. It should read the same months-per-year value.

## 3. Market finance rate as the inflation/interest field

Reading confirmed: it's stored in Company Settings, shown with a "not used yet" badge, and read by no calculation. It fits LMN's field, but one meaning has to be settled first. LMN's label says "inflation/interest" and its output is an "interest/inflation value over the life", which is a forward-looking rate applied over the years you own the machine. Our market finance rate is described as the business's cost of capital, which is the "interest" reading.

This is not double inflation. Our 3% inflation runs backward, from the purchase or as-of year up to today, to get replacement cost today. LMN's rate runs forward over the machine's life. They cover different years.

Proposal: send the market finance rate in this field, and rewrite its helper text to say "LMN uses this as the inflation/interest rate on budget equipment rows". If you'd rather LMN get a forward inflation rate instead, that would be a separate setting. Tell me which one you mean.

## 4. Does Replacement Cost (Today) already include tax, freight and admin?

It depends on which way the replacement cost was set (`calculateEquipment`):
- **No manual replacement cost entered** (inflation-adjusted): it starts from the total cost basis, which is purchase price + sales tax + freight/setup + other capital costs + attachments, then inflates that. So tax and fees are already included.
- **Manual replacement cost entered:** it's the user's figure, inflated from its as-of date, plus attachments. Tax and freight are **not** added. Whether they're included depends on what the user typed, and we can't tell.

Proposal:
- Leave the second field (additional fees) blank in every case.
- For inflation-adjusted machines, the value is already all-in, so splitting the fees out could double-count them.
- For manual machines, add helper text on the replacement cost field: "Enter the full replacement cost including tax and delivery."
- Don't build a separate fees field until you ask for one.
- Flag: the row's breakdown view should show which method each unit used, so a category mixing both is visible.

## 5. LMN's proration rule: unverified, and the allocator isn't designed around either reading

There are two possible readings:
- **(i)** months in division ÷ 12
- **(ii)** months in division ÷ months per year used

One observation (5 and 5 gave full annual recovery) points to (ii), but (i) hasn't been ruled out. That one row might simply have also ignored the months fields.

A safe test that doesn't touch the client's live budget:
1. In a throwaway or sandbox LMN budget, or a copied budget you delete afterwards, add one dummy equipment row: $120,000 replacement, $0 fees, 10 years, $0 end value, 0% rate. That gives a simple $12,000/yr base.
2. Try these four cases and write down the Annual ROI:
   - 12 / 12
   - 6 / 6
   - 12 / 6
   - 6 / 3
3. Reading the result:
   - Under (i), the cases give $12,000, $6,000, $6,000, $3,000.
   - Under (ii), they give $12,000, $12,000, $6,000, $6,000.
   - Case 6 / 6 alone tells the two apart, and 6 / 3 confirms it.
4. Also check whether "months per year used" changes Annual ROI when the division field is blank (a non-divisional budget).

**Why it matters:** under (ii), a machine's division months must add up to its months-per-year-used, not to 12. Our 9A shares are a share of the twelve-month year, so we'd export months in division = share × months-per-year-used rather than share × 12. The data we store survives either way. Only how the export turns a share into months changes. The division months field stays out of the build until the test is done.

## 6. Shipping order: sound, with one condition

Months-per-year-used can ship first. It means something with no divisions at all, and on a non-divisional budget LMN reads it on its own.

The condition: under reading (ii), months-per-year is the bottom number of the division split. It has to be correct and in place before the division months ship. So shipping it first is good preparation, not a conflict. It also lets us check against LMN on a non-divisional budget straight away.

## 7. Revised 9C-Budget shape

**9C-Budget.1: full-value fields, no divisions. Can build now.**
- Add a months-per-year-used value on each unit. Fallback order:
  1. the unit's own value
  2. the category default
  3. 12
- No seeded season guesses. The fallback is 12, so the export is unchanged until the user sets it.
- It's set on the category level in the same category edit window as the division split, so it's set once and overridden only where a unit differs.
- Export rows group by category + recovery method + months-per-year. The quantity stays whole.
- New columns in the copy view and CSV for Owned rows (Field and Overhead):
  - Months/Yr Used
  - Inflation/Interest % (market finance rate, or blank if not set)
  - Additional Fees (always blank, with a note explaining why)
- Leased rows use the real months-per-year instead of the hardcoded 12.
- Remove the "not used yet" badge from market finance rate and update its helper text.
- Before/after table on the page and in the changelog: existing rows are unchanged unless a months value is set.

**9C-Budget.2: division rows. Blocked on the LMN test in point 5.**
- Each Owned/Leased section splits by service division, one row per category × division. Rows are tagged and named with the division first, the same convention as the price list.
- Full replacement and end values on every row. Add a Months-in-Division column, worked out from the 9A share using whichever rule the test confirms.
- Overhead and owner-perk routing per unit × division, as in 9A.1.
- Year-round shared units stay in one undivided row.

**Removed from the spec:** share-scaled dollars and the "5/12 of $X" labelling.

## Technical notes
- New nullable `months_per_year_used` columns: on `equipment` (unit override) and on a per-user category table (the existing `user_category_overrides`, or a new column next to the category allocation).
- Resolve it in one helper, next to `resolveAllocation`, and add tests for the 12 fallback and for overrides.
- `rollupEngine` group key gains months-per-year. `RollupLine.monthsUsed` stops being a constant.
- No new security-definer functions. The lint count stays at 8. Buy vs Rent doesn't change.
