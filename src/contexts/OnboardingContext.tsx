import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

export type OnboardingStep = 
  | 'step_dashboard_viewed'
  | 'step_equipment_imported'
  | 'step_insurance_uploaded'
  | 'step_cashflow_viewed'
  | 'step_buy_vs_rent_used'
  | 'step_fms_exported'
  | 'step_methodology_reviewed';

export interface OnboardingProgress {
  step_dashboard_viewed: boolean;
  step_equipment_imported: boolean;
  step_insurance_uploaded: boolean;
  step_cashflow_viewed: boolean;
  step_buy_vs_rent_used: boolean;
  step_fms_exported: boolean;
  step_methodology_reviewed: boolean;
  completed_at: string | null;
  dismissed_at: string | null;
}

interface OnboardingContextType {
  progress: OnboardingProgress | null;
  loading: boolean;
  isOnboardingComplete: boolean;
  isOnboardingDismissed: boolean;
  showOnboarding: boolean;
  completedCount: number;
  totalSteps: number;
  markStepComplete: (step: OnboardingStep) => Promise<void>;
  dismissOnboarding: () => Promise<void>;
  restartOnboarding: () => Promise<void>;
  refetch: () => Promise<void>;
}

const defaultProgress: OnboardingProgress = {
  step_dashboard_viewed: false,
  step_equipment_imported: false,
  step_insurance_uploaded: false,
  step_cashflow_viewed: false,
  step_buy_vs_rent_used: false,
  step_fms_exported: false,
  step_methodology_reviewed: false,
  completed_at: null,
  dismissed_at: null,
};

const TOTAL_STEPS = 7;

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-complete steps based on existing data
  const autoCompleteSteps = useCallback(async (currentProgress: OnboardingProgress): Promise<OnboardingProgress> => {
    if (!user) return currentProgress;
    
    const updates: Partial<OnboardingProgress> = {};
    
    // Check for existing equipment
    if (!currentProgress.step_equipment_imported) {
      const { count } = await supabase
        .from('equipment')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (count && count > 0) {
        updates.step_equipment_imported = true;
      }
    }
    
    // Check for insurance (insured equipment OR settings configured)
    if (!currentProgress.step_insurance_uploaded) {
      const { count: insuredCount } = await supabase
        .from('equipment')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_insured', true);
      
      const { data: settings } = await supabase
        .from('insurance_settings')
        .select('broker_email, policy_number')
        .eq('user_id', user.id)
        .maybeSingle();
      
      const hasInsurance = (insuredCount && insuredCount > 0) || 
                           (settings?.broker_email || settings?.policy_number);
      
      if (hasInsurance) {
        updates.step_insurance_uploaded = true;
      }
    }
    
    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('onboarding_progress')
        .update(updates)
        .eq('user_id', user.id);
      
      return { ...currentProgress, ...updates };
    }
    
    return currentProgress;
  }, [user]);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgress(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching onboarding progress:', error);
        setProgress(null);
      } else if (data) {
        let currentProgress: OnboardingProgress = {
          step_dashboard_viewed: data.step_dashboard_viewed,
          step_equipment_imported: data.step_equipment_imported,
          step_insurance_uploaded: data.step_insurance_uploaded,
          step_cashflow_viewed: data.step_cashflow_viewed,
          step_buy_vs_rent_used: data.step_buy_vs_rent_used,
          step_fms_exported: data.step_fms_exported,
          step_methodology_reviewed: data.step_methodology_reviewed,
          completed_at: data.completed_at,
          dismissed_at: data.dismissed_at,
        };
        
        // Auto-complete steps based on existing data
        currentProgress = await autoCompleteSteps(currentProgress);
        setProgress(currentProgress);
      } else {
        // No row exists, create one
        const { data: newData, error: insertError } = await supabase
          .from('onboarding_progress')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating onboarding progress:', insertError);
          setProgress(defaultProgress);
        } else if (newData) {
          let currentProgress: OnboardingProgress = {
            step_dashboard_viewed: newData.step_dashboard_viewed,
            step_equipment_imported: newData.step_equipment_imported,
            step_insurance_uploaded: newData.step_insurance_uploaded,
            step_cashflow_viewed: newData.step_cashflow_viewed,
            step_buy_vs_rent_used: newData.step_buy_vs_rent_used,
            step_fms_exported: newData.step_fms_exported,
            step_methodology_reviewed: newData.step_methodology_reviewed,
            completed_at: newData.completed_at,
            dismissed_at: newData.dismissed_at,
          };
          
          // Auto-complete steps based on existing data
          currentProgress = await autoCompleteSteps(currentProgress);
          setProgress(currentProgress);
        }
      }
    } catch (err) {
      console.error('Error in fetchProgress:', err);
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }, [user, autoCompleteSteps]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const completedCount = progress
    ? [
        progress.step_dashboard_viewed,
        progress.step_equipment_imported,
        progress.step_insurance_uploaded,
        progress.step_cashflow_viewed,
        progress.step_buy_vs_rent_used,
        progress.step_fms_exported,
        progress.step_methodology_reviewed,
      ].filter(Boolean).length
    : 0;

  const isOnboardingComplete = completedCount === TOTAL_STEPS || !!progress?.completed_at;
  const isOnboardingDismissed = !!progress?.dismissed_at;
  const showOnboarding = !isOnboardingComplete && !isOnboardingDismissed;

  const markStepComplete = useCallback(async (step: OnboardingStep) => {
    if (!user || !progress) return;
    
    // Already complete, skip
    if (progress[step]) return;

    const updates: Partial<OnboardingProgress> & { completed_at?: string } = {
      [step]: true,
    };

    // Check if this completes all steps
    const newProgress = { ...progress, [step]: true };
    const allComplete = [
      newProgress.step_dashboard_viewed,
      newProgress.step_equipment_imported,
      newProgress.step_insurance_uploaded,
      newProgress.step_cashflow_viewed,
      newProgress.step_buy_vs_rent_used,
      newProgress.step_fms_exported,
      newProgress.step_methodology_reviewed,
    ].every(Boolean);

    if (allComplete) {
      updates.completed_at = new Date().toISOString();
      
      // Fire celebratory confetti! 🎉
      setTimeout(() => {
        // Left burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.1, y: 0.6 },
          colors: ['#10b981', '#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
        });
        // Right burst
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { x: 0.9, y: 0.6 },
          colors: ['#10b981', '#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
        });
        // Center shower
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { x: 0.5, y: 0.3 },
          colors: ['#10b981', '#22c55e', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
        });
      }, 100);
    }

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating onboarding step:', error);
        return;
      }

      setProgress(prev => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      console.error('Error in markStepComplete:', err);
    }
  }, [user, progress]);

  const dismissOnboarding = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error dismissing onboarding:', error);
        return;
      }

      setProgress(prev => prev ? { ...prev, dismissed_at: new Date().toISOString() } : null);
    } catch (err) {
      console.error('Error in dismissOnboarding:', err);
    }
  }, [user]);

  const restartOnboarding = useCallback(async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('onboarding_progress')
        .update({ dismissed_at: null })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error restarting onboarding:', error);
        return;
      }

      setProgress(prev => prev ? { ...prev, dismissed_at: null } : null);
    } catch (err) {
      console.error('Error in restartOnboarding:', err);
    }
  }, [user]);

  return (
    <OnboardingContext.Provider
      value={{
        progress,
        loading,
        isOnboardingComplete,
        isOnboardingDismissed,
        showOnboarding,
        completedCount,
        totalSteps: TOTAL_STEPS,
        markStepComplete,
        dismissOnboarding,
        restartOnboarding,
        refetch: fetchProgress,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
