export type EquipmentStatus = 'Active' | 'Sold' | 'Retired' | 'Lost';

export type EquipmentCategory = 
  | 'Excavation'
  | 'Skid Steer / Loader'
  | 'Truck / Vehicle'
  | 'Heavy Compaction Equipment'
  | 'Light Compaction Equipment'
  | 'Commercial Mowers'
  | 'Handheld Power Tools'
  | 'Large Demo & Specialty Tools'
  | 'Trailer'
  | 'Snow Equipment'
  | 'Shop / Other';

export interface CategoryDefaults {
  category: EquipmentCategory;
  defaultUsefulLife: number;
  defaultResalePercent: number;
  notes: string;
}

export interface Equipment {
  id: string;
  
  // Identification
  name: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  assetId?: string;
  make: string;
  model: string;
  year: number;
  serialVin?: string;
  
  // Cost Basis
  purchaseDate: string;
  purchasePrice: number;
  salesTax: number;
  freightSetup: number;
  otherCapEx: number;
  
  // Allocation
  cogsPercent: number; // 0-100
  
  // Useful Life
  usefulLifeOverride?: number;
  
  // Replacement & Resale
  replacementCostNew: number;
  expectedResaleOverride?: number;
  
  // Disposal
  saleDate?: string;
  salePrice?: number;
}

// Calculated fields (derived from Equipment)
export interface EquipmentCalculated extends Equipment {
  totalCostBasis: number;
  overheadPercent: number;
  cogsAllocatedCost: number;
  overheadAllocatedCost: number;
  usefulLifeUsed: number;
  estimatedEndOfLifeYear: number;
  estimatedYearsLeft: number;
  defaultResalePercent: number;
  expectedResaleDefault: number;
  expectedResaleUsed: number;
  roiPercent?: number;
}

// LMN Export format
export interface LMNExportData {
  itemName: string;
  category: EquipmentCategory;
  status: EquipmentStatus;
  purchasePrice: number;
  additionalPurchaseFees: number;
  replacementValue: number;
  expectedValueAtEndOfLife: number;
  usefulLife: number;
  cogsPercent: number;
  overheadPercent: number;
}
