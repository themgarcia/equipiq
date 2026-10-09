import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DEFAULT_RECOVERY_BASIS, RecoveryBasis } from '@/lib/calculations';

export interface CompanySettings {
  fuel_price_per_litre: number | null;
  market_finance_rate_pct: number | null;
  default_hours_per_day: number;
  recovery_basis: RecoveryBasis;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  fuel_price_per_litre: null,
  market_finance_rate_pct: null,
  default_hours_per_day: 8,
  recovery_basis: DEFAULT_RECOVERY_BASIS,
};

/**
 * Company-wide settings, scoped per user account today.
 * Cached via React Query so many components can read it with one request.
 * When no row exists yet, defaults are returned.
 */
export function useCompanySettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const key = ['company_settings', user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CompanySettings> => {
      const { data, error } = await supabase
        .from('company_settings')
        .select('fuel_price_per_litre, market_finance_rate_pct, default_hours_per_day, recovery_basis')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return DEFAULT_COMPANY_SETTINGS;
      return {
        fuel_price_per_litre: data.fuel_price_per_litre === null ? null : Number(data.fuel_price_per_litre),
        market_finance_rate_pct: data.market_finance_rate_pct === null ? null : Number(data.market_finance_rate_pct),
        default_hours_per_day: Number(data.default_hours_per_day),
        recovery_basis: data.recovery_basis as RecoveryBasis,
      };
    },
  });

  const mutation = useMutation({
    mutationFn: async (next: CompanySettings) => {
      const { error } = await supabase
        .from('company_settings')
        .upsert({ user_id: user!.id, ...next }, { onConflict: 'user_id' });
      if (error) throw error;
      return next;
    },
    onSuccess: (next) => queryClient.setQueryData(key, next),
  });

  return {
    settings: query.data ?? DEFAULT_COMPANY_SETTINGS,
    recoveryBasis: (query.data ?? DEFAULT_COMPANY_SETTINGS).recovery_basis,
    loading: query.isLoading,
    save: mutation.mutateAsync,
    saving: mutation.isPending,
  };
}

export const RECOVERY_BASIS_LABEL: Record<RecoveryBasis, string> = {
  net_of_resale: 'Net of resale',
  gross: 'Gross',
};
