import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, AlertTriangle, Mail, CheckCircle2, ShieldAlert } from 'lucide-react';

export function DeleteAccountDialog() {
  const { user } = useAuth();
  const { isImpersonating } = useImpersonation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Block account deletion during impersonation
  if (isImpersonating) {
    return (
      <Button variant="destructive" className="w-full sm:w-auto" disabled>
        <ShieldAlert className="mr-2 h-4 w-4" />
        Disabled During Impersonation
      </Button>
    );
  }

  const handleRequestDeletion = async () => {
    if (!user) return;
    
    setIsRequesting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('request-account-deletion', {
        body: { baseUrl: window.location.origin },
      });
      
      if (error) throw error;
      
      setEmailSent(true);
      toast({
        title: 'Confirmation email sent',
        description: 'Please check your email to confirm account deletion.',
      });
      
    } catch (error) {
      console.error('Error requesting account deletion:', error);
      toast({
        title: 'Error',
        description: 'Failed to send confirmation email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRequesting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setConfirmText('');
    setEmailSent(false);
  };

  const confirmationPhrase = 'DELETE';
  const isConfirmed = confirmText === confirmationPhrase;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
      else setIsOpen(true);
    }}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        {!emailSent ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Delete Your Account?
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  This action is <strong>permanent and cannot be undone</strong>. All of your data will be deleted, including:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>All equipment records and attachments</li>
                  <li>All uploaded documents</li>
                  <li>Insurance settings and change history</li>
                  <li>Feedback submissions</li>
                  <li>Your profile and preferences</li>
                  <li>Subscription and billing history</li>
                </ul>
                <p className="text-sm">
                  For security, we'll send a confirmation email to <strong>{user?.email}</strong>. 
                  You must click the link in that email to complete the deletion.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <div className="py-4">
              <Label htmlFor="confirm-delete" className="text-sm font-medium">
                Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm-delete"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="mt-2"
                autoComplete="off"
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isRequesting}>
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleRequestDeletion}
                disabled={!isConfirmed || isRequesting}
              >
                {isRequesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Confirmation Email
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-5 w-5" />
                Confirmation Email Sent
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p>
                  We've sent a confirmation email to <strong>{user?.email}</strong>.
                </p>
                <p>
                  Please check your inbox and click the confirmation link to complete the account deletion. 
                  The link will expire in 24 hours.
                </p>
                <p className="text-sm text-muted-foreground">
                  If you don't see the email, check your spam folder.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <AlertDialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
