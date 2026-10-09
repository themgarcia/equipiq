import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { categoryDefaults as fallbackCategories } from '@/data/categoryDefaults';
import type { CategoryDefaults, EquipmentDivision, BenchmarkType } from '@/types/equipment';
import type { CategoryCostDefaults } from '@/lib/operatingCosts';

function formatRange(basis: string, min: number | null, max: number | null): string | null {
  if (basis === 'calendar' || min == null || max == null) return null;
  return `${Number(min).toLocaleString('en-US')}–${Number(max).toLocaleString('en-US')} ${basis === 'miles' ? 'mi' : 'hrs'}`;
}

/** Reads category defaults from the database; falls back to the client array if the read fails. */
export function useCategoryDefaultsTable() {
  return useQuery({
    queryKey: ['category_defaults'],
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<{ rows: CategoryDefaults[]; source: 'database' | 'fallback'; costDefaults: Record<string, CategoryCostDefaults> }> => {
      const { data, error } = await supabase
        .from('category_defaults')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error || !data || data.length === 0) {
        const costDefaults: Record<string, CategoryCostDefaults> = {};
        fallbackCategories.forEach((c) => {
          costDefaults[c.category] = { maintenancePercent: c.maintenancePercent, insurancePercent: c.insurancePercent, licensingAnnual: null, fuelConsumptionLph: null };
        });
        return { rows: fallbackCategories, source: 'fallback', costDefaults };
      }
      const costDefaults: Record<string, CategoryCostDefaults> = {};
      data.forEach((r) => {
        costDefaults[r.category] = {
          maintenancePercent: Number(r.maintenance_repair_pct),
          insurancePercent: Number(r.insurance_pct),
          licensingAnnual: r.licensing_annual == null ? null : Number(r.licensing_annual),
          fuelConsumptionLph: r.fuel_consumption_lph == null ? null : Number(r.fuel_consumption_lph),
        };
      });
      return {
        source: 'database',
        costDefaults,
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
