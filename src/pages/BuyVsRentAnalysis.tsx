import { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

import { 
  Scale, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Lock,
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { BuyVsRentInput, EquipmentCategory } from '@/types/equipment';
import { categoryDefaults, getCategoryDefaults } from '@/data/categoryDefaults';
import { calculateBuyVsRent, formatCurrency, formatDays, calculateRentalCostByType } from '@/lib/buyVsRentCalculations';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { BuyVsRentSkeleton } from '@/components/PageSkeletons';
import { FinancialValue } from '@/components/ui/financial-value';

// Derive categories from categoryDefaults
const categories: EquipmentCategory[] = categoryDefaults.map(c => c.category);

const defaultInput: BuyVsRentInput = {
  category: 'Excavator – Compact (≤ 6 ton)',
  description: '',
  purchasePrice: 50000,
  usefulLife: 10,
  resaleValue: 12500,
  rentalRateDaily: 350,
  rentalRateWeekly: undefined,
  rentalRateMonthly: undefined,
  usageDaysPerYear: 100,
  annualMaintenance: 2000,
  annualInsurance: 750,
};

export default function BuyVsRentAnalysis() {
  const { canUseBuyVsRent, effectivePlan, subscription } = useSubscription();
  const [input, setInput] = useState<BuyVsRentInput>(defaultInput);
  const [selectedRateType, setSelectedRateType] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Round any existing decimal values on mount
  useEffect(() => {
    const roundedResale = Math.round(input.resaleValue);
    const roundedMaintenance = Math.round(input.annualMaintenance);
    const roundedInsurance = Math.round(input.annualInsurance);
    
    if (roundedResale !== input.resaleValue || 
        roundedMaintenance !== input.annualMaintenance || 
        roundedInsurance !== input.annualInsurance) {
      setInput(prev => ({
        ...prev,
        resaleValue: roundedResale,
        annualMaintenance: roundedMaintenance,
        annualInsurance: roundedInsurance,
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const result = useMemo(() => {
    if (input.purchasePrice > 0 && input.rentalRateDaily > 0 && input.usefulLife > 0) {
      return calculateBuyVsRent(input);
    }
    return null;
  }, [input]);

  // Auto-select the best available rate when rates change
  useEffect(() => {
    if (input.rentalRateMonthly && input.rentalRateMonthly > 0) {
      setSelectedRateType('monthly');
    } else if (input.rentalRateWeekly && input.rentalRateWeekly > 0) {
      setSelectedRateType('weekly');
    } else {
      setSelectedRateType('daily');
    }
  }, [input.rentalRateDaily, input.rentalRateWeekly, input.rentalRateMonthly]);

  const handleCategoryChange = (category: EquipmentCategory) => {
    const defaults = getCategoryDefaults(category);
    const resaleValue = Math.round(input.purchasePrice * (defaults.defaultResalePercent / 100));
    const maintenance = Math.round(input.purchasePrice * (defaults.maintenancePercent / 100));
    const insurance = Math.round(input.purchasePrice * (defaults.insurancePercent / 100));

    setInput(prev => ({
      ...prev,
      category,
      usefulLife: defaults.defaultUsefulLife,
      resaleValue,
      annualMaintenance: maintenance,
      annualInsurance: insurance,
    }));
  };

  const handlePurchasePriceChange = (purchasePrice: number) => {
    const defaults = getCategoryDefaults(input.category);
    const resaleValue = Math.round(purchasePrice * (defaults.defaultResalePercent / 100));
    const maintenance = Math.round(purchasePrice * (defaults.maintenancePercent / 100));
    const insurance = Math.round(purchasePrice * (defaults.insurancePercent / 100));

    setInput(prev => ({
      ...prev,
      purchasePrice,
      resaleValue,
      annualMaintenance: maintenance,
      annualInsurance: insurance,
    }));
  };

  const updateField = <K extends keyof BuyVsRentInput>(field: K, value: BuyVsRentInput[K]) => {
    setInput(prev => ({ ...prev, [field]: value }));
  };

  // Get break-even value for selected rate type
  const getSelectedBreakEven = () => {
    if (!result) return 0;
    switch (selectedRateType) {
      case 'daily': return result.breakEvenAnalysis.daily ?? 0;
      case 'weekly': return result.breakEvenAnalysis.weekly ?? 0;
      case 'monthly': return result.breakEvenAnalysis.monthly ?? 0;
    }
  };

  // Calculate rental cost based on selected rate type
  const selectedRentalCost = useMemo(() => {
    return calculateRentalCostByType(input, selectedRateType) ?? result?.annualRentalCost ?? 0;
  }, [input, selectedRateType, result]);

  // Calculate year-by-year comparison based on selected rate
  const selectedYearComparison = useMemo(() => {
    if (!result) return [];
    
    return Array.from({ length: input.usefulLife }, (_, i) => {
      const year = i + 1;
      const ownCumulative = result.annualOwnershipCost * year;
      const rentCumulative = selectedRentalCost * year;
      return {
        year,
        ownCumulative,
        rentCumulative,
        savings: rentCumulative - ownCumulative,
      };
    });
  }, [result, selectedRentalCost, input.usefulLife]);

  // Get rate description for selected type
  const getSelectedRateDescription = () => {
    switch (selectedRateType) {
      case 'daily': return `${formatCurrency(input.rentalRateDaily)}/day`;
      case 'weekly': return `${formatCurrency(input.rentalRateWeekly!)}/week`;
      case 'monthly': return `${formatCurrency(input.rentalRateMonthly!)}/month`;
    }
  };

  // Show loading state while subscription is being fetched
  if (subscription.loading) {
    return (
      <Layout>
        <BuyVsRentSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Demo-only banner for free users */}
        {!canUseBuyVsRent && (
          <div className="mb-6 p-4 rounded-lg border border-warning/30 bg-warning/10">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <Lock className="h-5 w-5 text-warning flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-warning-foreground">Demo Mode</p>
                <p className="text-sm text-warning-foreground/80">
                  You're using the Buy vs. Rent calculator in demo mode. Upgrade to Professional or Business for full, unrestricted access.
                </p>
              </div>
              <UpgradePrompt
                feature="Buy vs. Rent Analysis"
                description="Get full access to the Buy vs. Rent calculator with no restrictions."
                variant="inline"
              />
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-3xl font-bold">Buy vs. Rent Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Enter details about equipment you're considering to see whether buying or renting makes more financial sense
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="space-y-6">
            {/* Equipment Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5 text-primary" />
                  Equipment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={input.category} 
                      onValueChange={(value) => handleCategoryChange(value as EquipmentCategory)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Input
                      id="description"
                      placeholder="e.g., CAT 305 Mini Excavator"
                      value={input.description}
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="purchasePrice"
                        type="number"
                        className="pl-9"
                        value={input.purchasePrice || ''}
                        onChange={(e) => handlePurchasePriceChange(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="usefulLife">Useful Life (years)</Label>
                    <Input
                      id="usefulLife"
                      type="number"
                      value={input.usefulLife || ''}
                      onChange={(e) => updateField('usefulLife', Number(e.target.value))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="resaleValue">Expected Resale Value</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resaleValue"
                        type="number"
                        step="1"
                        className="pl-9"
                        value={input.resaleValue || ''}
                        onChange={(e) => updateField('resaleValue', Number(e.target.value))}
                        onBlur={(e) => {
                          const rounded = Math.round(Number(e.target.value));
                          if (rounded !== input.resaleValue) updateField('resaleValue', rounded);
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Auto-calculated from category default ({getCategoryDefaults(input.category).defaultResalePercent}%)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rental Rates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Rental Rates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="rentalDaily">Daily Rate *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rentalDaily"
                        type="number"
                        className="pl-9"
                        value={input.rentalRateDaily || ''}
                        onChange={(e) => updateField('rentalRateDaily', Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rentalWeekly">Weekly Rate</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rentalWeekly"
                        type="number"
                        className="pl-9"
                        placeholder="Optional"
                        value={input.rentalRateWeekly || ''}
                        onChange={(e) => updateField('rentalRateWeekly', Number(e.target.value) || undefined)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="rentalMonthly">Monthly Rate</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="rentalMonthly"
                        type="number"
                        className="pl-9"
                        placeholder="Optional"
                        value={input.rentalRateMonthly || ''}
                        onChange={(e) => updateField('rentalRateMonthly', Number(e.target.value) || undefined)}
                      />
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="usageDays">Expected Usage (days/year)</Label>
                  <Input
                    id="usageDays"
                    type="number"
                    value={input.usageDaysPerYear || ''}
                    onChange={(e) => updateField('usageDaysPerYear', Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How many days per year will you actually use this equipment?
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Ownership Costs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-primary" />
                  Annual Ownership Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maintenance">Maintenance/Repairs</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="maintenance"
                        type="number"
                        step="1"
                        className="pl-9"
                        value={input.annualMaintenance || ''}
                        onChange={(e) => updateField('annualMaintenance', Number(e.target.value))}
                        onBlur={(e) => {
                          const rounded = Math.round(Number(e.target.value));
                          if (rounded !== input.annualMaintenance) updateField('annualMaintenance', rounded);
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: {getCategoryDefaults(input.category).maintenancePercent}% of purchase price
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="insurance">Insurance</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="insurance"
                        type="number"
                        step="1"
                        className="pl-9"
                        value={input.annualInsurance || ''}
                        onChange={(e) => updateField('annualInsurance', Number(e.target.value))}
                        onBlur={(e) => {
                          const rounded = Math.round(Number(e.target.value));
                          if (rounded !== input.annualInsurance) updateField('annualInsurance', rounded);
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Default: {getCategoryDefaults(input.category).insurancePercent}% of purchase price
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {result ? (
              <>
                {/* Break-Even Analysis */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-4">
                      <Info className="h-4 w-4" />
                      Break-Even Analysis
                      <span className="text-xs ml-auto">Click a card to view that scenario</span>
                    </div>
                    
                    {/* All break-even scenarios - Clickable */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Daily Rate */}
                      <div 
                        onClick={() => result.breakEvenAnalysis.daily !== null && setSelectedRateType('daily')}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          selectedRateType === 'daily' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border',
                          result.breakEvenAnalysis.daily !== null 
                            ? 'cursor-pointer hover:border-primary/50' 
                            : 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <p className="text-xs text-muted-foreground">Daily Rate</p>
                        <p className="text-lg font-bold font-mono-nums">
                          {result.breakEvenAnalysis.daily !== null 
                            ? formatDays(result.breakEvenAnalysis.daily)
                            : 'N/A'}
                        </p>
                        {selectedRateType === 'daily' && result.breakEvenAnalysis.daily !== null && (
                          <Badge variant="secondary" className="text-xs mt-1">Selected</Badge>
                        )}
                      </div>
                      
                      {/* Weekly Rate */}
                      <div 
                        onClick={() => result.breakEvenAnalysis.weekly !== null && setSelectedRateType('weekly')}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          selectedRateType === 'weekly' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border',
                          result.breakEvenAnalysis.weekly !== null 
                            ? 'cursor-pointer hover:border-primary/50' 
                            : 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <p className="text-xs text-muted-foreground">Weekly Rate</p>
                        <p className="text-lg font-bold font-mono-nums">
                          {result.breakEvenAnalysis.weekly !== null 
                            ? formatDays(result.breakEvenAnalysis.weekly)
                            : 'N/A'}
                        </p>
                        {selectedRateType === 'weekly' && result.breakEvenAnalysis.weekly !== null && (
                          <Badge variant="secondary" className="text-xs mt-1">Selected</Badge>
                        )}
                      </div>
                      
                      {/* Monthly Rate */}
                      <div 
                        onClick={() => result.breakEvenAnalysis.monthly !== null && setSelectedRateType('monthly')}
                        className={cn(
                          'p-3 rounded-lg border transition-all',
                          selectedRateType === 'monthly' 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border',
                          result.breakEvenAnalysis.monthly !== null 
                            ? 'cursor-pointer hover:border-primary/50' 
                            : 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        <p className="text-xs text-muted-foreground">Monthly Rate</p>
                        <p className="text-lg font-bold font-mono-nums">
                          {result.breakEvenAnalysis.monthly !== null 
                            ? formatDays(result.breakEvenAnalysis.monthly)
                            : 'N/A'}
                        </p>
                        {selectedRateType === 'monthly' && result.breakEvenAnalysis.monthly !== null && (
                          <Badge variant="secondary" className="text-xs mt-1">Selected</Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Your usage comparison */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t pt-4 gap-3 sm:gap-0 mt-4">
                      <div>
                        <p className="text-sm">Selected Break-Even:</p>
                        <p className="text-xl font-bold font-mono-nums">
                          {formatDays(getSelectedBreakEven())}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Your Usage:</p>
                        <p className="text-xl font-bold font-mono-nums">
                          {formatDays(input.usageDaysPerYear)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-muted rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">
                        {input.usageDaysPerYear > getSelectedBreakEven() 
                          ? `You use this equipment ${Math.round(input.usageDaysPerYear - getSelectedBreakEven())} days more than the break-even point, making buying more economical.`
                          : input.usageDaysPerYear < getSelectedBreakEven()
                            ? `You use this equipment ${Math.round(getSelectedBreakEven() - input.usageDaysPerYear)} days less than the break-even point, making renting more economical.`
                            : `Your usage is right at the break-even point. Consider other factors like convenience and availability.`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <TrendingDown className="h-4 w-4" />
                        Annual Cost to Own
                      </div>
                      <p className="text-2xl font-bold font-mono-nums mt-1">
                        {formatCurrency(result.annualOwnershipCost)}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2 space-y-1">
                        <div className="flex justify-between">
                          <span>Depreciation:</span>
                          <span>{formatCurrency(result.ownershipBreakdown.depreciation)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Maintenance:</span>
                          <span>{formatCurrency(result.ownershipBreakdown.maintenance)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Insurance:</span>
                          <span>{formatCurrency(result.ownershipBreakdown.insurance)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="h-4 w-4" />
                        Annual Cost to Rent
                      </div>
                      <p className="text-2xl font-bold font-mono-nums mt-1">
                        {formatCurrency(selectedRentalCost)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on {input.usageDaysPerYear} days using {selectedRateType} rate ({getSelectedRateDescription()})
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cost Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Cumulative Cost Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={selectedYearComparison}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="year" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `Yr ${value}`}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          />
                          <RechartsTooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(label) => `Year ${label}`}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="ownCumulative" 
                            name="Own" 
                            stroke="hsl(142 71% 45%)" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(142 71% 45%)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="rentCumulative" 
                            name="Rent" 
                            stroke="hsl(0 72% 51%)" 
                            strokeWidth={2}
                            dot={{ fill: 'hsl(0 72% 51%)' }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Year-by-Year Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Year-by-Year Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto -mx-6 px-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Year</TableHead>
                            <TableHead className="text-right">Own (Cumulative)</TableHead>
                            <TableHead className="text-right">Rent (Cumulative)</TableHead>
                            <TableHead className="text-right">Savings by Buying</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedYearComparison.map((row) => (
                            <TableRow key={row.year}>
                              <TableCell className="font-medium">Year {row.year}</TableCell>
                              <TableCell className="text-right font-mono-nums">
                                {formatCurrency(row.ownCumulative)}
                              </TableCell>
                              <TableCell className="text-right font-mono-nums">
                                {formatCurrency(row.rentCumulative)}
                              </TableCell>
                              <TableCell className="text-right">
                                <FinancialValue value={row.savings} weight="medium" semantic={true} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                  <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold text-lg">Enter Equipment Details</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Fill in the form on the left to see a complete buy vs. rent analysis with recommendations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
