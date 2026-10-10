# 9C-Budget.2: One rate, a paste-only export table, and the explanation moved

## Checked in the code and data

- The backward 3% is hardcoded (`ANNUAL_INFLATION_RATE` in `src/lib/calculations.ts`). There is no setting for it. Only `calculateEquipment` reads it, but everything that depends on replacement value inherits it: resale, annual recovery, Cashflow, the FMS Export, maintenance % and Dashboard totals. The "3%" is also written as text in Definitions and in the replacement-cost placeholder on both equipment forms.
- The market finance rate is read only by the FMS Export.
- **Accounts with a market finance rate set: 1 of 1 settings rows, and it's yours, at 5.5%.** No other account has saved company settings, so all of them already use 3% in both directions.

## 1. One rate setting, default 3%

There will be one company setting, **"Equipment price inflation (% per year)"**. It drives both:
- the backward step to Replacement Cost (Today), replacing the hardcoded constant, and
- the Inflation/Interest value on the LMN budget export.

Plain helper text: "How much equipment prices rise each year. EquipIQ uses it to bring what you paid up to today's replacement cost, and LMN uses the same number to carry that cost forward over the machine's life. Default 3%."

The market finance rate box comes off Company Settings. The column stays in the database, marked deprecated, and nothing reads it.

### Starting value: 3% for everyone
Every account starts at 3%, which is the value the app uses today, so no figure on screen changes when this is published. The old finance rate never fed a published calculation, so there's no notice and no before-and-after table. If a user changes the rate later, their numbers update and they export again, which is the setting working as intended.

## 2. The owned table only shows what you paste into LMN

| Column | Pasted into LMN? | Decision |
|---|---|---|
| Category | Yes, as the row name | Keep |
| Qty | Yes, NUMBER OF | Keep |
| Avg Replacement | Yes, replacement value | Keep |
| Life (Yrs) | Yes, years owned | Keep |
| Avg Resale | Yes, end-of-life value | Keep. It's also no longer hidden on small screens, because it's a paste field. |
| Months/Yr | Yes, months used | Keep |
| Rate % | Yes, but the same value on every row | **Move into the table header** as one copyable line: "Inflation/Interest rate for every row: 3% [copy]" |
| Annual per unit | No | **Remove** |
| Type (Owned/Leased) | No | **Remove.** The owned and leased tables are already separate sections, so the badge adds nothing. |

That leaves six columns. The detail slide-out keeps the item list and the per-row breakdown for anyone checking.

The CSV gets the same change: no annual column, and the rate goes in a single header line.

## 3. Where the LMN-versus-EquipIQ difference is explained

**Recommended: on Cashflow Analysis**, next to EquipIQ's annual recovery, because that is the only page where our annual figure appears. It gets a short "Why LMN shows a higher yearly figure" note (an expandable line), with your largest unit worked through: "EquipIQ: $5,191/yr, the cost to replace it at today's price. LMN: about $7,037/yr, because it also carries the replacement cost forward 8 years at 3%. Both are right; they answer different questions."

The FMS Export also gets one line in its info box linking to that note, so a user who notices the gap inside LMN has somewhere to go. The figures are not repeated in the table.

## 4. Before publish
- Version **1.5.0**.
- Changelog, plain words first: the FMS Export now sends what LMN needs, and LMN works out its own yearly figure, which is higher than EquipIQ's because it carries cost forward over the machine's life (explained on Cashflow). Also: one equipment price inflation setting replaces the fixed 3% and the finance rate; the export table is narrower; plus the 9C-Budget.1 fixes (months per year, Category Lifespans reset/default, leased Months Used).

## Tests (kept in project)
- Rate 3% reproduces the current Bobcat 324 replacement value of $55,369.
- Rate 2%: $40,000 × 1.02^11 = $49,947.
- The export rate equals the company inflation setting.
- Excavator Mini at 3%: LMN annual about $7,037; EquipIQ $5,191.

## Technical notes
- Migration: add `company_settings.inflation_rate_pct numeric not null default 3.0` and `rate_merge_notice_dismissed_at timestamptz null`, and keep the old rate's value visible to the notice through `market_finance_rate_pct` (read-only). Run `COMMENT ... DEPRECATED` on `market_finance_rate_pct`. Existing rows take 3.0.
- `calculateEquipment(..., inflationPct)`. `EquipmentContext` passes it from `useCompanySettings`, and it falls back to 3 only when no row exists. Update AGENTS.md: inflation resolves only from `company_settings`.
- No SECURITY DEFINER functions; the linter count stays at 8.
