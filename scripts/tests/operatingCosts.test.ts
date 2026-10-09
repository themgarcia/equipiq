// Run: bun test scripts/tests/operatingCosts.test.ts
import { test, expect } from 'bun:test';
import { resolveOperatingCosts } from '../../src/lib/operatingCosts';

const mini = { maintenancePercent: 5, insurancePercent: 1.5, licensingAnnual: null, fuelConsumptionLph: null };
const bobcat = { replacementCostUsed: 55369 };

test('Bobcat maintenance = 5% of replacement cost today', () => {
  expect(resolveOperatingCosts(bobcat, mini).maintenance.value).toBeCloseTo(2768.45, 2);
});
test('insured, no declared value: 1.5% of replacement cost', () => {
  expect(resolveOperatingCosts({ ...bobcat, isInsured: true }, mini).insurance.value).toBeCloseTo(830.535, 2);
});
test('insured with $58,200 declared: 1.5% of declared = 873', () => {
  const r = resolveOperatingCosts({ replacementCostUsed: 90000, isInsured: true, insuranceDeclaredValue: 58200 }, mini).insurance;
  expect(r.value).toBe(873);
  expect(r.source).toBe('estimate_declared');
});
test('not on insured register resolves to null, not 0', () => {
  expect(resolveOperatingCosts({ ...bobcat, isInsured: false }, mini).insurance.value).toBeNull();
  expect(resolveOperatingCosts({ ...bobcat, isInsured: null }, mini).insurance.value).toBeNull();
});
test('premium of 0 entered stays 0', () => {
  expect(resolveOperatingCosts({ ...bobcat, insuranceAnnualPremium: 0 }, mini).insurance.value).toBe(0);
});
test('premium beats estimate', () => {
  expect(resolveOperatingCosts({ ...bobcat, isInsured: true, insuranceAnnualPremium: 900 }, mini).insurance.value).toBe(900);
});
test('override beats category default', () => {
  expect(resolveOperatingCosts({ ...bobcat, maintenanceAnnualOverride: 1500 }, mini).maintenance.value).toBe(1500);
});
test('licensing and fuel with no data are null', () => {
  const r = resolveOperatingCosts(bobcat, mini);
  expect(r.licensing.value).toBeNull();
  expect(r.fuel.value).toBeNull();
});
