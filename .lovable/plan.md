

# P0 Step 4: Financing-Aware Split — IMPLEMENTED

All changes from this step have been implemented.

## Completed

1. ✅ Database: `lmn_recovery_method` column added to `equipment` table
2. ✅ Types: `lmnRecoveryMethod` added to `Equipment` interface
3. ✅ Context: DB mapping added for `lmn_recovery_method`
4. ✅ Form: Radio toggle for leased items (Owned Recovery vs Lease Payment Recovery)
5. ✅ Rollup Engine: Split into owned/leased arrays with leased-specific fields
6. ✅ FMS Export: Owned/Leased sub-tables with cost comparison tooltips
7. ✅ CSV Export: Separate sections for Owned and Leased
8. ✅ Mobile Sheet: Shows leased-specific fields when viewing leased recovery line
