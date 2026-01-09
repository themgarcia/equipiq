import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type SubscriptionPlan = 'free' | 'professional' | 'business';

interface AdminModeContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminModeActive: boolean;
  toggleAdminMode: () => void;
  // Demo mode features
  demoPlan: SubscriptionPlan | null;
  setDemoPlan: (plan: SubscriptionPlan | null) => void;
  demoDataEnabled: boolean;
  setDemoDataEnabled: (enabled: boolean) => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminModeActive, setAdminModeActive] = useState(false);
  const [demoPlan, setDemoPlanState] = useState<SubscriptionPlan | null>(null);
  const [demoDataEnabled, setDemoDataEnabledState] = useState(false);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminModeActive(false);
        setDemoPlanState(null);
        setDemoDataEnabledState(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(!!data);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // Restore admin mode and demo settings from localStorage if user is admin
  useEffect(() => {
    if (isAdmin && !isLoading) {
      const storedMode = localStorage.getItem('adminModeActive');
      if (storedMode === 'true') {
        setAdminModeActive(true);
        
        // Restore demo settings
        const storedDemoPlan = localStorage.getItem('demoPlan');
        if (storedDemoPlan && ['free', 'professional', 'business'].includes(storedDemoPlan)) {
          setDemoPlanState(storedDemoPlan as SubscriptionPlan);
        }
        
        const storedDemoData = localStorage.getItem('demoDataEnabled');
        if (storedDemoData === 'true') {
          setDemoDataEnabledState(true);
        }
      }
    }
  }, [isAdmin, isLoading]);

  // Clear demo settings if user loses admin status or admin mode is deactivated
  useEffect(() => {
    if (!isAdmin || !adminModeActive) {
      setDemoPlanState(null);
      setDemoDataEnabledState(false);
      localStorage.removeItem('demoPlan');
      localStorage.removeItem('demoDataEnabled');
    }
    
    if (!isAdmin && adminModeActive) {
      setAdminModeActive(false);
      localStorage.removeItem('adminModeActive');
    }
  }, [isAdmin, adminModeActive]);

  const toggleAdminMode = () => {
    if (!isAdmin) return;
    
    const newValue = !adminModeActive;
    setAdminModeActive(newValue);
    
    if (newValue) {
      localStorage.setItem('adminModeActive', 'true');
    } else {
      localStorage.removeItem('adminModeActive');
      // Also clear demo settings when exiting admin mode
      setDemoPlanState(null);
      setDemoDataEnabledState(false);
      localStorage.removeItem('demoPlan');
      localStorage.removeItem('demoDataEnabled');
    }
  };

  const setDemoPlan = (plan: SubscriptionPlan | null) => {
    if (!adminModeActive) return;
    setDemoPlanState(plan);
    if (plan) {
      localStorage.setItem('demoPlan', plan);
    } else {
      localStorage.removeItem('demoPlan');
    }
  };

  const setDemoDataEnabled = (enabled: boolean) => {
    if (!adminModeActive) return;
    setDemoDataEnabledState(enabled);
    if (enabled) {
      localStorage.setItem('demoDataEnabled', 'true');
    } else {
      localStorage.removeItem('demoDataEnabled');
    }
  };

  return (
    <AdminModeContext.Provider value={{ 
      isAdmin, 
      isLoading, 
      adminModeActive, 
      toggleAdminMode,
      demoPlan,
      setDemoPlan,
      demoDataEnabled,
      setDemoDataEnabled,
    }}>
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (context === undefined) {
    throw new Error('useAdminMode must be used within an AdminModeProvider');
  }
  return context;
}
