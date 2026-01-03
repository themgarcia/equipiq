export type EquipmentStatus = 'Active' | 'Sold' | 'Retired' | 'Lost';

export type FinancingType = 'owned' | 'financed' | 'leased';

export type EquipmentCategory = 
  | 'Compaction (Heavy)'
  | 'Compaction (Light)'
  | 'Excavation'
  | 'Handheld Power Tools'
  | 'Large Demo & Specialty Tools'
  | 'Lawn (Commercial)'
  | 'Lawn (Handheld)'
  | 'Loader (Large / Wheel)'
  | 'Loader (Mid-Size)'
  | 'Loader (Mini-Skid)'
  | 'Loader (Skid / CTL)'
  | 'Shop / Other'
  | 'Snow Equipment'
  | 'Trailer'
  | 'Vehicle (Commercial)'
  | 'Vehicle (Light-Duty)';

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
  
  // Financing (cashflow visibility only - does NOT affect pricing)
  financingType: FinancingType;
  depositAmount: number;
  financedAmount: number;
  monthlyPayment: number;
  termMonths: number;
  buyoutAmount: number;
  financingStartDate?: string;
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

// Cashflow Analysis Types (informational only - does NOT affect pricing)
export interface EquipmentCashflow {
  annualCashOutflow: number;           // monthly payment × 12
  paymentsCompleted: number;           // months since financing start
  totalCashOutlaidToDate: number;      // deposit + payments made
  remainingPayments: number;           // term - completed
  remainingCashObligations: number;    // remaining × monthly + buyout
  annualEconomicRecovery: number;      // replacementCostUsed ÷ usefulLife
  annualSurplusShortfall: number;      // recovery - outflow
  cashflowStatus: 'surplus' | 'neutral' | 'shortfall';
  payoffDate: string | null;           // date when financing ends
}

// Cashflow Projection Types
export interface CashflowProjectionPoint {
  year: number;
  date: string;
  annualRecovery: number;              // constant annual recovery (through job pricing)
  annualPayments: number;              // decreasing annual payments as items pay off
  netAnnualCashflow: number;
  activePayments: number;              // count of items still making payments
  events: string[];                    // e.g., ["Truck paid off", "Mini Skid paid off"]
}

export interface CashflowStabilization {
  stabilizationDate: string | null;
  stabilizedNetCashflow: number;
  yearsUntilStabilization: number;
  itemsWithActivePayments: number;
}

export interface PortfolioCashflow {
  totalAnnualRecovery: number;
  totalAnnualPayments: number;
  netAnnualCashflow: number;
  totalDeposits: number;
  totalRemainingObligations: number;
  overallStatus: 'surplus' | 'neutral' | 'shortfall';
}

export interface PaybackTimelinePoint {
  month: number;
  cumulativeOutlay: number;
  cumulativeRecovery: number;
  netPosition: number;
}
