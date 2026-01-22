import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Rocket, ArrowRight, Sparkles } from 'lucide-react';

const WELCOME_SEEN_KEY = 'equipiq_welcome_seen';

export function WelcomeModal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { progress, loading, completedCount } = useOnboarding();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Don't show if still loading or no user
    if (loading || !user || !progress) return;

    // Check if user has already seen the welcome modal
    const welcomeSeen = localStorage.getItem(WELCOME_SEEN_KEY);
    if (welcomeSeen) return;

    // Show modal only for fresh users (no steps completed except maybe dashboard_viewed)
    const isNewUser = completedCount <= 1 && !progress.dismissed_at && !progress.completed_at;
    
    if (isNewUser) {
      // Small delay for smooth experience after page load
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, [loading, user, progress, completedCount]);

  const handleGetStarted = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, new Date().toISOString());
    setOpen(false);
    navigate('/get-started');
  };

  const handleExplore = () => {
    localStorage.setItem(WELCOME_SEEN_KEY, new Date().toISOString());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl">Welcome to EquipIQ!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            You're all set up and ready to take control of your fleet finances.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Quick Setup Guide</p>
                <p className="text-sm text-muted-foreground">
                  We've prepared a 7-step checklist to help you get the most out of EquipIQ in just a few minutes.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            <Button onClick={handleGetStarted} className="w-full">
              Start the Guide
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button variant="ghost" onClick={handleExplore} className="w-full text-muted-foreground">
              I'll explore on my own
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}