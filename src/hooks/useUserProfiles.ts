import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  full_name: string | null;
  company_name: string | null;
}

export function useUserProfiles() {
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async (userIds: (string | null)[]) => {
    const uniqueIds = [...new Set(userIds.filter((id): id is string => !!id))];
    
    if (uniqueIds.length === 0) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_name')
        .in('id', uniqueIds);

      if (error) throw error;

      const profileMap = new Map<string, UserProfile>();
      data?.forEach(p => {
        profileMap.set(p.id, {
          full_name: p.full_name,
          company_name: p.company_name,
        });
      });
      setProfiles(profileMap);
    } catch (error) {
      console.error('Failed to fetch user profiles:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDisplayName = useCallback((userId: string | null): { name: string; company: string | null; isUnknown: boolean } => {
    if (!userId) {
      return { name: 'Anonymous', company: null, isUnknown: true };
    }
    
    const profile = profiles.get(userId);
    if (!profile || !profile.full_name) {
      return { name: `Unknown (${userId.slice(0, 8)}...)`, company: null, isUnknown: true };
    }
    
    return {
      name: profile.full_name,
      company: profile.company_name,
      isUnknown: false,
    };
  }, [profiles]);

  return { profiles, loading, fetchProfiles, getDisplayName };
}
