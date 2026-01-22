import { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useDeviceType } from '@/hooks/use-mobile';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
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
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceDot, ResponsiveContainer, Area, Tooltip as RechartsTooltip, ComposedChart } from 'recharts';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { CashflowSkeleton } from '@/components/PageSkeletons';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { FinancialValue } from '@/components/ui/financial-value';

type StatusFilter = 'all' | 'surplus' | 'neutral' | 'shortfall';
type FinancingFilter = 'all' | 'owned' | 'financed' | 'leased';
type SortField = 'name' | 'category' | 'financingType' | 'payoffDate' | 'annualRecovery' | 'annualPayments' | 'surplusShortfall' | 'status';
type SortDirection = 'asc' | 'desc';

function getStatusIcon(status: 'surplus' | 'neutral' | 'shortfall') {
  switch (status) {
    case 'surplus':
      return <CheckCircle className="h-4 w-4 text-success" />;
    case 'neutral':
      return <MinusCircle className="h-4 w-4 text-warning" />;
    case 'shortfall':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
  }
}

function getStatusBadge(status: 'surplus' | 'neutral' | 'shortfall') {
  switch (status) {
    case 'surplus':
      return <Badge className="bg-success/10 text-success hover:bg-success/10">Surplus</Badge>;
    case 'neutral':
      return <Badge className="bg-warning/10 text-warning hover:bg-warning/10">Neutral</Badge>;
    case 'shortfall':
      return <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">Shortfall</Badge>;
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
              <CheckCircle className="h-8 w-8 text-success" />
            ) : (
              <AlertCircle className="h-8 w-8 text-warning" />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
  const { canUseCashflow, effectivePlan, subscription } = useSubscription();
  const { markStepComplete } = useOnboarding();
  const deviceType = useDeviceType();
  const isPhone = deviceType === 'phone';
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [financingFilter, setFinancingFilter] = useState<FinancingFilter>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<{
    equipment: Equipment;
    calculated: EquipmentCalculated;
  } | null>(null);
  const [sortField, setSortField] = useState<SortField>('payoffDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Mark onboarding step on mount
  useEffect(() => {
    markStepComplete('step_cashflow_viewed');
  }, [markStepComplete]);
  
  // Calculate cashflow for all equipment - MUST be before any conditional returns
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
  
  // Calculate insight about when cashflow turns positive
  const cashflowInsight = useMemo(() => {
    if (projection.length === 0) return null;
    
    const currentYear = new Date().getFullYear();
    const currentPoint = projection.find(p => p.year === currentYear);
    const isCurrentlyNegative = currentPoint && currentPoint.netAnnualCashflow < 0;
    
    // Find the first year where net cashflow becomes positive (after current year if negative)
    const turnsPositiveYear = isCurrentlyNegative 
      ? projection.find(p => p.year > currentYear && p.netAnnualCashflow >= 0)
      : null;
    
    return {
      isCurrentlyNegative,
      currentNetCashflow: currentPoint?.netAnnualCashflow || 0,
      turnsPositiveYear: turnsPositiveYear?.year || null,
      yearsUntilPositive: turnsPositiveYear 
        ? turnsPositiveYear.year - currentYear 
        : null,
    };
  }, [projection]);
  
  // Calculate where zero falls in the chart's Y domain for split gradient
  const chartYDomain = useMemo(() => {
    if (projection.length === 0) return { minY: 0, maxY: 0, zeroOffset: 0.5 };
    
    const netValues = projection.map(p => p.netAnnualCashflow);
    const minY = Math.min(...netValues, 0);
    const maxY = Math.max(...netValues, 0);
    
    // Calculate where 0 sits as percentage from TOP (SVG gradients go top-to-bottom)
    const range = maxY - minY;
    const zeroOffset = range > 0 ? maxY / range : 0.5;
    
    return { minY, maxY, zeroOffset };
  }, [projection]);
  
  // Sort equipment
  const sortedEquipment = useMemo(() => {
    return [...filteredEquipment].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'name':
          comparison = a.equipment.name.localeCompare(b.equipment.name);
          break;
        case 'category':
          comparison = a.equipment.category.localeCompare(b.equipment.category);
          break;
        case 'financingType':
          comparison = a.equipment.financingType.localeCompare(b.equipment.financingType);
          break;
        case 'payoffDate':
          // Owned/paid-off items go to bottom when descending (treat as date 0)
          const aDate = a.cashflow.payoffDate ? new Date(a.cashflow.payoffDate).getTime() : 0;
          const bDate = b.cashflow.payoffDate ? new Date(b.cashflow.payoffDate).getTime() : 0;
          comparison = aDate - bDate;
          break;
        case 'annualRecovery':
          comparison = a.cashflow.annualEconomicRecovery - b.cashflow.annualEconomicRecovery;
          break;
        case 'annualPayments':
          comparison = a.cashflow.annualCashOutflow - b.cashflow.annualCashOutflow;
          break;
        case 'surplusShortfall':
          comparison = a.cashflow.annualSurplusShortfall - b.cashflow.annualSurplusShortfall;
          break;
        case 'status':
          const statusOrder = { shortfall: 0, neutral: 1, surplus: 2 };
          comparison = statusOrder[a.cashflow.cashflowStatus] - statusOrder[b.cashflow.cashflowStatus];
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }, [filteredEquipment, sortField, sortDirection]);
  
  // Handle sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Sortable header component
  const SortableHeader = ({ field, children, className }: { field: SortField; children: React.ReactNode; className?: string }) => (
    <TableHead 
      className={`cursor-pointer select-none hover:bg-muted/50 ${className || ''}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'desc' ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );
  
  // Helper to format payoff date display
  const getPayoffDateDisplay = (cashflow: EquipmentCashflow, financingType: string) => {
    if (financingType === 'owned') {
      return <Badge className="bg-success/10 text-success hover:bg-success/10">Paid in Full</Badge>;
    }
    if (!cashflow.payoffDate) {
      return <span className="text-muted-foreground">—</span>;
    }
    const payoffDate = new Date(cashflow.payoffDate);
    const now = new Date();
    if (isBefore(payoffDate, now)) {
      return <Badge className="bg-success/10 text-success hover:bg-success/10">Complete</Badge>;
    }
    // Color code based on time remaining
    const monthsLeft = cashflow.remainingPayments;
    let badgeClass = "bg-muted text-muted-foreground";
    if (monthsLeft <= 12) {
      badgeClass = "bg-success/10 text-success";
    } else if (monthsLeft <= 24) {
      badgeClass = "bg-warning/10 text-warning";
    }
    return (
      <Badge className={`${badgeClass} hover:${badgeClass}`}>
        {format(payoffDate, 'MMM yyyy')}
      </Badge>
    );
  };
  
  // Show loading state while subscription is being fetched
  if (subscription.loading) {
    return (
      <Layout>
        <CashflowSkeleton />
      </Layout>
    );
  }
  
  // Block access for free users - AFTER all hooks
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
  
  if (loading) {
    return (
      <Layout>
        <CashflowSkeleton />
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
              <p className="text-2xl font-bold text-success">
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
              <p className="text-2xl font-bold text-destructive">
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
              <FinancialValue 
                value={portfolioSummary.netAnnualCashflow} 
                size="2xl" 
                weight="bold"
                semantic={true}
              />
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>As equipment pays off, payments decrease while recovery stays constant</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                
                {/* Dynamic insight badge when negative */}
                {cashflowInsight?.isCurrentlyNegative && (
                  <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-destructive">
                          Financing payments currently exceed recovery
                        </p>
                        <p className="text-muted-foreground mt-1">
                          {cashflowInsight.turnsPositiveYear 
                            ? `Projected to turn positive in ${cashflowInsight.turnsPositiveYear} (${cashflowInsight.yearsUntilPositive} year${cashflowInsight.yearsUntilPositive !== 1 ? 's' : ''} from now) as equipment pays off.`
                            : 'Consider reviewing financing terms or equipment utilization to improve cashflow.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projection} margin={{ top: 25, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNetCashflow" x1="0" y1="0" x2="0" y2="1">
                          {/* Green portion (above zero) */}
                          <stop offset="0%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4}/>
                          <stop offset={`${chartYDomain.zeroOffset * 100}%`} stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
                          {/* Red portion (below zero) */}
                          <stop offset={`${chartYDomain.zeroOffset * 100}%`} stopColor="hsl(0, 84%, 60%)" stopOpacity={0.2}/>
                          <stop offset="100%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.4}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis 
                        dataKey="year" 
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        tickFormatter={(year) => year === new Date().getFullYear() ? 'Today' : year.toString()}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        className="text-xs"
                        tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      />
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => {
                          const labels: Record<string, string> = {
                            annualRecovery: 'Annual Recovery',
                            annualPayments: 'Annual Payments',
                            netAnnualCashflow: 'Net Cashflow'
                          };
                          return [formatCurrency(value), labels[name] || name];
                        }}
                        labelFormatter={(label) => {
                          const point = projection.find(p => p.year === label);
                          if (point?.events.length) {
                            return `Year ${label} — ${point.events.join(', ')} payoff`;
                          }
                          return `Year ${label}`;
                        }}
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
                      {/* Reference line at $0 */}
                      <ReferenceLine 
                        y={0} 
                        stroke="hsl(var(--muted-foreground))"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
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
                      {/* Today marker line */}
                      <ReferenceLine 
                        x={new Date().getFullYear()} 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        strokeOpacity={0.7}
                      />
                      {/* Add reference lines for payoff events */}
                      {projection.filter(p => p.events.length > 0).map((p) => (
                        <ReferenceLine 
                          key={p.year}
                          x={p.year} 
                          stroke="hsl(45, 93%, 47%)"
                          strokeDasharray="5 5"
                          strokeWidth={2}
                          strokeOpacity={0.8}
                        />
                      ))}
                      {/* Add reference dots at payoff points on the payments line */}
                      {projection.filter(p => p.events.length > 0).map((p) => (
                        <ReferenceDot
                          key={`dot-${p.year}`}
                          x={p.year}
                          y={p.annualPayments}
                          r={6}
                          fill="hsl(45, 93%, 47%)"
                          stroke="hsl(var(--background))"
                          strokeWidth={2}
                        />
                      ))}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-success"></div>
                    <span className="text-muted-foreground">Annual Recovery (from job pricing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 bg-destructive"></div>
                    <span className="text-muted-foreground">Annual Payments (financing)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-3 flex overflow-hidden rounded-sm">
                      <div className="w-2 h-full bg-success/30"></div>
                      <div className="w-2 h-full bg-destructive/30"></div>
                    </div>
                    <span className="text-muted-foreground">Net Cashflow</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-sm">
                            <strong>Green</strong> = Recovery exceeds payments (positive cashflow)<br/>
                            <strong>Red</strong> = Payments exceed recovery (negative cashflow)
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Negative cashflow means more cash is leaving for financing than being recovered through job pricing. 
                            This is common with new equipment and improves as loans/leases pay off.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning border-2 border-background"></div>
                    <span className="text-muted-foreground">Payoff event</span>
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
          <CardContent className={isPhone ? "p-3" : "p-0"}>
            {sortedEquipment.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active equipment matches your filters
              </div>
            ) : isPhone ? (
              /* Mobile Card View */
              <div className="space-y-3">
                {sortedEquipment.map(({ equipment: eq, calculated, cashflow }) => (
                  <div
                    key={eq.id}
                    onClick={() => setSelectedEquipment({ equipment: eq, calculated })}
                    className="p-3 border rounded-lg bg-card hover:bg-muted/50 transition-colors cursor-pointer active:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{eq.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{eq.category}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatusIcon(cashflow.cashflowStatus)}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="capitalize text-xs">
                        {eq.financingType}
                      </Badge>
                      {getPayoffDateDisplay(cashflow, eq.financingType)}
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Recovery</p>
                        <p className="font-medium text-success font-mono-nums">
                          {formatCurrency(cashflow.annualEconomicRecovery)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Payments</p>
                        <p className="font-medium text-destructive font-mono-nums">
                          {formatCurrency(cashflow.annualCashOutflow)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net</p>
                        <p className={`font-medium font-mono-nums ${
                          cashflow.annualSurplusShortfall >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {cashflow.annualSurplusShortfall >= 0 ? '+' : ''}
                          {formatCurrency(cashflow.annualSurplusShortfall)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop Table View */
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHeader field="name">Equipment</SortableHeader>
                    <SortableHeader field="category">Category</SortableHeader>
                    <SortableHeader field="financingType">Financing</SortableHeader>
                    <SortableHeader field="payoffDate">Payoff Date</SortableHeader>
                    <SortableHeader field="annualRecovery" className="text-right">Annual Recovery</SortableHeader>
                    <SortableHeader field="annualPayments" className="text-right">Annual Payments</SortableHeader>
                    <SortableHeader field="surplusShortfall" className="text-right">Surplus/Shortfall</SortableHeader>
                    <SortableHeader field="status">Status</SortableHeader>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEquipment.map(({ equipment: eq, calculated, cashflow }) => (
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
                      <TableCell className="text-right text-success">
                        {formatCurrency(cashflow.annualEconomicRecovery)}
                      </TableCell>
                      <TableCell className="text-right text-destructive">
                        {formatCurrency(cashflow.annualCashOutflow)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        cashflow.annualSurplusShortfall >= 0 ? 'text-success' : 'text-destructive'
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
                  ))}
                </TableBody>
              </Table>
            )}
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
