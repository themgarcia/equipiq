import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Package, DollarSign, TrendingUp, Wallet, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface UserStats {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  equipmentCount: number;
  totalValue: number;
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
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalEquipment: 0,
    totalFleetValue: 0,
    avgEquipmentPerUser: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');
      
      if (profilesError) throw profilesError;

      // Fetch all equipment (admin can see all due to service role context)
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');

      if (equipmentError) throw equipmentError;

      // Calculate user stats
      const userStatsMap = new Map<string, UserStats>();
      
      profiles?.forEach(profile => {
        userStatsMap.set(profile.id, {
          id: profile.id,
          email: '', // Will be populated if we have access
          fullName: profile.full_name || 'Unknown',
          createdAt: profile.created_at,
          equipmentCount: 0,
          totalValue: 0,
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
          // For financed/leased: use financed_amount, or calculate from payments if zero
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
            <TabsTrigger value="categories">Market Data</TabsTrigger>
            <TabsTrigger value="financing">Financing</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Overview of all platform users and their equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Equipment</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userStats.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.fullName}</TableCell>
                        <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">{user.equipmentCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(user.totalValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories/Market Data Tab */}
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
