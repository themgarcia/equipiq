/**
 * Division allocation resolution and mapping proposals (display only until 9B/9C).
 * Effective allocation = unit override → category default → year-round shared.
 * Proposals only SUGGEST; nothing here saves or overwrites a confirmed value.
 */
import { suggestShares } from '@/lib/divisionShares';

export interface AllocationRow {
  service_division_id: string | null;
  months_committed: number | null;
  share_of_year: number;
  expected_hours: number | null;
  allocation_type: string | null;
}

export interface UnitAllocationRow extends AllocationRow {
  is_override: boolean;
}

export type AllocationSource = 'unit' | 'category' | 'shared';

export interface ResolvedAllocation {
  rows: AllocationRow[];
  source: AllocationSource;
}

const SHARED: AllocationRow = { service_division_id: null, months_committed: null, share_of_year: 1, expected_hours: null, allocation_type: null };

export function resolveAllocation(unitRows: UnitAllocationRow[], categoryRows: AllocationRow[]): ResolvedAllocation {
  if (unitRows.some(r => r.is_override)) {
    return { rows: unitRows.map(({ is_override: _o, ...r }) => r), source: 'unit' };
  }
  if (categoryRows.length > 0) return { rows: categoryRows, source: 'category' };
  return { rows: [SHARED], source: 'shared' };
}

export interface DivisionLite { id: string; name: string; season_months: number }

export interface CategoryProposal {
  category: string;
  rows: AllocationRow[]; // empty = year-round shared
}

/**
 * One answer per taxonomy division → a proposed category default for each fleet
 * category in that taxonomy division. Months come from each division's season;
 * shares are the suggested split. An empty answer proposes year-round shared.
 */
export function proposeFromMapping(
  answers: Record<string, string[]>,
  divisions: DivisionLite[],
  fleetCategories: { category: string; taxonomyDivision: string }[],
): CategoryProposal[] {
  return fleetCategories
    .filter(c => c.taxonomyDivision in answers)
    .map(c => {
      const picked = (answers[c.taxonomyDivision] ?? [])
        .map(id => divisions.find(d => d.id === id))
        .filter((d): d is DivisionLite => !!d);
      if (picked.length === 0) return { category: c.category, rows: [] };
      const shares = suggestShares(picked.map(d => ({ months: d.season_months })));
      return {
        category: c.category,
        rows: picked.map((d, i) => ({
          service_division_id: d.id,
          months_committed: d.season_months,
          share_of_year: shares[i],
          expected_hours: null,
          allocation_type: null,
        })),
      };
    });
}

/** Plain-language summary, e.g. "Lawn 58.3% / Snow 41.7%". */
export function describeAllocation(rows: AllocationRow[], divName: (id: string) => string): string {
  const split = rows.filter(r => r.service_division_id);
  if (split.length === 0) return 'Year-round shared';
  return split.map(r => `${divName(r.service_division_id!)} ${(Math.round(r.share_of_year * 1000) / 10).toFixed(1)}%`).join(' / ');
}
