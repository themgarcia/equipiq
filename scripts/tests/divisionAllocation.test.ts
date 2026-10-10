import { describe, expect, test } from 'bun:test';
import { resolveAllocation, proposeFromMapping } from '../../src/lib/divisionAllocation';
import { monthsMessage } from '../../src/lib/divisionShares';

const shared = { service_division_id: null, months_committed: null, share_of_year: 1, expected_hours: null, allocation_type: 'operational' };
const catRows = [
  { service_division_id: 'lawn', months_committed: 7, share_of_year: 7 / 12, expected_hours: null, allocation_type: null },
  { service_division_id: 'snow', months_committed: 5, share_of_year: 5 / 12, expected_hours: null, allocation_type: null },
];

describe('resolution order', () => {
  test('unit override wins over category default', () => {
    const unit = [{ ...shared, service_division_id: 'lawn', is_override: true }];
    expect(resolveAllocation(unit, catRows).source).toBe('unit');
  });
  test('inheriting unit takes category default', () => {
    const r = resolveAllocation([{ ...shared, is_override: false }], catRows);
    expect(r.source).toBe('category');
    expect(r.rows).toBe(catRows);
  });
  test('no override and no category default = year-round shared', () => {
    const r = resolveAllocation([{ ...shared, is_override: false }], []);
    expect(r.source).toBe('shared');
    expect(r.rows[0].share_of_year).toBe(1);
  });
  test('a category edit leaves an override unit unchanged', () => {
    const unit = [{ ...shared, service_division_id: 'lawn', is_override: true }];
    const before = resolveAllocation(unit, catRows).rows;
    const after = resolveAllocation(unit, [{ ...catRows[0], share_of_year: 1 }]).rows;
    expect(after).toEqual(before);
  });
});

describe('mapping proposals', () => {
  const fleet = [{ category: 'Fleet — Truck', taxonomyDivision: 'Fleet' }];
  test('Lawn + Snow at 7 and 5 months proposes 7/12 and 5/12 with no message', () => {
    const p = proposeFromMapping({ Fleet: ['lawn', 'snow'] }, [
      { id: 'lawn', name: 'Lawn', season_months: 7 }, { id: 'snow', name: 'Snow', season_months: 5 },
    ], fleet);
    expect(p[0].rows.map(r => r.share_of_year)).toEqual([7 / 12, 5 / 12]);
    expect(monthsMessage(p[0].rows.map(r => ({ months: r.months_committed })))).toBeNull();
  });
  test('8 + 5 months proposes 61.5% / 38.5% and flags 13 months', () => {
    const p = proposeFromMapping({ Fleet: ['a', 'b'] }, [
      { id: 'a', name: 'Construction', season_months: 8 }, { id: 'b', name: 'Snow', season_months: 5 },
    ], fleet);
    expect(p[0].rows.map(r => Math.round(r.share_of_year * 1000) / 10)).toEqual([61.5, 38.5]);
    expect(monthsMessage(p[0].rows.map(r => ({ months: r.months_committed })))).toContain('13 months');
  });
  test('empty answer proposes year-round shared', () => {
    expect(proposeFromMapping({ Fleet: [] }, [], fleet)[0].rows).toEqual([]);
  });
});
