# Step 9A.1 — Category-level allocation, division mapping, Company Settings UI pass (spec only)

Do not start 9B or 9C. No change to Buy vs Rent, to any calculated number, or to the export.

## Should it be split?

No. All three parts are data entry, and none of them changes a number. The order matters, though, and each part can be checked before the next starts:

1. Company Settings restructure, including the Save fix (this part is independent).
2. Category-level allocation defaults, the resolver, and "where this came from" on each unit.
3. The taxonomy-to-service-division mapping, which proposes category defaults through the shared review pattern.

If part 3 slips, parts 1 and 2 still stand on their own.

---

## Part 1 — Category-level allocation defaults

The pattern is the same as Useful Life Override and Expected Resale Override:

```text
Effective allocation for a unit =
  1. this unit's own allocation (override), if the user set one
  2. else the category default for this unit's category
  3. else Year-round shared (today's behaviour)
```

- A category default holds the same thing a unit allocation holds today: one or more service divisions, each with months committed, share of year, expected hours per unit, and rate basis. Or it holds "Year-round shared".
- The overlap rule is unchanged. Months entered suggest shares, the user confirms, and Save only works at 100%. It reuses `divisionShares.ts` and the same messages.
- **Recovery method (owned/leased) stays per unit.** It is a property of each machine's financing, not of its category. Inherited rows take it from the unit.
- **Each unit shows where its allocation came from.** This mirrors the Step 8 Operating Costs rows:
  - "From category default: Fleet — Truck → Lawn 58.3% / Snow 41.7%", with an **Override for this unit** button.
  - "Set for this unit (override)", with a **Reset to category default** button.
  - "Year-round shared (no category default set)".
- Changing a category default updates every unit that inherits it, and never touches units that have an override. Before saving, the confirm dialog says how many units this changes and how many it leaves alone, for example: "Applies to 3 trucks. 1 truck has its own setting and won't change."

### Where it's entered
On the new **Divisions** tab in Company Settings (Part 3). It's a list of the categories in **your fleet only**, grouped by taxonomy division, with one row per category: an allocation summary, its source, and Edit. The editor is the existing allocation panel, reused.

### Existing data
- Each of the 9A backfill rows (one Year-round shared row per unit, with nothing chosen by the user) becomes **inherit**, not override. Inheriting from no category default resolves to Year-round shared, so every unit keeps exactly today's behaviour.
- Any unit the user has already allocated through the panel stays an **override**. Your account has 1 such row, from testing. The other two accounts have none.

---

## Part 2 — Taxonomy division to service division mapping

- **Order:** the user names their service divisions first. Only then does the mapping appear. It never seeds names.
- **Which questions are asked:** one per taxonomy division that actually has equipment in the fleet. The question reads: "Equipment in the **Fleet** division — which of your service divisions does it serve?" The user picks from their own divisions, or "Year-round shared — don't split". Your account has Construction, Fleet and Lawn, so that's **3 questions**, not 7.
- **What happens with the answers:** they **propose** a category default for every category in that taxonomy division. Months are pre-filled from each service division's season length, and shares are suggested by the existing rule. Nothing is applied yet.
- **Review:** each proposed category row shows a source badge ("Proposed from your Fleet answer"), plus a flag where months don't make 12 ("13 months committed — decide the overlap") or where hours are still blank. Rows that already have a category default are listed as **conflicts**: "Keep current" or "Use proposal". Nothing saves until the user presses **Apply selected**.
- The answers are stored, so the mapping can be re-run later. Re-running never overwrites confirmed category defaults without going through the same conflict step.

### Can it share the document-import review screen? Honest answer: partly.
- **Sharing the screen itself is not practical.** The import review is one very large component built around equipment fields: make, model, price, financing, attachments and parent matching. The mapping review rows are category x division allocations. Forcing them into it would bend both screens.
- **Sharing the pieces is practical, and it's what the user actually recognises.** The confidence badge, the per-field source badge and the conflict banner are written as small blocks inside the import screen today. I would move those three blocks into shared components without changing how they look, use them in the import screen, and use them in the mapping review. The interaction (proposal arrives, badges, conflicts listed, confirm to save) and the visuals would match.
- **Risk:** this touches the import review screen. That change is a pure move, with the same output, and gets checked by clicking through one document import afterwards.

---

## Part 3 — Company Settings UI pass

### The bug
The page has one Save button for four fields (recovery basis, fuel, finance rate, hours/day). The Service divisions card below it saves itself immediately, so the button ends up mid-page. The real cause is **two save models on one page**, not where the button sits.

### Recommended structure: two tabs, with a sticky save bar on the first

```text
Company Settings
[ Costs & rates ]  [ Service divisions ]

Costs & rates            -> grouped sections: "How recovery is counted",
                            "Fuel and finance", "Work day"
                            Sticky bar at the bottom appears only with unsaved
                            changes: "You have unsaved changes  [Discard] [Save]"
Service divisions        -> 1. Your divisions (names, seasons)
                            2. Match equipment to divisions (the mapping)
                            3. Category allocations (list from Part 1)
                            Each step saves on its own action; no page Save.
```

**Why tabs rather than collapsible groups:** the two halves behave differently. One is a form that you save. The other is a set of steps where each action saves as you go. Mixing them on one scroll page caused this bug, and collapsible groups would keep both models on one page. The sticky bar means Save is always reachable no matter how many settings arrive later. The tab is remembered in the address bar, so a link to "Service divisions" opens it directly.

### Other UI debt from 9A, from reading the code (not clicked through)
- **Equipment detail panel length.** It now stacks details, Operating Costs and Divisions. Proposal: show Divisions as a one-line summary with its source and an Edit button, so the full editor only opens when overriding.
- **Two homes for category-level values.** Category Lifespans holds life and resale, and Divisions would hold allocations. That's acceptable for now. At 9C the FMS Export category grid is planned to become the main category view, so it's worth deciding then whether Lifespans folds into it.
- **Owned/leased toggle.** Changing it from the edit form or the FMS Export toggle updates all of a unit's division rows at once. That's correct today, but it's still the deprecated column path until 9C.
- **Hours are per unit per division.** On a category default they mean "hours per unit". The label must say "per machine", or users will enter fleet totals.

---

## Part 4 — The burden, measured

Your fleet: 12 active units, 10 categories, 3 taxonomy divisions (Construction 7 units, Fleet 4, Lawn 1), and 3 service divisions. The assumption is that 8 units serve two divisions and 4 are year-round shared. One "touch" means one field entered or one button pressed.

```text
                                9A as built         9A.1 proposal
Who serves what (divisions,     8 x 5  = 40         3 mapping answers   ~4
shares, save)                   4 x 3  = 12         review + Apply       1
                                                    overlap fixes      ~3-6
                                                    1 exception unit    ~5
  Subtotal                      ~52                 ~13-16
Expected hours                  8 x 2  = 16         ~8 cats x 2 = ~16
  Total                         ~68                 ~29-32
```

- **Allocation itself drops about 4x (52 to about 15) on your fleet**, and it stays almost flat as the fleet grows. For 50 units in the same categories, it goes from about 220 touches to about 15.
- **Hours do not drop on your fleet**, and I won't pretend they do. You have almost one unit per category, so hours "per category" and hours "per unit" are about the same count. Hours shrink only where a category has several similar machines.
- If that isn't good enough, the option is to let hours stay blank at 9A.1 and enter them in the 9C category grid. They aren't used in any number until 9B anyway. I'd leave them optional here and not required to save.

---

## Technical section

**New tables** (per-user RLS `auth.uid() = user_id AND auth.uid() IS NOT NULL`, GRANTs to authenticated and service_role, updated_at trigger, no new SECURITY DEFINER functions, so the lint count stays at 8):
- `category_division_allocations`: user_id, category (text, em-dash format), service_division_id (nullable, null = shared), months_committed, share_of_year, expected_hours_per_unit, rate_basis. unique(user_id, category, service_division_id). A plain invoker-rights total-100% trigger function, the same shape as `check_allocation_shares`. Saves go through `replace_category_allocations(_category, _rows)` (invoker rights).
- `taxonomy_division_mappings`: user_id, taxonomy_division (one of 7, CHECK), service_division_ids uuid[] (empty = shared), confirmed_at. unique(user_id, taxonomy_division).

**Change to an existing table (additive):** `equipment_division_allocations.is_override boolean NOT NULL DEFAULT false`.
- **Backfill:** set `true` for units that have any row with a division, or rows created after the 9A backfill. Every other row stays `false` (inherit).
- `replace_equipment_allocations` sets `true`. A new `reset_equipment_allocations_to_inherit(_equipment_id)` (invoker rights) writes one shared row with `is_override = false`.
- No rows are deleted. Data is preserved, including the 9A rows.

**Code:**
- `src/lib/divisionAllocation.ts` gets `resolveAllocation(unitRows, categoryRows)` returning `{rows, source: 'unit' | 'category' | 'shared'}`. It's pure and display-only until 9B.
- `useCategoryAllocations` and `useTaxonomyMappings` hooks.
- `proposeFromMapping(mappings, divisions, fleetCategories)`, which only proposes and reuses `suggestShares`.
- Extract `ConfidenceBadge`, `SourceBadge` and `ConflictBanner` from `EquipmentImportReview.tsx` into `src/components/review/`, as a pure move.
- `Settings/Company.tsx` moves to tabs plus a sticky save bar.
- `DivisionAllocationPanel` becomes summary + source + override/reset.
- `AGENTS.md` gets the resolution order rule.

**Tests** (`scripts/tests/`):
- resolution order: unit, then category, then shared
- a category edit does not change override units
- the Fleet answer "Lawn + Snow" (seasons 7 and 5) proposes 7/12 and 5/12 with no message
- seasons 8 and 5 propose 61.5% / 38.5% and flag 13 months
- the proposal never overwrites a confirmed default without the conflict step
- after the backfill, every unit except your 1 test unit resolves to "shared"

Linter checked after each migration (expect 8).
