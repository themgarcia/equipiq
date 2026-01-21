import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { FinancialValue } from '@/components/ui/financial-value';

interface MetricCardProps {
  title: string;
  value: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  variant?: 'default' | 'primary' | 'warning';
  className?: string;
}

const variantStyles = {
  default: '',
  primary: 'border-primary/20 bg-primary/5',
  warning: 'border-warning/20 bg-warning/5',
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  variant = 'default',
  className 
}: MetricCardProps) {
  return (
    <div className={cn('metric-card card-interactive', variantStyles[variant], className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold font-mono-nums tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <FinancialValue 
            value={trend.value} 
            format="percent" 
            weight="medium" 
            size="sm"
            semantic={true}
          />
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
