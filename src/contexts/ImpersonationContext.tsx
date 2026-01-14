import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ImpersonatedUser {
  id: string;
  email: string;
  full_name: string;
}

interface ImpersonationContextType {
  isImpersonating: boolean;
  impersonatedUser: ImpersonatedUser | null;
  sessionId: string | null;
  startImpersonation: (targetUserId: string, reason?: string) => Promise<boolean>;
  endImpersonation: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

const IMPERSONATION_STORAGE_KEY = 'equipiq_impersonation_state';
const ORIGINAL_SESSION_KEY = 'equipiq_original_session';

interface StoredImpersonationState {
  impersonatedUser: ImpersonatedUser;
  sessionId: string | null;
}

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<ImpersonatedUser | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();

  // Restore impersonation state on mount
  useEffect(() => {
    const storedState = localStorage.getItem(IMPERSONATION_STORAGE_KEY);
    const originalSession = localStorage.getItem(ORIGINAL_SESSION_KEY);
    
    if (storedState && originalSession) {
      try {
        const state: StoredImpersonationState = JSON.parse(storedState);
        setImpersonatedUser(state.impersonatedUser);
        setSessionId(state.sessionId);
        setIsImpersonating(true);
      } catch (e) {
        // Clear invalid state
        localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        localStorage.removeItem(ORIGINAL_SESSION_KEY);
      }
    }
  }, []);

  const startImpersonation = useCallback(async (targetUserId: string, reason?: string): Promise<boolean> => {
    try {
      // Store the current session before impersonating
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        toast({
          title: "Error",
          description: "No active session found",
          variant: "destructive",
        });
        return false;
      }

      // Store the original admin session
      localStorage.setItem(ORIGINAL_SESSION_KEY, JSON.stringify(currentSession));

      // Call the edge function to get the impersonation token
      const { data, error } = await supabase.functions.invoke('admin-impersonate-user', {
        body: { targetUserId, reason },
      });

      if (error || !data?.success) {
        toast({
          title: "Impersonation failed",
          description: error?.message || data?.error || "Unknown error",
          variant: "destructive",
        });
        localStorage.removeItem(ORIGINAL_SESSION_KEY);
        return false;
      }

      // Verify the OTP to log in as the target user
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'email',
      });

      if (verifyError) {
        toast({
          title: "Impersonation failed",
          description: verifyError.message,
          variant: "destructive",
        });
        localStorage.removeItem(ORIGINAL_SESSION_KEY);
        return false;
      }

      // Store impersonation state
      const impersonationState: StoredImpersonationState = {
        impersonatedUser: data.target_user,
        sessionId: data.session_id,
      };
      localStorage.setItem(IMPERSONATION_STORAGE_KEY, JSON.stringify(impersonationState));

      // Update state
      setImpersonatedUser(data.target_user);
      setSessionId(data.session_id);
      setIsImpersonating(true);

      toast({
        title: "Impersonation started",
        description: `You are now viewing as ${data.target_user.full_name}`,
      });

      return true;
    } catch (error: any) {
      console.error('Impersonation error:', error);
      toast({
        title: "Impersonation failed",
        description: error.message || "Unknown error",
        variant: "destructive",
      });
      localStorage.removeItem(ORIGINAL_SESSION_KEY);
      return false;
    }
  }, [toast]);

  const endImpersonation = useCallback(async () => {
    try {
      // Get the stored original session
      const storedSession = localStorage.getItem(ORIGINAL_SESSION_KEY);
      
      if (!storedSession) {
        toast({
          title: "Error",
          description: "Original session not found. Please log in again.",
          variant: "destructive",
        });
        // Sign out as a fallback
        await supabase.auth.signOut();
        setIsImpersonating(false);
        setImpersonatedUser(null);
        setSessionId(null);
        localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
        return;
      }

      const originalSession: Session = JSON.parse(storedSession);

      // Log the end of impersonation (before switching back)
      if (sessionId) {
        try {
          await supabase.functions.invoke('admin-impersonate-user', {
            body: { 
              action: 'end',
              sessionId,
            },
          });
        } catch (e) {
          // Continue even if logging fails
          console.error('Failed to log impersonation end:', e);
        }
      }

      // Restore the original admin session
      const { error } = await supabase.auth.setSession({
        access_token: originalSession.access_token,
        refresh_token: originalSession.refresh_token,
      });

      if (error) {
        toast({
          title: "Error restoring session",
          description: "Please log in again.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
      } else {
        toast({
          title: "Impersonation ended",
          description: "You are back to your admin account.",
        });
      }

      // Clear state
      setIsImpersonating(false);
      setImpersonatedUser(null);
      setSessionId(null);
      localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      localStorage.removeItem(ORIGINAL_SESSION_KEY);

    } catch (error: any) {
      console.error('End impersonation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to end impersonation",
        variant: "destructive",
      });
      // Force sign out as fallback
      await supabase.auth.signOut();
      setIsImpersonating(false);
      setImpersonatedUser(null);
      setSessionId(null);
      localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
      localStorage.removeItem(ORIGINAL_SESSION_KEY);
    }
  }, [sessionId, toast]);

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        impersonatedUser,
        sessionId,
        startImpersonation,
        endImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const context = useContext(ImpersonationContext);
  if (!context) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
}
