import { BuyVsRentInput, BuyVsRentResult, BuyVsRentRecommendation, OwnershipBreakdown, YearComparison } from '@/types/equipment';

const BUFFER_PERCENT = 0.15; // 15% buffer for close call determination

export function calculateBuyVsRent(input: BuyVsRentInput): BuyVsRentResult {
  // Calculate ownership breakdown
  const depreciation = (input.purchasePrice - input.resaleValue) / input.usefulLife;
  
  const ownershipBreakdown: OwnershipBreakdown = {
    depreciation,
    maintenance: input.annualMaintenance,
    insurance: input.annualInsurance,
  };

  const annualOwnershipCost = 
    depreciation + 
    input.annualMaintenance + 
    input.annualInsurance;

  // Calculate optimal rental cost (use best rate available)
  const annualRentalCost = calculateOptimalRentalCost(input);

  // Calculate break-even days
  const breakEvenDays = input.rentalRateDaily > 0 
    ? annualOwnershipCost / input.rentalRateDaily 
    : 0;

  // Determine recommendation based on actual cost comparison
  const recommendation = determineRecommendation(annualOwnershipCost, annualRentalCost);

  // Calculate savings
  const annualSavings = Math.abs(annualOwnershipCost - annualRentalCost);
  const totalSavingsOverLife = annualSavings * input.usefulLife;

  // Build year-by-year comparison
  const yearByYearComparison = buildYearByYearComparison(
    input.usefulLife,
    annualOwnershipCost,
    annualRentalCost
  );

  return {
    annualOwnershipCost,
    ownershipBreakdown,
    annualRentalCost,
    breakEvenDays,
    recommendation,
    annualSavings,
    totalSavingsOverLife,
    yearByYearComparison,
  };
}

function calculateOptimalRentalCost(input: BuyVsRentInput): number {
  const daysPerYear = input.usageDaysPerYear;
  
  // Calculate cost using each available rate
  const dailyCost = daysPerYear * input.rentalRateDaily;
  
  // Weekly rate (if provided) - assume 5 working days per week
  let weeklyCost = Infinity;
  if (input.rentalRateWeekly && input.rentalRateWeekly > 0) {
    const weeksNeeded = Math.ceil(daysPerYear / 5);
    weeklyCost = weeksNeeded * input.rentalRateWeekly;
  }
  
  // Monthly rate (if provided) - assume 22 working days per month
  let monthlyCost = Infinity;
  if (input.rentalRateMonthly && input.rentalRateMonthly > 0) {
    const monthsNeeded = Math.ceil(daysPerYear / 22);
    monthlyCost = monthsNeeded * input.rentalRateMonthly;
  }
  
  // Return the cheapest option
  return Math.min(dailyCost, weeklyCost, monthlyCost);
}

function determineRecommendation(
  annualOwnershipCost: number, 
  annualRentalCost: number
): BuyVsRentRecommendation {
  const maxCost = Math.max(annualOwnershipCost, annualRentalCost);
  const percentDifference = maxCost > 0 
    ? Math.abs(annualOwnershipCost - annualRentalCost) / maxCost 
    : 0;
  
  // If the difference is within 15%, it's a close call
  if (percentDifference <= BUFFER_PERCENT) {
    return 'CLOSE_CALL';
  } else if (annualOwnershipCost < annualRentalCost) {
    return 'BUY';  // Owning costs less
  } else {
    return 'RENT'; // Renting costs less
  }
}

function buildYearByYearComparison(
  usefulLife: number,
  annualOwnershipCost: number,
  annualRentalCost: number
): YearComparison[] {
  const comparisons: YearComparison[] = [];
  
  for (let year = 1; year <= usefulLife; year++) {
    const ownCumulative = annualOwnershipCost * year;
    const rentCumulative = annualRentalCost * year;
    const savings = rentCumulative - ownCumulative; // Positive = buying saves money
    
    comparisons.push({
      year,
      ownCumulative,
      rentCumulative,
      savings,
    });
  }
  
  return comparisons;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDays(value: number): string {
  return `${Math.round(value)} days/year`;
}
