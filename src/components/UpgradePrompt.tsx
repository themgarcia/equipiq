import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradePromptProps {
  feature: string;
  description?: string;
  variant?: 'inline' | 'modal' | 'banner';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function UpgradePrompt({
  feature,
  description,
  variant = 'inline',
  open,
  onOpenChange,
}: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);

  if (variant === 'modal') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Beta Feature
            </DialogTitle>
            <DialogDescription>
              {description || `${feature} is available during the open beta.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="rounded-lg bg-primary/5 p-4 border border-primary/20">
              <h4 className="font-medium text-foreground mb-2">Open Beta Access Includes:</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Full access to {feature}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Unlimited equipment tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  All analysis tools included
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">✓</span>
                  Direct feedback channel
                </li>
              </ul>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange?.(false)}>
                Got It
              </Button>
              <Button asChild className="flex-1">
                <Link to="/feedback">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Give Feedback
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (variant === 'banner' && !dismissed) {
    return (
      <div className="relative rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 mb-6">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-foreground">{feature}</h4>
              <p className="text-sm text-muted-foreground">
                {description || 'Available during open beta. Share your feedback!'}
              </p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/feedback">
              Feedback
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <div className="rounded-lg bg-muted/50 border border-border p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      <h3 className="font-semibold text-foreground mb-2">{feature}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
        {description || `This feature is available during the open beta period. Have feedback?`}
      </p>
      <Button asChild>
        <Link to="/feedback">
          Share Feedback
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
