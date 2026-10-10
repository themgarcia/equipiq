# 9C-Budget.2: Name what the LMN rate means, and settle the two-rate problem

## What the code does today (checked)

- **Backward 3% is hardcoded.** `ANNUAL_INFLATION_RATE = 0.03` is a private constant in `src/lib/calculations.ts`. No setting, no database column, no way to change it.
- **One place uses it:** `calculateEquipment` when building Replacement Cost (Today). It is skipped for units with a manual replacement cost entered "as of" this year; manual costs from earlier years still get 3% per year up to today.
- **Everything downstream inherits it:** replacement value, expected resale (a % of replacement), annual recovery on Cashflow and FMS Export, the LMN preview, Operating Costs maintenance % and Dashboard totals.
- **The "3%" is also written out as text** in Definitions (formula and worked examples) and in the replacement cost placeholder on both equipment forms. Those must follow any change.
- **The forward rate** is `market_finance_rate_pct`, read only by the FMS Export (LMN preview and the copied Inflation/Interest value). The Settings text currently calls it cost of money.

So your reading is right. If a user means "inflation" for both directions, the product holds two numbers for one idea, and they can only change one.

## Proposal

### 1. Make the forward rate an explicit choice (Company Settings, Costs & rates)

Replace the bare finance-rate box with one question: **"What should LMN's Inflation/Interest rate stand for?"**

- **Replacement cost inflation**: "What this machine will cost to buy again." Uses the company inflation rate (see 2).
- **Cost of capital**: "What tying money up in equipment costs you, including the return you're not earning elsewhere." Uses the market finance rate you enter.

Under the choice there is a **live preview** on your own fleet, recalculated as you pick:
- Total yearly recovery: EquipIQ figure, LMN figure under each option, and the % gap.
- Three example rows (largest, longest-life, a typical one) so you can see that long lives compound the most.
- Nothing is saved until you press Save. Same pattern as the gross / net-of-resale choice.

Stored as a new setting `lmn_rate_basis` (`inflation` | `cost_of_capital`). The FMS Export reads the rate through one resolver, and each owned row's tooltip shows which rate is being used and why.

**Default for existing users: cost of capital**, because that is what 9C-Budget.1 sends today, so publishing doesn't change any number already on the page. New users must pick before the LMN figure shows. Until then they see a "Choose what this rate means" prompt, not a silent default. The Grindstone 2% is noted as a hint that contractors may lean towards inflation. It is not used to pick the default.

### 2. One inflation number in the product (recommended)

Add a setting `inflation_rate_pct` (default **3.0**), labelled "Equipment price inflation: how much machine prices rise each year." It drives:
- the **backward** step (purchase price to replacement cost today), replacing the hardcoded constant, and
- the **forward** LMN rate when "Replacement cost inflation" is chosen.

Why I recommend this over keeping them separate: keeping them separate only makes sense under the cost-of-capital reading, and the choice in (1) already covers that case. Leaving 3% fixed while the user picks "inflation" at 2% is the exact inconsistency you described.

### 3. This changes numbers only if the user changes the rate

- The default stays 3.0, so **no existing replacement value moves on release**. I'll confirm this with a before/after check on all three accounts (expect zero differences).
- If a user changes it, every inflation-adjusted replacement value, resale, recovery and LMN figure moves. So editing the rate gets its own review before saving: a before/after table of the affected units (replacement today, resale, annual recovery), totals and the count of units unaffected (manual cost entered this year). The user must confirm in a second step, the same way the big-change warning on Category Lifespans works.
- No data migration rewrites stored values. Replacement cost is calculated each time, so the change is only the setting.

Cost: one migration (two nullable or defaulted columns on `company_settings`), a rate parameter threaded through `calculateEquipment` (around 6 callers, via context), the settings card with preview and review, and copy updates in Definitions and both forms. Medium-small, and none of it touches Buy vs Rent.

### 4. Before publish: version and changelog
- Version **1.5.0**.
- Changelog, in plain words first: "The FMS Export now shows LMN's yearly figure next to EquipIQ's. They differ on purpose: EquipIQ shows today's cost to recover, while LMN carries the replacement value forward over the machine's life at your Inflation/Interest rate. Long-lived machines show the biggest gap." Plus the months-per-year, Category Lifespans reset/default and leased Months Used fixes from 9C-Budget.1, and this step's rate choice.

## Tests (kept in project)
- Inflation 3% gives the same replacement value as today's constant (Bobcat 324: $55,369).
- Inflation 2% gives a lower value: $40,000 × 1.02^11 = $49,947.
- Forward rate resolver: `inflation` returns the inflation rate, `cost_of_capital` returns the finance rate, unset returns null (no figure shown).
- LMN preview at 5.5% versus 2% for the excavator row ($8,892 at 5.5%).

## Open questions
- Should the cost-of-capital option be allowed to be blank? Today a blank rate means no LMN figure. I propose keeping that.
- Do you agree with the default of cost of capital for existing users, given it preserves what is on the page now?

## Technical notes
- New columns: `company_settings.inflation_rate_pct numeric not null default 3.0`, `company_settings.lmn_rate_basis text null` (check constraint on the two values; existing rows backfilled to `cost_of_capital`).
- `calculateEquipment(equipment, overrides, attachmentTotal, inflationPct = 3)`; `EquipmentContext` passes the setting. Record in AGENTS.md: inflation resolves only from `company_settings`.
- No SECURITY DEFINER functions; the linter count stays at 8.
