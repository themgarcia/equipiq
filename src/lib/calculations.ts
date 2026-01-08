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
  
  // Allocation
  const overheadPercent = 100 - equipment.cogsPercent;
  const cogsAllocatedCost = (equipment.cogsPercent / 100) * totalCostBasis;
  const overheadAllocatedCost = (overheadPercent / 100) * totalCostBasis;
  
  // Useful Life
  const usefulLifeUsed = equipment.usefulLifeOverride ?? categoryDefaults.defaultUsefulLife;
  const purchaseYear = new Date(equipment.purchaseDate).getFullYear();
  const estimatedEndOfLifeYear = purchaseYear + usefulLifeUsed;
  const currentYear = new Date().getFullYear();
  const estimatedYearsLeft = Math.max(0, estimatedEndOfLifeYear - currentYear);
  
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
  const additionalFees = equipment.salesTax + equipment.freightSetup + equipment.otherCapEx;
  
  return {
    equipmentName: `${equipment.category} - ${equipment.name}`,
    purchasePrice: equipment.purchasePrice,
    additionalPurchaseFees: additionalFees,
    attachmentValue: attachmentTotal,
    replacementValue: equipment.replacementCostUsed + attachmentTotal,
    expectedValueAtEndOfLife: equipment.expectedResaleUsed,
    usefulLife: equipment.usefulLifeUsed,
    cogsPercent: equipment.cogsPercent,
    overheadPercent: equipment.overheadPercent,
    cogsAllocatedCost: equipment.cogsAllocatedCost,
    overheadAllocatedCost: equipment.overheadAllocatedCost,
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
