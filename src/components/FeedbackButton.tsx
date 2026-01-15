import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FeedbackDialog } from './FeedbackDialog';
import { useLocation } from 'react-router-dom';

export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  // Don't show on landing, auth, or feedback page
  const hiddenPaths = ['/', '/auth', '/feedback', '/privacy', '/terms'];
  if (hiddenPaths.includes(location.pathname)) {
    return null;
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={() => setOpen(true)}
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-primary hover:bg-primary/90"
            aria-label="Send feedback"
          >
            <MessageSquarePlus className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Send feedback</p>
        </TooltipContent>
      </Tooltip>
      
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
