import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanyProfileData {
  companyName: string;
  industry: string;
  fieldEmployees: string;
  annualRevenue?: string;
  yearsInBusiness?: number;
  region?: string;
  companyWebsite?: string;
  referralSource?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  attemptsRemaining?: number;
  blockedUntil?: string;
  retryAfterSeconds?: number;
  message?: string;
  warning?: string;
  cleared?: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, companyData: CompanyProfileData) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  checkRateLimit: (action: 'login' | 'signup' | 'password_reset', email?: string) => Promise<RateLimitResult>;
  clearRateLimit: (action: 'login' | 'signup' | 'password_reset', email?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRateLimit = useCallback(async (
    action: 'login' | 'signup' | 'password_reset',
    email?: string
  ): Promise<RateLimitResult> => {
    try {
      const { data, error } = await supabase.functions.invoke('check-auth-rate-limit', {
        body: { action, email },
      });

      if (error) {
        console.error('Rate limit check error:', error);
        // Fail open - allow the request if rate limit check fails
        return { allowed: true };
      }

      return data as RateLimitResult;
    } catch (err) {
      console.error('Rate limit check failed:', err);
      // Fail open - allow the request if rate limit check fails
      return { allowed: true };
    }
  }, []);

  const clearRateLimit = useCallback(async (
    action: 'login' | 'signup' | 'password_reset',
    email?: string
  ): Promise<void> => {
    try {
      await supabase.functions.invoke('check-auth-rate-limit', {
        body: { action, email, success: true },
      });
    } catch (err) {
      console.error('Failed to clear rate limit:', err);
    }
  }, []);

  const signUp = useCallback(async (
    email: string, 
    password: string, 
    fullName: string,
    companyData: CompanyProfileData
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          company_name: companyData.companyName,
          industry: companyData.industry,
          field_employees: companyData.fieldEmployees,
          annual_revenue: companyData.annualRevenue || null,
          years_in_business: companyData.yearsInBusiness || null,
          region: companyData.region || null,
          company_website: companyData.companyWebsite || null,
          referral_source: companyData.referralSource || null,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Clear rate limit on successful signup
    await clearRateLimit('signup', email);

    // Send welcome email (fire and forget)
    try {
      await supabase.functions.invoke('send-welcome-email', {
        body: { email, fullName },
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return { error: null };
  }, [clearRateLimit]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error };
    }

    // Clear rate limit on successful login
    await clearRateLimit('login', email);

    return { error: null };
  }, [clearRateLimit]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      signUp,
      signIn,
      signOut,
      checkRateLimit,
      clearRateLimit,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
