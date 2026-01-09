import { useState, useMemo } from 'react';
import { Layout } from '@/components/Layout';
import { useEquipment } from '@/contexts/EquipmentContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  MinusCircle,
  Info,
  ChevronRight,
  Calendar,
  Target,
  Lock,
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { 
  calculateEquipmentCashflow, 
  calculatePortfolioCashflow, 
  calculatePaybackTimeline,
  calculateCashflowProjection,
} from '@/lib/cashflowCalculations';
import { Equipment, EquipmentCalculated, EquipmentCashflow } from '@/types/equipment';
import { format, isBefore, isAfter } from 'date-fns';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer, Area, Tooltip, ComposedChart } from 'recharts';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/UpgradePrompt';

type StatusFilter = 'all' | 'surplus' | 'neutral' | 'shortfall';
type FinancingFilter = 'all' | 'owned' | 'financed' | 'leased';

function getStatusIcon(status: 'surplus' | 'neutral' | 'shortfall') {
  switch (status) {
    case 'surplus':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'neutral':
      return <MinusCircle className="h-4 w-4 text-yellow-600" />;
    case 'shortfall':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
  }
}

function getStatusBadge(status: 'surplus' | 'neutral' | 'shortfall') {
  switch (status) {
    case 'surplus':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Surplus</Badge>;
    case 'neutral':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Neutral</Badge>;
    case 'shortfall':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Shortfall</Badge>;
  }
}

interface PaybackDialogProps {
  equipment: Equipment;
  calculated: EquipmentCalculated;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function PaybackDialog({ equipment, calculated, open, onOpenChange }: PaybackDialogProps) {
  const { timeline, paybackMonth } = calculatePaybackTimeline(equipment, calculated);
  
  // Sample every 12th month for cleaner display, plus key points
  const chartData = timeline.filter((_, i) => i % 12 === 0 || i === timeline.length - 1);
  
  const chartConfig = {
    cumulativeOutlay: {
      label: 'Cash Outlay',
      color: 'hsl(var(--destructive))',
    },
    cumulativeRecovery: {
      label: 'Pricing Recovery',
      color: 'hsl(var(--primary))',
    },
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Payback Timeline: {equipment.name}</DialogTitle>
        </DialogHeader>
        
        <div className="bg-muted/50 border rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="h-4 w-4" />
            <span>This visualization is informational only. It does not recommend buying, selling, or refinancing.</span>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Payback Summary */}
          <div className="flex items-center justify-between p-4 bg-card border rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Payback Point</p>
              <p className="text-2xl font-bold">
                {paybackMonth !== null 
                  ? `Month ${paybackMonth} (${Math.floor(paybackMonth / 12)} years, ${paybackMonth % 12} months)`
                  : 'Not yet recovered'
                }
              </p>
            </div>
            {paybackMonth !== null ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            )}
          </div>
          
          {/* Chart */}
          <div className="h-[300px]">
            <ChartContainer config={chartConfig} className="h-full w-full">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="month" 
                  tickFormatter={(value) => `Yr ${Math.floor(value / 12)}`}
                  className="text-xs"
                />
                <YAxis 
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  className="text-xs"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeOutlay" 
                  stroke="var(--color-cumulativeOutlay)" 
                  strokeWidth={2}
                  dot={false}
                  name="Cash Outlay"
                />
                <Line 
                  type="monotone" 
                  dataKey="cumulativeRecovery" 
                  stroke="var(--color-cumulativeRecovery)" 
                  strokeWidth={2}
                  dot={false}
                  name="Pricing Recovery"
                />
                {paybackMonth !== null && (
                  <ReferenceLine 
                    x={paybackMonth} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Payback', position: 'top' }}
                  />
                )}
              </LineChart>
            </ChartContainer>
          </div>
          
          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                {equipment.financingType === 'owned' ? 'Paid in Full' : 'Total Deposit'}
              </p>
              <p className="text-lg font-semibold">
                {equipment.financingType === 'owned' 
                  ? formatCurrency(calculated.totalCostBasis)
                  : formatCurrency(equipment.depositAmount)
                }
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Monthly Payment</p>
              <p className="text-lg font-semibold">
                {equipment.financingType === 'owned' 
                  ? '—'
                  : formatCurrency(equipment.monthlyPayment)
                }
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">Term</p>
              <p className="text-lg font-semibold">
                {equipment.financingType === 'owned' 
                  ? '—'
                  : `${equipment.termMonths} months`
                }
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CashflowAnalysis() {
  const { equipment, calculatedEquipment, loading } = useEquipment();
  const { canUseCashflow, effectivePlan } = useSubscription();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [financingFilter, setFinancingFilter] = useState<FinancingFilter>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<{
    equipment: Equipment;
    calculated: EquipmentCalculated;
  } | null>(null);
  
  // Block access for free users
  if (!canUseCashflow) {
    return (
      <Layout>
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
          <div className="mb-6">
            <div className="accent-line mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              Cashflow Analysis
            </h1>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold mb-2">Cashflow Analysis is a Premium Feature</h2>
                <p className="text-muted-foreground">
                  Understand how equipment financing decisions affect cash leaving your business. 
                  Track payment schedules, recovery rates, and project future cashflow with confidence.
                </p>
              </div>
              
              <div className="space-y-3 text-left mb-6 bg-muted/50 rounded-lg p-4">
                <p className="text-sm font-medium">With Cashflow Analysis, you can:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    View portfolio-level cashflow summaries
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Track individual equipment payback timelines
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Project when financing obligations stabilize
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                    Compare recovery vs. payment outflow
                  </li>
                </ul>
              </div>
              
              <UpgradePrompt
                feature="Cashflow Analysis"
                description="Get full access to cashflow analysis and projections."
                variant="inline"
              />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Calculate cashflow for all equipment
  const equipmentWithCashflow = useMemo(() => {
    return equipment.map((eq, index) => {
      const calculated = calculatedEquipment[index];
      const cashflow = calculateEquipmentCashflow(eq, calculated);
      return { equipment: eq, calculated, cashflow };
    });
  }, [equipment, calculatedEquipment]);
  
  // Filter equipment
  const filteredEquipment = useMemo(() => {
    return equipmentWithCashflow.filter(item => {
      // Only show active equipment
      if (item.equipment.status !== 'Active') return false;
      
      // Status filter
      if (statusFilter !== 'all' && item.cashflow.cashflowStatus !== statusFilter) {
        return false;
      }
      
      // Financing filter
      if (financingFilter !== 'all' && item.equipment.financingType !== financingFilter) {
        return false;
      }
      
      return true;
    });
  }, [equipmentWithCashflow, statusFilter, financingFilter]);
  
  // Calculate portfolio summary
  const portfolioSummary = useMemo(() => {
    return calculatePortfolioCashflow(equipmentWithCashflow);
  }, [equipmentWithCashflow]);
  
  // Calculate cashflow projection
  const { projection, stabilization } = useMemo(() => {
    return calculateCashflowProjection(equipmentWithCashflow);
  }, [equipmentWithCashflow]);
  
  // Helper to format payoff date display
  const getPayoffDateDisplay = (cashflow: EquipmentCashflow, financingType: string) => {
    if (financingType === 'owned') {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid in Full</Badge>;
    }
    if (!cashflow.payoffDate) {
      return <span className="text-muted-foreground">—</span>;
    }
    const payoffDate = new Date(cashflow.payoffDate);
    const now = new Date();
    if (isBefore(payoffDate, now)) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>;
    }
    // Color code based on time remaining
    const monthsLeft = cashflow.remainingPayments;
    let badgeClass = "bg-muted text-muted-foreground";
    if (monthsLeft <= 12) {
      badgeClass = "bg-green-100 text-green-800";
    } else if (monthsLeft <= 24) {
      badgeClass = "bg-yellow-100 text-yellow-800";
    }
    return (
      <Badge className={`${badgeClass} hover:${badgeClass}`}>
        {format(payoffDate, 'MMM yyyy')}
      </Badge>
    );
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="accent-line mb-4" />
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                Cashflow Analysis
              </h1>
              <p className="text-muted-foreground mt-1">
                Understand how financing decisions affect cash leaving your business
              </p>
            </div>
          </div>
        </div>
        
        {/* Disclaimer Banner */}
        <div className="bg-muted/50 border rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">This view shows financing cashflow pressure. It does not affect pricing or Buy vs Rent calculations.</p>
              <p className="mt-1">
                Equipment pricing is based on useful-life amortization. Financing structure, loan terms, and deposits 
                are for cashflow visibility only — two identical machines will always price the same regardless of how they were financed.
              </p>
              <p className="mt-2 text-xs border-t pt-2 border-muted-foreground/20">
                <strong>Note:</strong> This analysis does not include balloon payments, lease buyouts, or residual value recovery. 
                Only regular monthly payments and annual pricing recovery are shown.
              </p>
            </div>
          </div>
        </div>
        
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Current Annual Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(portfolioSummary.totalAnnualRecovery)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Value being recovered through job pricing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Current Annual Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(portfolioSummary.totalAnnualPayments)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cash currently leaving for financing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {getStatusIcon(portfolioSummary.overallStatus)}
                Current Net Cashflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${
                portfolioSummary.netAnnualCashflow >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {portfolioSummary.netAnnualCashflow >= 0 ? '+' : ''}
                {formatCurrency(portfolioSummary.netAnnualCashflow)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {getStatusBadge(portfolioSummary.overallStatus)}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Total Cash Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(portfolioSummary.totalDeposits)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Paid in full + deposits
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Cashflow Stabilization Section */}
        {stabilization.itemsWithActivePayments > 0 && (
          <div className="mb-6 space-y-4">
            {/* Stabilization Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    All Financing Ends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {stabilization.stabilizationDate 
                      ? format(new Date(stabilization.stabilizationDate), 'MMM yyyy')
                      : 'All Paid Off'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stabilization.yearsUntilStabilization > 0 
                      ? `${stabilization.yearsUntilStabilization} year${stabilization.yearsUntilStabilization !== 1 ? 's' : ''} from now`
                      : 'Already stabilized'
                    }
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Active Payment Items
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {stabilization.itemsWithActivePayments}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Still making payments
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Cashflow Projection Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Cashflow Projection
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  As equipment pays off, payments decrease while recovery stays constant
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projection} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNetCashflow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="year" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            annualRecovery: 'Annual Recovery',
                            annualPayments: 'Annual Payments',
                            netAnnualCashflow: 'Net Cashflow'
                          };
                          return [formatCurrency(value), labels[name] || name];
                        }}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      {/* Green line for Annual Recovery (constant) */}
                      <Line 
                        type="monotone" 
                        dataKey="annualRecovery" 
                        stroke="hsl(142, 76%, 36%)" 
                        strokeWidth={2}
                        dot={false}
                        name="annualRecovery"
                      />
                      {/* Red/Orange line for Annual Payments (decreasing) */}
                      <Line 
                        type="monotone" 
                        dataKey="annualPayments" 
                        stroke="hsl(0, 84%, 60%)" 
                        strokeWidth={2}
                        dot={false}
                        name="annualPayments"
                      />
                      {/* Shaded area for net cashflow (the gap) */}
                      <Area 
                        type="monotone" 
                        dataKey="netAnnualCashflow" 
                        stroke="none"
                        fillOpacity={1} 
                        fill="url(#colorNetCashflow)" 
                        name="netAnnualCashflow"
                      />
                      {/* Add reference lines for payoff events */}
                      {projection.filter(p => p.events.length > 0).map((p) => (
                        <ReferenceLine 
                          key={p.year}
                          x={p.year} 
                          stroke="hsl(var(--muted-foreground))" 
                          strokeDasharray="3 3"
                          strokeOpacity={0.5}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-green-600"></div>
                    <span className="text-muted-foreground">Annual Recovery (from job pricing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-red-500"></div>
                    <span className="text-muted-foreground">Annual Payments (financing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 bg-green-600/30 rounded-sm"></div>
                    <span className="text-muted-foreground">Net Cashflow (the gap)</span>
                  </div>
                </div>
                
                {/* Payoff Events */}
                {projection.some(p => p.events.length > 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Payoff events:</p>
                    <div className="flex flex-wrap gap-2">
                      {projection.filter(p => p.events.length > 0).flatMap(p => 
                        p.events.map((event, i) => (
                          <Badge key={`${p.year}-${i}`} variant="outline" className="text-xs">
                            {p.year}: {event}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Status:</span>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="surplus">Surplus</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="shortfall">Shortfall</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Financing:</span>
            <Select value={financingFilter} onValueChange={(v) => setFinancingFilter(v as FinancingFilter)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="owned">Owned</SelectItem>
                <SelectItem value="financed">Financed</SelectItem>
                <SelectItem value="leased">Leased</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Equipment Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Financing</TableHead>
                  <TableHead>Payoff Date</TableHead>
                  <TableHead className="text-right">Annual Recovery</TableHead>
                  <TableHead className="text-right">Annual Payments</TableHead>
                  <TableHead className="text-right">Surplus/Shortfall</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEquipment.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No active equipment matches your filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEquipment.map(({ equipment: eq, calculated, cashflow }) => (
                    <TableRow key={eq.id}>
                      <TableCell className="font-medium">{eq.name}</TableCell>
                      <TableCell className="text-muted-foreground">{eq.category}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {eq.financingType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getPayoffDateDisplay(cashflow, eq.financingType)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        {formatCurrency(cashflow.annualEconomicRecovery)}
                      </TableCell>
                      <TableCell className="text-right text-red-600">
                        {formatCurrency(cashflow.annualCashOutflow)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        cashflow.annualSurplusShortfall >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cashflow.annualSurplusShortfall >= 0 ? '+' : ''}
                        {formatCurrency(cashflow.annualSurplusShortfall)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cashflow.cashflowStatus)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEquipment({ equipment: eq, calculated })}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        
        {/* Payback Timeline Dialog */}
        {selectedEquipment && (
          <PaybackDialog
            equipment={selectedEquipment.equipment}
            calculated={selectedEquipment.calculated}
            open={!!selectedEquipment}
            onOpenChange={(open) => !open && setSelectedEquipment(null)}
          />
        )}
      </div>
    </Layout>
  );
}
