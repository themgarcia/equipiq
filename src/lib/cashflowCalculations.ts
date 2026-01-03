/**
 * Cashflow Calculations Library
 * 
 * IMPORTANT: This file calculates financing/cashflow metrics ONLY for visibility.
 * These calculations are completely separate from pricing logic.
 * They do NOT affect equipment pricing, Buy vs Rent, or LMN exports.
 */

import { Equipment, EquipmentCalculated, EquipmentCashflow, PaybackTimelinePoint, PortfolioCashflow } from '@/types/equipment';

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
    const startDate = new Date(equipment.financingStartDate);
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
  
  return {
    annualCashOutflow,
    paymentsCompleted,
    totalCashOutlaidToDate,
    remainingPayments,
    remainingCashObligations,
    annualEconomicRecovery,
    annualSurplusShortfall,
    cashflowStatus,
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
  
  const totalAnnualPayments = activeItems.reduce(
    (sum, item) => sum + item.cashflow.annualCashOutflow, 
    0
  );
  
  const netAnnualCashflow = totalAnnualRecovery - totalAnnualPayments;
  
  const totalDeposits = activeItems.reduce(
    (sum, item) => sum + item.equipment.depositAmount, 
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
