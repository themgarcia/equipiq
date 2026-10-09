// Run: bun test scripts/tests/annualRecovery.test.ts
import { test, expect } from 'bun:test';
import { annualRecovery } from '../../src/lib/calculations';

// 2014 Bobcat 324: replacement $55,369, resale 25% = $13,842, life 8 yrs
const bobcat = { replacementCostUsed: 55369, expectedResaleUsed: 13842, usefulLifeUsed: 8 } as const;

test('net of resale: (55,369 − 13,842) ÷ 8 ≈ 5,191', () => {
  expect(Math.round(annualRecovery(bobcat, 'net_of_resale'))).toBe(5191);
});

test('gross: 55,369 ÷ 8 ≈ 6,921', () => {
  expect(Math.round(annualRecovery(bobcat, 'gross'))).toBe(6921);
});

test('default basis is net of resale', () => {
  expect(Math.round(annualRecovery(bobcat))).toBe(5191);
});

test('zero useful life returns 0', () => {
  expect(annualRecovery({ ...bobcat, usefulLifeUsed: 0 }, 'gross')).toBe(0);
});
