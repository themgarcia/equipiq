import { describe, expect, test } from 'bun:test';
import { resolveMonthsPerYear } from '../../src/lib/calculations';

describe('months per year used', () => {
  test('nothing set falls back to 12', () => {
    expect(resolveMonthsPerYear(null, undefined)).toEqual({ months: 12, source: 'default' });
  });
  test('category value applies when the unit has none', () => {
    expect(resolveMonthsPerYear(null, 5)).toEqual({ months: 5, source: 'category' });
  });
  test('unit value wins over category', () => {
    expect(resolveMonthsPerYear(7, 5)).toEqual({ months: 7, source: 'unit' });
  });
});
