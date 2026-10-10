import { Equipment, EquipmentCalculated, FMSExportData, CategoryDefaults } from '@/types/equipment';
import { getCategoryDefaults as getStaticCategoryDefaults } from '@/data/categoryDefaults';
import { parseLocalDate } from '@/lib/utils';

/** Fallback only when no company_settings row exists. The live value is company_settings.inflation_rate_pct. */
export const DEFAULT_INFLATION_RATE_PCT = 3;

export function calculateInflationAdjustedCost(
  originalCost: number, 
  fromYear: number, 
  toYear: number,
  inflationPct: number = DEFAULT_INFLATION_RATE_PCT
): number {
  const years = Math.max(0, toYear - fromYear);
  return originalCost * Math.pow(1 + inflationPct / 100, years);
}

/** Months per year used: unit value, then the user's category value, then 12. */
export function resolveMonthsPerYear(
  unit: number | null | undefined,
  category: number | null | undefined
): { months: number; source: 'unit' | 'category' | 'default' } {
  if (unit != null && unit > 0) return { months: unit, source: 'unit' };
  if (category != null && category > 0) return { months: category, source: 'category' };
  return { months: 12, source: 'default' };
}

export function calculateEquipment(
  equipment: Equipment, 
  categoryDefaultsOverrides?: CategoryDefaults[],
  attachmentTotal: number = 0
): EquipmentCalculated {
  // Use overrides if provided, otherwise fall back to static defaults
  const categoryDefaults = categoryDefaultsOverrides 
    ? (categoryDefaultsOverrides.find(c => c.category === equipment.category) || getStaticCategoryDefaults(equipment.category))
    : getStaticCategoryDefaults(equipment.category);
  
  // Equipment cost basis (before attachments)
  const equipmentCostBasis = 
    equipment.purchasePrice + 
    equipment.salesTax + 
    equipment.freightSetup + 
    equipment.otherCapEx;
  
  // Total Cost Basis - NOW INCLUDES ATTACHMENTS
  const totalCostBasis = equipmentCostBasis + attachmentTotal;
  
  // Allocation - owner_perk items are excluded from overhead recovery
  const isOwnerPerk = equipment.allocationType === 'owner_perk';
  const effectiveCogsPercent = isOwnerPerk ? 0 : equipment.cogsPercent;
  const overheadPercent = isOwnerPerk ? 0 : (100 - equipment.cogsPercent);
  const cogsAllocatedCost = (effectiveCogsPercent / 100) * totalCostBasis;
  const overheadAllocatedCost = (overheadPercent / 100) * totalCostBasis;
  
  // Useful Life - use model year (not purchase date) to correctly handle used equipment
  // A 2016 vehicle with 8-year useful life should end in 2024, regardless of when purchased
  const usefulLifeUsed = equipment.usefulLifeOverride ?? categoryDefaults.defaultUsefulLife;
  const modelYear = equipment.year;
  const estimatedEndOfLifeYear = modelYear + usefulLifeUsed;
  
  // Calculate years left based on model year
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearsLeft = estimatedEndOfLifeYear - currentYear;
  const estimatedYearsLeft = Math.max(0, Math.round(yearsLeft * 10) / 10);
  
  // Keep purchase date/year for replacement cost calculations
  const purchaseDate = parseLocalDate(equipment.purchaseDate);
  const purchaseYear = purchaseDate.getFullYear();
  
  // Replacement Cost - apply 3% annual inflation
  let replacementCostUsed: number;
  let replacementCostSource: 'manual' | 'inflationAdjusted';
  let inflationYears: number;
  
  if (equipment.replacementCostNew > 0) {
    // Manual entry: inflate from the as-of date (or current year if not set)
    // Manual replacement cost is for equipment only - add attachments separately
    const asOfYear = equipment.replacementCostAsOfDate 
      ? parseLocalDate(equipment.replacementCostAsOfDate).getFullYear() 
      : currentYear;
    inflationYears = Math.max(0, currentYear - asOfYear);
    const inflatedEquipmentCost = calculateInflationAdjustedCost(equipment.replacementCostNew, asOfYear, currentYear);
    // Add attachments at current value (no inflation needed as they're stored at current value)
    replacementCostUsed = inflatedEquipmentCost + attachmentTotal;
    replacementCostSource = 'manual';
  } else {
    // Auto-calculated: inflate full cost basis (equipment + attachments)
    // For used equipment, inflate from model year to better approximate new-replacement cost
    // For new equipment, inflate from purchase year
    const inflationBaseYear = equipment.purchaseCondition === 'used' ? modelYear : purchaseYear;
    inflationYears = Math.max(0, currentYear - inflationBaseYear);
    replacementCostUsed = calculateInflationAdjustedCost(totalCostBasis, inflationBaseYear, currentYear);
    replacementCostSource = 'inflationAdjusted';
  }
  
  // Resale
  const defaultResalePercent = categoryDefaults.defaultResalePercent;
  const expectedResaleDefault = (defaultResalePercent / 100) * replacementCostUsed;
  const expectedResaleUsed = equipment.expectedResaleOverride ?? expectedResaleDefault;
  
  const months = resolveMonthsPerYear(equipment.monthsPerYearUsed, categoryDefaults.monthsPerYearUsed);

  // ROI (if sold)
  let roiPercent: number | undefined;
  if (equipment.status === 'Sold' && equipment.salePrice !== undefined) {
    roiPercent = ((equipment.salePrice - totalCostBasis) / totalCostBasis) * 100;
  }
  
  return {
    ...equipment,
    totalCostBasis,
    overheadPercent,
    cogsAllocatedCost,
    overheadAllocatedCost,
    usefulLifeUsed,
    estimatedEndOfLifeYear,
    estimatedYearsLeft,
    defaultResalePercent,
    expectedResaleDefault,
    expectedResaleUsed,
    replacementCostUsed,
    replacementCostSource,
    inflationYears,
    roiPercent,
    attachmentTotalValue: attachmentTotal,
    monthsPerYearUsedResolved: months.months,
    monthsPerYearSource: months.source,
  };
}

export function toFMSExport(equipment: EquipmentCalculated): FMSExportData {
  // Owner perks are excluded from FMS export calculations (they don't go to overhead recovery)
  const isOwnerPerk = equipment.allocationType === 'owner_perk';
  
  return {
    equipmentName: `${equipment.category} - ${equipment.name}`,
    replacementValue: equipment.replacementCostUsed, // Already includes attachments
    usefulLife: equipment.usefulLifeUsed,
    expectedValueAtEndOfLife: equipment.expectedResaleUsed,
    cogsAllocatedCost: isOwnerPerk ? 0 : equipment.cogsAllocatedCost,
    overheadAllocatedCost: isOwnerPerk ? 0 : equipment.overheadAllocatedCost,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

export type RecoveryBasis = 'net_of_resale' | 'gross';
export const DEFAULT_RECOVERY_BASIS: RecoveryBasis = 'net_of_resale';

/**
 * Single source of truth for annual recovery. Every screen that shows
 * "Annual Recovery" must call this so the figures can never diverge.
 * - net_of_resale: (replacement − expected resale) ÷ useful life
 * - gross: replacement ÷ useful life
 */
export function annualRecovery(
  item: Pick<EquipmentCalculated, 'replacementCostUsed' | 'expectedResaleUsed' | 'usefulLifeUsed'>,
  basis: RecoveryBasis = DEFAULT_RECOVERY_BASIS
): number {
  if (!item.usefulLifeUsed || item.usefulLifeUsed <= 0) return 0;
  const recoverable = basis === 'gross'
    ? item.replacementCostUsed
    : item.replacementCostUsed - item.expectedResaleUsed;
  return recoverable / item.usefulLifeUsed;
}
