import { Equipment, EquipmentCalculated, LMNExportData, CategoryDefaults } from '@/types/equipment';
import { getCategoryDefaults as getStaticCategoryDefaults } from '@/data/categoryDefaults';

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
  
  // Replacement Cost - use provided value, or fall back to total cost basis
  const replacementCostUsed = equipment.replacementCostNew > 0 
    ? equipment.replacementCostNew 
    : totalCostBasis;
  
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
    roiPercent,
  };
}

export function toLMNExport(equipment: EquipmentCalculated): LMNExportData {
  const additionalFees = equipment.salesTax + equipment.freightSetup + equipment.otherCapEx;
  
  return {
    equipmentName: `${equipment.category} - ${equipment.name}`,
    purchasePrice: equipment.purchasePrice,
    additionalPurchaseFees: additionalFees,
    replacementValue: equipment.replacementCostUsed,
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
