# Step 7 — Company Settings (spec only, no implementation yet)

## 1. Settings store

New table `company_settings`, one row per user account.

| Column | Type | Default | Notes |
|---|---|---|---|
| id | uuid PK | gen_random_uuid() | |
| user_id | uuid, NOT NULL, UNIQUE | — | owner today (no FK to auth.users, per project rule) |
| org_id | uuid, NULL | null | reserved for the future org move (see section 5) |
| fuel_price_per_litre | numeric(10,4) NULL | null | CHECK > 0 when set |
| market_finance_rate_pct | numeric(6,3) NULL | null | CHECK between 0 and 100 when set |
| default_hours_per_day | numeric(4,1) NOT NULL | 8 | CHECK > 0 and <= 24 |
| recovery_basis | enum `recovery_basis` NOT NULL | 'net_of_resale' | values: net_of_resale, gross |
| created_at / updated_at | timestamptz | now() | existing `update_updated_at_column` trigger |

Row creation: lazy upsert from the client on first save. No signup trigger is added (the existing signup triggers are SECURITY DEFINER; adding to them or creating a new one is avoided). When no row exists, the app uses the defaults above in code, so every existing user gets net_of_resale immediately.

RLS (no new SECURITY DEFINER functions; lint count stays at 8):
- SELECT / INSERT / UPDATE: `auth.uid() IS NOT NULL AND user_id = auth.uid()`
- DELETE: `USING (false)` (settings are reset, not deleted)
- Grants: SELECT, INSERT, UPDATE to authenticated; ALL to service_role; nothing to anon.

## 2. Settings UI

New page "Company Settings" at `/settings/company`, linked in the sidebar next to Billing and from Profile. One card per field, each with a plain-language label and helper text:

- **Fuel price (per litre)** — "Use what you actually pay per litre, taken from your fuel invoices — not the price posted at the pump. After tax treatment and supplier discounts, the pump price is usually higher than your real cost." Shown in $/L. Badge: "Used in the upcoming LMN catalog export — not yet used in any calculation."
- **Market finance rate (%)** — "The rate your business as a whole would pay to borrow money or would expect to earn on it — your cost of capital. This is not the interest rate on any single machine's loan or lease." Same "not yet used" badge.
- **Default hours per day** — "How many hours a machine typically runs on a working day. Used to convert between hours and days." Default 8. Store/display only in this step (flag: confirm it should also stay unwired — the brief says only fuel and finance rate stay unwired, but nothing currently consumes hours/day either).
- **Recovery basis** — radio choice:
  - "Net of resale (recommended)": (replacement cost − expected resale) ÷ useful life. You price to recover only what the machine loses; resale covers the rest.
  - "Gross": replacement cost ÷ useful life. You price to recover the full replacement cost and treat resale as a bonus.
  - Helper with the live Bobcat-style example computed from the user's own first machine, and a note: "This changes Annual Recovery on Cashflow Analysis and FMS Export."

Numeric fields follow the existing validate-on-blur pattern. Saving shows a toast.

## 3. Recovery basis — one formula everywhere

New single function `annualRecovery(item, basis)` in `src/lib/calculations.ts`:
- net_of_resale: `(replacementCostUsed − expectedResaleUsed) / usefulLifeUsed`
- gross: `replacementCostUsed / usefulLifeUsed`
- returns 0 when useful life <= 0.

Every location that computes annual recovery today, and will call this function instead:

| # | File / function | Today | After |
|---|---|---|---|
| 1 | `src/lib/cashflowCalculations.ts` `calculateEquipmentCashflow` (line ~59) → `annualEconomicRecovery`, which drives `annualSurplusShortfall` and status | gross | setting |
| 2 | `src/lib/cashflowCalculations.ts` `calculatePaybackTimeline` (line ~207) monthly recovery = repl ÷ life ÷ 12 | gross | setting ÷ 12 |
| 3 | `src/lib/cashflowCalculations.ts` `calculatePortfolioCashflow` (line ~114) sums #1 | inherits | inherits |
| 4 | `src/lib/cashflowCalculations.ts` `calculateCashflowProjection` (line ~261) sums #1; feeds chart and `stabilizedNetCashflow` | inherits | inherits |
| 5 | `src/lib/rollupEngine.ts` `buildLine` `totalAnnualRecovery` (line ~112) and the portfolio total (line ~159) | net | setting |
| 6 | `src/pages/FMSExport.tsx` `CashGapSummary` `ownedRecovery` (line ~127) | net | setting |
| 7 | `src/pages/FMSExport.tsx` `CostComparisonTooltip` `ownedRecovery` (line ~198) | net | setting |
| 8 | `src/pages/CashflowAnalysis.tsx` sort, table and chart (lines ~345, 543, 741, 936, 988) | display of #1/#4 | inherits |

Basis is passed as an explicit argument (no hidden global) so tests can cover both. A hook `useCompanySettings()` loads the row (or defaults) and pages pass `recovery_basis` down.

Not changed: `src/pages/Landing.tsx` (marketing calculator using its own sample "fleet value ÷ life" — not equipment data; flag if you want it aligned). `buyVsRentCalculations.ts` has no recovery figure.

### Surfacing the change
- Cashflow Analysis: a dismissible notice above the summary cards — "Annual Recovery now subtracts expected resale (your Recovery basis setting). Figures, especially Surplus/Shortfall, are lower than before. Change basis in Company Settings." Dismissal stored per user in localStorage, shown until dismissed.
- Annual Recovery column header and summary card get a small label showing the active basis ("Net of resale" / "Gross") on both Cashflow and FMS Export.
- Changelog entry (version bump to 1.4.0) under "Changed", stating the Cashflow figures change and why.

## 4. Fuel price and finance rate
Stored and displayed only. No calculation reads them in this step.

## 5. Future move to an organisation (no data migration)
- `org_id` column exists now, nullable, unused.
- When orgs arrive: create `organizations` + membership table; a backfill sets `org_id` for each existing row (each user becomes owner of a one-person org, so their row becomes the org's row — no data moves or reshapes, only a column fill, which is part of an additive migration).
- Then add RLS policies for org members, a unique index on `org_id`, and switch the client lookup from `user_id` to `org_id`. `user_id` is kept as "created by".
- Flag: the backfill is an UPDATE inside the org migration. If you consider that a "data migration", the alternative is to resolve org settings via `coalesce(org row, owner's user row)` at read time — zero writes, slightly more query logic. I recommend the backfill.

## 6. Before / after — 2014 Bobcat 324
Inputs: replacement $55,369, resale $13,842 (25%), useful life 8.

| Location | Today | net_of_resale (default) | gross |
|---|---|---|---|
| Cashflow Annual Recovery | $6,921 | **$5,191** (changes) | $6,921 |
| Cashflow Surplus/Shortfall | $6,921 − payments | $5,191 − payments ($1,730 lower) | unchanged |
| Payback timeline monthly recovery | $577 | $433 | $577 |
| FMS rollup / Cash Gap / tooltip recovery | $5,191 | $5,191 | **$6,921** (changes) |

Calculation: (55,369 − 13,842) ÷ 8 = 5,190.9 → $5,191; 55,369 ÷ 8 = 6,921.1 → $6,921. The Bobcat is owned/paid off, so payments = 0 and Surplus goes from +$6,921 to +$5,191.

## 7. Flags / unsure
- The values sent to LMN (replacement, life, end-of-life value) are not a recovery figure; LMN subtracts resale itself. So under "gross", EquipIQ's on-screen recovery will differ from what LMN computes from the export. Proposal: show a note on FMS Export when basis = gross. Confirm.
- Cashflow status thresholds (10% buffer) will flip some items from "covered" to "at risk" under net. Expected, but worth knowing.
- Hours per day: confirm store-only.

## Technical details
- Migration: create enum, table, grants, enable RLS, 4 policies, updated_at trigger, comment on `org_id` ("reserved for org scoping").
- Tests (vitest, next to existing): `annualRecovery` returns 5,191 net and 6,921 gross for Bobcat inputs; 0 when life is 0; cashflow and rollup both return the same value for the same basis.
- Files: new migration, `src/hooks/useCompanySettings.ts`, `src/pages/Settings/Company.tsx`, route in `App.tsx`, sidebar link in `Layout.tsx`, edits to `calculations.ts`, `cashflowCalculations.ts`, `rollupEngine.ts`, `FMSExport.tsx`, `CashflowAnalysis.tsx`, `changelog.json`, `CHANGELOG.md`, `version.ts`.
