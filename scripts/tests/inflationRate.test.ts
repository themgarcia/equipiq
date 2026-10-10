// Run: bun test scripts/tests/inflationRate.test.ts
import { test, expect } from 'bun:test';
import { calculateInflationAdjustedCost, annualRecovery, DEFAULT_INFLATION_RATE_PCT } from '../../src/lib/calculations';
import { lmnBudgetAnnual } from '../../src/lib/lmnBudget';

test('default inflation rate is 3%', () => {
  expect(DEFAULT_INFLATION_RATE_PCT).toBe(3);
});

test('3% over 11 years reproduces the Bobcat 324 replacement value: $55,369', () => {
  expect(Math.round(calculateInflationAdjustedCost(40000, 2015, 2026, 3))).toBe(55369);
});

test('2% over 11 years: $40,000 × 1.02^11 = $49,735', () => {
  expect(Math.round(calculateInflationAdjustedCost(40000, 2015, 2026, 2))).toBe(49735);
});

test('Excavator Mini at one shared 3%: EquipIQ $5,191, LMN about $7,037', () => {
  const unit = { replacementCostUsed: 55369, expectedResaleUsed: 13842, usefulLifeUsed: 8 };
  expect(Math.round(annualRecovery(unit, 'net_of_resale'))).toBe(5191);
  expect(Math.round(lmnBudgetAnnual(55369, 13842, 8, 3)!.annual)).toBe(7037);
});
