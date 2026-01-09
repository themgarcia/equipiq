import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription, SubscriptionPlan } from '@/hooks/useSubscription';
import { UsageMeter, formatBytes } from '@/components/UsageMeter';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Zap, Users, CheckCircle2, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const PLAN_ORDER: Record<SubscriptionPlan, number> = { 
  free: 0, 
  professional: 1, 
  business: 2 
};

export default function Billing() {
  const { subscription, usage, limits, refreshSubscription, effectivePlan, isDemo } = useSubscription();
  const { toast } = useToast();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const currentPlanLevel = PLAN_ORDER[effectivePlan];

  const getPlanAction = (targetPlan: SubscriptionPlan): 'current' | 'upgrade' | 'downgrade' => {
    const targetLevel = PLAN_ORDER[targetPlan];
    if (targetLevel === currentPlanLevel) return 'current';
    if (targetLevel > currentPlanLevel) return 'upgrade';
    return 'downgrade';
  };

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

  const planBadgeColor: Record<SubscriptionPlan, string> = {
    free: 'bg-muted text-muted-foreground',
    professional: 'bg-primary text-primary-foreground',
    business: 'bg-purple-500 text-white',
  };

  const renderPlanCard = (
    plan: SubscriptionPlan,
    title: string,
    description: string,
    icon: React.ReactNode,
    features: string[],
    pricing?: { monthly: string; annual: string }
  ) => {
    const action = getPlanAction(plan);
    const isCurrent = action === 'current';
    const isUpgrade = action === 'upgrade';
    const isDowngrade = action === 'downgrade';

    return (
      <Card className={cn(
        "relative transition-all",
        isCurrent && "ring-2 ring-primary border-primary",
        isDowngrade && "opacity-75"
      )}>
        {isCurrent && (
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground shadow-md">
            <Crown className="h-3 w-3 mr-1" />
            Current Plan
          </Badge>
        )}
        <CardHeader className={cn(isCurrent && "pt-6")}>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-sm">
            {features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {pricing ? (
            <div className="flex gap-2">
              {isCurrent ? (
                <Button className="flex-1" variant="secondary" disabled>
                  <Crown className="h-4 w-4 mr-2" />
                  Your Plan
                </Button>
              ) : isUpgrade ? (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => handleCheckout(plan as 'professional' | 'business', 'annual')}
                    disabled={checkoutLoading !== null || isDemo}
                  >
                    {checkoutLoading === `${plan}-annual` && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    <Sparkles className="h-4 w-4 mr-1" />
                    {pricing.annual}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCheckout(plan as 'professional' | 'business', 'monthly')}
                    disabled={checkoutLoading !== null || isDemo}
                  >
                    {checkoutLoading === `${plan}-monthly` && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {pricing.monthly}
                  </Button>
                </>
              ) : (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={portalLoading || isDemo}
                >
                  {portalLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Downgrade via Portal
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              {isCurrent ? (
                <Button className="flex-1" variant="secondary" disabled>
                  <Crown className="h-4 w-4 mr-2" />
                  Your Plan
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={handleManageBilling}
                  disabled={portalLoading || isDemo}
                >
                  {portalLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Downgrade via Portal
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="space-y-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground mt-1">Manage your subscription and view usage</p>
          </div>

          {/* Demo Mode Banner */}
          {isDemo && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="py-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Demo Mode: Simulating <span className="font-semibold capitalize">{effectivePlan}</span> plan. 
                  Checkout buttons are disabled.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    Current Plan
                    <Badge className={cn('capitalize', planBadgeColor[effectivePlan])}>
                      {effectivePlan}
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
                {(subscription.isSubscribed || effectivePlan !== 'free') && (
                  <Button variant="outline" onClick={handleManageBilling} disabled={portalLoading || isDemo}>
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

          {/* Plan Options */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              {effectivePlan === 'free' ? 'Upgrade Your Plan' : 
               effectivePlan === 'business' ? 'Plan Comparison' : 'Manage Your Plan'}
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Free Plan */}
              {renderPlanCard(
                'free',
                'Free',
                'Get started',
                <Zap className="h-5 w-5 text-muted-foreground" />,
                [
                  '5 equipment + attachments',
                  '100 MB storage',
                  'Basic depreciation tracking',
                ]
              )}

              {/* Professional Plan */}
              {renderPlanCard(
                'professional',
                'Professional',
                'For growing contractors',
                <Zap className="h-5 w-5 text-primary" />,
                [
                  '50 equipment + attachments',
                  '2 GB storage',
                  'Full Buy vs Rent & Cashflow',
                  'AI parsing & email alerts',
                ],
                { monthly: '$39/mo', annual: '$349/year' }
              )}

              {/* Business Plan */}
              {renderPlanCard(
                'business',
                'Business',
                'For large fleets',
                <Users className="h-5 w-5 text-purple-500" />,
                [
                  'Unlimited equipment',
                  'Unlimited storage',
                  'Priority support',
                  'Everything in Professional',
                ],
                { monthly: '$89/mo', annual: '$799/year' }
              )}
            </div>
          </div>

          <Button variant="ghost" onClick={() => refreshSubscription()}>
            Refresh Subscription Status
          </Button>
        </div>
      </div>
    </Layout>
  );
}