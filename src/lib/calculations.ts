import { Equipment, EquipmentCalculated, FMSExportData, CategoryDefaults } from '@/types/equipment';
import { getCategoryDefaults as getStaticCategoryDefaults } from '@/data/categoryDefaults';

const ANNUAL_INFLATION_RATE = 0.03; // 3% annual inflation

function calculateInflationAdjustedCost(
  originalCost: number, 
  fromYear: number, 
  toYear: number
): number {
  const years = Math.max(0, toYear - fromYear);
  return originalCost * Math.pow(1 + ANNUAL_INFLATION_RATE, years);
}

export function calculateEquipment(
  equipment: Equipment, 
  categoryDefaultsOverrides?: CategoryDefaults[]
): EquipmentCalculated {
  // Use overrides if provided, otherwise fall back to static defaults
  const categoryDefaults = categoryDefaultsOverrides 
    ? (categoryDefaultsOverrides.find(c => c.category === equipment.category) || getStaticCategoryDefaults(equipment.category))
    : getStaticCategoryDefaults(equipment.category);
  
  // Total Cost Basis
  const totalCostBasis = 
    equipment.purchasePrice + 
    equipment.salesTax + 
    equipment.freightSetup + 
    equipment.otherCapEx;
  
  // Allocation - owner_perk items are excluded from overhead recovery
  const isOwnerPerk = equipment.allocationType === 'owner_perk';
  const effectiveCogsPercent = isOwnerPerk ? 0 : equipment.cogsPercent;
  const overheadPercent = isOwnerPerk ? 0 : (100 - equipment.cogsPercent);
  const cogsAllocatedCost = (effectiveCogsPercent / 100) * totalCostBasis;
  const overheadAllocatedCost = (overheadPercent / 100) * totalCostBasis;
  
  // Useful Life
  const usefulLifeUsed = equipment.usefulLifeOverride ?? categoryDefaults.defaultUsefulLife;
  const purchaseDate = new Date(equipment.purchaseDate);
  const endOfLifeDate = new Date(purchaseDate);
  endOfLifeDate.setFullYear(endOfLifeDate.getFullYear() + usefulLifeUsed);
  const estimatedEndOfLifeYear = endOfLifeDate.getFullYear();
  
  // Calculate precise years left with decimal precision
  const now = new Date();
  const currentYear = now.getFullYear();
  const purchaseYear = purchaseDate.getFullYear();
  const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
  const yearsLeft = (endOfLifeDate.getTime() - now.getTime()) / msPerYear;
  const estimatedYearsLeft = Math.max(0, Math.round(yearsLeft * 10) / 10);
  
  // Replacement Cost - apply 3% annual inflation
  let replacementCostUsed: number;
  let replacementCostSource: 'manual' | 'inflationAdjusted';
  let inflationYears: number;
  
  if (equipment.replacementCostNew > 0) {
    // Manual entry: inflate from the as-of date (or current year if not set)
    const asOfYear = equipment.replacementCostAsOfDate 
      ? new Date(equipment.replacementCostAsOfDate).getFullYear() 
      : currentYear;
    inflationYears = Math.max(0, currentYear - asOfYear);
    replacementCostUsed = calculateInflationAdjustedCost(equipment.replacementCostNew, asOfYear, currentYear);
    replacementCostSource = 'manual';
  } else {
    // Auto-calculated: inflate from purchase year
    inflationYears = Math.max(0, currentYear - purchaseYear);
    replacementCostUsed = calculateInflationAdjustedCost(totalCostBasis, purchaseYear, currentYear);
    replacementCostSource = 'inflationAdjusted';
  }
  
  // Resale
  const defaultResalePercent = categoryDefaults.defaultResalePercent;
  const expectedResaleDefault = (defaultResalePercent / 100) * replacementCostUsed;
  const expectedResaleUsed = equipment.expectedResaleOverride ?? expectedResaleDefault;
  
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
  };
}

export function toFMSExport(equipment: EquipmentCalculated, attachmentTotal: number = 0): FMSExportData {
  // Owner perks are excluded from FMS export calculations (they don't go to overhead recovery)
  const isOwnerPerk = equipment.allocationType === 'owner_perk';
  
  return {
    equipmentName: `${equipment.category} - ${equipment.name}`,
    replacementValue: equipment.replacementCostUsed + attachmentTotal,
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
