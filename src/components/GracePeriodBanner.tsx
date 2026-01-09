import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GracePeriodBannerProps {
  daysLeft: number;
  plan: string;
}

export function GracePeriodBanner({ daysLeft, plan }: GracePeriodBannerProps) {
  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/20">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              <span className="font-medium">Your {plan} subscription has ended.</span>
              {' '}You have {daysLeft} day{daysLeft !== 1 ? 's' : ''} left of full access before downgrading to the Free plan.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="border-yellow-500/50 hover:bg-yellow-500/10 flex-shrink-0">
            <Link to="/settings/billing">
              Resubscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
