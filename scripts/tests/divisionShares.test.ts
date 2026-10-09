import { describe, expect, test } from 'bun:test';
import { suggestShares, monthsMessage, sharesValid } from '../../src/lib/divisionShares';

describe('division shares', () => {
  test('clean 8 + 4 suggests 8/12 and 4/12 with no message', () => {
    const e = [{ months: 8 }, { months: 4 }];
    const s = suggestShares(e);
    expect(s[0]).toBeCloseTo(8 / 12, 6);
    expect(s[1]).toBeCloseTo(4 / 12, 6);
    expect(monthsMessage(e)).toBeNull();
  });

  test('8 + 5 suggests 0.615 / 0.385 and flags 13 months', () => {
    const e = [{ months: 8 }, { months: 5 }];
    const s = suggestShares(e);
    expect(s[0]).toBeCloseTo(0.6154, 4);
    expect(s[1]).toBeCloseTo(0.3846, 4);
    expect(monthsMessage(e)).toContain('13 months across a 12-month year');
  });

  test('7 + 4 flags 11 months', () => {
    expect(monthsMessage([{ months: 7 }, { months: 4 }])).toContain('11 months of a 12-month year');
  });

  test('shares must total 100% to save', () => {
    expect(sharesValid([7 / 12, 5 / 12])).toBe(true);
    expect(sharesValid([0.6, 0.5])).toBe(false);
    expect(sharesValid([0.5, 0.4])).toBe(false);
    expect(sharesValid([1])).toBe(true);
  });

  test('loader at 7/12 and 5/12 lands on 9.72 and 55.56', () => {
    expect(Math.round((20000 * 7 / 12 / 1200) * 100) / 100).toBe(9.72);
    expect(Math.round((20000 * 5 / 12 / 150) * 100) / 100).toBe(55.56);
  });
});
