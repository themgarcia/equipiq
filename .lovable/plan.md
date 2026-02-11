

# Version Bump to v1.3.6 + Full Changelog

Bump `APP_VERSION` to `"1.3.6"` and add a comprehensive changelog entry covering everything since v1.3.5.

---

## Changelog Entry: v1.3.6 (2026-02-11)

### Added (user-facing)
- Usage benchmarks per category on FMS Export and Category Lifespans pages (e.g., "5,000-8,000 hrs at commercial production")
- Benchmark ranges automatically convert miles to kilometers for Canadian users
- Choose how leased equipment is recovered in LMN: "Owned Recovery" (replacement value / useful life) or "Lease Payment Recovery" (monthly payments passed through)
- Side-by-side cost comparison tooltips on FMS Export showing owned vs. lease annual costs, including amortized deposits
- FMS Export now splits Field and Overhead sections into separate Owned and Leased sub-tables
- Canadian users automatically default to kilometers during signup

### Improved (user-facing)
- Lease vs. owned cost comparisons now include deposits for a true apples-to-apples annual cost
- Clearer tooltip language on FMS Export -- comparisons use "more competitive" instead of "saves"
- Equipment taxonomy updated to 93 categories with benchmark data for every category
- "Mini Skid Steer" category renamed to "Stand-On" to match current industry terminology

### Fixed (user-facing)
- Equipment using the old "Mini Skid Steer" category automatically updated to "Stand-On"

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/version.ts` | Bump `APP_VERSION` from `"1.3.5"` to `"1.3.6"` |
| `src/data/changelog.json` | Add new v1.3.6 entry at top of entries array with all items above (both userFacing and technical arrays) |
| `CHANGELOG.md` | Add corresponding v1.3.6 section at top, generated from the JSON data |

No code changes beyond these three files. The Canadian auto-default is already implemented via a database trigger -- it just needs to be documented.

