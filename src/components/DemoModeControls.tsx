import { useAdminMode } from '@/contexts/AdminModeContext';
import { SubscriptionPlan } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RotateCcw, Eye } from 'lucide-react';

export function DemoModeControls() {
  const { adminModeActive, demoPlan, setDemoPlan, demoDataEnabled, setDemoDataEnabled } = useAdminMode();

  if (!adminModeActive) return null;

  const handlePlanChange = (value: string) => {
    if (value === 'real') {
      setDemoPlan(null);
    } else {
      setDemoPlan(value as SubscriptionPlan);
    }
  };

  const handleReset = () => {
    setDemoPlan(null);
    setDemoDataEnabled(false);
  };

  const hasAnyDemoActive = demoPlan !== null || demoDataEnabled;

  return (
    <div className="space-y-3 p-3 rounded-lg bg-sidebar-accent/30 border border-sidebar-border">
      <div className="flex items-center gap-2 text-xs font-medium text-sidebar-foreground">
        <Eye className="h-3.5 w-3.5" />
        Demo Mode Controls
      </div>

      {/* Plan Selector */}
      <div className="space-y-1.5">
        <Label className="text-xs text-sidebar-foreground/70">Simulate Plan</Label>
        <Select value={demoPlan || 'real'} onValueChange={handlePlanChange}>
          <SelectTrigger className="h-8 text-xs bg-sidebar border-sidebar-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="real">Real Subscription</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="professional">Professional</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Demo Data Toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-xs text-sidebar-foreground/70">Use Demo Data</Label>
        <Switch
          checked={demoDataEnabled}
          onCheckedChange={setDemoDataEnabled}
          className="scale-75"
        />
      </div>

      {/* Reset Button */}
      {hasAnyDemoActive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="w-full h-7 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground"
        >
          <RotateCcw className="h-3 w-3 mr-1.5" />
          Reset to Real
        </Button>
      )}
    </div>
  );
}
