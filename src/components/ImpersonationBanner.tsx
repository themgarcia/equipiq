import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { UserCheck, X } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, endImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <div className="bg-warning text-warning-foreground px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4" />
        <span>
          Viewing as <strong>{impersonatedUser.full_name}</strong>
          <span className="hidden sm:inline text-warning-foreground/80 ml-1">({impersonatedUser.email})</span>
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={endImpersonation}
        className="bg-warning-foreground/10 border-warning-foreground/30 text-warning-foreground hover:bg-warning-foreground/20 hover:text-warning-foreground"
      >
        <X className="h-3 w-3 mr-1" />
        Exit
      </Button>
    </div>
  );
}
