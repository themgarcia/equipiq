import { EquipmentCalculated, FinancingType, AllocationType } from '@/types/equipment';
import { getCategoryDefaults } from '@/data/categoryDefaults';
import { annualRecovery, RecoveryBasis, DEFAULT_RECOVERY_BASIS } from '@/lib/calculations';

// ─── Types ──────────────────────────────────────────────────────

export type LmnRecoveryMethod = 'owned' | 'leased';

export interface RollupLine {
  /** Category name used as grouping key */
  category: string;
  /** Individual equipment names in this line */
  itemNames: string[];
  /** Number of items rolled into this line */
  qty: number;
  /** Average replacement value across items */
  avgReplacementValue: number;
  /** Average useful life across items */
  avgUsefulLife: number;
  /** Average end-of-life value across items */
  avgEndValue: number;
  /** Sum of annual recovery across items */
  totalAnnualRecovery: number;
  /** Sum of COGS allocated cost across items */
  totalCogs: number;
  /** Sum of overhead allocated cost across items */
  totalOverhead: number;
  /** 'owned' | 'financed' | 'leased' — for field equipment grouping */
  financingType: FinancingType;
  /** Unit type from category defaults */
  unit: 'Hours' | 'Days';
  /** Which sub-table this line belongs to */
  lmnRecoveryMethod: LmnRecoveryMethod;
  /** Sum of monthly payments for leased group */
  totalMonthlyPayment: number;
  /** Payments per year — default 12 */
  paymentsPerYear: number;
  /** Months per year used — resolved per unit (unit, category, then 12); same for every unit in the line */
  monthsUsed: number;
  /** True when at least one unit's replacement cost was typed in by hand (may or may not include tax/freight) */
  hasManualReplacement: boolean;
  /** True when at least one unit's replacement cost was inflated from its cost basis (already includes tax/freight) */
  hasInflatedReplacement: boolean;
  /** Count of items where financingType === 'leased' */
  leasedItemCount: number;
  /** Sum of monthly payments only from leased items */
  leasedItemMonthlyPayment: number;
  /** Sum of deposit amounts from leased items only */
  leasedItemDepositTotal: number;
  /** Average term in months across leased items */
  leasedItemAvgTermMonths: number;
}

export interface RollupResult {
  /** Field equipment lines (operational allocation) — all combined */
  fieldLines: RollupLine[];
  /** Overhead equipment lines (overhead_only + owner_perk) — all combined */
  overheadLines: RollupLine[];
  /** Field owned recovery lines */
  fieldOwnedLines: RollupLine[];
  /** Field leased recovery lines */
  fieldLeasedLines: RollupLine[];
  /** Overhead owned recovery lines */
  overheadOwnedLines: RollupLine[];
  /** Overhead leased recovery lines */
  overheadLeasedLines: RollupLine[];
  /** Totals for field section */
  fieldTotals: RollupTotals;
  /** Totals for overhead section */
  overheadTotals: RollupTotals;
  /** Totals for field owned */
  fieldOwnedTotals: RollupTotals;
  /** Totals for field leased */
  fieldLeasedTotals: RollupTotals;
  /** Totals for overhead owned */
  overheadOwnedTotals: RollupTotals;
  /** Totals for overhead leased */
  overheadLeasedTotals: RollupTotals;
}

export interface RollupTotals {
  totalQty: number;
  totalAnnualRecovery: number;
  totalCogs: number;
  totalOverhead: number;
}

// ─── Rollup Engine ──────────────────────────────────────────────

function isFieldEquipment(allocationType: AllocationType): boolean {
  return allocationType === 'operational';
}

function getRecoveryMethod(item: EquipmentCalculated): LmnRecoveryMethod {
  if (item.financingType === 'leased' && (item as any).lmnRecoveryMethod === 'leased') {
    return 'leased';
  }
  return 'owned';
}

// Units with different months per year become separate lines, so the
// months value on each line is true for every unit in it (never averaged).
function getGroupKey(item: EquipmentCalculated, _isField: boolean): string {
  const recoveryMethod = getRecoveryMethod(item);
  return `${item.category}|||${recoveryMethod}|||${item.monthsPerYearUsedResolved ?? 12}`;
}

function buildLine(items: EquipmentCalculated[], recoveryMethod: LmnRecoveryMethod, basis: RecoveryBasis): RollupLine {
  const qty = items.length;
  const categoryDef = getCategoryDefaults(items[0].category);

  const avgReplacementValue = items.reduce((sum, i) => sum + i.replacementCostUsed, 0) / qty;
  const avgUsefulLife = items.reduce((sum, i) => sum + i.usefulLifeUsed, 0) / qty;
  const avgEndValue = items.reduce((sum, i) => sum + i.expectedResaleUsed, 0) / qty;

  const totalAnnualRecovery = items.reduce((sum, i) => sum + annualRecovery(i, basis), 0);

  const totalCogs = items.reduce((sum, i) => sum + i.cogsAllocatedCost, 0);
  const totalOverhead = items.reduce((sum, i) => sum + i.overheadAllocatedCost, 0);
  const totalMonthlyPayment = items.reduce((sum, i) => sum + i.monthlyPayment, 0);
  const leasedItems = items.filter(i => i.financingType === 'leased');
  const leasedItemCount = leasedItems.length;
  const leasedItemMonthlyPayment = leasedItems.reduce((sum, i) => sum + i.monthlyPayment, 0);
  const leasedItemDepositTotal = leasedItems.reduce((sum, i) => sum + i.depositAmount, 0);
  const leasedItemAvgTermMonths = leasedItemCount > 0
    ? leasedItems.reduce((sum, i) => sum + i.termMonths, 0) / leasedItemCount
    : 0;

  // Determine financing type for display
  const financingType: FinancingType = recoveryMethod === 'leased' ? 'leased' : 
    (items.some(i => i.financingType === 'leased') ? 'leased' : 
     items.some(i => i.financingType === 'financed') ? 'financed' : 'owned');

  return {
    category: items[0].category,
    itemNames: items.map(i => i.name),
    qty,
    avgReplacementValue,
    avgUsefulLife,
    avgEndValue,
    totalAnnualRecovery,
    totalCogs,
    totalOverhead,
    financingType,
    unit: categoryDef.unit || 'Hours',
    lmnRecoveryMethod: recoveryMethod,
    totalMonthlyPayment,
    paymentsPerYear: 12,
    monthsUsed: items[0].monthsPerYearUsedResolved ?? 12,
    hasManualReplacement: items.some(i => i.replacementCostSource === 'manual'),
    hasInflatedReplacement: items.some(i => i.replacementCostSource === 'inflationAdjusted'),
    leasedItemCount,
    leasedItemMonthlyPayment,
    leasedItemDepositTotal,
    leasedItemAvgTermMonths,
  };
}

function computeTotals(lines: RollupLine[]): RollupTotals {
  return {
    totalQty: lines.reduce((sum, l) => sum + l.qty, 0),
    totalAnnualRecovery: lines.reduce((sum, l) => sum + l.totalAnnualRecovery, 0),
    totalCogs: lines.reduce((sum, l) => sum + l.totalCogs, 0),
    totalOverhead: lines.reduce((sum, l) => sum + l.totalOverhead, 0),
  };
}

export function rollupEquipment(calculatedEquipment: EquipmentCalculated[], basis: RecoveryBasis = DEFAULT_RECOVERY_BASIS): RollupResult {
  // Only active equipment
  const active = calculatedEquipment.filter(e => e.status === 'Active');

  // Split into field vs overhead
  const fieldItems = active.filter(e => isFieldEquipment(e.allocationType));
  const overheadItems = active.filter(e => !isFieldEquipment(e.allocationType));

  // Group field items by category + recovery method
  const fieldGroups = new Map<string, EquipmentCalculated[]>();
  for (const item of fieldItems) {
    const key = getGroupKey(item, true);
    const group = fieldGroups.get(key) || [];
    group.push(item);
    fieldGroups.set(key, group);
  }

  // Group overhead items by category + recovery method
  const overheadGroups = new Map<string, EquipmentCalculated[]>();
  for (const item of overheadItems) {
    const key = getGroupKey(item, false);
    const group = overheadGroups.get(key) || [];
    group.push(item);
    overheadGroups.set(key, group);
  }

  // Build lines
  const fieldLines: RollupLine[] = [];
  for (const [key, items] of fieldGroups) {
    const recoveryMethod = key.split('|||')[1] as LmnRecoveryMethod;
    fieldLines.push(buildLine(items, recoveryMethod, basis));
  }

  const overheadLines: RollupLine[] = [];
  for (const [key, items] of overheadGroups) {
    const recoveryMethod = key.split('|||')[1] as LmnRecoveryMethod;
    overheadLines.push(buildLine(items, recoveryMethod, basis));
  }

  // Sort alphabetically by category
  const sortFn = (a: RollupLine, b: RollupLine) => 
    a.category.localeCompare(b.category) || a.lmnRecoveryMethod.localeCompare(b.lmnRecoveryMethod) || b.monthsUsed - a.monthsUsed;
  fieldLines.sort(sortFn);
  overheadLines.sort(sortFn);

  // Split into owned/leased sub-arrays
  const fieldOwnedLines = fieldLines.filter(l => l.lmnRecoveryMethod === 'owned');
  const fieldLeasedLines = fieldLines.filter(l => l.lmnRecoveryMethod === 'leased');
  const overheadOwnedLines = overheadLines.filter(l => l.lmnRecoveryMethod === 'owned');
  const overheadLeasedLines = overheadLines.filter(l => l.lmnRecoveryMethod === 'leased');

  return {
    fieldLines,
    overheadLines,
    fieldOwnedLines,
    fieldLeasedLines,
    overheadOwnedLines,
    overheadLeasedLines,
    fieldTotals: computeTotals(fieldLines),
    overheadTotals: computeTotals(overheadLines),
    fieldOwnedTotals: computeTotals(fieldOwnedLines),
    fieldLeasedTotals: computeTotals(fieldLeasedLines),
    overheadOwnedTotals: computeTotals(overheadOwnedLines),
    overheadLeasedTotals: computeTotals(overheadLeasedLines),
  };
}

// ─── CSV Export ──────────────────────────────────────────────────

export function rollupToCSV(result: RollupResult, inflationRatePct: number | null = null): string {
  const rows: string[][] = [];
  if (inflationRatePct != null) {
    rows.push(['Inflation/Interest rate for every row (%)', String(inflationRatePct)]);
    rows.push([]);
  }

  // Field Equipment — Owned Section
  rows.push(['FIELD EQUIPMENT — LMN Equipment Budget — Owned']);
  rows.push(['Category', 'Qty', 'Avg Replacement Value', 'Additional Fees', 'Life (Yrs)', 'Avg Resale Value', 'Months/Yr Used']);

  for (const line of result.fieldOwnedLines) {
    rows.push([
      line.category,
      String(line.qty),
      String(Math.round(line.avgReplacementValue)),
      '',
      String(Math.round(line.avgUsefulLife)),
      String(Math.round(line.avgEndValue)),
      String(line.monthsUsed),
    ]);
  }

  rows.push(['Total', String(result.fieldOwnedTotals.totalQty), '', '', '', '', '']);
  rows.push([]); // blank row

  // Field Equipment — Leased Section (only if items exist)
  if (result.fieldLeasedLines.length > 0) {
    rows.push(['FIELD EQUIPMENT — LMN Equipment Budget — Leased']);
    rows.push(['Category', 'Qty', 'Monthly Payment', 'Payments/Yr', 'Months Used']);

    for (const line of result.fieldLeasedLines) {
      rows.push([
        line.category,
        String(line.qty),
        String(Math.round(line.totalMonthlyPayment / line.qty)),
        String(line.paymentsPerYear),
        String(line.monthsUsed),
      ]);
    }

    rows.push(['Total', String(result.fieldLeasedTotals.totalQty), '', '', '']);
    rows.push([]); // blank row
  }

  // Overhead Equipment — Owned Section
  rows.push(['OVERHEAD EQUIPMENT — LMN Overhead Budget — Owned']);
  rows.push(['Category', 'Qty', 'Avg Replacement Value', 'Additional Fees', 'Life (Yrs)', 'Avg Resale Value', 'Months/Yr Used']);

  for (const line of result.overheadOwnedLines) {
    rows.push([
      line.category,
      String(line.qty),
      String(Math.round(line.avgReplacementValue)),
      '',
      String(Math.round(line.avgUsefulLife)),
      String(Math.round(line.avgEndValue)),
      String(line.monthsUsed),
    ]);
  }

  rows.push(['Total', String(result.overheadOwnedTotals.totalQty), '', '', '', '', '']);
  rows.push([]);
  rows.push(['Additional Fees is left blank on purpose: replacement values already include tax and delivery when EquipIQ worked them out, and hand-entered replacement costs should include them.']);

  // Overhead Equipment — Leased Section (only if items exist)
  if (result.overheadLeasedLines.length > 0) {
    rows.push([]); // blank row
    rows.push(['OVERHEAD EQUIPMENT — LMN Overhead Budget — Leased']);
    rows.push(['Category', 'Qty', 'Monthly Payment', 'Payments/Yr', 'Months Used']);

    for (const line of result.overheadLeasedLines) {
      rows.push([
        line.category,
        String(line.qty),
        String(Math.round(line.totalMonthlyPayment / line.qty)),
        String(line.paymentsPerYear),
        String(line.monthsUsed),
      ]);
    }

    rows.push(['Total', String(result.overheadLeasedTotals.totalQty), '', '', '']);
  }

  // Build CSV string
  const escapeCsvValue = (value: string): string => {
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  return rows.map(row => row.map(escapeCsvValue).join(',')).join('\n');
}
