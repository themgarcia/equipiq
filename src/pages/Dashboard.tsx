import { useEffect } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { MetricCard } from '@/components/MetricCard';
import { formatCurrency } from '@/lib/calculations';
import { parseLocalDate } from '@/lib/utils';
import { FinancialValue } from '@/components/ui/financial-value';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WelcomeModal } from '@/components/WelcomeModal';
import { 
  DollarSign, 
  AlertTriangle,
  CreditCard,
  Calendar,
  Wrench,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DashboardSkeleton } from '@/components/PageSkeletons';

export default function Dashboard() {
  const { calculatedEquipment, loading } = useEquipment();
  const { markStepComplete } = useOnboarding();
  
  // Mark dashboard as viewed on mount
  useEffect(() => {
    markStepComplete('step_dashboard_viewed');
  }, [markStepComplete]);
  
  if (loading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }
  
  const activeEquipment = calculatedEquipment.filter(e => e.status === 'Active');
  
  // Main metrics
  const totalCostBasis = activeEquipment.reduce((sum, e) => sum + e.totalCostBasis, 0);
  
  const agingEquipment = activeEquipment.filter(e => e.estimatedYearsLeft <= 1);

  // Financing calculations
  const totalMonthlyPayments = activeEquipment.reduce((sum, e) => sum + e.monthlyPayment, 0);
  const totalOutstandingDebt = activeEquipment.reduce((sum, e) => {
    if (e.financingType === 'owned' || !e.financingStartDate) return sum;
    const startDate = parseLocalDate(e.financingStartDate);
    const now = new Date();
    const monthsElapsed = Math.max(0, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()));
    const remainingPayments = Math.max(0, e.termMonths - monthsElapsed);
    return sum + (remainingPayments * e.monthlyPayment) + e.buyoutAmount;
  }, 0);

  // Upcoming payoffs (next 12 months)
  const upcomingPayoffs = activeEquipment
    .filter(e => e.financingType !== 'owned' && e.financingStartDate && e.termMonths > 0)
    .map(e => {
      const startDate = parseLocalDate(e.financingStartDate!);
      const payoffDate = new Date(startDate);
      payoffDate.setMonth(payoffDate.getMonth() + e.termMonths);
      const now = new Date();
      const monthsUntilPayoff = (payoffDate.getFullYear() - now.getFullYear()) * 12 + (payoffDate.getMonth() - now.getMonth());
      return { ...e, payoffDate, monthsUntilPayoff };
    })
    .filter(e => e.monthsUntilPayoff > 0 && e.monthsUntilPayoff <= 12)
    .sort((a, b) => a.monthsUntilPayoff - b.monthsUntilPayoff);

  // Replacement timeline
  const replacementIn1Year = activeEquipment.filter(e => e.estimatedYearsLeft <= 1);
  const replacementIn2Years = activeEquipment.filter(e => e.estimatedYearsLeft > 1 && e.estimatedYearsLeft <= 2);
  const replacementIn3Years = activeEquipment.filter(e => e.estimatedYearsLeft > 2 && e.estimatedYearsLeft <= 3);
  
  const replacementCost1Year = replacementIn1Year.reduce((sum, e) => sum + e.replacementCostUsed, 0);
  const replacementCost2Years = replacementIn2Years.reduce((sum, e) => sum + e.replacementCostUsed, 0);
  const replacementCost3Years = replacementIn3Years.reduce((sum, e) => sum + e.replacementCostUsed, 0);

  const hasReplacementNeeds = replacementIn1Year.length + replacementIn2Years.length + replacementIn3Years.length > 0;

  return (
    <Layout>
      <WelcomeModal />
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Fleet overview at a glance
          </p>
        </div>

        {/* Simplified Metrics Grid - 4 Key Cards */}
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Fleet Investment"
            value={<FinancialValue value={totalCostBasis} format="compact" showSign={false} size="2xl" weight="bold" />}
            subtitle={`${activeEquipment.length} active items`}
            icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Monthly Payments"
            value={<FinancialValue value={totalMonthlyPayments} format="compact" showSign={false} size="2xl" weight="bold" />}
            subtitle="Financing obligations"
            icon={<CreditCard className="h-5 w-5 text-muted-foreground" />}
          />
          <MetricCard
            title="Outstanding Debt"
            value={<FinancialValue value={totalOutstandingDebt} format="compact" showSign={false} size="2xl" weight="bold" />}
            subtitle="Remaining liability"
            icon={<DollarSign className="h-5 w-5 text-muted-foreground" />}
          />
          <Link to="/equipment?filter=aging" className="block">
            <MetricCard
              title="Aging Alert"
              value={<span className="text-2xl font-bold">{agingEquipment.length}</span>}
              subtitle={agingEquipment.length === 0 ? "All equipment healthy" : "Items need attention"}
              icon={<AlertTriangle className={`h-5 w-5 ${agingEquipment.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />}
              className={agingEquipment.length > 0 ? 'border-warning/30 bg-warning/5' : ''}
            />
          </Link>
        </div>

        {/* Replacement Forecast - Merged Card */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Replacement Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {hasReplacementNeeds ? (
              <>
                {/* Timeline Summary */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      <span className="text-sm font-medium">Within 1 Year</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">{replacementIn1Year.length}</span>
                      <FinancialValue value={replacementCost1Year} format="compact" showSign={false} className="text-muted-foreground" />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      <span className="text-sm font-medium">1-2 Years</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">{replacementIn2Years.length}</span>
                      <FinancialValue value={replacementCost2Years} format="compact" showSign={false} className="text-muted-foreground" />
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      <span className="text-sm font-medium">2-3 Years</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="text-2xl font-bold">{replacementIn3Years.length}</span>
                      <FinancialValue value={replacementCost3Years} format="compact" showSign={false} className="text-muted-foreground" />
                    </div>
                  </div>
                </div>

                {/* 3-Year Total */}
                <div className="flex justify-between items-center p-4 bg-muted/50 rounded-lg">
                  <span className="font-medium">3-Year Total CapEx</span>
                  <FinancialValue 
                    value={replacementCost1Year + replacementCost2Years + replacementCost3Years} 
                    format="compact" 
                    showSign={false} 
                    size="xl" 
                    weight="bold" 
                  />
                </div>

                {/* Items Needing Attention (merged from Aging Equipment) */}
                {agingEquipment.length > 0 && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <h3 className="text-sm font-medium">Items Needing Attention</h3>
                    </div>
                    <div className="space-y-2">
                      {agingEquipment.slice(0, 4).map(equipment => (
                        <Link 
                          key={equipment.id}
                          to={`/equipment?selected=${equipment.id}`}
                          className="flex items-center justify-between p-3 bg-warning/5 border border-warning/20 rounded-lg hover:bg-warning/10 transition-colors group"
                        >
                          <div>
                            <p className="font-medium text-sm">{equipment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {equipment.category} • {equipment.estimatedYearsLeft === 0 
                                ? 'Past useful life' 
                                : `${equipment.estimatedYearsLeft.toFixed(1)} years left`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <FinancialValue value={equipment.replacementCostUsed} format="currency" showSign={false} size="sm" weight="medium" />
                              <p className="text-xs text-muted-foreground">to replace</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                          </div>
                        </Link>
                      ))}
                      {agingEquipment.length > 4 && (
                        <Link to="/equipment?filter=aging">
                          <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
                            View all {agingEquipment.length} items
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
                <p className="font-medium text-foreground">Fleet Looking Good</p>
                <p className="text-sm mt-1">
                  No equipment needs replacement in the next 3 years.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Payoffs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Payoffs
              {upcomingPayoffs.length > 0 && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({upcomingPayoffs.length} in next 12 months)
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {upcomingPayoffs.length > 0 ? (
              <div className="space-y-2">
                {upcomingPayoffs.map(item => (
                  <Link 
                    key={item.id} 
                    to={`/equipment?selected=${item.id}`}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors group"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.make} {item.model} • {formatCurrency(item.monthlyPayment)}/mo
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="font-medium text-sm">
                          {item.payoffDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.monthsUntilPayoff} months left
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-success" />
                <p className="font-medium text-foreground">All Clear</p>
                <p className="text-sm mt-1">
                  No financing payoffs in the next 12 months.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </Layout>
  );
}
