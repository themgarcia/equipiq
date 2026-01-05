import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminModeContextType {
  isAdmin: boolean;
  isLoading: boolean;
  adminModeActive: boolean;
  toggleAdminMode: () => void;
}

const AdminModeContext = createContext<AdminModeContextType | undefined>(undefined);

export function AdminModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminModeActive, setAdminModeActive] = useState(false);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setAdminModeActive(false);
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

  // Restore admin mode from localStorage if user is admin
  useEffect(() => {
    if (isAdmin && !isLoading) {
      const storedMode = localStorage.getItem('adminModeActive');
      if (storedMode === 'true') {
        setAdminModeActive(true);
      }
    }
  }, [isAdmin, isLoading]);

  // Deactivate admin mode if user loses admin status
  useEffect(() => {
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
    }
  };

  return (
    <AdminModeContext.Provider value={{ isAdmin, isLoading, adminModeActive, toggleAdminMode }}>
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
