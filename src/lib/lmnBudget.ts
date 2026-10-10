/**
 * LMN's budget-side Owned Equipment Calculator, reproduced so the FMS Export
 * can preview what LMN will show. BUDGET EXPORT ONLY — this does not match the
 * LMN Equipment Catalog's Acquisition Value and must not be reused there.
 *
 * Confirmed to the cent against two live LMN rows (same 2% rate, 7-yr life,
 * 10% end ratio). Not yet checked against a different rate and life.
 *
 * - Interest/inflation value = replacement × ((1 + rate)^years − 1)
 *   (compounds on the full replacement value; end value is NOT deducted first)
 * - Annual = (replacement − end value + interest value) ÷ years
 * Months per year used does not scale this figure.
 */
export interface LmnBudgetResult {
  interestValue: number;
  annual: number;
}

export function lmnBudgetAnnual(
  replacement: number,
  endValue: number,
  years: number,
  ratePct: number
): LmnBudgetResult | null {
  if (!years || years <= 0) return null;
  const interestValue = replacement * (Math.pow(1 + ratePct / 100, years) - 1);
  const annual = (replacement - endValue + interestValue) / years;
  return { interestValue, annual };
}
