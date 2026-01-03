import { useState, useMemo } from 'react';
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
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BuyVsRentInput, EquipmentCategory } from '@/types/equipment';
import { categoryDefaults, getCategoryDefaults } from '@/data/categoryDefaults';
import { calculateBuyVsRent, formatCurrency, formatDays } from '@/lib/buyVsRentCalculations';
import { cn } from '@/lib/utils';

// Derive categories from categoryDefaults
const categories: EquipmentCategory[] = categoryDefaults.map(c => c.category);

const defaultInput: BuyVsRentInput = {
  category: 'Excavation',
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
  const [input, setInput] = useState<BuyVsRentInput>(defaultInput);

  const result = useMemo(() => {
    if (input.purchasePrice > 0 && input.rentalRateDaily > 0 && input.usefulLife > 0) {
      return calculateBuyVsRent(input);
    }
    return null;
  }, [input]);

  const handleCategoryChange = (category: EquipmentCategory) => {
    const defaults = getCategoryDefaults(category);
    const resaleValue = input.purchasePrice * (defaults.defaultResalePercent / 100);
    const maintenance = input.purchasePrice * (defaults.maintenancePercent / 100);
    const insurance = input.purchasePrice * (defaults.insurancePercent / 100);

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
    const resaleValue = purchasePrice * (defaults.defaultResalePercent / 100);
    const maintenance = purchasePrice * (defaults.maintenancePercent / 100);
    const insurance = purchasePrice * (defaults.insurancePercent / 100);

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

  const getRecommendationStyle = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY':
        return {
          bg: 'bg-green-100 dark:bg-green-900/30',
          text: 'text-green-800 dark:text-green-300',
          border: 'border-green-200 dark:border-green-800',
          icon: CheckCircle,
          label: 'Buying is recommended',
        };
      case 'RENT':
        return {
          bg: 'bg-red-100 dark:bg-red-900/30',
          text: 'text-red-800 dark:text-red-300',
          border: 'border-red-200 dark:border-red-800',
          icon: XCircle,
          label: 'Renting is recommended',
        };
      default:
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          text: 'text-yellow-800 dark:text-yellow-300',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: AlertTriangle,
          label: 'Close call - consider other factors',
        };
    }
  };

  return (
    <Layout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-3xl font-bold">Buy vs. Rent Analysis</h1>
          <p className="text-muted-foreground mt-1">
            Enter details about equipment you're considering to see whether buying or renting makes more financial sense.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
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
                  <div className="col-span-2">
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
                  <div className="col-span-2">
                    <Label htmlFor="resaleValue">Expected Resale Value</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="resaleValue"
                        type="number"
                        className="pl-9"
                        value={input.resaleValue || ''}
                        onChange={(e) => updateField('resaleValue', Number(e.target.value))}
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
                <div className="grid grid-cols-3 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="maintenance">Maintenance/Repairs</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="maintenance"
                        type="number"
                        className="pl-9"
                        value={input.annualMaintenance || ''}
                        onChange={(e) => updateField('annualMaintenance', Number(e.target.value))}
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
                        className="pl-9"
                        value={input.annualInsurance || ''}
                        onChange={(e) => updateField('annualInsurance', Number(e.target.value))}
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
                {/* Recommendation Badge */}
                {(() => {
                  const style = getRecommendationStyle(result.recommendation);
                  const Icon = style.icon;
                  return (
                    <Card className={cn('border-2', style.border)}>
                      <CardContent className={cn('p-6', style.bg)}>
                        <div className="flex items-center gap-4">
                          <div className={cn('p-3 rounded-full', style.bg)}>
                            <Icon className={cn('h-8 w-8', style.text)} />
                          </div>
                          <div>
                            <Badge 
                              className={cn(
                                'text-lg px-4 py-1 font-bold',
                                result.recommendation === 'BUY' && 'bg-green-600 hover:bg-green-600',
                                result.recommendation === 'RENT' && 'bg-red-600 hover:bg-red-600',
                                result.recommendation === 'CLOSE_CALL' && 'bg-yellow-600 hover:bg-yellow-600'
                              )}
                            >
                              {result.recommendation === 'CLOSE_CALL' ? 'CLOSE CALL' : result.recommendation}
                            </Badge>
                            <p className={cn('mt-1 font-medium', style.text)}>
                              {style.label}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-current/10">
                          <p className={cn('text-lg font-semibold', style.text)}>
                            {result.annualOwnershipCost < result.annualRentalCost 
                              ? `Buying saves ${formatCurrency(result.annualSavings)} per year`
                              : `Renting saves ${formatCurrency(result.annualSavings)} per year`
                            }
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Over {input.usefulLife} years: {formatCurrency(result.totalSavingsOverLife)} total savings
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })()}

                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
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
                        {formatCurrency(result.annualRentalCost)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Based on {input.usageDaysPerYear} days × {formatCurrency(input.rentalRateDaily)}/day
                        {(input.rentalRateWeekly || input.rentalRateMonthly) && 
                          ' (optimized using best available rate)'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Break-Even Analysis */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                      <Info className="h-4 w-4" />
                      Break-Even Analysis
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm">Break-Even Point:</p>
                        <p className="text-xl font-bold font-mono-nums">
                          {formatDays(result.breakEvenDays)}
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
                        {input.usageDaysPerYear > result.breakEvenDays 
                          ? `You use this equipment ${Math.round(input.usageDaysPerYear - result.breakEvenDays)} days more than the break-even point, making buying more economical.`
                          : input.usageDaysPerYear < result.breakEvenDays
                            ? `You use this equipment ${Math.round(result.breakEvenDays - input.usageDaysPerYear)} days less than the break-even point, making renting more economical.`
                            : `Your usage is right at the break-even point. Consider other factors like convenience and availability.`
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Cumulative Cost Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={result.yearByYearComparison}>
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
                          <Tooltip 
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
                        {result.yearByYearComparison.map((row) => (
                          <TableRow key={row.year}>
                            <TableCell className="font-medium">Year {row.year}</TableCell>
                            <TableCell className="text-right font-mono-nums">
                              {formatCurrency(row.ownCumulative)}
                            </TableCell>
                            <TableCell className="text-right font-mono-nums">
                              {formatCurrency(row.rentCumulative)}
                            </TableCell>
                            <TableCell className={cn(
                              'text-right font-mono-nums font-medium',
                              row.savings > 0 ? 'text-green-600' : 'text-red-600'
                            )}>
                              {row.savings > 0 ? '+' : ''}{formatCurrency(row.savings)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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
