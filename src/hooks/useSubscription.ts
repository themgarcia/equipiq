import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { DEMO_USAGE } from '@/data/demoEquipmentData';

export type SubscriptionPlan = 'free' | 'professional' | 'business';

export interface PlanLimits {
  maxItems: number;
  maxStorageBytes: number;
  hasFullBuyVsRent: boolean;
  hasCashflow: boolean;
  hasEmailAlerts: boolean;
  hasPrioritySupport: boolean;
  aiParsingIncluded: boolean;
}

export interface SubscriptionState {
  plan: SubscriptionPlan;
  isSubscribed: boolean;
  billingInterval: 'monthly' | 'annual' | null;
  subscriptionEnd: string | null;
  inGracePeriod: boolean;
  gracePeriodEndsAt: string | null;
  hasBetaAccess: boolean;
  loading: boolean;
  error: string | null;
}

export interface UsageState {
  equipmentCount: number;
  attachmentCount: number;
  totalItemCount: number;
  storageUsedBytes: number;
  loading: boolean;
}

// Plan limits configuration
const PLAN_LIMITS: Record<SubscriptionPlan, PlanLimits> = {
  free: {
    maxItems: 5,
    maxStorageBytes: 100 * 1024 * 1024, // 100MB
    hasFullBuyVsRent: false,
    hasCashflow: false,
    hasEmailAlerts: false,
    hasPrioritySupport: false,
    aiParsingIncluded: false,
  },
  professional: {
    maxItems: 50,
    maxStorageBytes: 2 * 1024 * 1024 * 1024, // 2GB
    hasFullBuyVsRent: true,
    hasCashflow: true,
    hasEmailAlerts: true,
    hasPrioritySupport: false,
    aiParsingIncluded: true,
  },
  business: {
    maxItems: Infinity,
    maxStorageBytes: Infinity,
    hasFullBuyVsRent: true,
    hasCashflow: true,
    hasEmailAlerts: true,
    hasPrioritySupport: true,
    aiParsingIncluded: true,
  },
};

export function useSubscription() {
  const { user } = useAuth();
  const { adminModeActive, demoPlan, demoDataEnabled } = useAdminMode();
  
  const [subscription, setSubscription] = useState<SubscriptionState>({
    plan: 'free',
    isSubscribed: false,
    billingInterval: null,
    subscriptionEnd: null,
    inGracePeriod: false,
    gracePeriodEndsAt: null,
    hasBetaAccess: false,
    loading: true,
    error: null,
  });

  const [usage, setUsage] = useState<UsageState>({
    equipmentCount: 0,
    attachmentCount: 0,
    totalItemCount: 0,
    storageUsedBytes: 0,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        plan: 'free',
        isSubscribed: false,
        billingInterval: null,
        subscriptionEnd: null,
        inGracePeriod: false,
        gracePeriodEndsAt: null,
        hasBetaAccess: false,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) throw error;

      const effectivePlan = data.in_grace_period ? data.plan : (data.subscribed ? data.plan : 'free');

      setSubscription({
        plan: effectivePlan,
        isSubscribed: data.subscribed,
        billingInterval: data.billing_interval || null,
        subscriptionEnd: data.subscription_end || null,
        inGracePeriod: data.in_grace_period || false,
        gracePeriodEndsAt: data.grace_period_ends_at || null,
        hasBetaAccess: data.beta_access || false,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setSubscription(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to check subscription',
      }));
    }
  }, [user]);

  const loadUsage = useCallback(async () => {
    if (!user) {
      setUsage({
        equipmentCount: 0,
        attachmentCount: 0,
        totalItemCount: 0,
        storageUsedBytes: 0,
        loading: false,
      });
      return;
    }

    try {
      // Get equipment count
      const { count: equipmentCount } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get attachment count
      const { count: attachmentCount } = await supabase
        .from('equipment_attachments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get storage usage from documents
      const { data: documents } = await supabase
        .from('equipment_documents')
        .select('file_size')
        .eq('user_id', user.id);

      const storageUsedBytes = documents?.reduce((sum, doc) => sum + (doc.file_size || 0), 0) || 0;

      setUsage({
        equipmentCount: equipmentCount || 0,
        attachmentCount: attachmentCount || 0,
        totalItemCount: (equipmentCount || 0) + (attachmentCount || 0),
        storageUsedBytes,
        loading: false,
      });
    } catch (err) {
      console.error('Error loading usage:', err);
      setUsage(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  // Initial load and refresh
  useEffect(() => {
    checkSubscription();
    loadUsage();
  }, [checkSubscription, loadUsage]);

  // Refresh subscription status periodically (every 60 seconds)
  useEffect(() => {
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  // Determine if we're in demo mode
  const isDemo = adminModeActive && (demoPlan !== null || demoDataEnabled);
  
  // Effective plan - use demo plan if set, otherwise real subscription
  const effectivePlan = useMemo(() => {
    if (adminModeActive && demoPlan) {
      return demoPlan;
    }
    return subscription.plan;
  }, [adminModeActive, demoPlan, subscription.plan]);
  
  // Effective usage - use demo usage if demo data enabled
  const effectiveUsage = useMemo(() => {
    if (adminModeActive && demoDataEnabled) {
      return DEMO_USAGE[demoPlan || 'free'];
    }
    return usage;
  }, [adminModeActive, demoDataEnabled, demoPlan, usage]);

  // Computed values using effective plan and usage
  const limits = PLAN_LIMITS[effectivePlan];
  
  const canAddEquipment = effectiveUsage.totalItemCount < limits.maxItems;
  const canUploadDocuments = effectiveUsage.storageUsedBytes < limits.maxStorageBytes;
  const canUseBuyVsRent = limits.hasFullBuyVsRent || subscription.inGracePeriod;
  const canUseCashflow = limits.hasCashflow || subscription.inGracePeriod;
  const hasEmailAlerts = limits.hasEmailAlerts;
  const hasPrioritySupport = limits.hasPrioritySupport;

  const itemsRemaining = Math.max(0, limits.maxItems - effectiveUsage.totalItemCount);
  const storageRemaining = Math.max(0, limits.maxStorageBytes - effectiveUsage.storageUsedBytes);

  const daysLeftInGrace = subscription.gracePeriodEndsAt
    ? Math.max(0, Math.ceil((new Date(subscription.gracePeriodEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    // State
    subscription,
    usage: effectiveUsage,
    limits,
    
    // Demo mode indicators
    isDemo,
    effectivePlan,
    realPlan: subscription.plan,

    // Permissions
    canAddEquipment,
    canUploadDocuments,
    canUseBuyVsRent,
    canUseCashflow,
    hasEmailAlerts,
    hasPrioritySupport,
    hasBetaAccess: subscription.hasBetaAccess,

    // Computed
    itemsRemaining,
    storageRemaining,
    daysLeftInGrace,

    // Actions
    refreshSubscription: checkSubscription,
    refreshUsage: loadUsage,
  };
}
