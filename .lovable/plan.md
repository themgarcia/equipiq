

# Remove Total Annual Equipment Recovery Summary Bar

Remove the summary stat bar that shows "Total Annual Equipment Recovery" from the FMS Export page.

## File: `src/pages/FMSExport.tsx`

Delete the entire summary stat bar block (approximately lines 247-253) — the conditional block that renders a `bg-muted/50 border rounded-lg` div containing the Info icon and the total annual recovery amounts.

