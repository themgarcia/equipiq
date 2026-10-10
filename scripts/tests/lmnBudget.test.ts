import { describe, expect, test } from 'bun:test';
import { lmnBudgetAnnual } from '../../src/lib/lmnBudget';

const cents = (n: number) => Math.round(n * 100) / 100;

describe('LMN budget formula (observed in LMN)', () => {
  test('Row A: $15,000 / $1,500 / 7 yrs / 2%', () => {
    const r = lmnBudgetAnnual(15000, 1500, 7, 2)!;
    expect(cents(r.interestValue)).toBe(2230.29);
    expect(cents(r.annual)).toBe(2247.18);
  });
  test('Row B: $6,000 / $600 / 7 yrs / 2%', () => {
    const r = lmnBudgetAnnual(6000, 600, 7, 2)!;
    expect(cents(r.interestValue)).toBe(892.11);
    expect(cents(r.annual)).toBe(898.87);
  });
  test('zero life gives no figure', () => {
    expect(lmnBudgetAnnual(1000, 0, 0, 2)).toBeNull();
  });
});
