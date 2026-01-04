import { useEquipment } from '@/contexts/EquipmentContext';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency, formatPercent } from '@/lib/calculations';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Calendar,
  Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer } from '@/components/ui/chart';

export default function Dashboard() {
  const { calculatedEquipment } = useEquipment();
  
  const activeEquipment = calculatedEquipment.filter(e => e.status === 'Active');
  
  // Main metrics
  const totalCostBasis = activeEquipment.reduce((sum, e) => sum + e.totalCostBasis, 0);
  const totalCOGS = activeEquipment.reduce((sum, e) => sum + e.cogsAllocatedCost, 0);
  const totalOverhead = activeEquipment.reduce((sum, e) => sum + e.overheadAllocatedCost, 0);
  const totalReplacementValue = activeEquipment.reduce((sum, e) => sum + e.replacementCostUsed, 0);
  
  const agingEquipment = activeEquipment.filter(e => e.estimatedYearsLeft <= 1);
  
  const recentEquipment = [...calculatedEquipment]
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 5);

  // Financing calculations
  const financedItems = activeEquipment.filter(e => e.financingType === 'financed');
  const leasedItems = activeEquipment.filter(e => e.financingType === 'leased');
  const ownedItems = activeEquipment.filter(e => e.financingType === 'owned');
  
  const totalMonthlyPayments = activeEquipment.reduce((sum, e) => sum + e.monthlyPayment, 0);
  const totalOutstandingDebt = activeEquipment.reduce((sum, e) => {
    if (e.financingType === 'owned' || !e.financingStartDate) return sum;
    const startDate = new Date(e.financingStartDate);
    const now = new Date();
    const monthsElapsed = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
    const remainingPayments = Math.max(0, e.termMonths - monthsElapsed);
    return sum + (remainingPayments * e.monthlyPayment) + e.buyoutAmount;
  }, 0);

  // Upcoming payoffs (next 12 months)
  const upcomingPayoffs = activeEquipment
    .filter(e => e.financingType !== 'owned' && e.financingStartDate && e.termMonths > 0)
    .map(e => {
      const startDate = new Date(e.financingStartDate!);
      const payoffDate = new Date(startDate);
      payoffDate.setMonth(payoffDate.getMonth() + e.termMonths);
      const now = new Date();
      const monthsUntilPayoff = (payoffDate.getFullYear() - now.getFullYear()) * 12 + (payoffDate.getMonth() - now.getMonth());
      return { ...e, payoffDate, monthsUntilPayoff };
    })
    .filter(e => e.monthsUntilPayoff > 0 && e.monthsUntilPayoff <= 12)
    .sort((a, b) => a.monthsUntilPayoff - b.monthsUntilPayoff);

  // Category breakdown
  const categoryData = activeEquipment.reduce((acc, e) => {
    const existing = acc.find(c => c.name === e.category);
    if (existing) {
      existing.value += e.totalCostBasis;
      existing.count += 1;
    } else {
      acc.push({ name: e.category, value: e.totalCostBasis, count: 1 });
    }
    return acc;
  }, [] as { name: string; value: number; count: number }[])
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted-foreground))'
  ];

  // Replacement timeline
  const replacementIn1Year = activeEquipment.filter(e => e.estimatedYearsLeft <= 1);
  const replacementIn2Years = activeEquipment.filter(e => e.estimatedYearsLeft > 1 && e.estimatedYearsLeft <= 2);
  const replacementIn3Years = activeEquipment.filter(e => e.estimatedYearsLeft > 2 && e.estimatedYearsLeft <= 3);
  
  const replacementCost1Year = replacementIn1Year.reduce((sum, e) => sum + e.replacementCostUsed, 0);
  const replacementCost2Years = replacementIn2Years.reduce((sum, e) => sum + e.replacementCostUsed, 0);
  const replacementCost3Years = replacementIn3Years.reduce((sum, e) => sum + e.replacementCostUsed, 0);

  // Fleet health calculation - average useful life remaining as percentage
  const avgUsefulLifeRemainingPercent = activeEquipment.length > 0 
    ? activeEquipment.reduce((sum, e) => {
        const totalLife = e.usefulLifeUsed + e.estimatedYearsLeft;
        const percentRemaining = totalLife > 0 
          ? (e.estimatedYearsLeft / totalLife) * 100 
          : 0;
        return sum + Math.max(0, percentRemaining);
      }, 0) / activeEquipment.length 
    : 0;

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your equipment fleet and allocations
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Total Cost Basis"
            value={formatCurrency(totalCostBasis)}
            subtitle={`${activeEquipment.length} active items`}
            icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Allocated to COGS"
            value={formatCurrency(totalCOGS)}
            subtitle="Job-related equipment costs"
            icon={<TrendingUp className="h-5 w-5 text-muted-foreground" />}
            variant="primary"
          />
          <MetricCard
            title="Allocated to Overhead"
            value={formatCurrency(totalOverhead)}
            subtitle="Non-job equipment costs"
            icon={<Package className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Replacement Value"
            value={formatCurrency(totalReplacementValue)}
            subtitle="Inflation-adjusted estimate"
            icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          />
        </div>

        {/* Financing Summary */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Financing Summary
            </CardTitle>
            <CardDescription>
              {financedItems.length} financed, {leasedItems.length} leased, {ownedItems.length} owned outright
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monthly Obligations</p>
                <p className="text-2xl font-bold font-mono-nums">{formatCurrency(totalMonthlyPayments)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Outstanding Debt</p>
                <p className="text-2xl font-bold font-mono-nums">{formatCurrency(totalOutstandingDebt)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Useful Life Remaining</p>
                <p className="text-2xl font-bold font-mono-nums">{avgUsefulLifeRemainingPercent.toFixed(0)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category & Replacement Row */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2 mb-8">
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Basis by Category</CardTitle>
              <CardDescription>Distribution across equipment types</CardDescription>
            </CardHeader>
            <CardContent>
              {categoryData.length > 0 ? (
                <ChartContainer config={{}} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-popover border rounded-lg p-2 shadow-md">
                                <p className="font-medium text-sm">{data.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatCurrency(data.value)} ({data.count} items)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No equipment data available
                </div>
              )}
              <div className="mt-4 space-y-2">
                {categoryData.map((cat, index) => (
                  <div key={cat.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="truncate max-w-[140px]">{cat.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono-nums">{formatCurrency(cat.value)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Replacement Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Replacement Planning
              </CardTitle>
              <CardDescription>Upcoming equipment replacement needs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-destructive" />
                    <span className="text-sm">Within 1 year</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{replacementIn1Year.length} items</span>
                    <span className="text-sm text-muted-foreground ml-2 font-mono-nums">
                      {formatCurrency(replacementCost1Year)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    <span className="text-sm">1-2 years</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{replacementIn2Years.length} items</span>
                    <span className="text-sm text-muted-foreground ml-2 font-mono-nums">
                      {formatCurrency(replacementCost2Years)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm">2-3 years</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium">{replacementIn3Years.length} items</span>
                    <span className="text-sm text-muted-foreground ml-2 font-mono-nums">
                      {formatCurrency(replacementCost3Years)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">3-Year Total CapEx</span>
                  <span className="text-lg font-bold font-mono-nums">
                    {formatCurrency(replacementCost1Year + replacementCost2Years + replacementCost3Years)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Payoffs */}
        {upcomingPayoffs.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Payoffs
              </CardTitle>
              <CardDescription>Equipment paying off in the next 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingPayoffs.slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.make} {item.model} • {formatCurrency(item.monthlyPayment)}/mo
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">
                        {item.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.monthsUntilPayoff} months left
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {upcomingPayoffs.length > 5 && (
                <p className="text-sm text-muted-foreground text-center mt-3">
                  +{upcomingPayoffs.length - 5} more items
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Two Column Layout - Aging & Recent */}
        <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Aging Equipment */}
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-semibold">Aging Equipment</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {agingEquipment.length} items need attention
              </span>
            </div>
            
            {agingEquipment.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                No equipment reaching end of useful life soon. Great job!
              </p>
            ) : (
              <div className="space-y-3">
                {agingEquipment.slice(0, 4).map(equipment => (
                  <div 
                    key={equipment.id}
                    className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-sm">{equipment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {equipment.category} • {equipment.estimatedYearsLeft === 0 
                          ? 'Past useful life' 
                          : `${equipment.estimatedYearsLeft} year left`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono-nums">
                        {formatCurrency(equipment.expectedResaleUsed)}
                      </p>
                      <p className="text-xs text-muted-foreground">expected resale</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Equipment */}
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Equipment</h2>
              <Link to="/equipment">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  View all <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentEquipment.map(equipment => (
                <div 
                  key={equipment.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-sm">{equipment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {equipment.make} {equipment.model} • {equipment.year}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={equipment.status} />
                    <p className="text-sm font-mono-nums">
                      {formatCurrency(equipment.totalCostBasis)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
