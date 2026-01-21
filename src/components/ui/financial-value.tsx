import { cn } from '@/lib/utils';
import { formatCurrency as formatCurrencyFn, formatPercent as formatPercentFn } from '@/lib/calculations';

interface FinancialValueProps {
  value: number;
  showSign?: boolean;
  format?: 'currency' | 'percent' | 'number';
  neutralAt?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const weightClasses = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export function FinancialValue({
  value,
  showSign = true,
  format = 'currency',
  neutralAt,
  size = 'md',
  weight = 'normal',
  className,
}: FinancialValueProps) {
  const isNeutral = value === 0 || value === neutralAt;
  const isPositive = value > 0;
  
  const colorClass = isNeutral 
    ? '' 
    : isPositive 
      ? 'text-success' 
      : 'text-destructive';

  const formatValue = () => {
    const signPrefix = showSign && isPositive ? '+' : '';
    
    switch (format) {
      case 'currency':
        return `${signPrefix}${formatCurrencyFn(value)}`;
      case 'percent':
        return `${signPrefix}${value}%`;
      case 'number':
        return `${signPrefix}${value.toLocaleString()}`;
      default:
        return `${signPrefix}${value}`;
    }
  };

  return (
    <span className={cn(
      'font-mono-nums',
      sizeClasses[size],
      weightClasses[weight],
      colorClass,
      className
    )}>
      {formatValue()}
    </span>
  );
}
