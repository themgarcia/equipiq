import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { AllocationRow } from '@/lib/divisionAllocation';

/** Category-level allocation defaults (per user), keyed by category. */
export function useCategoryAllocations() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['category_division_allocations', user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<Record<string, AllocationRow[]>> => {
      const { data, error } = await supabase
        .from('category_division_allocations')
        .select('category, service_division_id, months_committed, share_of_year, expected_hours_per_unit, allocation_type')
        .eq('user_id', user!.id);
      if (error) throw error;
      const out: Record<string, AllocationRow[]> = {};
      for (const r of data ?? []) {
        (out[r.category] ??= []).push({
          service_division_id: r.service_division_id,
          months_committed: r.months_committed === null ? null : Number(r.months_committed),
          share_of_year: Number(r.share_of_year),
          expected_hours: r.expected_hours_per_unit === null ? null : Number(r.expected_hours_per_unit),
          allocation_type: r.allocation_type,
        });
      }
      return out;
    },
  });

  /** Replace a category's default. Empty rows = remove the default (units fall back to year-round shared). */
  const replace = async (category: string, rows: AllocationRow[]) => {
    const payload = rows.map(r => ({
      service_division_id: r.service_division_id,
      months_committed: r.months_committed,
      share_of_year: r.share_of_year,
      expected_hours_per_unit: r.expected_hours,
      allocation_type: r.allocation_type,
    }));
    const { error } = await supabase.rpc('replace_category_allocations', { _category: category, _rows: payload });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: key });
    await qc.invalidateQueries({ queryKey: ['equipment_allocations'] });
  };

  return { byCategory: query.data ?? {}, loading: query.isLoading, replace };
}

export function useTaxonomyMappings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['taxonomy_division_mappings', user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<Record<string, string[]>> => {
      const { data, error } = await supabase
        .from('taxonomy_division_mappings')
        .select('taxonomy_division, service_division_ids')
        .eq('user_id', user!.id);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map(r => [r.taxonomy_division, r.service_division_ids ?? []]));
    },
  });

  const saveAnswers = async (answers: Record<string, string[]>) => {
    const rows = Object.entries(answers).map(([taxonomy_division, service_division_ids]) => ({
      user_id: user!.id, taxonomy_division, service_division_ids, confirmed_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from('taxonomy_division_mappings').upsert(rows, { onConflict: 'user_id,taxonomy_division' });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: key });
  };

  return { answers: query.data ?? {}, loading: query.isLoading, saveAnswers };
}
