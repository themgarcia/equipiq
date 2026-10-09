# AGENTS.md

- Category defaults live in the `category_defaults` table (with `category_consumables` as its child); the client array in `src/data/categoryDefaults.ts` stays as the reference for calculations until full cutover — why: the table is extensible and overridable, and the parity test (`scripts/seed/categoryDefaults.parity.test.ts`) must pass before anything else reads from it.
- Seed data for category tables is generated from the client array by `scripts/seed/generateCategorySeed.ts`, never hand-typed — why: values must match exactly.
