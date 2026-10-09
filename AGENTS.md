# AGENTS.md

- Category defaults live in the `category_defaults` table (with `category_consumables` as its child); the client array in `src/data/categoryDefaults.ts` stays as the reference for calculations until full cutover — why: the table is extensible and overridable, and the parity test (`scripts/seed/categoryDefaults.parity.test.ts`) must pass before anything else reads from it.
- Seed data for category tables is generated from the client array by `scripts/seed/generateCategorySeed.ts`, never hand-typed — why: values must match exactly.
- Annual recovery is computed only by `annualRecovery(item, basis)` in `src/lib/calculations.ts`, with the basis read from `company_settings` via `useCompanySettings` — why: Cashflow and FMS Export once diverged under the same label; one function keeps them identical.
- Company-wide settings live in `company_settings`, one row per user today, with a reserved nullable `org_id` — why: lets settings move to an organisation later by filling `org_id` instead of reshaping data.
