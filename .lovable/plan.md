

# Version Bump to 1.3.7 + Changelog Update

Bump version from 1.3.6 to 1.3.7 and add a new changelog entry for the Lease Cost Education features and the paid-off lease fix.

---

## Changes

### 1. `src/lib/version.ts`
- Update `APP_VERSION` from `"1.3.6"` to `"1.3.7"`

### 2. `src/data/changelog.json`
Add a new entry at the top of the `entries` array for version 1.3.7 (date: 2026-02-16) with:

**Added**
- User-facing: "Cash Gap Warning on FMS Export highlights when your actual lease payments exceed what you're recovering through LMN rates", "Detailed per-item cost comparison tooltips showing owned recovery vs. actual lease cost including deposit amortization", "Switch an item's recovery method directly from the FMS Export page without going back to the equipment form", "New 'Owned vs. Leased Recovery in LMN' reference section on the Definitions page explaining when to use each method"
- Technical: CashGapSummary component computing from raw calculatedEquipment, restructured CostComparisonTooltip with per-item breakdowns, inline recovery method toggle with AlertDialog for multi-item categories, new Definitions accordion entry with #lease-recovery anchor and auto-open on hash navigation

**Improved**
- User-facing: "Recovery method labels on equipment form now describe what each option does", "Paid-off leases no longer trigger cash gap warnings -- tooltips show 'Payments complete' instead"
- Technical: Updated EquipmentFormContent radio labels with descriptive text and "Which should I choose?" link to /definitions#lease-recovery, isPaymentComplete helper excludes finished leases from CashGapSummary and both tooltip variants

### 3. `CHANGELOG.md`
Run the generator script logic inline -- add the corresponding `## [1.3.7] - 2026-02-16` section at the top using the technical descriptions from the JSON.

