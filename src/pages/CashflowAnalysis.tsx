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
} from 'lucide-react';
import { formatCurrency } from '@/lib/calculations';
import { 
  calculateEquipmentCashflow, 
  calculatePortfolioCashflow, 
  calculatePaybackTimeline 
} from '@/lib/cashflowCalculations';
import { Equipment, EquipmentCalculated, EquipmentCashflow } from '@/types/equipment';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ResponsiveContainer } from 'recharts';

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
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [financingFilter, setFinancingFilter] = useState<FinancingFilter>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<{
    equipment: Equipment;
    calculated: EquipmentCalculated;
  } | null>(null);
  
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
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <div className="accent-line mb-4" />
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Wallet className="h-8 w-8 text-primary" />
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
            </div>
          </div>
        </div>
        
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Annual Pricing Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(portfolioSummary.totalAnnualRecovery)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Value recovered through job pricing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                Annual Financing Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(portfolioSummary.totalAnnualPayments)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Cash leaving for financing
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {getStatusIcon(portfolioSummary.overallStatus)}
                Net Annual Cashflow
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
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
