# Step 6 — Move Category Defaults into the Database (spec only)

No calculation logic changes. The client-side array stays in place. Nothing switches over until the comparison check passes.

## Findings that change the brief (confirmed)

1. **The array has 94 categories, not 93.** "Construction — Vacuum Lifter" was added recently; the header comment still says 93. The check will expect 94.
2. **The benchmarks are not in the notes text.** Each category already has its own `benchmarkType` (hours / miles / calendar) and `benchmarkRange` (for example "4,000–6,000 hrs"). The notes hold model and brand keywords that AI matching uses. So usage parsing will read the existing benchmark fields. Notes are copied over unchanged.
3. **Maintenance and insurance are not a flat 5.0 / 1.5.** Buy vs Rent reads per-category values: maintenance ranges from 2–8% and insurance from 0.5–2.5%. Reusing the existing defaults means seeding each category's own value. A flat 5.0/1.5 would change Buy vs Rent results for most categories, which breaks the "no calculation changes" rule. **Default: seed per-category values.** You can choose flat values instead.
4. **The LMN unit already exists.** Every category has a `unit` of Hours or Days. `default_lmn_unit` will be seeded from it, not left empty.
5. **Edits on Category Lifespans are not saved today.** They only live in memory and are lost on reload. That stays as it is in this step (see Cutover).

## 1. Tables

```text
category_defaults (1) ──< category_consumables (many)
        ^
        └── future user_category_overrides.category_id (not built now)
```

**category_defaults**
- `id` uuid primary key: the stable key a future overrides table will reference
- `category` text unique not null: the exact em-dash name, e.g. "Lawn — Mower — Zero Turn"
- `division` text not null, check in the 7 divisions
- `useful_life_years` int not null, `resale_pct` numeric not null
- `default_allocation` text not null (operational / overhead_only), carried over so the table is a full copy
- `notes` text not null: verbatim
- `maintenance_repair_pct` numeric not null, `insurance_pct` numeric not null
- `licensing_annual` numeric null, `fuel_consumption_lph` numeric null: both null for all 94 for now, because no source exists
- No `default_hours_per_day`. Workday length is a company setting and will be added in a later step.
- `default_lmn_unit` enum `lmn_unit` (hours, days) not null
- `usage_basis` enum `usage_basis` (hours, miles, calendar) not null
- `lifetime_usage_min/max`, `annual_usage_min/max` numeric null
- `sort_order` int, `created_at`, `updated_at`, plus the existing `update_updated_at_column` trigger

**category_consumables**
- `id` uuid pk, `category_id` uuid references category_defaults(id) on delete cascade
- `name` text not null, `interval_hours` numeric null, `source_note` text not null (the exact phrase from the notes)
- unique (category_id, name)

**Security**
- Grant SELECT to authenticated and ALL to service_role. No access for signed-out visitors.
- RLS SELECT: `auth.uid() IS NOT NULL`
- INSERT, UPDATE and DELETE: `auth.uid() IS NOT NULL AND has_role(auth.uid(),'admin')`
- **No new SECURITY DEFINER functions.** These policies reuse the existing `has_role`, so the lint count stays at eight.

## 2. Seed and parsing results

Seed rows are generated from the array by a script, so values are copied, not retyped. Rules:
- Lifetime: parse `benchmarkRange` "A–B hrs|mi" → min A, max B. Calendar → basis calendar, both null.
- Annual: only where the notes state "X–Y hrs/yr".

Parsing results:

| Result | Count | Categories |
|---|---|---|
| Hours, lifetime parsed cleanly | 56 | all with an hours benchmark |
| Miles, lifetime parsed cleanly | 9 | Fleet trucks (7) and vans (2) |
| Calendar, no usage figures | 29 | trailers, plows, spreaders, "Other", etc. |
| Annual parsed cleanly | 2 | Lawn — Mower — Zero Turn: 600–1,000 hrs/yr; Snow — Blower: 50–150 (basis stays calendar) |

The full 94-row review table (category, life, resale %, maint %, ins %, unit, basis, lifetime min/max, annual min/max) will be delivered with the seed, generated from the same script.

## 3. Consumables

| Category | Name | Interval hrs | Source note |
|---|---|---|---|
| Construction — Attachment | Bits/teeth/edges | null | "Bits/teeth/edges consumable" |
| Construction — Saw — Cut-Off | Blades | null | "Blades consumable" |
| Irrigation — Trencher — Walk-Behind | Chain/teeth | null | "Chain/teeth consumable" |
| Tree — Stump Grinder | Teeth | null | "Teeth consumable" |
| Construction — Loader — CTL | Track undercarriage | 2000 | "Track undercarriage at ~2,000 hrs is major cost" (the source note keeps the approximation visible) |

## 4. Resolved decisions

1. **Snow — Blower:** basis stays calendar, with annual_usage_min 50 and annual_usage_max 150.
2. **CTL undercarriage:** 2000 interval hours, with the source note kept word for word.
3. **Excluded as major repairs, not consumables:** Lawn — Sprayer — Tank ("Pump rebuild extends life") and Shop — Pressure Washer ("Pump wear is limiting factor").
4. **Excluded as a condition:** Snow — Sidewalk Machine ("Salt exposure accelerates wear").
5. **`licensing_annual` and `fuel_consumption_lph`:** null for all 94. `default_hours_per_day` is dropped.

## 5. Verification, then cutover

- Run a comparison script (a test file next to the existing tests) that loads all table rows and the array. It asserts:
  - the counts are equal (94)
  - every category name matches exactly, em-dash included
  - `useful_life_years` and `resale_pct` are exact matches
  - maintenance %, insurance %, unit, allocation and notes also match
- It prints every mismatch, and the cutover is blocked on zero mismatches.
- **Cutover, only after it passes:** Category Lifespans reads its list from the table. Calculations, Buy vs Rent, FMS export and per-item Useful Life / Expected Resale overrides keep reading the array through the existing context, untouched. The page's edit pencil keeps today's in-memory behaviour, so no non-admin write path is opened.

## Deliverables at build time

The migration SQL, a seed script with the generated insert data, the 94-row parsing table, the manual-resolution list above, the comparison test with its output, and a short change summary.

## Technical notes
- The migration holds only the schema: enums, two tables, grants, RLS, the trigger. The seed goes in through a separate data insert.
- The page uses a small hook to fetch `category_defaults` ordered by `sort_order`, falling back to the array if the fetch fails.
- An `AGENTS.md` rule will record that the database table is the future source of truth and the array is the reference until the full cutover.
