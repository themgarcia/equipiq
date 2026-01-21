import { ShieldCheck, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { InsuranceMetrics } from '@/types/insurance';

interface InsuranceMetricsRowProps {
  metrics: InsuranceMetrics;
}

export function InsuranceMetricsRow({ metrics }: InsuranceMetricsRowProps) {
  const getRenewalDisplay = () => {
    if (metrics.daysToRenewal === null) {
      return { value: '—', label: 'Set renewal date', variant: 'muted' as const };
    }
    if (metrics.daysToRenewal < 0) {
      return { value: 'Overdue', label: `${Math.abs(metrics.daysToRenewal)} days past`, variant: 'destructive' as const };
    }
    if (metrics.daysToRenewal <= 60) {
      return { value: metrics.daysToRenewal.toString(), label: 'days to renewal', variant: 'warning' as const };
    }
    return { value: metrics.daysToRenewal.toString(), label: 'days to renewal', variant: 'default' as const };
  };

  const renewalDisplay = getRenewalDisplay();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.totalInsuredCount}</p>
              <p className="text-xs text-muted-foreground">Insured Equipment</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <DollarSign className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">${Math.ceil(metrics.totalDeclaredValue).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Declared Value</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${metrics.pendingChangesCount > 0 ? 'bg-warning/10' : 'bg-muted'}`}>
              <AlertTriangle className={`h-5 w-5 ${metrics.pendingChangesCount > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{metrics.pendingChangesCount}</p>
              <p className="text-xs text-muted-foreground">Pending Changes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              renewalDisplay.variant === 'destructive' ? 'bg-destructive/10' :
              renewalDisplay.variant === 'warning' ? 'bg-warning/10' :
              renewalDisplay.variant === 'muted' ? 'bg-muted' :
              'bg-info/10'
            }`}>
              <Clock className={`h-5 w-5 ${
                renewalDisplay.variant === 'destructive' ? 'text-destructive' :
                renewalDisplay.variant === 'warning' ? 'text-warning' :
                renewalDisplay.variant === 'muted' ? 'text-muted-foreground' :
                'text-info'
              }`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{renewalDisplay.value}</p>
              <p className="text-xs text-muted-foreground">{renewalDisplay.label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
