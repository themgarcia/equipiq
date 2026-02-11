import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type DistanceUnit = 'mi' | 'km';

/**
 * Hook to read and update the user's distance unit preference from their profile.
 * Returns 'mi' as default until loaded.
 */
export function useDistanceUnit() {
  const { user } = useAuth();
  const [distanceUnit, setDistanceUnit] = useState<DistanceUnit>('mi');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('distance_unit')
          .eq('id', user!.id)
          .maybeSingle();

        if (!error && data?.distance_unit) {
          setDistanceUnit(data.distance_unit as DistanceUnit);
        }
      } catch {
        // fall back to 'mi'
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const updateDistanceUnit = useCallback(async (unit: DistanceUnit) => {
    if (!user) return;
    setDistanceUnit(unit);
    
    await supabase
      .from('profiles')
      .update({ distance_unit: unit } as any)
      .eq('id', user.id);
  }, [user]);

  return { distanceUnit, updateDistanceUnit, loading };
}
