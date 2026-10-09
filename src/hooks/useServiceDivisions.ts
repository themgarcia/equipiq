import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ServiceDivision {
  id: string;
  name: string;
  season_months: number;
  events_per_season: number | null;
  sort_order: number;
  archived_at: string | null;
}

export function useServiceDivisions() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ['service_divisions', user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<ServiceDivision[]> => {
      const { data, error } = await supabase
        .from('service_divisions')
        .select('id, name, season_months, events_per_season, sort_order, archived_at')
        .eq('user_id', user!.id)
        .order('sort_order')
        .order('name');
      if (error) throw error;
      return (data ?? []).map(d => ({
        ...d,
        season_months: Number(d.season_months),
        events_per_season: d.events_per_season === null ? null : Number(d.events_per_season),
      }));
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const add = async (d: { name: string; season_months: number; events_per_season: number | null }) => {
    const { error } = await supabase.from('service_divisions').insert({
      user_id: user!.id, ...d, sort_order: (query.data?.length ?? 0),
    });
    if (error) throw error;
    await invalidate();
  };

  const update = async (id: string, d: Partial<{ name: string; season_months: number; events_per_season: number | null; archived_at: string | null }>) => {
    const { error } = await supabase.from('service_divisions').update(d).eq('id', id);
    if (error) throw error;
    await invalidate();
  };

  /** Deletes when unused; archives when units are allocated to it. Returns which happened. */
  const remove = async (id: string): Promise<'deleted' | 'archived'> => {
    const { count, error: cErr } = await supabase
      .from('equipment_division_allocations')
      .select('id', { count: 'exact', head: true })
      .eq('service_division_id', id);
    if (cErr) throw cErr;
    if ((count ?? 0) > 0) {
      await update(id, { archived_at: new Date().toISOString() });
      return 'archived';
    }
    const { error } = await supabase.from('service_divisions').delete().eq('id', id);
    if (error) throw error;
    await invalidate();
    return 'deleted';
  };

  return {
    divisions: query.data ?? [],
    activeDivisions: (query.data ?? []).filter(d => !d.archived_at),
    loading: query.isLoading,
    add, update, remove,
  };
}
