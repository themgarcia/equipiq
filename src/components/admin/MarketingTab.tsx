import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Megaphone, Mail, Send, Loader2 } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketInsight {
  name: string;
  value: number;
  label?: string;
}

interface MarketingTabProps {
  referralSourceStats: MarketInsight[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function MarketingTab({ referralSourceStats }: MarketingTabProps) {
  const { toast } = useToast();
  const [sendingTestEmail, setSendingTestEmail] = useState<string | null>(null);

  const sendTestEmail = async (emailType: 'welcome' | 'password-reset') => {
    setSendingTestEmail(emailType);
    try {
      const { data, error } = await supabase.functions.invoke('admin-test-email', {
        body: { emailType },
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
        description: `Check your inbox at ${data.sentTo}`,
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingTestEmail(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Referral Source Analytics */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Referral Source Analytics</CardTitle>
          </div>
          <CardDescription>Track where signups are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          {referralSourceStats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No referral data yet</p>
              <p className="text-sm">Data will appear as users sign up with referral source</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div>
                <h4 className="text-sm font-medium mb-3">Distribution</h4>
                <ChartContainer
                  config={Object.fromEntries(
                    referralSourceStats.map((stat, index) => [
                      stat.name,
                      { label: stat.label, color: CHART_COLORS[index % CHART_COLORS.length] },
                    ])
                  )}
                  className="h-[250px]"
                >
                  <PieChart>
                    <Pie
                      data={referralSourceStats}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                    >
                      {referralSourceStats.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </div>

              {/* Stats Table */}
              <div>
                <h4 className="text-sm font-medium mb-3">Breakdown</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {referralSourceStats.map((stat) => {
                      const totalReferrals = referralSourceStats.reduce((sum, s) => sum + s.value, 0);
                      const percentage = totalReferrals > 0 ? ((stat.value / totalReferrals) * 100).toFixed(1) : '0';
                      return (
                        <TableRow key={stat.name}>
                          <TableCell className="font-medium">{stat.label}</TableCell>
                          <TableCell className="text-right">{stat.value}</TableCell>
                          <TableCell className="text-right">{percentage}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Sources Cards */}
      {referralSourceStats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {referralSourceStats.slice(0, 4).map((stat, index) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Badge variant={index === 0 ? 'default' : 'secondary'}>
                  #{index + 1}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {((stat.value / referralSourceStats.reduce((sum, s) => sum + s.value, 0)) * 100).toFixed(1)}% of referrals
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Email Tools Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Marketing & Communications</CardTitle>
          </div>
          <CardDescription>Tools for user communication and marketing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Email Templates Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium">Test Email Templates</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Send sample emails to your own inbox to verify templates before sending to users.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => sendTestEmail('welcome')}
                disabled={sendingTestEmail !== null}
                className="gap-2"
              >
                {sendingTestEmail === 'welcome' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Welcome Email
              </Button>
              <Button
                variant="outline"
                onClick={() => sendTestEmail('password-reset')}
                disabled={sendingTestEmail !== null}
                className="gap-2"
              >
                {sendingTestEmail === 'password-reset' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Password Changed Email
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
