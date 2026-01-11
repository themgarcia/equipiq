import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';

export function DeleteAccountDialog() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-account');
      
      if (error) throw error;
      
      toast({
        title: 'Account deleted',
        description: 'Your account and all associated data have been permanently deleted.',
      });
      
      // Sign out and redirect
      await signOut();
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error deleting account',
        description: 'There was a problem deleting your account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setIsOpen(false);
      setConfirmText('');
    }
  };

  const confirmationPhrase = 'DELETE';
  const isConfirmed = confirmText === confirmationPhrase;

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
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
          <AlertDialogCancel onClick={() => setConfirmText('')} disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
