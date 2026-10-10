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
- **LMN unit (Hours/Days):** the category's `default_lmn_unit`, overridable per category x division and per unit x division. It is only shown and stored for Field Equipment rows. Overhead rows hide it.
- **Per-event:** shown as a divisor only in 9B ("$8,333 a season; at 12 events $694, at 20 events $417"). It has no column.
- **rate_basis:** removed from the panel, no longer read or written, and the column is marked DEPRECATED. It isn't dropped, because that would break the live app. Its 37 "hourly" values are left alone.

**Does EquipIQ need to hold Hours/Days at all?** Yes, though only for price-list rows, and only once EquipIQ outputs a rate.
- Today the export sends annual totals plus the unit, copied across as a label. EquipIQ never computes a per-hour or per-day figure.
- From 9C-PRICELIST onward, cost per day = cost per hour x hours per day, the Step 7 setting. The output number depends on the unit, so your reasoning holds there.
- For budget-routed rows the unit means nothing, and they won't carry one.
- **Not verified:** whether LMN's Equipment Catalog takes an annual cost and divides it itself, or expects the rate typed in. That's open until checked against LMN.

---

## 2. Category-level allocation defaults

```text
Effective allocation for a unit =
  1. this unit's own allocation (override), if set
  2. else the category default for its category
  3. else Year-round shared (today's behaviour)
```

- A category default holds the same thing a unit allocation holds: divisions, months committed, share of year, expected hours per machine, the router flag, and an optional Hours/Days override. Or it holds "Year-round shared".
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

## 7. Division split in the budget export: confirmed, with one decision for you

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

**The decision you need to make: how does a share of a machine go into an LMN budget?** LMN takes qty, replacement value, life and end value, then works out recovery itself. There are two honest options:
- **(a) Scale the dollars by share.** Replacement value and end value x 5/12, life unchanged, qty stays whole. LMN's recovery comes out at exactly 5/12 of the machine. Leased rows: monthly payment x share.
- **(b) Fractional qty.** Qty 0.42 with full values. This only works if LMN accepts decimal quantities, which is **unverified**.

I recommend (a), because it doesn't depend on LMN accepting decimals. The catch is that the "replacement value" shown per division is then a share, not the machine's price, and the row has to say so ("5/12 of $180,000").

## 8. Split 9C in two, and order: agreed, with one change

- **Agree on the split.** 9C-BUDGET changes numbers you already rely on, so it needs before/after review and a version bump. 9C-PRICELIST only adds.
- **Agree that BUDGET comes before PRICELIST.** The data model supports it: the budget split needs only shares and the router, and both exist after 9A.1. PRICELIST needs hours, the unit and the 9B cost engine.
- **What I'd change:** 9C-BUDGET doesn't depend on 9B at all, so it can come **before 9B**. The proposed order:

```text
9A.1  (this step)  -> 9C-BUDGET  -> 9B cost engine  -> 9C-PRICELIST
```

That gets the budget side done first for the Grindstone engagement, and leaves the open 9B decisions (fuel wiring, financing treatment) where they are. The one dependency to watch: 9C-PRICELIST must read the same router, so Field rows don't land in both exports. The rollup takes each unit x division row exactly once, and a test checks that.

**9C-BUDGET will need:**
- a before/after table for your 12 machines, where unallocated rows stay byte-identical
- the decision on (a) or (b)
- a changelog entry

---

## Technical section

**Migration (additive only; GRANTs, per-user RLS with `auth.uid() IS NOT NULL`, no new SECURITY DEFINER functions, so the lint count stays at 8):**
- `category_division_allocations`: user_id, category, service_division_id (null = shared), months_committed, share_of_year, expected_hours_per_unit, allocation_type (nullable; null = the unit's own flag), lmn_unit (nullable `lmn_unit` enum; null = category default). unique(user_id, category, service_division_id). Plain invoker total-100% trigger. Saved through an invoker `replace_category_allocations`.
- `taxonomy_division_mappings`: user_id, taxonomy_division (CHECK, one of 7), service_division_ids uuid[], confirmed_at. unique(user_id, taxonomy_division).
- `equipment_division_allocations` adds:
  - `is_override boolean DEFAULT false`, backfilled true for rows with a division or created after the 9A backfill
  - `allocation_type`, backfilled from `equipment.allocation_type` and synced by extending the existing default-allocation trigger
  - `lmn_unit`, nullable
- Comments:
  - `COMMENT ON COLUMN ... rate_basis IS 'DEPRECATED: unit is lmn_unit; seasonal is allocation_type'`
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
- The panel shows a summary with source, uses the router flag instead of the rate dropdown, and shows Hours/Days only on Field rows.
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
- the unit is hidden or null on overhead rows
