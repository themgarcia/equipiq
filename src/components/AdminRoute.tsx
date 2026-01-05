import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: adminLoading, adminModeActive } = useAdminMode();
  const location = useLocation();
  const { toast } = useToast();
  const hasShownToast = useRef(false);

  const isLoading = authLoading || adminLoading;

  useEffect(() => {
    if (!isLoading && user && !isAdmin && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: "Access denied",
        description: "You don't have permission to access the admin area.",
        variant: "destructive",
      });
    }
  }, [isLoading, user, isAdmin, toast]);

  useEffect(() => {
    if (!isLoading && isAdmin && !adminModeActive && !hasShownToast.current) {
      hasShownToast.current = true;
      toast({
        title: "Admin mode required",
        description: "Please enable admin mode to access this page.",
      });
    }
  }, [isLoading, isAdmin, adminModeActive, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin || !adminModeActive) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
