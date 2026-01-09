import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Package, DollarSign, TrendingUp, Wallet, Building2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  getIndustryLabel, 
  getFieldEmployeesLabel, 
  getAnnualRevenueLabel, 
  getRegionLabel 
} from '@/data/signupOptions';

interface UserStats {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  equipmentCount: number;
  totalValue: number;
  companyName: string | null;
  industry: string | null;
  fieldEmployees: string | null;
  annualRevenue: string | null;
  region: string | null;
  betaAccess: boolean;
  betaAccessGrantedAt: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  billingInterval: string | null;
}

interface CategoryStats {
  category: string;
  count: number;
  avgPurchasePrice: number;
  totalValue: number;
  avgAge: number;
}

interface FinancingStats {
  type: string;
  count: number;
  totalAmount: number;
  totalPurchaseValue: number;
}

interface MarketInsight {
  name: string;
  value: number;
  label?: string;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export default function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [financingStats, setFinancingStats] = useState<FinancingStats[]>([]);
  const [industryStats, setIndustryStats] = useState<MarketInsight[]>([]);
  const [companySizeStats, setCompanySizeStats] = useState<MarketInsight[]>([]);
  const [revenueStats, setRevenueStats] = useState<MarketInsight[]>([]);
  const [regionStats, setRegionStats] = useState<MarketInsight[]>([]);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalEquipment: 0,
    totalFleetValue: 0,
    avgEquipmentPerUser: 0,
  });
  const [loading, setLoading] = useState(true);
  const [togglingBeta, setTogglingBeta] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch all profiles with new columns
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, company_name, industry, field_employees, annual_revenue, region, years_in_business, company_website');
      
      if (profilesError) throw profilesError;

      // Fetch subscriptions for plan and beta access info
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status, billing_interval, beta_access, beta_access_granted_at');
      
      if (subscriptionsError) throw subscriptionsError;

      // Create a map for quick subscription lookup
      const subscriptionMap = new Map<string, { 
        plan: string; 
        status: string; 
        billingInterval: string | null;
        betaAccess: boolean; 
        betaAccessGrantedAt: string | null;
      }>();
      subscriptions?.forEach(sub => {
        subscriptionMap.set(sub.user_id, {
          plan: sub.plan || 'free',
          status: sub.status || 'active',
          billingInterval: sub.billing_interval,
          betaAccess: sub.beta_access || false,
          betaAccessGrantedAt: sub.beta_access_granted_at,
        });
      });

      // Fetch all equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');

      if (equipmentError) throw equipmentError;

      // Calculate user stats
      const userStatsMap = new Map<string, UserStats>();
      
      profiles?.forEach(profile => {
        const subInfo = subscriptionMap.get(profile.id);
        userStatsMap.set(profile.id, {
          id: profile.id,
          email: '',
          fullName: profile.full_name || 'Unknown',
          createdAt: profile.created_at,
          equipmentCount: 0,
          totalValue: 0,
          companyName: profile.company_name,
          industry: profile.industry,
          fieldEmployees: profile.field_employees,
          annualRevenue: profile.annual_revenue,
          region: profile.region,
          betaAccess: subInfo?.betaAccess || false,
          betaAccessGrantedAt: subInfo?.betaAccessGrantedAt || null,
          subscriptionPlan: subInfo?.plan || 'free',
          subscriptionStatus: subInfo?.status || 'active',
          billingInterval: subInfo?.billingInterval || null,
        });
      });

      // Aggregate equipment data by user
      equipment?.forEach(item => {
        const userStat = userStatsMap.get(item.user_id);
        if (userStat) {
          userStat.equipmentCount++;
          userStat.totalValue += Number(item.purchase_price) + Number(item.sales_tax) + 
                                  Number(item.freight_setup) + Number(item.other_cap_ex);
        }
      });

      const userStatsArray = Array.from(userStatsMap.values());

      // Calculate market insights from profiles
      const industryMap = new Map<string, number>();
      const sizeMap = new Map<string, number>();
      const revenueMap = new Map<string, number>();
      const regionMap = new Map<string, number>();

      profiles?.forEach(profile => {
        if (profile.industry) {
          industryMap.set(profile.industry, (industryMap.get(profile.industry) || 0) + 1);
        }
        if (profile.field_employees) {
          sizeMap.set(profile.field_employees, (sizeMap.get(profile.field_employees) || 0) + 1);
        }
        if (profile.annual_revenue) {
          revenueMap.set(profile.annual_revenue, (revenueMap.get(profile.annual_revenue) || 0) + 1);
        }
        if (profile.region) {
          regionMap.set(profile.region, (regionMap.get(profile.region) || 0) + 1);
        }
      });

      setIndustryStats(Array.from(industryMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getIndustryLabel(name),
      })).sort((a, b) => b.value - a.value));

      setCompanySizeStats(Array.from(sizeMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getFieldEmployeesLabel(name),
      })));

      setRevenueStats(Array.from(revenueMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getAnnualRevenueLabel(name),
      })));

      setRegionStats(Array.from(regionMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getRegionLabel(name),
      })).sort((a, b) => b.value - a.value).slice(0, 10)); // Top 10 regions

      // Calculate category stats
      const categoryMap = new Map<string, CategoryStats>();
      const currentYear = new Date().getFullYear();

      equipment?.forEach(item => {
        const existing = categoryMap.get(item.category) || {
          category: item.category,
          count: 0,
          avgPurchasePrice: 0,
          totalValue: 0,
          avgAge: 0,
        };
        
        const itemValue = Number(item.purchase_price) + Number(item.sales_tax) + 
                          Number(item.freight_setup) + Number(item.other_cap_ex);
        
        existing.count++;
        existing.totalValue += itemValue;
        existing.avgAge += (currentYear - item.year);
        
        categoryMap.set(item.category, existing);
      });

      const categoryStatsArray = Array.from(categoryMap.values()).map(cat => ({
        ...cat,
        avgPurchasePrice: cat.totalValue / cat.count,
        avgAge: cat.avgAge / cat.count,
      }));

      // Calculate financing stats
      const financingMap = new Map<string, FinancingStats>();
      
      equipment?.forEach(item => {
        const type = item.financing_type || 'owned';
        const existing = financingMap.get(type) || {
          type,
          count: 0,
          totalAmount: 0,
          totalPurchaseValue: 0,
        };
        
        const itemValue = Number(item.purchase_price) + Number(item.sales_tax) + 
                          Number(item.freight_setup) + Number(item.other_cap_ex);
        
        existing.count++;
        existing.totalPurchaseValue += itemValue;
        
        if (type !== 'owned') {
          let financedValue = Number(item.financed_amount) || 0;
          if (financedValue === 0 && Number(item.monthly_payment) > 0) {
            financedValue = Number(item.monthly_payment) * Number(item.term_months);
          }
          existing.totalAmount += financedValue;
        }
        
        financingMap.set(type, existing);
      });

      const financingStatsArray = Array.from(financingMap.values());

      // Calculate totals
      const totalUsers = profiles?.length || 0;
      const totalEquipment = equipment?.length || 0;
      const totalFleetValue = equipment?.reduce((sum, item) => 
        sum + Number(item.purchase_price) + Number(item.sales_tax) + 
        Number(item.freight_setup) + Number(item.other_cap_ex), 0) || 0;

      setUserStats(userStatsArray);
      setCategoryStats(categoryStatsArray);
      setFinancingStats(financingStatsArray);
      setTotals({
        totalUsers,
        totalEquipment,
        totalFleetValue,
        avgEquipmentPerUser: totalUsers > 0 ? totalEquipment / totalUsers : 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBetaAccess = async (userId: string, enabled: boolean) => {
    setTogglingBeta(userId);
    try {
      const updateData = enabled 
        ? { beta_access: true, beta_access_granted_at: new Date().toISOString() }
        : { beta_access: false, beta_access_granted_at: null };

      const { error } = await supabase
        .from('subscriptions')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;

      // Update local state
      setUserStats(prev => prev.map(user => 
        user.id === userId 
          ? { 
              ...user, 
              betaAccess: enabled, 
              betaAccessGrantedAt: enabled ? new Date().toISOString() : null 
            } 
          : user
      ));

      toast({
        title: enabled ? "Beta access granted" : "Beta access revoked",
        description: enabled 
          ? "User now has full Business tier access." 
          : "User has been reverted to their subscription plan.",
      });
    } catch (error: any) {
      console.error('Error toggling beta access:', error);
      toast({
        title: "Failed to update beta access",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTogglingBeta(null);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPlanBadgeVariant = (plan: string, betaAccess: boolean): "default" | "secondary" | "destructive" | "outline" => {
    if (betaAccess) return "default";
    switch (plan) {
      case 'business': return "default";
      case 'professional': return "secondary";
      default: return "outline";
    }
  };

  const formatPlanDisplay = (plan: string, interval: string | null, betaAccess: boolean): string => {
    if (betaAccess && plan === 'free') return "Business (Beta)";
    
    const planName = plan === 'professional' ? 'Pro' : plan.charAt(0).toUpperCase() + plan.slice(1);
    
    if (plan === 'free') return 'Free';
    
    const intervalLabel = interval === 'year' ? 'Annual' : interval === 'month' ? 'Monthly' : '';
    return intervalLabel ? `${planName} (${intervalLabel})` : planName;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading admin data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform analytics and user management</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalEquipment}</div>
              <p className="text-xs text-muted-foreground">
                {totals.avgEquipmentPerUser.toFixed(1)} avg per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Fleet Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.totalFleetValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryStats.length}</div>
              <p className="text-xs text-muted-foreground">unique categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="market">Market Insights</TabsTrigger>
            <TabsTrigger value="categories">Equipment Data</TabsTrigger>
            <TabsTrigger value="financing">Financing</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Overview of all platform users and their companies</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Company</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Employees</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Equipment</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead className="text-center">Beta Access</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.fullName}</TableCell>
                          <TableCell>{user.companyName || '—'}</TableCell>
                          <TableCell>{user.industry ? getIndustryLabel(user.industry) : '—'}</TableCell>
                          <TableCell>{user.fieldEmployees ? getFieldEmployeesLabel(user.fieldEmployees) : '—'}</TableCell>
                          <TableCell>{user.annualRevenue ? getAnnualRevenueLabel(user.annualRevenue) : '—'}</TableCell>
                          <TableCell>{user.region ? getRegionLabel(user.region) : '—'}</TableCell>
                          <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">{user.equipmentCount}</TableCell>
                          <TableCell className="text-right">{formatCurrency(user.totalValue)}</TableCell>
                          <TableCell>
                            <Badge variant={getPlanBadgeVariant(user.subscriptionPlan, user.betaAccess)}>
                              {formatPlanDisplay(user.subscriptionPlan, user.billingInterval, user.betaAccess)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <Switch 
                                checked={user.betaAccess}
                                onCheckedChange={(checked) => toggleBetaAccess(user.id, checked)}
                                disabled={togglingBeta === user.id}
                              />
                              {user.betaAccess && user.betaAccessGrantedAt && (
                                <span className="text-[10px] text-muted-foreground">
                                  {format(new Date(user.betaAccessGrantedAt), 'MMM d')}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Insights Tab */}
          <TabsContent value="market" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Industry Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Industry Distribution
                  </CardTitle>
                  <CardDescription>Users by industry type</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {industryStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <BarChart 
                        data={industryStats} 
                        layout="vertical"
                      >
                        <XAxis type="number" />
                        <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 12 }} />
                        <ChartTooltip 
                          content={({ payload }) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                  <p className="font-medium">{data.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.value} companies
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No industry data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Size Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Company Size
                  </CardTitle>
                  <CardDescription>Distribution by field employees</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {companySizeStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <PieChart>
                        <Pie
                          data={companySizeStats}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ label, value }) => `${label}: ${value}`}
                        >
                          {companySizeStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No company size data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Distribution
                  </CardTitle>
                  <CardDescription>Companies by annual revenue range</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {revenueStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <BarChart data={revenueStats}>
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <ChartTooltip 
                          content={({ payload }) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                  <p className="font-medium">{data.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.value} companies
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Top Regions
                  </CardTitle>
                  <CardDescription>Geographic distribution of users</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {regionStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <BarChart 
                        data={regionStats} 
                        layout="vertical"
                      >
                        <XAxis type="number" />
                        <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 12 }} />
                        <ChartTooltip 
                          content={({ payload }) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                  <p className="font-medium">{data.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.value} users
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No region data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories/Equipment Data Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Equipment by Category</CardTitle>
                  <CardDescription>Distribution across equipment categories</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={{}} className="h-full w-full">
                    <BarChart 
                      data={categoryStats.map(cat => ({
                        ...cat,
                        percent: totals.totalEquipment > 0 
                          ? ((cat.count / totals.totalEquipment) * 100)
                          : 0,
                      }))} 
                      layout="vertical"
                    >
                      <XAxis type="number" tickFormatter={(value) => `${value.toFixed(0)}%`} />
                      <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={({ payload }) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                <p className="font-medium">{data.category}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.percent.toFixed(1)}% ({data.count} items)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="percent" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financing Distribution</CardTitle>
                  <CardDescription>Owned vs Financed vs Leased</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={{}} className="h-full w-full">
                    <PieChart>
                      <Pie
                        data={financingStats}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ type, count }) => {
                          const total = financingStats.reduce((sum, s) => sum + s.count, 0);
                          const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                          return `${type}: ${percent}%`;
                        }}
                      >
                        {financingStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Category Analytics</CardTitle>
                <CardDescription>Detailed breakdown by equipment category</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Avg Purchase Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Avg Age (Years)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryStats.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium">{cat.category}</TableCell>
                        <TableCell className="text-right">{cat.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.avgPurchasePrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.totalValue)}</TableCell>
                        <TableCell className="text-right">{cat.avgAge.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financing Tab */}
          <TabsContent value="financing" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {financingStats.map((stat) => (
                <Card key={stat.type}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium capitalize">{stat.type}</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.type === 'owned' 
                        ? `${formatCurrency(stat.totalPurchaseValue)} total value`
                        : stat.totalAmount > 0 
                          ? `${formatCurrency(stat.totalAmount)} financed`
                          : `${formatCurrency(stat.totalPurchaseValue)} total value`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Financing Breakdown</CardTitle>
                <CardDescription>Detailed financing analytics across all users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Financing Type</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Financed Amount</TableHead>
                      <TableHead className="text-right">% of Fleet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financingStats.map((stat) => (
                      <TableRow key={stat.type}>
                        <TableCell className="font-medium capitalize">{stat.type}</TableCell>
                        <TableCell className="text-right">{stat.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stat.totalPurchaseValue)}</TableCell>
                        <TableCell className="text-right">
                          {stat.type !== 'owned' ? formatCurrency(stat.totalAmount) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.totalEquipment > 0 
                            ? ((stat.count / totals.totalEquipment) * 100).toFixed(1) + '%'
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
