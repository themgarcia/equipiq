/**
 * Per-unit operating costs (Step 8). Display/resolution only — NOT used by
 * recovery, Buy vs Rent, FMS export or any rate calculation.
 * Percentages apply to Replacement Cost (Today); the insurance estimate
 * prefers declared value. null = "Not set" (unknown), distinct from 0.
 */

export type OperatingCostSource =
  | 'override'
  | 'category_default'
  | 'premium'
  | 'estimate_declared'
  | 'estimate_replacement'
  | 'not_set';

export interface ResolvedCost {
  value: number | null;
  source: OperatingCostSource;
  derivation: string;
}

export interface OperatingCostInput {
  replacementCostUsed: number;
  maintenanceAnnualOverride?: number | null;
  licensingAnnualOverride?: number | null;
  fuelConsumptionLphOverride?: number | null;
  insuranceAnnualPremium?: number | null;
  isInsured?: boolean | null;
  insuranceDeclaredValue?: number | null;
}

export interface CategoryCostDefaults {
  maintenancePercent: number | null;
  insurancePercent: number | null;
  licensingAnnual: number | null;
  fuelConsumptionLph: number | null;
}

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
const has = (v: number | null | undefined): v is number => v != null && !Number.isNaN(v);

export function resolveOperatingCosts(item: OperatingCostInput, cat: CategoryCostDefaults) {
  const rc = item.replacementCostUsed;

  let maintenance: ResolvedCost;
  if (has(item.maintenanceAnnualOverride)) {
    maintenance = { value: item.maintenanceAnnualOverride, source: 'override', derivation: `Your override: ${usd(item.maintenanceAnnualOverride)}/yr` };
  } else if (has(cat.maintenancePercent)) {
    const v = rc * cat.maintenancePercent / 100;
    maintenance = { value: v, source: 'category_default', derivation: `Category default: ${cat.maintenancePercent}% of ${usd(rc)} replacement cost today = ${usd(v)}/yr` };
  } else {
    maintenance = { value: null, source: 'not_set', derivation: 'Not set — no category default' };
  }

  let insurance: ResolvedCost;
  if (has(item.insuranceAnnualPremium)) {
    insurance = { value: item.insuranceAnnualPremium, source: 'premium', derivation: `Premium entered on Insurance page: ${usd(item.insuranceAnnualPremium)}/yr` };
  } else if (item.isInsured === true && has(cat.insurancePercent)) {
    const declared = has(item.insuranceDeclaredValue) && item.insuranceDeclaredValue > 0 ? item.insuranceDeclaredValue : null;
    const base = declared ?? rc;
    const v = base * cat.insurancePercent / 100;
    insurance = declared != null
      ? { value: v, source: 'estimate_declared', derivation: `Estimate: ${cat.insurancePercent}% of ${usd(base)} declared value = ${usd(v)}/yr` }
      : { value: v, source: 'estimate_replacement', derivation: `Estimate: ${cat.insurancePercent}% of ${usd(base)} replacement cost today (no declared value) = ${usd(v)}/yr` };
  } else {
    insurance = { value: null, source: 'not_set', derivation: 'Not set — not separately scheduled (may be under blanket coverage)' };
  }

  const simple = (override: number | null | undefined, def: number | null, unit: string): ResolvedCost => {
    if (has(override)) return { value: override, source: 'override', derivation: `Your override: ${unit === 'L/hr' ? override : usd(override)} ${unit}` };
    if (has(def)) return { value: def, source: 'category_default', derivation: `Category default: ${unit === 'L/hr' ? def : usd(def)} ${unit}` };
    return { value: null, source: 'not_set', derivation: 'Not set — no category default yet' };
  };

  return {
    maintenance,
    insurance,
    licensing: simple(item.licensingAnnualOverride, cat.licensingAnnual, '/yr'),
    fuel: simple(item.fuelConsumptionLphOverride, cat.fuelConsumptionLph, 'L/hr'),
  };
}
