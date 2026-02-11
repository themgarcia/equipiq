export type EquipmentStatus = 'Active' | 'Sold' | 'Retired' | 'Lost';

export type FinancingType = 'owned' | 'financed' | 'leased';

export type PurchaseCondition = 'new' | 'used';

export type AllocationType = 'operational' | 'overhead_only' | 'owner_perk';

// v3 taxonomy: 92 categories across 7 divisions — too large for a union type
export type EquipmentCategory = string;

export type EquipmentDivision = 'Construction' | 'Fleet' | 'Irrigation' | 'Lawn' | 'Shop' | 'Snow' | 'Tree';

export type UnitType = 'Hours' | 'Days';

export type DefaultAllocation = 'operational' | 'overhead_only';

export type BenchmarkType = 'hours' | 'miles' | 'calendar';

export interface CategoryDefaults {
  category: EquipmentCategory;
  division: EquipmentDivision;
  defaultUsefulLife: number;
  defaultResalePercent: number;
  unit: UnitType;
  defaultAllocation: DefaultAllocation;
  notes: string;
  maintenancePercent: number;
  insurancePercent: number;
  benchmarkType: BenchmarkType;
  benchmarkRange: string | null;
}

// Entry source for tracking how equipment was added
export type EntrySource = 'manual' | 'ai_document' | 'spreadsheet';

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
  
  // Purchase condition
  purchaseCondition: PurchaseCondition;
  
  // Allocation type (for owner perks, overhead-only items)
  allocationType: AllocationType;

  // Insurance
  isInsured?: boolean;
  insuranceDeclaredValue?: number;
  insuranceNotes?: string;
  insuranceReviewedAt?: string;

  // Entry source tracking
  entrySource?: EntrySource;

  // LMN Recovery Method (only meaningful when financingType === 'leased')
  lmnRecoveryMethod?: 'owned' | 'leased';
}

// Calculated fields (derived from Equipment)
export interface EquipmentCalculated extends Equipment {
  totalCostBasis: number;  // Includes equipment + attachments
  overheadPercent: number;
  cogsAllocatedCost: number;
  overheadAllocatedCost: number;
  usefulLifeUsed: number;
  estimatedEndOfLifeYear: number;
  estimatedYearsLeft: number;
  defaultResalePercent: number;
  expectedResaleDefault: number;
  expectedResaleUsed: number;
  replacementCostUsed: number;  // Includes equipment + attachments
  replacementCostSource: 'manual' | 'inflationAdjusted';
  inflationYears: number;
  roiPercent?: number;
  // Attachment total value (for display purposes)
  attachmentTotalValue?: number;
}

// FMS Export format
export interface FMSExportData {
  equipmentName: string; // Format: "Category - Item Name"
  replacementValue: number;
  usefulLife: number;
  expectedValueAtEndOfLife: number;
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

export interface BreakEvenAnalysis {
  daily: number | null;
  weekly: number | null;
  monthly: number | null;
  primary: number;
  primaryType: 'daily' | 'weekly' | 'monthly';
}

export interface BuyVsRentResult {
  annualOwnershipCost: number;
  ownershipBreakdown: OwnershipBreakdown;
  annualRentalCost: number;
  breakEvenDays: number;
  breakEvenAnalysis: BreakEvenAnalysis;
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
  events: string[];                    // e.g., ["Truck paid off", "Stand-On paid off"]
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

// Equipment Documents
export interface EquipmentDocument {
  id: string;
  equipmentId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  notes?: string;
  uploadedAt: string;
}

// Updatable field for merge functionality
export interface UpdatableField {
  field: keyof Equipment;
  label: string;
  existingValue: any;
  importedValue: any;
  willUpdate: boolean;
}

// Equipment Attachments (accessories, buckets, implements, etc.)
export interface EquipmentAttachment {
  id: string;
  equipmentId: string;
  name: string;
  description?: string;
  value: number;
  serialNumber?: string;
  photoPath?: string;
  createdAt: string;
}

// Document Import Types

// Summary of what was extracted from each document in batch mode
export interface DocumentSummary {
  fileName: string;
  extracted: string[];
  itemsFound: string[];
}

// Conflict detected between documents when extracting data
export interface FieldConflict {
  field: string;
  values: any[];
  sources: string[];
  resolved: any;
}

// Extended extracted equipment with source tracking for batch imports
export interface ExtractedEquipmentBase {
  make: string;
  model: string;
  year: number | null;
  serialVin: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  salesTax: number | null;
  freightSetup: number | null;
  financingType: 'owned' | 'financed' | 'leased' | null;
  depositAmount: number | null;
  financedAmount: number | null;
  monthlyPayment: number | null;
  termMonths: number | null;
  buyoutAmount: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
  suggestedType?: 'equipment' | 'attachment';
  suggestedParentIndex?: number | null;
  purchaseCondition?: 'new' | 'used' | null;
  suggestedCategory?: EquipmentCategory | null;
  sourceDocumentIndices?: number[];
}

// Import mode for batch processing
export type ImportMode = 'single_asset' | 'multi_asset';

// Batch import response from edge function
export interface BatchImportResponse {
  success: boolean;
  equipment: ExtractedEquipmentBase[];
  documentSummaries: DocumentSummary[];
  conflicts: FieldConflict[];
  processingNotes: string;
  mode: ImportMode;
  documentCount: number;
  fileNames: string[];
}
