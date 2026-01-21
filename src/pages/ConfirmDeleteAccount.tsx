import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function ConfirmDeleteAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMessage('No confirmation token provided.');
      return;
    }

    async function confirmDeletion() {
      try {
        const { data, error } = await supabase.functions.invoke('confirm-account-deletion', {
          body: { token },
        });

        if (error) throw error;

        if (data?.success) {
          setStatus('success');
          // Sign out locally
          await supabase.auth.signOut();
        } else {
          throw new Error(data?.error || 'Unknown error');
        }
      } catch (err: any) {
        console.error('Error confirming deletion:', err);
        
        if (err.message?.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
          setErrorMessage(err.message || 'Failed to delete account. Please try again.');
        }
      }
    }

    confirmDeletion();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        {status === 'loading' && (
          <>
            <CardHeader className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
              <CardTitle>Deleting Your Account</CardTitle>
              <CardDescription>
                Please wait while we process your request...
              </CardDescription>
            </CardHeader>
          </>
        )}

        {status === 'success' && (
          <>
            <CardHeader className="text-center">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
              <CardTitle>Account Deleted</CardTitle>
              <CardDescription>
                Your account and all associated data have been permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Thank you for using equipIQ. We're sorry to see you go.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Return to Home
              </Button>
            </CardContent>
          </>
        )}

        {status === 'expired' && (
          <>
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
              <CardTitle>Link Expired</CardTitle>
              <CardDescription>
                This deletion confirmation link has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                For security reasons, deletion links are only valid for 24 hours. 
                Please log in and request a new deletion link from your profile settings.
              </p>
              <Button onClick={() => navigate('/auth')} variant="outline">
                Go to Login
              </Button>
            </CardContent>
          </>
        )}

        {status === 'error' && (
          <>
            <CardHeader className="text-center">
              <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>Something Went Wrong</CardTitle>
              <CardDescription>
                {errorMessage || 'We could not process your deletion request.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Please try again or contact support if the problem persists.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => navigate('/profile')} variant="outline">
                  Go to Profile
                </Button>
                <Button onClick={() => navigate('/feedback')}>
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
