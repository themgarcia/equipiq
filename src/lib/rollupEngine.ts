import { EquipmentCalculated, FinancingType, AllocationType } from '@/types/equipment';
import { getCategoryDefaults } from '@/data/categoryDefaults';

// ─── Types ──────────────────────────────────────────────────────

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
}

export interface RollupResult {
  /** Field equipment lines (operational allocation) */
  fieldLines: RollupLine[];
  /** Overhead equipment lines (overhead_only + owner_perk) */
  overheadLines: RollupLine[];
  /** Totals for field section */
  fieldTotals: RollupTotals;
  /** Totals for overhead section */
  overheadTotals: RollupTotals;
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

function getGroupKey(item: EquipmentCalculated, isField: boolean): string {
  if (isField) {
    // Field equipment: group by category + financing type
    const finType = item.financingType === 'leased' ? 'leased' : 'owned';
    return `${item.category}|||${finType}`;
  }
  // Overhead equipment: group by category only (no financing split)
  return `${item.category}|||overhead`;
}

function buildLine(items: EquipmentCalculated[], financingType: FinancingType): RollupLine {
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

  // Group field items
  const fieldGroups = new Map<string, EquipmentCalculated[]>();
  for (const item of fieldItems) {
    const key = getGroupKey(item, true);
    const group = fieldGroups.get(key) || [];
    group.push(item);
    fieldGroups.set(key, group);
  }

  // Group overhead items
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
    const finType = key.split('|||')[1] as FinancingType;
    fieldLines.push(buildLine(items, finType === 'leased' ? 'leased' : 'owned'));
  }

  const overheadLines: RollupLine[] = [];
  for (const [, items] of overheadGroups) {
    overheadLines.push(buildLine(items, 'owned'));
  }

  // Sort alphabetically by category
  fieldLines.sort((a, b) => a.category.localeCompare(b.category) || a.financingType.localeCompare(b.financingType));
  overheadLines.sort((a, b) => a.category.localeCompare(b.category));

  return {
    fieldLines,
    overheadLines,
    fieldTotals: computeTotals(fieldLines),
    overheadTotals: computeTotals(overheadLines),
  };
}

// ─── CSV Export ──────────────────────────────────────────────────

export function rollupToCSV(result: RollupResult): string {
  const rows: string[][] = [];

  // Field Equipment Section
  rows.push(['FIELD EQUIPMENT — LMN Equipment Budget']);
  rows.push(['Category', 'Qty', 'Avg Replacement Value', 'Life (Yrs)', 'Avg End Value', 'Type']);

  for (const line of result.fieldLines) {
    rows.push([
      line.category,
      String(line.qty),
      String(Math.round(line.avgReplacementValue)),
      String(Math.round(line.avgUsefulLife)),
      String(Math.round(line.avgEndValue)),
      line.financingType === 'leased' ? 'Leased' : 'Owned',
    ]);
  }

  rows.push(['Total', String(result.fieldTotals.totalQty), '', '', '', '']);
  rows.push([]); // blank row

  // Overhead Equipment Section
  rows.push(['OVERHEAD EQUIPMENT — LMN Overhead Budget']);
  rows.push(['Category', 'Qty', 'Avg Replacement Value', 'Life (Yrs)', 'Avg End Value']);

  for (const line of result.overheadLines) {
    rows.push([
      line.category,
      String(line.qty),
      String(Math.round(line.avgReplacementValue)),
      String(Math.round(line.avgUsefulLife)),
      String(Math.round(line.avgEndValue)),
    ]);
  }

  rows.push(['Total', String(result.overheadTotals.totalQty), '', '', '']);

  // Build CSV string
  const escapeCsvValue = (value: string): string => {
    if (value.includes('"') || value.includes(',') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  return rows.map(row => row.map(escapeCsvValue).join(',')).join('\n');
}
