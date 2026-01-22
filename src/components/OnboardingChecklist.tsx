import { Link } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  X, 
  Check, 
  ChevronRight, 
  LayoutDashboard, 
  Package, 
  ShieldCheck, 
  Wallet, 
  Scale, 
  FileSpreadsheet, 
  Clock,
  PartyPopper
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Animated checkmark component with scale-in and bounce effect
function AnimatedCheck({ className }: { className?: string }) {
  return (
    <div className="relative">
      <Check 
        className={cn(
          "h-4 w-4 animate-[checkmark-pop_0.4s_ease-out_forwards]",
          className
        )} 
      />
    </div>
  );
}

interface OnboardingStep {
  key: 'step_dashboard_viewed' | 'step_equipment_imported' | 'step_insurance_uploaded' | 'step_cashflow_viewed' | 'step_buy_vs_rent_used' | 'step_fms_exported' | 'step_methodology_reviewed';
  label: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const steps: OnboardingStep[] = [
  {
    key: 'step_dashboard_viewed',
    label: 'Dashboard Tour',
    description: 'Understand your fleet overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'step_equipment_imported',
    label: 'Add Your First Equipment',
    description: 'Import or enter your most valuable piece',
    href: '/equipment',
    icon: Package,
  },
  {
    key: 'step_insurance_uploaded',
    label: 'Review Insurance Coverage',
    description: 'Upload policy or verify an item\'s coverage',
    href: '/insurance',
    icon: ShieldCheck,
  },
  {
    key: 'step_cashflow_viewed',
    label: 'Analyze Cash Flow',
    description: 'See net recovery on financed items',
    href: '/cashflow',
    icon: Wallet,
  },
  {
    key: 'step_buy_vs_rent_used',
    label: 'Try Buy vs Rent',
    description: 'Evaluate your next purchase decision',
    href: '/buy-vs-rent',
    icon: Scale,
  },
  {
    key: 'step_fms_exported',
    label: 'Explore FMS Export',
    description: 'Preview how to sync with your FMS',
    href: '/export',
    icon: FileSpreadsheet,
  },
  {
    key: 'step_methodology_reviewed',
    label: 'Understand Our Methodology',
    description: 'Review lifespan assumptions and definitions',
    href: '/categories',
    icon: Clock,
  },
];

export function OnboardingChecklist() {
  const { 
    progress, 
    loading, 
    isOnboardingComplete, 
    showOnboarding, 
    completedCount, 
    totalSteps,
    dismissOnboarding 
  } = useOnboarding();

  if (loading || !showOnboarding) {
    return null;
  }

  const progressPercent = (completedCount / totalSteps) * 100;

  return (
    <Card className="border-primary/20 bg-primary/5" id="get-started">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Get Started
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={dismissOnboarding}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete these steps to master EquipIQ
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {completedCount} of {totalSteps} complete
          </p>
        </div>

        {/* Steps list */}
        <div className="space-y-2">
          {steps.map((step) => {
            const isComplete = progress?.[step.key] ?? false;
            const StepIcon = step.icon;
            
            return (
              <Link
                key={step.key}
                to={step.href}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg transition-colors group',
                  isComplete 
                    ? 'bg-muted/50' 
                    : 'bg-card hover:bg-muted/50 border'
                )}
              >
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 transition-all duration-300',
                  isComplete 
                    ? 'bg-success text-success-foreground scale-100' 
                    : 'bg-muted scale-100'
                )}>
                  {isComplete ? (
                    <AnimatedCheck />
                  ) : (
                    <StepIcon className="h-4 w-4 text-muted-foreground transition-opacity duration-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium transition-all duration-300',
                    isComplete && 'text-muted-foreground line-through'
                  )}>
                    {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {step.description}
                  </p>
                </div>
                {!isComplete && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Dismiss button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full text-muted-foreground"
          onClick={dismissOnboarding}
        >
          Dismiss for now
        </Button>
      </CardContent>
    </Card>
  );
}

export function OnboardingCompleteBanner() {
  const { isOnboardingComplete, dismissOnboarding, progress } = useOnboarding();

  // Show celebration banner only when just completed (completed but not dismissed)
  if (!isOnboardingComplete || progress?.dismissed_at) {
    return null;
  }

  return (
    <Card className="border-success/20 bg-success/5" id="get-started">
      <CardContent className="py-6 text-center">
        <PartyPopper className="h-12 w-12 mx-auto mb-4 text-success" />
        <h3 className="text-lg font-semibold mb-2">You're All Set!</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You've completed the Get Started guide. You're ready to manage your fleet like a pro.
        </p>
        <Button variant="outline" size="sm" onClick={dismissOnboarding}>
          Hide this card
        </Button>
      </CardContent>
    </Card>
  );
}
