import { Equipment, EquipmentCalculated, LMNExportData } from '@/types/equipment';
import { getCategoryDefaults } from '@/data/categoryDefaults';

export function calculateEquipment(equipment: Equipment): EquipmentCalculated {
  const categoryDefaults = getCategoryDefaults(equipment.category);
  
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
  
  // Resale
  const defaultResalePercent = categoryDefaults.defaultResalePercent;
  const expectedResaleDefault = (defaultResalePercent / 100) * equipment.replacementCostNew;
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
    roiPercent,
  };
}

export function toLMNExport(equipment: EquipmentCalculated): LMNExportData {
  const additionalFees = equipment.salesTax + equipment.freightSetup + equipment.otherCapEx;
  
  return {
    equipmentName: `${equipment.category} - ${equipment.name}`,
    purchasePrice: equipment.purchasePrice,
    additionalPurchaseFees: additionalFees,
    replacementValue: equipment.replacementCostNew,
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
