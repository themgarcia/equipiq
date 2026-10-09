# Step 9 — Division allocation and seasonal recovery (spec only)

## Recommendation: split into three steps

This is too big for one step. Each part below can ship and be checked on its own, and each depends on the one before it.

| Step | Scope | Changes any existing number? |
|---|---|---|
| **9A — Foundations** | Category Lifespans persistence fix (item 7), service divisions in Company Settings (1), per-unit allocation (2), recovery method per unit x division with migration (3) | No. Data entry only. |
| **9B — Cost engine** | Calendar/usage split and allocation rule (4), three denominators (8), division view on Cashflow/FMS as read-only preview | No export change yet. New numbers appear next to the old ones. |
| **9C — Export grain and category grid** | Category x division rollup (5), editable category grid with completeness on FMS Export (6), Step 8 drawer becomes the override path | Yes. Export rows change. Version bump plus changelog. |

The rest of this document specifies all three, so the design hangs together. Approving it approves **9A only** for building. 9B and 9C each come back for a go-ahead.

---

## Item 7 — Why Lifespans edits don't survive a reload (confirmed)

- The pencil calls `updateCategoryDefaults` in the equipment context. That function only changes React state in memory (`setCategoryDefaults(prev => …)`). Nothing is written to the database.
- `category_defaults` is a **shared** table. Its policies (checked live) let only admins insert, update or delete, and any signed-in user read. A contractor's edit can't go there, and shouldn't, because it would change every company's defaults.
- **Fix:** build the `user_category_overrides` table that Step 6 planned for: one row per user per category, nullable columns for useful life, resale %, notes, plus the new category-level LMN fields from 9C. The effective value is the user's override, then the shared default. The page reads and writes overrides. Calculations that read the client array get the user's override merged on top through the same context, so an edit made in Lifespans reaches calculations as it does today, and it now survives a reload.
- Flag: today an in-session edit already changes calculations (the context is merged). Once edits persist, they keep changing numbers after a reload. That is the intent, but it is new.

---

## Item 1 — Service divisions (9A)

- These are user-defined and company-level, and separate from the 7 taxonomy divisions.
- Each one has a name (matching an LMN budget), a season length in months (1–12), optional season start and end months (display only, to show overlap), an optional expected events per season (for per-event pricing, item 8), and a sort order.
- They are managed in a new "Service divisions" card in Company Settings, with plain-language help: "Name these to match your LMN budgets. Fleet and Shop are support, not services — leave them out."
- A division can be archived but not deleted while units are allocated to it.
- No seeded list and no suggestion chips. The list starts blank with only the helper text, because the names have to match the contractor's own LMN element budgets.

## Item 2 — Per-unit allocation (9A)

- Each unit is either **year-round shared** (one blended 12-month rate, a deliberate choice) or **allocated** across one or more service divisions.
- Each allocation row has the division, months committed (entered), share of the year (stored, 0–1), expected hours in the division, and recovery method.
- **Overlap is the user's call every time. No rule resolves it.**
  - Months committed are entered for each division and pre-filled from that division's season length.
  - Each row shows the resulting share of the year, and the share is directly editable.
  - A row total is shown against 100%.
  - Proportional normalisation (months ÷ total months entered) only **suggests** pre-filled shares. It is never silently applied as the answer.
  - If the months entered add up to exactly 12 (for example a clean 8 + 4), the shares are months ÷ 12, there's no message, and no action is needed.
  - If they add up to more than 12, say so plainly: "You've committed 13 months across a 12-month year. Adjust the shares to decide who carries the overlap."
  - If they add up to less than 12: "You've committed 10 months of a 12-month year. Adjust the shares so the whole year is carried."
  - Shares aren't saved until the user confirms them. Save stays disabled until shares total 100% (±0.1%), and the database enforces the same check.
  - Changing months later updates the suggestion but never overwrites shares the user has already confirmed without asking.
- Your example: 8 + 5 shows the 13-month message with suggested shares of 61.5% / 38.5% (10.26 / 51.28). Setting them to 7/12 and 5/12 gives 9.72 / 55.56. Either is valid. The contractor decides.
- Units with no allocation yet are treated as "Unallocated". They keep today's behaviour and are listed as incomplete.
- UI: a new "Divisions" section on the equipment form, plus a bulk "Allocate" action from the category grid in 9C.

## Item 3 — Recovery method per unit x division (9A)

- `lmn_recovery_method` moves onto each allocation row.
- Migration: for every existing unit, create one **year-round shared** allocation row (share 1.0, hours null) carrying the unit's current `lmn_recovery_method`. Every unit keeps its exact current behaviour until the user allocates it.
- The old column stays in place and is marked deprecated. It isn't dropped.
- Confirmed: these are two separate fields per row. `recovery_method` (owned/leased) is the financing structure and is migrated as-is. `rate_basis` (hourly / seasonal / per_event) is the rate denominator and defaults to hourly.

## Item 4 — Cost allocation rule (9B)

Each unit's annual cost splits as follows:

- **Calendar costs** (by share of year): annual recovery from `annualRecovery(item, basis)`, the Step 7 basis, so depreciation stays in one function; insurance; licensing; financing.
- **Usage costs** (by share of hours): maintenance and repair; fuel (L/hr x hours x fuel price); tires and wear parts when they exist.
- For each division: calendar x share of year, plus usage x (division hours ÷ total hours). Then divide by the division's own hours, season, or events. No blending.
- **Flags:**
  - Fuel requires wiring the Step 7 fuel price into a calculation for the first time. That needs your explicit go-ahead in 9B.
  - "Financing" overlaps with depreciation. Payments are cash, not cost, and adding both double-counts. I propose financing contributes only the **interest** portion, and only if you want it at all (market finance rate as cost of capital is the alternative). That decision is left to 9B.
  - Maintenance today is a % of replacement cost per *year*, not per hour. Allocating it by hours treats it as usage-driven, which is consistent with your rule.
  - Values that resolve to "Not set" (null) contribute nothing, and the row shows as incomplete. They are never silently counted as $0.

## Item 8 — Three denominators (9B)

- Per hour = division total ÷ division hours.
- Per season = the division total itself (one season per year).
- Per event = division total ÷ expected events per season.
- Each one shows only when its input exists. Otherwise it reads "Needs hours" or "Needs events". All three are shown side by side and nothing is selected for the user. No markups, margins or overhead ratios.

## Item 5 — Export grain (9C)

- The rollup key becomes category x service division x recovery method. Year-round shared and unallocated units roll into a "Shared (year-round)" division row for their category.
- A loader in Construction and Snow produces two export rows.

## Item 6 — Category grid (9C, supersedes the Step 8 drawer as primary)

- An editable grid on FMS Export with one row per category x division. The columns are the LMN price list fields: maintenance and repair, insurance, licensing, fuel L/hr, hours, season, events, plus the computed per-hour, per-season and per-event costs.
- Each cell defaults from the units rolled into that row and can be edited at the category level (stored per user, per category x division). Effective value = per-unit override, then the category-level value, then the shared default, then "Not set".
- Completeness: a chip on each row (Complete / Missing: fuel, hours…) plus a page-level count ("14 of 22 rows complete") and a filter for "Missing inputs".
- The Step 8 drawer stays, relabelled "Unit override (exception)". `resolveOperatingCosts` gains the category-level layer.

---

## Worked example — wheel loader, $20,000 annual cost

Inputs: Construction 1,200 hrs; Snow 150 hrs (1,350 total).

```text
Blend by hours (today):   20,000 / 1,350            = $14.81/hr both

A) All $20k calendar, shares 7/12 and 5/12 (your framing)
   Construction  20,000 x 7/12 = 11,667 / 1,200 hrs  = $9.72/hr
   Snow          20,000 x 5/12 =  8,333 /   150 hrs  = $55.56/hr
   Snow per season = $8,333 ; at 20 events = $416.67/event

B) Months entered 8 + 5 -> "13 months" message; user accepts the suggested shares
   Construction  20,000 x 8/13 = 12,308 / 1,200      = $10.26/hr
   Snow          20,000 x 5/13 =  7,692 /   150      = $51.28/hr

C) Full rule, illustrative split $14,000 calendar + $6,000 usage, shares 7/12, 5/12
   Construction  14,000 x 7/12 = 8,167 + 6,000 x 1200/1350 = 5,333 -> 13,500 / 1,200 = $11.25/hr
   Snow          14,000 x 5/12 = 5,833 + 6,000 x  150/1350 =   667 ->  6,500 /   150 = $43.33/hr
   Check: 13,500 + 6,500 = 20,000 (nothing lost or double-counted)
```

Case A lands exactly on 9.72 / 55.56. Under the full rule (C), any usage-driven cost pulls both rates part-way back toward the blend. That is correct, because snow really does burn less fuel per season, but the real numbers will sit between your targets and $14.81. The 20 events and the $14k/$6k split are placeholders I made up for illustration. They aren't data.

---

## Technical section

**New tables** (all per-user RLS on `auth.uid() = user_id` with `auth.uid() IS NOT NULL`, GRANTs to authenticated and service_role, no deletes on audit-like data, updated_at trigger reusing `update_updated_at_column`, no new SECURITY DEFINER functions):

- `user_category_overrides` (9A): user_id, category (text, matches `category_defaults.category`), useful_life_years, resale_pct, notes, all nullable; unique(user_id, category).
- `service_divisions` (9A): id, user_id, org_id (nullable, same org-move pattern as company_settings), name, season_months (1–12), season_start_month and season_end_month (nullable), events_per_season (nullable), sort_order, archived_at; unique(user_id, name).
- `equipment_division_allocations` (9A): id, user_id, equipment_id (FK equipment, on delete cascade), service_division_id (nullable; null = year-round shared), months_committed (nullable), share_of_year numeric (0–1), expected_hours (nullable), recovery_method text (owned/leased), rate_basis text default 'hourly'. Unique(equipment_id, service_division_id). The sum-to-100% check is a non-SECURITY-DEFINER deferred constraint trigger (plain trigger, invoker rights).
- `user_category_division_inputs` (9C): user_id, category, service_division_id, plus the nullable LMN field columns.

**Migration 9A backfill:** `INSERT INTO equipment_division_allocations SELECT … share 1.0, division null, recovery_method = coalesce(lmn_recovery_method,'owned')` for every equipment row. `COMMENT ON COLUMN equipment.lmn_recovery_method IS 'DEPRECATED: replaced by equipment_division_allocations.recovery_method'`. No changes to equipment, category_defaults, category_consumables or company_settings data.

**Code (9A):** new hooks `useServiceDivisions` and `useUserCategoryOverrides`; `EquipmentContext.updateCategoryDefaults` writes overrides; `CategoryLifespans.tsx` reads base table + overrides; Company Settings gets a divisions card; the equipment form gets a Divisions section; `rollupEngine` and `FMSExport` read recovery method from the allocation row (single shared row = identical output to today).

**Code (9B/9C):** new `src/lib/divisionAllocation.ts` (pure, tested with the loader cases A/B/C as fixed assertions); `rollupEngine` key adds division; the FMS Export grid; `resolveOperatingCosts` gains a category-level layer. Buy vs Rent is untouched.

**Tests:** 9A: shares must total 100% to save; 8+4 suggests 8/12 and 4/12 with no warning; 8+5 suggests 0.615/0.385 and flags 13 months; 7+4 flags 11 months; edited shares are never overwritten by a months change; backfill preserves the method and sets rate_basis to hourly. 9B: cases A, B, C above to the cent.

**Lint:** confirm the count stays at 8 after each migration.

**Decided:** overlap is a user judgment (suggestion only); recovery_method and rate_basis are two separate fields; no seeded or suggested division names.

**Open, returns with 9B:** financing treatment (interest only, or excluded); go-ahead for fuel wiring.
