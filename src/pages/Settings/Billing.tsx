import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { UsageMeter, formatBytes } from '@/components/UsageMeter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Zap, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Billing() {
  const { subscription, usage, limits, refreshSubscription } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async (plan: 'professional' | 'business', interval: 'monthly' | 'annual') => {
    setCheckoutLoading(`${plan}-${interval}`);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { plan, interval },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to create checkout session',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to open billing portal',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  if (subscription.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const planBadgeColor = {
    free: 'bg-muted text-muted-foreground',
    professional: 'bg-primary text-primary-foreground',
    business: 'bg-purple-500 text-white',
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-1">Manage your subscription and view usage</p>
        </div>

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-3">
                  Current Plan
                  <Badge className={cn('capitalize', planBadgeColor[subscription.plan])}>
                    {subscription.plan}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {subscription.isSubscribed && subscription.subscriptionEnd && (
                    <>Next billing date: {new Date(subscription.subscriptionEnd).toLocaleDateString()}</>
                  )}
                  {subscription.inGracePeriod && (
                    <span className="text-yellow-600">Grace period ends: {new Date(subscription.gracePeriodEndsAt!).toLocaleDateString()}</span>
                  )}
                  {!subscription.isSubscribed && !subscription.inGracePeriod && (
                    <>You're on the free plan</>
                  )}
                </CardDescription>
              </div>
              {subscription.isSubscribed && (
                <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
                  {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                  Manage Billing
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <UsageMeter
                current={usage.totalItemCount}
                max={limits.maxItems}
                label="Equipment + Attachments"
              />
              <UsageMeter
                current={usage.storageUsedBytes}
                max={limits.maxStorageBytes}
                label="Document Storage"
                formatValue={formatBytes}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upgrade Options */}
        {subscription.plan !== 'business' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {subscription.plan === 'free' ? 'Upgrade Your Plan' : 'Available Plans'}
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Professional */}
              {subscription.plan === 'free' && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Professional
                    </CardTitle>
                    <CardDescription>For growing contractors</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        50 equipment + attachments
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Full Buy vs Rent & Cashflow
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        AI parsing & email alerts
                      </li>
                    </ul>
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => handleCheckout('professional', 'annual')}
                        disabled={checkoutLoading !== null}
                      >
                        {checkoutLoading === 'professional-annual' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        $349/year
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleCheckout('professional', 'monthly')}
                        disabled={checkoutLoading !== null}
                      >
                        {checkoutLoading === 'professional-monthly' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        $39/mo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Business */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Business
                  </CardTitle>
                  <CardDescription>For large fleets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Unlimited equipment
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Unlimited document storage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      Priority support
                    </li>
                  </ul>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleCheckout('business', 'annual')}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === 'business-annual' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      $799/year
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleCheckout('business', 'monthly')}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === 'business-monthly' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      $89/mo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        <Button variant="ghost" onClick={() => refreshSubscription()}>
          Refresh Subscription Status
        </Button>
      </div>
    </Layout>
  );
}