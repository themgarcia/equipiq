export type EquipmentStatus = 'Active' | 'Sold' | 'Retired' | 'Lost';

export type EquipmentCategory = 
  | 'Excavation'
  | 'Mini Skid / Compact Power Carrier'
  | 'Skid Steer (Standard)'
  | 'Compact Track Loader'
  | 'Large Loader'
  | 'Truck / Vehicle'
  | 'Heavy Compaction Equipment'
  | 'Light Compaction Equipment'
  | 'Commercial Mowers'
  | 'Handheld Lawn Equipment'
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
  replacementCostAsOfDate?: string;
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
  replacementCostUsed: number;
  replacementCostSource: 'manual' | 'inflationAdjusted';
  inflationYears: number;
  roiPercent?: number;
}

// LMN Export format
export interface LMNExportData {
  equipmentName: string; // Format: "Category - Item Name"
  purchasePrice: number;
  additionalPurchaseFees: number;
  replacementValue: number;
  expectedValueAtEndOfLife: number;
  usefulLife: number;
  cogsPercent: number;
  overheadPercent: number;
  cogsAllocatedCost: number;
  overheadAllocatedCost: number;
}

// Buy vs. Rent Analysis
export interface BuyVsRentInput {
  category: EquipmentCategory;
  description: string;
  purchasePrice: number;
  usefulLife: number;
  resaleValue: number;
  rentalRateDaily: number;
  rentalRateWeekly?: number;
  rentalRateMonthly?: number;
  usageDaysPerYear: number;
  annualMaintenance: number;
  annualInsurance: number;
}

export interface OwnershipBreakdown {
  depreciation: number;
  maintenance: number;
  insurance: number;
}

export interface YearComparison {
  year: number;
  ownCumulative: number;
  rentCumulative: number;
  savings: number;
}

export type BuyVsRentRecommendation = 'BUY' | 'RENT' | 'CLOSE_CALL';

export interface BuyVsRentResult {
  annualOwnershipCost: number;
  ownershipBreakdown: OwnershipBreakdown;
  annualRentalCost: number;
  breakEvenDays: number;
  recommendation: BuyVsRentRecommendation;
  annualSavings: number;
  totalSavingsOverLife: number;
  yearByYearComparison: YearComparison[];
}
