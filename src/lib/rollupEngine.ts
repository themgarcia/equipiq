import { EquipmentCalculated, FinancingType, AllocationType } from '@/types/equipment';
import { getCategoryDefaults } from '@/data/categoryDefaults';

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
  /** Months used per year — default 12 */
  monthsUsed: number;
  /** Count of items where financingType === 'leased' */
  leasedItemCount: number;
  /** Sum of monthly payments only from leased items */
  leasedItemMonthlyPayment: number;
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

function getGroupKey(item: EquipmentCalculated, isField: boolean): string {
  const recoveryMethod = getRecoveryMethod(item);
  if (isField) {
    return `${item.category}|||${recoveryMethod}`;
  }
  return `${item.category}|||${recoveryMethod}`;
}

function buildLine(items: EquipmentCalculated[], recoveryMethod: LmnRecoveryMethod): RollupLine {
  const qty = items.length;
  const categoryDef = getCategoryDefaults(items[0].category);

  const avgReplacementValue = items.reduce((sum, i) => sum + i.replacementCostUsed, 0) / qty;
  const avgUsefulLife = items.reduce((sum, i) => sum + i.usefulLifeUsed, 0) / qty;
  const avgEndValue = items.reduce((sum, i) => sum + i.expectedResaleUsed, 0) / qty;

  const totalAnnualRecovery = items.reduce((sum, i) => {
    const life = i.usefulLifeUsed || 1;
    return sum + (i.replacementCostUsed - i.expectedResaleUsed) / life;
  }, 0);

  const totalCogs = items.reduce((sum, i) => sum + i.cogsAllocatedCost, 0);
  const totalOverhead = items.reduce((sum, i) => sum + i.overheadAllocatedCost, 0);
  const totalMonthlyPayment = items.reduce((sum, i) => sum + i.monthlyPayment, 0);
  const leasedItems = items.filter(i => i.financingType === 'leased');
  const leasedItemCount = leasedItems.length;
  const leasedItemMonthlyPayment = leasedItems.reduce((sum, i) => sum + i.monthlyPayment, 0);

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
    monthsUsed: 12,
    leasedItemCount,
    leasedItemMonthlyPayment,
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

export function rollupEquipment(calculatedEquipment: EquipmentCalculated[]): RollupResult {
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
    fieldLines.push(buildLine(items, recoveryMethod));
  }

  const overheadLines: RollupLine[] = [];
  for (const [key, items] of overheadGroups) {
    const recoveryMethod = key.split('|||')[1] as LmnRecoveryMethod;
    overheadLines.push(buildLine(items, recoveryMethod));
  }

  // Sort alphabetically by category
  const sortFn = (a: RollupLine, b: RollupLine) => 
    a.category.localeCompare(b.category) || a.lmnRecoveryMethod.localeCompare(b.lmnRecoveryMethod);
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

export function rollupToCSV(result: RollupResult): string {
  const rows: string[][] = [];

  // Field Equipment — Owned Section
  rows.push(['FIELD EQUIPMENT — LMN Equipment Budget — Owned']);
  rows.push(['Category', 'Qty', 'Avg Replacement Value', 'Life (Yrs)', 'Avg End Value', 'Type']);

  for (const line of result.fieldOwnedLines) {
    rows.push([
      line.category,
      String(line.qty),
      String(Math.round(line.avgReplacementValue)),
      String(Math.round(line.avgUsefulLife)),
      String(Math.round(line.avgEndValue)),
      line.financingType === 'leased' ? 'Leased' : 'Owned',
    ]);
  }

  rows.push(['Total', String(result.fieldOwnedTotals.totalQty), '', '', '', '']);
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
  rows.push(['Category', 'Qty', 'Avg Replacement Value', 'Life (Yrs)', 'Avg End Value']);

  for (const line of result.overheadOwnedLines) {
    rows.push([
      line.category,
      String(line.qty),
      String(Math.round(line.avgReplacementValue)),
      String(Math.round(line.avgUsefulLife)),
      String(Math.round(line.avgEndValue)),
    ]);
  }

  rows.push(['Total', String(result.overheadOwnedTotals.totalQty), '', '', '']);

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
