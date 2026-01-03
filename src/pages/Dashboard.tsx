import { useEquipment } from '@/contexts/EquipmentContext';
import { MetricCard } from '@/components/MetricCard';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/calculations';
import { Layout } from '@/components/Layout';
import { 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const { calculatedEquipment } = useEquipment();
  
  const activeEquipment = calculatedEquipment.filter(e => e.status === 'Active');
  
  const totalCostBasis = activeEquipment.reduce((sum, e) => sum + e.totalCostBasis, 0);
  const totalCOGS = activeEquipment.reduce((sum, e) => sum + e.cogsAllocatedCost, 0);
  const totalOverhead = activeEquipment.reduce((sum, e) => sum + e.overheadAllocatedCost, 0);
  const totalReplacementValue = activeEquipment.reduce((sum, e) => sum + e.replacementCostUsed, 0);
  
  const agingEquipment = activeEquipment.filter(e => e.estimatedYearsLeft <= 1);
  
  const recentEquipment = [...calculatedEquipment]
    .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
    .slice(0, 5);

  return (
    <Layout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="accent-line mb-4" />
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your equipment fleet and allocations
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
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

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
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

        {/* Quick Stats */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg COGS Allocation</p>
            <p className="text-2xl font-bold font-mono-nums">
              {activeEquipment.length > 0 
                ? Math.round(activeEquipment.reduce((sum, e) => sum + e.cogsPercent, 0) / activeEquipment.length)
                : 0}%
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Avg Useful Life</p>
            <p className="text-2xl font-bold font-mono-nums">
              {activeEquipment.length > 0 
                ? (activeEquipment.reduce((sum, e) => sum + e.usefulLifeUsed, 0) / activeEquipment.length).toFixed(1)
                : 0} yrs
            </p>
          </div>
          <div className="bg-muted/30 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total Categories</p>
            <p className="text-2xl font-bold font-mono-nums">
              {new Set(activeEquipment.map(e => e.category)).size}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
