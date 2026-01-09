import { useAdminMode } from '@/contexts/AdminModeContext';
import { Button } from '@/components/ui/button';
import { X, Eye } from 'lucide-react';

export function DemoModeBanner() {
  const { adminModeActive, demoPlan, demoDataEnabled, setDemoPlan, setDemoDataEnabled } = useAdminMode();

  // Only show if admin mode is active AND either demo plan or demo data is enabled
  if (!adminModeActive || (!demoPlan && !demoDataEnabled)) return null;

  const planLabel = demoPlan 
    ? demoPlan.charAt(0).toUpperCase() + demoPlan.slice(1) 
    : 'Real';

  const getMessage = () => {
    if (demoPlan && demoDataEnabled) {
      return `Viewing as ${planLabel} User with Demo Data`;
    } else if (demoPlan) {
      return `Viewing as ${planLabel} User (Real Data)`;
    } else if (demoDataEnabled) {
      return `Demo Data Active (Real Plan)`;
    }
    return '';
  };

  const handleExit = () => {
    setDemoPlan(null);
    setDemoDataEnabled(false);
  };

  return (
    <div className="sticky top-0 z-40 bg-amber-500/90 dark:bg-amber-600/90 backdrop-blur-sm text-amber-950 dark:text-amber-50">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4" />
          {getMessage()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          className="h-7 px-2 text-amber-950 dark:text-amber-50 hover:bg-amber-600/30 dark:hover:bg-amber-500/30"
        >
          <X className="h-4 w-4 mr-1" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
}
