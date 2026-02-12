import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Rocket, 
  Check, 
  ChevronRight, 
  LayoutDashboard, 
  Package, 
  ShieldCheck, 
  Wallet, 
  Scale, 
  FileSpreadsheet, 
  Clock,
  PartyPopper,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Animated checkmark component with scale-in and bounce effect
function AnimatedCheck({ className }: { className?: string }) {
  return (
    <div className="relative">
      <Check 
        className={cn(
          "h-5 w-5 animate-[checkmark-pop_0.4s_ease-out_forwards]",
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
    description: 'Understand your fleet overview and key metrics',
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

function GetStartedSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <Skeleton className="h-1 w-16 mb-4" />
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function GetStarted() {
  const navigate = useNavigate();
  const { 
    progress, 
    loading, 
    isOnboardingComplete, 
    completedCount, 
    totalSteps,
    dismissOnboarding,
    markStepComplete
  } = useOnboarding();

  // Mark dashboard viewed when coming to this page (it's part of exploring the app)
  useEffect(() => {
    if (!loading && progress && !progress.step_dashboard_viewed) {
      markStepComplete('step_dashboard_viewed');
    }
  }, [loading, progress, markStepComplete]);

  if (loading) {
    return (
      <Layout>
        <GetStartedSkeleton />
      </Layout>
    );
  }

  const progressPercent = (completedCount / totalSteps) * 100;

  // Find next incomplete step
  const nextStep = steps.find(step => !progress?.[step.key]);

  const handleDismissAndGo = async () => {
    await dismissOnboarding();
    navigate('/dashboard');
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Rocket className="h-8 w-8 text-primary" />
            Get Started with EquipIQ
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete these steps to master your fleet management
          </p>
        </div>

        {/* Completion State */}
        {isOnboardingComplete ? (
          <Card className="border-success/20 bg-success/5 mb-8">
            <CardContent className="py-8 text-center">
              <PartyPopper className="h-16 w-16 mx-auto mb-4 text-success" />
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                You've completed the Get Started guide. You're ready to manage your fleet like a pro.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={handleDismissAndGo}>
                  Go to Dashboard
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Progress Overview */}
            <Card className="mb-6">
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Your Progress</p>
                    <p className="text-2xl font-bold">{completedCount} of {totalSteps} complete</p>
                  </div>
                  {nextStep && (
                    <Link to={nextStep.href}>
                      <Button>
                        Continue
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </div>
                <Progress value={progressPercent} className="h-3" />
              </CardContent>
            </Card>

            {/* Steps List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Onboarding Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, index) => {
                  const isComplete = progress?.[step.key] ?? false;
                  const StepIcon = step.icon;
                  const isNext = nextStep?.key === step.key;
                  
                  return (
                    <Link
                      key={step.key}
                      to={step.href}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-lg transition-all group',
                        isComplete 
                          ? 'bg-muted/50' 
                          : isNext
                            ? 'bg-accent/5 border-2 border-accent/20 hover:border-accent/40'
                            : 'bg-card hover:bg-muted/50 border'
                      )}
                    >
                      {/* Step number or check */}
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 transition-all duration-300',
                        isComplete 
                          ? 'bg-success text-success-foreground' 
                          : isNext
                            ? 'bg-accent text-accent-foreground'
                            : 'bg-muted'
                      )}>
                        {isComplete ? (
                          <AnimatedCheck />
                        ) : (
                          <span className="text-sm font-medium">{index + 1}</span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          'font-medium transition-all duration-300',
                          isComplete && 'text-muted-foreground line-through'
                        )}>
                          {step.label}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                      
                      {/* Icon */}
                      <StepIcon className={cn(
                        'h-5 w-5 flex-shrink-0 transition-colors',
                        isComplete 
                          ? 'text-muted-foreground' 
                          : 'text-muted-foreground group-hover:text-foreground'
                      )} />
                      
                      {/* Arrow */}
                      {!isComplete && (
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </CardContent>
            </Card>

            {/* Dismiss option */}
            <div className="mt-6 text-center">
              <Button 
                variant="ghost" 
                className="text-muted-foreground"
                onClick={handleDismissAndGo}
              >
                Skip for now, I'll explore on my own
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}