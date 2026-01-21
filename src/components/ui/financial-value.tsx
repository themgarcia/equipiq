import { cn } from '@/lib/utils';
import { formatCurrency as formatCurrencyFn } from '@/lib/calculations';

interface FinancialValueProps {
  value: number;
  showSign?: boolean;
  format?: 'currency' | 'percent' | 'number' | 'compact' | 'abbreviated';
  neutralAt?: number;
  /** When true, applies green for positive and red for negative values. Default false (informational). */
  semantic?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  precision?: number;
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

const formatCompactNumber = (num: number, precision: number = 1): string => {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  
  if (absNum >= 1_000_000_000) {
    const formatted = (absNum / 1_000_000_000).toFixed(precision);
    return `${sign}${formatted.replace(/\.0+$/, '')}B`;
  }
  if (absNum >= 1_000_000) {
    const formatted = (absNum / 1_000_000).toFixed(precision);
    return `${sign}${formatted.replace(/\.0+$/, '')}M`;
  }
  if (absNum >= 1_000) {
    const formatted = (absNum / 1_000).toFixed(precision);
    return `${sign}${formatted.replace(/\.0+$/, '')}K`;
  }
  return num.toLocaleString();
};

export function FinancialValue({
  value,
  showSign = true,
  format = 'currency',
  neutralAt,
  semantic = false,
  size = 'md',
  weight = 'normal',
  precision = 1,
  className,
}: FinancialValueProps) {
  const isNeutral = value === 0 || value === neutralAt;
  const isPositive = value > 0;
  
  // Only apply semantic colors (green/red) when explicitly requested
  const colorClass = semantic
    ? isNeutral 
      ? '' 
      : isPositive 
        ? 'text-success' 
        : 'text-destructive'
    : '';

  const formatValue = () => {
    const signPrefix = showSign && isPositive ? '+' : '';
    
    switch (format) {
      case 'currency':
        return `${signPrefix}${formatCurrencyFn(value)}`;
      case 'percent':
        return `${signPrefix}${value}%`;
      case 'number':
        return `${signPrefix}${value.toLocaleString()}`;
      case 'compact':
        return `${signPrefix}$${formatCompactNumber(Math.abs(value), precision)}${value < 0 ? '' : ''}`.replace('$-', '-$');
      case 'abbreviated':
        return `${signPrefix}${formatCompactNumber(value, precision)}`;
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
