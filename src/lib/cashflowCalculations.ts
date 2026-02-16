/**
 * Cashflow Calculations Library
 * 
 * IMPORTANT: This file calculates financing/cashflow metrics ONLY for visibility.
 * These calculations are completely separate from pricing logic.
 * They do NOT affect equipment pricing, Buy vs Rent, or FMS exports.
 */

import { 
  Equipment, 
  EquipmentCalculated, 
  EquipmentCashflow, 
  PaybackTimelinePoint, 
  PortfolioCashflow,
  CashflowProjectionPoint,
  CashflowStabilization
} from '@/types/equipment';
import { addMonths, format } from 'date-fns';
import { parseLocalDate } from '@/lib/utils';

/**
 * Calculate cashflow metrics for a single equipment item.
 * This is informational only - does NOT affect pricing.
 */
export function calculateEquipmentCashflow(
  equipment: Equipment,
  calculated: EquipmentCalculated
): EquipmentCashflow {
  // For owned equipment, the "deposit" is the total cost basis (cash paid upfront)
  // For financed/leased, use the actual deposit amount
  const effectiveDeposit = equipment.financingType === 'owned'
    ? calculated.totalCostBasis
    : equipment.depositAmount;
  
  // Annual cash outflow = monthly payment × 12
  const annualCashOutflow = equipment.monthlyPayment * 12;
  
  // Payments completed = months since financing start
  let paymentsCompleted = 0;
  if (equipment.financingStartDate && equipment.termMonths > 0) {
    const startDate = parseLocalDate(equipment.financingStartDate);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                       (now.getMonth() - startDate.getMonth());
    paymentsCompleted = Math.min(Math.max(0, monthsDiff), equipment.termMonths);
  }
  
  // Total cash outlaid to date = deposit + (payments completed × monthly payment)
  const totalCashOutlaidToDate = effectiveDeposit + (paymentsCompleted * equipment.monthlyPayment);
  
  // Remaining payments
  const remainingPayments = Math.max(0, equipment.termMonths - paymentsCompleted);
  
  // Remaining cash obligations = remaining payments × monthly + buyout
  const remainingCashObligations = (remainingPayments * equipment.monthlyPayment) + equipment.buyoutAmount;
  
  // Annual economic recovery = replacement value ÷ useful life
  // This represents how much value is "recovered" through job pricing annually
  const annualEconomicRecovery = calculated.usefulLifeUsed > 0 
    ? calculated.replacementCostUsed / calculated.usefulLifeUsed 
    : 0;
  
  // Annual surplus/shortfall = recovery - outflow
  const annualSurplusShortfall = annualEconomicRecovery - annualCashOutflow;
  
  // Determine cashflow status with 10% buffer zone
  let cashflowStatus: 'surplus' | 'neutral' | 'shortfall';
  if (annualEconomicRecovery === 0 && annualCashOutflow === 0) {
    cashflowStatus = 'neutral';
  } else {
    const ratio = annualEconomicRecovery > 0 ? annualCashOutflow / annualEconomicRecovery : Infinity;
    if (ratio < 0.9) {
      cashflowStatus = 'surplus'; // Cash outflow is more than 10% below recovery
    } else if (ratio > 1.1) {
      cashflowStatus = 'shortfall'; // Cash outflow is more than 10% above recovery
    } else {
      cashflowStatus = 'neutral'; // Within 10% either way
    }
  }
  
  // Calculate payoff date
  let payoffDate: string | null = null;
  if (equipment.financingType === 'owned') {
    payoffDate = null; // Already paid in full
  } else if (equipment.financingStartDate && equipment.termMonths > 0) {
    const startDate = parseLocalDate(equipment.financingStartDate);
    const endDate = addMonths(startDate, equipment.termMonths);
    payoffDate = format(endDate, 'yyyy-MM-dd');
  }
  
  return {
    annualCashOutflow,
    paymentsCompleted,
    totalCashOutlaidToDate,
    remainingPayments,
    remainingCashObligations,
    annualEconomicRecovery,
    annualSurplusShortfall,
    cashflowStatus,
    payoffDate,
  };
}

/**
 * Calculate portfolio-level cashflow summary for all active equipment.
 * This is informational only - does NOT affect pricing.
 */
export function calculatePortfolioCashflow(
  items: Array<{ equipment: Equipment; calculated: EquipmentCalculated; cashflow: EquipmentCashflow }>
): PortfolioCashflow {
  // Filter to active equipment only
  const activeItems = items.filter(item => item.equipment.status === 'Active');
  
  const totalAnnualRecovery = activeItems.reduce(
    (sum, item) => sum + item.cashflow.annualEconomicRecovery, 
    0
  );
  
  // Prorate current-year payments: mirror logic from calculateCashflowProjection()
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd = new Date(now.getFullYear(), 11, 31);
  
  let totalAnnualPayments = 0;
  for (const item of activeItems) {
    if (item.equipment.financingType === 'owned') continue;
    if (!item.cashflow.payoffDate) {
      // No payoff date but has payments (e.g. open-ended lease)
      totalAnnualPayments += item.cashflow.annualCashOutflow;
      continue;
    }
    const payoffDate = new Date(item.cashflow.payoffDate);
    if (payoffDate <= yearStart) {
      // Already paid off before this year
      continue;
    } else if (payoffDate >= yearEnd) {
      // Full year of payments
      totalAnnualPayments += item.cashflow.annualCashOutflow;
    } else {
      // Partial year — prorate
      const monthsInYear = payoffDate.getMonth() + 1;
      totalAnnualPayments += item.equipment.monthlyPayment * monthsInYear;
    }
  }
  
  const netAnnualCashflow = totalAnnualRecovery - totalAnnualPayments;
  
  // For owned equipment, use total cost basis; for financed/leased, use deposit
  const totalDeposits = activeItems.reduce(
    (sum, item) => {
      const effectiveDeposit = item.equipment.financingType === 'owned'
        ? item.calculated.totalCostBasis
        : item.equipment.depositAmount;
      return sum + effectiveDeposit;
    }, 
    0
  );
  
  const totalRemainingObligations = activeItems.reduce(
    (sum, item) => sum + item.cashflow.remainingCashObligations, 
    0
  );
  
  // Determine overall status
  let overallStatus: 'surplus' | 'neutral' | 'shortfall';
  if (totalAnnualRecovery === 0 && totalAnnualPayments === 0) {
    overallStatus = 'neutral';
  } else {
    const ratio = totalAnnualRecovery > 0 ? totalAnnualPayments / totalAnnualRecovery : Infinity;
    if (ratio < 0.9) {
      overallStatus = 'surplus';
    } else if (ratio > 1.1) {
      overallStatus = 'shortfall';
    } else {
      overallStatus = 'neutral';
    }
  }
  
  return {
    totalAnnualRecovery,
    totalAnnualPayments,
    netAnnualCashflow,
    totalDeposits,
    totalRemainingObligations,
    overallStatus,
  };
}

/**
 * Calculate payback timeline for visualization.
 * Shows cumulative cash outlay vs cumulative pricing recovery over time.
 * This is informational only - does NOT recommend buying/selling/refinancing.
 */
export function calculatePaybackTimeline(
  equipment: Equipment,
  calculated: EquipmentCalculated
): { timeline: PaybackTimelinePoint[]; paybackMonth: number | null } {
  const timeline: PaybackTimelinePoint[] = [];
  
  // For owned equipment, the "deposit" is the total cost basis (cash paid upfront)
  const effectiveDeposit = equipment.financingType === 'owned'
    ? calculated.totalCostBasis
    : equipment.depositAmount;
  
  // Monthly recovery = annual recovery ÷ 12
  const monthlyRecovery = calculated.usefulLifeUsed > 0 
    ? calculated.replacementCostUsed / calculated.usefulLifeUsed / 12 
    : 0;
  
  // Determine timeline length: max of term or useful life in months
  const usefulLifeMonths = calculated.usefulLifeUsed * 12;
  const maxMonths = Math.max(equipment.termMonths, usefulLifeMonths, 60); // At least 5 years
  
  let paybackMonth: number | null = null;
  
  for (let month = 0; month <= maxMonths; month++) {
    // Cumulative cash outlay: deposit + payments made up to this month
    const paymentsThisMonth = Math.min(month, equipment.termMonths);
    const cumulativeOutlay = effectiveDeposit + (paymentsThisMonth * equipment.monthlyPayment);
    
    // Cumulative recovery
    const cumulativeRecovery = month * monthlyRecovery;
    
    // Net position
    const netPosition = cumulativeRecovery - cumulativeOutlay;
    
    timeline.push({
      month,
      cumulativeOutlay,
      cumulativeRecovery,
      netPosition,
    });
    
    // Track payback month (first time recovery >= outlay, after month 0)
    if (paybackMonth === null && month > 0 && cumulativeRecovery >= cumulativeOutlay && cumulativeOutlay > 0) {
      paybackMonth = month;
    }
  }
  
  return { timeline, paybackMonth };
}

/**
 * Calculate cashflow projection over time showing when payments end.
 * Returns yearly projections and stabilization info.
 */
export function calculateCashflowProjection(
  items: Array<{ equipment: Equipment; calculated: EquipmentCalculated; cashflow: EquipmentCashflow }>
): { projection: CashflowProjectionPoint[]; stabilization: CashflowStabilization } {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Filter to active items with financing (non-owned)
  const activeItems = items.filter(item => item.equipment.status === 'Active');
  const financedItems = activeItems.filter(item => 
    item.equipment.financingType !== 'owned' && 
    item.cashflow.payoffDate !== null
  );
  
  // Total annual recovery stays constant (economic recovery through pricing)
  const totalAnnualRecovery = activeItems.reduce(
    (sum, item) => sum + item.cashflow.annualEconomicRecovery, 
    0
  );
  
  // First pass: find the latest payoff date among all financed items
  let maxPayoffYear = currentYear;
  for (const item of financedItems) {
    if (item.cashflow.payoffDate) {
      const payoffYear = new Date(item.cashflow.payoffDate).getFullYear();
      if (payoffYear > maxPayoffYear) {
        maxPayoffYear = payoffYear;
      }
    }
  }
  
  // Project to 2 years after the last payoff, minimum of 3 years total
  const projectionEndYear = Math.max(maxPayoffYear + 2, currentYear + 3);
  const yearsToProject = projectionEndYear - currentYear;
  
  // Build projection for calculated range
  const projection: CashflowProjectionPoint[] = [];
  let lastPayoffYear = currentYear;
  
  for (let yearOffset = 0; yearOffset <= yearsToProject; yearOffset++) {
    const year = currentYear + yearOffset;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);
    
    // Find items that are still making payments in this year
    const itemsWithPayments = financedItems.filter(item => {
      if (!item.cashflow.payoffDate) return false;
      const payoffDate = new Date(item.cashflow.payoffDate);
      return payoffDate > yearStart;
    });
    
    // Find items that pay off during this year
    const itemsPayingOff = financedItems.filter(item => {
      if (!item.cashflow.payoffDate) return false;
      const payoffDate = new Date(item.cashflow.payoffDate);
      return payoffDate >= yearStart && payoffDate <= yearEnd;
    });
    
    // Calculate annual payments for this year (prorated for items paying off mid-year)
    let annualPayments = 0;
    for (const item of activeItems) {
      if (item.equipment.financingType === 'owned') continue;
      if (!item.cashflow.payoffDate) {
        annualPayments += item.cashflow.annualCashOutflow;
        continue;
      }
      
      const payoffDate = new Date(item.cashflow.payoffDate);
      if (payoffDate <= yearStart) {
        // Already paid off before this year
        continue;
      } else if (payoffDate >= yearEnd) {
        // Full year of payments
        annualPayments += item.cashflow.annualCashOutflow;
      } else {
        // Partial year - prorate
        const monthsInYear = payoffDate.getMonth() + 1;
        annualPayments += (item.equipment.monthlyPayment * monthsInYear);
      }
    }
    
    // Track when last item pays off
    if (itemsWithPayments.length > 0) {
      lastPayoffYear = year;
    }
    
    const events = itemsPayingOff.map(item => `${item.equipment.name} paid off`);
    
    projection.push({
      year,
      date: format(new Date(year, 0, 1), 'yyyy-MM-dd'),
      annualRecovery: totalAnnualRecovery,
      annualPayments,
      netAnnualCashflow: totalAnnualRecovery - annualPayments,
      activePayments: itemsWithPayments.length,
      events,
    });
  }
  
  // Find the actual latest payoff date among all financed items with future payoffs
  let latestPayoffDate: string | null = null;
  for (const item of financedItems) {
    if (item.cashflow.payoffDate) {
      const payoffDate = new Date(item.cashflow.payoffDate);
      if (payoffDate > now) {
        if (!latestPayoffDate || payoffDate > new Date(latestPayoffDate)) {
          latestPayoffDate = item.cashflow.payoffDate;
        }
      }
    }
  }
  
  const itemsCurrentlyMakingPayments = financedItems.filter(item => {
    if (!item.cashflow.payoffDate) return false;
    return new Date(item.cashflow.payoffDate) > now;
  });
  
  const stabilization: CashflowStabilization = {
    stabilizationDate: latestPayoffDate,
    stabilizedNetCashflow: totalAnnualRecovery,
    yearsUntilStabilization: latestPayoffDate 
      ? new Date(latestPayoffDate).getFullYear() - currentYear 
      : 0,
    itemsWithActivePayments: itemsCurrentlyMakingPayments.length,
  };
  
  return { projection, stabilization };
}
