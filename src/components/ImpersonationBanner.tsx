import { useImpersonation } from '@/contexts/ImpersonationContext';
import { Button } from '@/components/ui/button';
import { UserCheck, X } from 'lucide-react';

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, endImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-4 text-sm font-medium">
      <div className="flex items-center gap-2">
        <UserCheck className="h-4 w-4" />
        <span>
          Viewing as <strong>{impersonatedUser.full_name}</strong>
          <span className="hidden sm:inline text-amber-800 ml-1">({impersonatedUser.email})</span>
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={endImpersonation}
        className="bg-amber-600/20 border-amber-700/50 text-amber-950 hover:bg-amber-600/40 hover:text-amber-950"
      >
        <X className="h-3 w-3 mr-1" />
        Exit
      </Button>
    </div>
  );
}
