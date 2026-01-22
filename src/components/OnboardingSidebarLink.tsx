import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Rocket } from 'lucide-react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OnboardingSidebarLinkProps {
  isCollapsed?: boolean;
}

export function OnboardingSidebarLink({ isCollapsed = false }: OnboardingSidebarLinkProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { completedCount, totalSteps, isOnboardingComplete, isOnboardingDismissed, restartOnboarding, loading } = useOnboarding();

  if (loading) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If dismissed, restart onboarding first
    if (isOnboardingDismissed) {
      await restartOnboarding();
    }
    
    navigate('/get-started');
  };

  const isActive = location.pathname === '/get-started';

  return (
    <SidebarMenuItem className={cn(isCollapsed && "w-full flex justify-center")}>
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarMenuButton
            onClick={handleClick}
            isActive={isActive}
            className={cn(
              'transition-all cursor-pointer',
              isCollapsed && 'w-8 justify-center',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <Rocket className={cn(
              'h-5 w-5 flex-shrink-0',
              isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50'
            )} />
            {isCollapsed ? (
              <span className="sr-only">Get Started</span>
            ) : (
              <>
                <span className="flex-1">Get Started</span>
                {!isOnboardingComplete && (
                  <Badge 
                    variant="secondary" 
                    className="ml-auto h-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0"
                  >
                    {completedCount}/{totalSteps}
                  </Badge>
                )}
              </>
            )}
          </SidebarMenuButton>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            Get Started {!isOnboardingComplete && `(${completedCount}/${totalSteps})`}
          </TooltipContent>
        )}
      </Tooltip>
    </SidebarMenuItem>
  );
}

interface OnboardingMobileLinkProps {
  className?: string;
}

export function OnboardingMobileLink({ className }: OnboardingMobileLinkProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { completedCount, totalSteps, isOnboardingComplete, isOnboardingDismissed, restartOnboarding, loading } = useOnboarding();

  if (loading) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If dismissed, restart onboarding first
    if (isOnboardingDismissed) {
      await restartOnboarding();
    }
    
    navigate('/get-started');
  };

  const isActive = location.pathname === '/get-started';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all w-full text-left',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
        className
      )}
    >
      <Rocket className={cn(
        'h-5 w-5 flex-shrink-0 transition-colors',
        isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/70'
      )} />
      <span className="flex-1">Get Started</span>
      {!isOnboardingComplete && (
        <Badge 
          variant="secondary" 
          className="h-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary border-0"
        >
          {completedCount}/{totalSteps}
        </Badge>
      )}
    </button>
  );
}
