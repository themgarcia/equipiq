# Step 8 — Per-unit operating cost fields (spec only)

Store, display and resolve effective values only. Nothing is wired into the FMS export, Buy vs Rent, recovery or any rate calculation.

## Findings (confirmed in code)

1. **Buy vs Rent uses purchase price.** `BuyVsRentAnalysis.tsx` sets maintenance = purchase price × maintenance %, insurance = purchase price × insurance %, and labels them "Default: X% of purchase price". Its purchase price is a hypothetical price today, so the basis is today's cost. This step does not change it.
2. **Insurance data already sits on the equipment record.** `is_insured`, `insurance_declared_value`, `insurance_notes` and `insurance_reviewed_at` are equipment columns. The Insurance page (Insured Register) edits them; the equipment form doesn't show them. So "one place" here means **one column, edited from one screen**, not a separate table.
3. **Bobcat category values:** Construction — Excavator — Mini has maintenance 5% and insurance 1.5% (array and table match, per the Step 6 parity test).

## 1. Pattern and new columns

Same pattern as Useful Life Override / Expected Resale Override: a nullable override, and the effective value = override ?? category default.

New nullable columns on `equipment`:
- `maintenance_annual_override` numeric (dollars per year)
- `licensing_annual_override` numeric (dollars per year)
- `fuel_consumption_lph_override` numeric (litres per hour)
- `insurance_annual_premium` numeric (dollars per year, edited only from the Insurance page)

Check constraints: each value must be >= 0 when set. RLS stays as equipment has it today (per user). No new functions, so the lint count stays at eight.

**No override and no default (licensing, fuel):** the effective value is **"Not set"**, not $0. The display shows "Not set — no category default yet" with the input beside it. Not set stays null in the resolver so a later step can tell "unknown" apart from "zero". Typing 0 on purpose stores 0, shown as "$0/yr (entered)".

## 2. Percentage basis — confirmed, with one caveat

I agree: use **Replacement Cost (Today)** (`replacementCostUsed`). Buy vs Rent applies % to a price in today's dollars. For an owned machine, the only figure in today's dollars is replacement cost today. Purchase price would understate the Bobcat's costs by about 28%.

Caveat: `replacementCostUsed` already includes attachments. So the maintenance and insurance allowances also cover attachment value. I think that's right, because attachments need upkeep and cover too. If you want machine-only, say so.

## 3. Insurance resolution

Order:
1. Unit is insured and has a premium → **premium from the Insurance page** ("Actual premium").
2. Unit is insured, no premium yet → **category default %** × replacement cost today ("Estimated — enter your premium on the Insurance page").
3. Unit not insured (`is_insured = false`) → **$0** ("Not insured").
4. Insured status not set yet (null, the unreviewed state) → category default, labelled as an estimate.

Why: if the default applied to uninsured units, cost would show up that nobody pays. A flat zero for unreviewed units would hide real cost. The equipment record reads the premium directly from its own `insurance_annual_premium` column, so nothing is copied. The equipment detail view shows it read-only, with a link that says "Edit on Insurance page".

## 4. Showing the derivation

A shared `OperatingCostRow` shows the effective value, a one-line derivation, a source badge (Category default / Your override / Actual premium / Not insured / Not set) and, for editable fields, the override input with a "Reset to default" option. Example: "Category default: 5% of $55,369 replacement cost today = $2,768/yr". It also gets an info tooltip in the Step 5 lease tooltip style, explaining why today's replacement cost is used.

Where it appears:
- **Equipment form:** a new "Operating Costs" section with the maintenance, licensing and fuel overrides, and insurance read-only.
- **Equipment details sheet:** all four effective values with derivations.
- **Insurance page, Insured Register edit dialog:** an "Annual premium" field next to Declared Value, showing the category estimate as placeholder text.

## 5. Mixed data sourcing — flagged

New category fields (licensing, fuel) exist only in the table. Maintenance and insurance % exist in both, and the parity test proves they're identical. Plan for this step:
- The resolver takes its category values from **`useCategoryDefaultsTable`**, which falls back to the array. All new values therefore come from the table.
- Recovery, Buy vs Rent and the FMS export keep reading the array, untouched.
- The risk is small today: licensing and fuel are null in both, and maint % and ins % match. It grows when someone edits the table, since only the new fields would pick up the change.

**Recommendation:** don't cut over in this step. Cut over as its own step, just before the LMN export (Step 9), by switching `EquipmentContext`'s category lookup to the table. That way a calculation change is its own reviewable change, and this step stays display-only. I won't cut over without your go-ahead.

## 6. Worked example — 2014 Bobcat 324

Replacement cost today = $55,369 (from the audit). Insurance status depends on what's set on its Insurance record today, so both cases are shown.

| Field | Override | Category default | Effective | Derivation shown |
|---|---|---|---|---|
| Maintenance + repair | none | 5% | **$2,768/yr** | 5% of $55,369 = $2,768.45 |
| Insurance (insured, no premium) | — | 1.5% | **$831/yr** | Estimate: 1.5% of $55,369 = $830.54 |
| Insurance (premium entered, e.g. $900) | — | — | **$900/yr** | Actual premium from Insurance page |
| Insurance (not insured) | — | — | **$0/yr** | Not insured |
| Licensing | none | none | **Not set** | No category default yet |
| Fuel L/hr | none | none | **Not set** | No category default yet |

For comparison, the Buy vs Rent method on purchase price would give $2,000 and $600.

## Flags / unsure

- I'll confirm the Bobcat's actual `is_insured` value with a read query during build. This doesn't change the design.
- Rounding: values are displayed rounded to the dollar and stored unrounded.
- Fuel is in L/hr. For Days-unit categories, L/hr may be the wrong measure for LMN. Revisit in the export step.
- Insurance % has no override on the equipment form, by design. The premium is the override.

## Technical details

- Migration: `ALTER TABLE public.equipment ADD COLUMN ...` × 4 (nullable) + CHECK (>= 0). The existing grants and RLS cover the new columns.
- `src/types/equipment.ts`: add `maintenanceAnnualOverride`, `licensingAnnualOverride`, `fuelConsumptionLphOverride`, `insuranceAnnualPremium`. Map them in the `EquipmentContext` load and save.
- New pure module `src/lib/operatingCosts.ts`: `resolveOperatingCosts(item, categoryRow)` returns `{ value, source, derivation }` for each field. Not imported by calculations.ts, rollupEngine, cashflow or the FMS export.
- `useInsurance` and `InsuredRegisterTab`: the update payload gets the premium.
- Tests in `src/lib/operatingCosts.test.ts`: Bobcat maintenance = 2768.45; insured without premium = 830.54; uninsured = 0; premium beats the default; override beats the default; licensing and fuel with no data = null.
- `AGENTS.md`: per-unit operating costs resolve only via `resolveOperatingCosts`; the insurance premium lives on the equipment row and is edited only from the Insurance page.
