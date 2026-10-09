import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { categoryDefaults as fallbackCategories } from '@/data/categoryDefaults';
import type { CategoryDefaults, EquipmentDivision, BenchmarkType } from '@/types/equipment';

function formatRange(basis: string, min: number | null, max: number | null): string | null {
  if (basis === 'calendar' || min == null || max == null) return null;
  return `${Number(min).toLocaleString('en-US')}–${Number(max).toLocaleString('en-US')} ${basis === 'miles' ? 'mi' : 'hrs'}`;
}

/** Reads category defaults from the database; falls back to the client array if the read fails. */
export function useCategoryDefaultsTable() {
  return useQuery({
    queryKey: ['category_defaults'],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<{ rows: CategoryDefaults[]; source: 'database' | 'fallback' }> => {
      const { data, error } = await supabase
        .from('category_defaults')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error || !data || data.length === 0) return { rows: fallbackCategories, source: 'fallback' };
      return {
        source: 'database',
        rows: data.map((r) => ({
          category: r.category,
          division: r.division as EquipmentDivision,
          defaultUsefulLife: Number(r.useful_life_years),
          defaultResalePercent: Number(r.resale_pct),
          unit: r.default_lmn_unit === 'hours' ? 'Hours' : 'Days',
          defaultAllocation: r.default_allocation as CategoryDefaults['defaultAllocation'],
          notes: r.notes,
          maintenancePercent: Number(r.maintenance_repair_pct),
          insurancePercent: Number(r.insurance_pct),
          benchmarkType: r.usage_basis as BenchmarkType,
          benchmarkRange: formatRange(r.usage_basis, r.lifetime_usage_min, r.lifetime_usage_max),
        })),
      };
    },
  });
}
