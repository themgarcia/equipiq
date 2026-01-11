import { useState } from 'react';
import { AlertTriangle, Send, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { InsuranceChangeLog, InsuranceSettings, InsuredEquipment } from '@/types/insurance';
import {
  generateChangeSummaryTemplate,
  generateFullRegisterTemplate,
  generateChangeEmailSubject,
  generateRegisterEmailSubject,
} from '@/lib/insuranceTemplates';
import { supabase } from '@/integrations/supabase/client';

interface BrokerEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'changes' | 'full_register';
  settings: InsuranceSettings | null;
  changes?: InsuranceChangeLog[];
  equipment?: InsuredEquipment[];
  userProfile: { fullName: string; companyName: string; email: string } | null;
}

export function BrokerEmailModal({
  open,
  onOpenChange,
  type,
  settings,
  changes = [],
  equipment = [],
  userProfile,
}: BrokerEmailModalProps) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  const templateContext = {
    userName: userProfile?.fullName || 'User',
    companyName: userProfile?.companyName || 'Company',
    userEmail: userProfile?.email || '',
    brokerName: settings?.brokerName || '',
  };

  const template = type === 'changes'
    ? generateChangeSummaryTemplate(changes, templateContext)
    : generateFullRegisterTemplate(equipment, templateContext);

  const subject = type === 'changes'
    ? generateChangeEmailSubject(userProfile?.companyName || 'Company')
    : generateRegisterEmailSubject(userProfile?.companyName || 'Company');

  const handleCopy = () => {
    navigator.clipboard.writeText(template);
    toast({
      title: "Copied to clipboard",
      description: "Email content is ready to paste. Don't forget to mark as sent!",
    });
    onOpenChange(false);
  };

  const handleSendEmail = async () => {
    if (!settings?.brokerEmail) {
      toast({
        title: "No broker email",
        description: "Please add your broker's email in settings first.",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-broker-update', {
        body: {
          type,
          brokerEmail: settings.brokerEmail,
          brokerName: settings.brokerName,
          subject,
          content: template,
          ccUserEmail: userProfile?.email,
          changeIds: type === 'changes' ? changes.map(c => c.id) : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Email sent",
        description: `Email sent to ${settings.brokerEmail}. You were CC'd for verification.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again or use the copy option.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send to Broker</DialogTitle>
          <DialogDescription>
            {type === 'changes' 
              ? 'Send pending insurance changes to your broker'
              : 'Send your complete insured equipment register to your broker'
            }
          </DialogDescription>
        </DialogHeader>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <strong>Recommended:</strong> Use "Copy to Clipboard" and send from your own email for better deliverability. 
            Direct email sending may land in spam folders.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">To:</p>
            <p className="text-sm text-muted-foreground">
              {settings?.brokerEmail || 'No broker email set'}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Subject:</p>
            <p className="text-sm text-muted-foreground">{subject}</p>
          </div>

          <div>
            <p className="text-sm font-medium mb-1">Preview:</p>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {template}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleCopy}>
            <Copy className="h-4 w-4 mr-2" />
            Copy to Clipboard
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button 
                    variant="secondary" 
                    disabled
                    className="opacity-50 cursor-not-allowed"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Email (CC me)
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Coming Soon</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
