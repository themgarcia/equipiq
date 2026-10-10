# Step 9A.1 — Category-level allocation, division mapping, Settings UI pass, input bug fix (spec only)

No building yet. 9B and 9C have not started. Nothing in this step changes Buy vs Rent or any exported number.

---

## 0. Bug fix first: Category Lifespans drops keystrokes (confirmed in code)

**Cause.** This is not slow re-rendering. The table and the mobile cards are built as components *inside* the page, so they are recreated on every keystroke. React then sees a brand-new table, throws away the input you're typing in, and builds a fresh one. Focus is lost after the first character, so "11" lands as "1". A second problem sits on top: `parseInt(value) || 0` turns an empty field into 0 mid-edit.

**The same pattern exists in three more places** (found by search):

| Where | Has inputs inside the recreated block? | Risk |
|---|---|---|
| Category Lifespans: table, mobile cards, mobile sheet | Yes: life, resale, notes | Live, as you saw |
| Insurance: Insured Register edit dialog (`EditFormContent`) | Yes: declared value, **annual premium** | Same bug |
| Insurance: Unreviewed Assets insure form (`InsureFormContent`) | Yes: declared value, also `parseFloat \|\| 0` | Same bug |
| Insurance: Pending Changes tables | Display only | Re-renders, nothing to drop |
| Equipment form | No. It uses the validate-on-blur numeric handler | Not affected |
| Divisions panel (9A) | No. It holds text while typing and converts on save | Not affected |

**Fix, the same everywhere:**
- Move each inner block out to a proper top-level component, so it is never recreated while typing.
- Number fields hold the text as typed and convert only on blur or save, following the project's validate-on-blur rule. An empty or invalid field shows an error and blocks Save. It is never silently saved as 0.
- Add range checks with a plain warning: useful life 1–30 yrs, resale 0–100%. When a new life is less than half or more than double the shared default, show "That's a big change from the 10-year default — check it before saving." This catches the 10 → 1 case even when typing is perfect.

**Test:** a browser test that triple-clicks Useful Life on Construction — Loader — Backhoe, types "11" at full speed, saves, reloads, and asserts 11. The same fast-typing check runs on the Insured Register premium field. Plus a unit test that an empty value never becomes 0.

---

## 1. Corrections to the model (rate basis removed)

Checked against the live data before revising:
- `category_defaults.default_lmn_unit` already exists, seeded in Step 6: **34 categories Hours, 60 Days**. `rate_basis` duplicated it with the wrong values.
- The Field Equipment / Overhead / Owner Perk flag exists as `equipment.allocation_type`: **34 operational, 3 overhead, 0 owner perk** across all accounts. It is **per unit today, not per unit x division**. 9A moved only owned/leased onto the division rows.
- `rate_basis` rows already saved: **37, all "hourly"**, which is the default. None are seasonal or per-event, so there's nothing to migrate.

**Corrected model:**
- **The allocation flag is the router.** It sits per unit x division and decides which export that share of the machine goes to. Field Equipment goes to the price list (a rate, and a unit applies). Overhead or Owner Perk goes to that division's overhead budget (no rate, and no unit at all). It is backfilled from each unit's current flag, so behaviour is unchanged. The unit-level flag stays, synced, and is marked deprecated until 9C.
- **LMN unit (Hours/Days):** the category's existing `default_lmn_unit`, used only as a label. It isn't overridden and no number depends on it (see below).
- **Per-event:** shown as a divisor only in 9B ("$8,333 a season; at 12 events $694, at 20 events $417"). It has no column.
- **rate_basis:** removed from the panel, no longer read or written, and the column is marked DEPRECATED. It isn't dropped, because that would break the live app. Its 37 "hourly" values are left alone.

**Does EquipIQ need to hold Hours/Days at all? Revised after your LMN findings: barely.**
- An LMN item stores **cost per hour + hours per day**, and LMN computes cost per day itself. EquipIQ always outputs per hour, so **no EquipIQ number depends on the Hours/Days unit**. Your earlier reasoning ("we must know which to output") no longer holds, because we never output per day.
- What does matter is **hours per day** (see section 9).
- The unit stays only as the existing category label (`default_lmn_unit`), pre-filling LMN's Units field. It needs no new column. The per-division unit override proposed earlier is **removed**.

---

## 2. Category-level allocation defaults

```text
Effective allocation for a unit =
  1. this unit's own allocation (override), if set
  2. else the category default for its category
  3. else Year-round shared (today's behaviour)
```

- A category default holds the same thing a unit allocation holds: divisions, months committed, share of year, expected hours per machine, and the router flag. Or it holds "Year-round shared".
- The overlap rule is unchanged: months suggest shares, the user confirms, and Save requires 100%.
- Owned/leased stays per unit, because it's that machine's financing.
- Each unit shows where its allocation came from, like the Step 8 rows: "From category default: Fleet — Truck → Lawn 58.3% / Snow 41.7%" with **Override for this unit**, or "Set for this unit" with **Reset to category default**, or "Year-round shared (no category default)".
- Changing a category default updates inheriting units only. The confirm dialog says how many change and how many have their own setting and stay put.
- **Existing data:** the 9A backfill rows become "inherit", which resolves to Year-round shared, so nothing changes. The one unit you allocated while testing stays an override.

## 3. Taxonomy-to-service-division mapping

- This comes after the user has named their divisions. It never seeds names.
- One question per taxonomy division that has equipment. Your fleet has Construction, Fleet and Lawn, so that's **3 questions**: "Equipment in the Fleet division — which of your service divisions does it serve?"
- The answers **propose** category defaults. Months are pre-filled from each division's season, and shares are suggested.
- In the review, each row gets a source badge, an overlap flag where months don't make 12, and a "hours blank" note. Existing defaults are listed as conflicts with Keep or Use proposal. Nothing saves until **Apply selected**.
- **Reusing the import review:** reusing the whole screen isn't practical, because it's a large equipment-specific screen. Reusing its pieces is practical: the confidence badge, the source badge and the conflict banner move into shared components with the same look, and both screens use them. That move touches the import screen, so one document import gets clicked through afterwards to check it.

## 4. Company Settings UI pass

**The cause:** two save models on one page. The form above has one Save, while the Divisions card saves itself, which strands the button mid-page.

**Recommendation: two tabs.**

```text
[ Costs & rates ]        recovery basis, fuel & finance, work day
                         sticky bar when unsaved: [Discard] [Save]
[ Service divisions ]    1. Your divisions  2. Match equipment  3. Category allocations
                         each step saves on its own action
```

Tabs beat collapsible groups here because the two halves behave differently. The sticky bar keeps Save reachable however many settings arrive later. The tab shows in the page address, so it can be linked directly.

**Other UI debt from 9A, from reading the code:**
- The equipment detail panel is getting long. Divisions becomes a one-line summary plus Edit.
- Category values now live in two places, Lifespans and Divisions. Revisit this in 9C.
- The FMS owned/leased toggle still writes the deprecated column path.
- The hours label must say "per machine".
- The inner-component input bug above.

## 5. Burden, measured (12 active, 10 categories, 3 service divisions)

Assumes 8 machines split across two divisions and 4 year-round. Counts are clicks and entries.

```text
                              9A as built     9A.1
Divisions + shares + save     ~52             ~13-16 (3 answers, Apply, overlap fixes, 1 exception)
Expected hours                ~16             ~16 (≈ one machine per category in your fleet)
Total                         ~68             ~29-32
```

- Allocation itself drops about 4x, and it stays flat as the fleet grows: about 220 entries become about 15 at 50 machines.
- Hours don't drop on your fleet. Hours stay optional in 9A.1, because nothing uses them until 9B.

---

## 6. The FMS Export today (read from the code)

- **Two sections:**
  - "Field Equipment — LMN Equipment Budget" = units with allocation `operational`.
  - "Overhead Equipment — LMN Overhead Budget" = `overhead_only` + `owner_perk` combined.
- **Within each section:** the grouping key is **category + recovery method** (owned vs. lease pass-through). There is no division anywhere.
- **Owned rows send:** category, qty, average replacement value, average useful life, average end value.
- **Lease rows send:** category, qty, average monthly payment, payments per year (12), months used (12).
- Values are copied cell by cell or downloaded as one CSV (`rollupToCSV`).
- There's a per-category toggle to switch leased units between Owned Recovery and Lease Pass-Through.

## 7. Division split in the budget export: confirmed, dollars scaled by share

**You are right.** LMN budgets are per division, and the export currently sums across them. A unit split 7/12 Construction and 5/12 Snow must become separate rows in the separate budgets, never one blended row. Each section gains a division level:

```text
Overhead Equipment — LMN Overhead Budget
  Snow            Loader — Wheel   (5/12 share)
  Construction    ...
  Shared (year-round, not yet allocated)   <- today's rows, unchanged until allocated
```

The router decides the section per row, so the same loader can sit in Construction's **Field** section and Snow's **Overhead** section.

**What it takes:**
- The rollup key becomes division + router flag + category + recovery method.
- Rows are grouped by division first, the CSV gains a division column, and the copy view gets a division heading per block.
- It uses only the share of year and the router flag from 9A/9A.1. It needs **no hours, no unit and no 9B cost engine**.

**Decided: scale the dollars by share (option a). Fractional qty is not built and not offered as a toggle.**
- Replacement value and end value are each multiplied by the division's share. Life is unchanged and qty stays whole. Lease rows: monthly payment x share.
- **Every scaled figure says so on its face**, in the copy view, the CSV and the before/after table:
  - **Copy view:** under the value, "5/12 of $180,000 — this machine's Snow share". When a row rolls up several machines with different shares, it reads "Share-weighted across 2 machines", and the row's expand list shows each machine's share and full price.
  - **CSV:** a Division column plus a "Share basis" column (e.g. "5/12 of $180,000", or "2 machines, shares vary — see detail"). Only the value column gets copied into LMN. The basis column is there so the number is never read as a price.
  - **Before/after table:** shows full price, share and scaled value side by side.
- The arithmetic holds: qty x average scaled value = the sum of each machine's share. Across divisions the shares total the full machine, so nothing is lost or double-counted, and a test checks this.

## 7b. Every row is tagged with its service division (both exports)

**How LMN works (observed by you, authoritative):**
- The budget is a **lens**: the price list page dropdown re-renders every rate with that budget's overhead and profit. Inside each estimate the user picks the budget for that division. Price list items hold cost only.
- **A service division is a production season, not a budget.** One division can sit under several budgets, for example Commercial and Residential Construction over the same "Construction" items. There's no division-to-budget mapping, and the user is never asked to name a division per budget.
- EquipIQ never carries, stores or predicts markup, overhead or profit.

**Naming, decided:** `<Service division> - <Category item name>`, e.g. "Construction - Loader", "Snow - Loader", "Maintenance - Pickup Truck".
- The prefix is the **service division name**, never a budget name.
- The item name is the category's last part(s). The em-dash category stays unchanged inside EquipIQ for matching, and only the exported name uses " - ".
  - Example: "Construction — Loader — Wheel" in Snow exports as "Snow - Loader — Wheel". Whether to flatten the category's own em-dashes in the exported name (e.g. "Snow - Wheel Loader") is a formatting choice for you. It doesn't change the convention.
- The names are generated, never typed, so the same category x division always gets the same name. That prevents the drifting, duplicate and [SAMPLE] mess you found.

**Budget export:** a heading per service division, with the division name on every row and CSV line.

**Unallocated / year-round shared rows:** the open question is now answered in principle. They have no production season, so they get no division prefix.
- The budget export keeps them under "Not allocated to a division", as today, and counts them as incomplete.
- The price list export lists them by category name only, flagged "Not allocated — this item will be used under every budget".
- Neither export guesses a division for them.

## 7c. Cross-division warning: dropped

The naming solves it. The budget is chosen per estimate, not stored per item, so the only way to cross wires is to pick the wrong *item*. With one item per division, each named with its division first, the right pick is the obvious one. A separate warning would repeat what the name already says, so it won't be built.

## 8. Split 9C in two, and order: agreed, with one change

- **Agree on the split.** 9C-BUDGET changes numbers you already rely on, so it needs before/after review and a version bump. 9C-PRICELIST only adds.
- **Agree that BUDGET comes before PRICELIST.** The data model supports it: the budget split needs only shares and the router, and both exist after 9A.1. PRICELIST needs hours, the unit and the 9B cost engine.
- **What I'd change:** 9C-BUDGET doesn't depend on 9B at all, so it can come **before 9B**. The proposed order:

```text
9A.1  (this step)  -> 9C-BUDGET  -> 9B cost engine  -> 9C-PRICELIST
```

That gets the budget side done first for the Grindstone engagement, and leaves the open 9B decisions (fuel wiring, financing treatment) where they are. The one dependency to watch: 9C-PRICELIST must read the same router, so Field rows don't land in both exports. The rollup takes each unit x division row exactly once, and a test checks that.

**9C-BUDGET will need:**
- a before/after table for your 12 machines (full price, share, scaled value), where unallocated rows stay byte-identical
- a division tag on every row and CSV line, plus the share basis on every scaled figure
- your choice of naming convention (needed for PRICELIST; the budget export uses division headings)
- a changelog entry

## 9. What your LMN findings change

**9A.1 itself: almost nothing.** It's still allocation, mapping, the Settings UI and the input bug. Only three small things change, and all of them shrink or reword:
- The per-division Hours/Days override is **removed** (one fewer column, one fewer control).
- The service divisions helper text stops saying "match your LMN budgets". It now says a division is a production season that can sit under several budgets.
- No division-to-budget mapping is added anywhere.

**Hours per day: Step 6 was wrong, and this is where it belongs.**
- Your data (10 on trucks and the snow loader, 8 on excavators, 7 on the plow and salter) shows hours per day is a per-machine-type value. Dropping `default_hours_per_day` in Step 6 was a mistake.
- **Where it belongs:** the LMN item is one per category x service division, so hours/day has to resolve at that level.
- Proposed resolution order:

```text
category x division override  ->  category (user_category_overrides)  ->  company setting (Step 7)
```

- **Not per unit, and I'm pushing back on that part of your ask.** Several units roll into one LMN item, and that item has only one hours/day. A per-unit value would have nothing to land on except an average, and an average quietly invents a number. If two machines in one category genuinely run different days, that's a sign they belong in different categories.
- No shared default is added to `category_defaults`, because there's no sourced value to seed. A category with no setting falls back to the company figure, labelled "Company default: 8 hrs".
- **Timing:** this is entered and used only in 9C-PRICELIST, so the columns are added there, not in 9A.1.

**Acquisition value:** removed from everything we source. LMN computes it, and we never send it or try to reproduce it.
- **Flag for the breakdown:** our cost per hour uses EquipIQ's own recovery, (replacement − resale) ÷ life. LMN's acquisition value includes a finance component neither of us can derive yet (the $60,375 gap on your 350,000 example).
- So a user who types our breakdown into LMN's calculator will get a **different** hourly figure from ours. The breakdown must say so plainly rather than imply the two will match.

**Fuel:** LMN wants consumption **per day** plus a price per unit. We hold L/hr, so we export L/hr x hours/day as "per day". This needs the fuel go-ahead that's still open for 9B.

**Purchase date:** closed. LMN has no field for it, so it isn't exported.

**9C-PRICELIST gets much smaller.**
- **Headline per item:** name (division - category), **cost per hour**, **hours per day**. That's two numbers.
- **Breakdown underneath, read-only, for auditing:** our annual recovery share, annual maintenance+repair, insurance and licensing (x life = LMN's "Total Operating Costs for Term"), forecast billable hours/yr, expected life, and fuel per day + price. Each line shows where it came from, using the Step 8 derivations.
- **The editable category grid is no longer the right surface.** Inputs already have homes (Lifespans, Operating Costs, Divisions, Settings), and a second place to edit them would recreate the duplicated mess you found in that LMN catalog.
- **Simpler surface:** a read-only list grouped by service division. Each row has the generated name, the two headline numbers with copy buttons, a completeness chip ("Missing: hours"), and an expand arrow for the breakdown. Fixing a gap links to where that input lives.
- **Rough size:** 9C-PRICELIST drops from about the size of 9C-BUDGET plus a grid to roughly half that. The grid's editing, its per-cell saving and its category-level input table all go away (`user_category_division_inputs` is no longer needed). What remains is the hours/day columns, one pure function for cost per hour, the list, and its tests.

**Design rule carried forward:** clean, consistently named output is the product.
- Names are generated from category + division, never typed.
- Exactly one row per category x division.
- There are no sample rows.
- A test fails if two output rows share a name.

---

## Technical section

**Migration (additive only; GRANTs, per-user RLS with `auth.uid() IS NOT NULL`, no new SECURITY DEFINER functions, so the lint count stays at 8):**
- `category_division_allocations`: user_id, category, service_division_id (null = shared), months_committed, share_of_year, expected_hours_per_unit, allocation_type (nullable; null = the unit's own flag). unique(user_id, category, service_division_id). Plain invoker total-100% trigger. Saved through an invoker `replace_category_allocations`.
- `taxonomy_division_mappings`: user_id, taxonomy_division (CHECK, one of 7), service_division_ids uuid[], confirmed_at. unique(user_id, taxonomy_division).
- `equipment_division_allocations` adds:
  - `is_override boolean DEFAULT false`, backfilled true for rows with a division or created after the 9A backfill
  - `allocation_type`, backfilled from `equipment.allocation_type` and synced by extending the existing default-allocation trigger
- Comments:
  - `COMMENT ON COLUMN ... rate_basis IS 'DEPRECATED: unit is category default_lmn_unit; seasonal is allocation_type'`
  - `COMMENT ON COLUMN equipment.allocation_type IS 'DEPRECATED at 9C: per-division value lives on allocation rows'`
- `replace_equipment_allocations` stops taking rate_basis and sets is_override. A new invoker `reset_equipment_allocations_to_inherit`.

**Code:**
- **Input fix:**
  - Lift `MobileCardView`/`DesktopTableView` out of `CategoryLifespans.tsx`, and `EditFormContent` out of `InsuredRegisterTab.tsx`. Do the same for `InsureFormContent`/`MobileCardView`/`DesktopTableView` in `UnreviewedAssetsTab.tsx` and the tables in `PendingChangesTab.tsx`.
  - Text-while-typing, convert-on-blur.
- `src/lib/divisionAllocation.ts`: `resolveAllocation`, plus `proposeFromMapping`, which reuses `suggestShares`.
- Hooks `useCategoryAllocations` and `useTaxonomyMappings`.
- Shared `ConfidenceBadge`, `SourceBadge` and `ConflictBanner` moved out of `EquipmentImportReview.tsx`.
- Settings tabs plus a sticky bar.
- The panel shows a summary with source, and uses the router flag instead of the rate dropdown. There's no unit control.
- `ServiceDivisionsCard` helper text changes to: "A service division is a production season — a block of the year your machines are committed to one kind of work (e.g. Construction, Maintenance, Snow). One division can sit under several LMN budgets. Fleet and Shop are support, not services — leave them out."
- `AGENTS.md`: the resolution-order rule, the router rule (replacing the rate_basis wording), and the "no inner components holding inputs" rule.

**Tests:**
- fast-typing "11" persists (browser)
- an empty value never saves as 0
- resolution order is unit, then category, then shared
- a category edit leaves overrides alone
- Lawn+Snow at 7 and 5 proposes 7/12 and 5/12 with no message
- seasons 8 and 5 propose 61.5% / 38.5% and flag 13 months
- a proposal never overwrites without the conflict step
- the allocation_type backfill matches 34 / 3 / 0
- the service divisions helper text no longer says divisions match budgets
