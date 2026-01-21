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
    <div className="sticky top-0 z-40 bg-warning/90 backdrop-blur-sm text-warning-foreground">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Eye className="h-4 w-4" />
          {getMessage()}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExit}
          className="h-7 px-2 text-warning-foreground hover:bg-warning-foreground/10"
        >
          <X className="h-4 w-4 mr-1" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
}
