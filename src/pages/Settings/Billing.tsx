import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useSubscription } from '@/hooks/useSubscription';
import { UsageMeter, formatBytes } from '@/components/UsageMeter';
import { Loader2, Sparkles, CheckCircle2, Crown, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Billing() {
  const { subscription, usage, limits, refreshSubscription, isDemo } = useSubscription();

  if (subscription.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="space-y-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">Billing & Subscription</h1>
            <p className="text-muted-foreground mt-1">View your access and usage</p>
          </div>

          {/* Demo Mode Banner */}
          {isDemo && (
            <Card className="border-amber-500/50 bg-amber-500/10">
              <CardContent className="py-3">
                <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Crown className="h-4 w-4" />
                  Demo Mode: Simulating full access. Changes won't be saved.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Open Beta Access Card */}
          <Card className="border-primary">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-3">
                    Open Beta Access
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Beta
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    You have full access to all features during the open beta period
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Usage Meters */}
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

          {/* Beta Features Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Included</CardTitle>
              <CardDescription>
                Full access to all equipIQ features during the beta period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Unlimited equipment tracking</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Full Buy vs Rent analysis</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Complete cashflow analysis</span>
                  </li>
                </ul>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>LMN FMS export</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Document storage & AI parsing</span>
                  </li>
                  <li className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Category lifespan management</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Beta Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="flex-1 space-y-2">
                  <h3 className="font-semibold text-foreground">About the Open Beta</h3>
                  <p className="text-sm text-muted-foreground">
                    We're working closely with contractors like you to refine equipIQ. 
                    Your feedback helps us build the features that matter most. 
                    Pricing will be announced when the beta period ends—beta participants 
                    will receive advance notice.
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/feedback">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Give Feedback
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={() => refreshSubscription()}>
            Refresh Status
          </Button>
        </div>
      </div>
    </Layout>
  );
}
