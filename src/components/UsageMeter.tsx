import { cn } from '@/lib/utils';

interface UsageMeterProps {
  current: number;
  max: number;
  label: string;
  formatValue?: (value: number) => string;
  showPercentage?: boolean;
  className?: string;
}

export function UsageMeter({
  current,
  max,
  label,
  formatValue = (v) => v.toString(),
  showPercentage = false,
  className,
}: UsageMeterProps) {
  const isUnlimited = !isFinite(max);
  const percentage = isUnlimited ? 0 : Math.min(100, (current / max) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          'font-medium',
          isAtLimit ? 'text-destructive' : isNearLimit ? 'text-yellow-600 dark:text-yellow-500' : 'text-foreground'
        )}>
          {formatValue(current)}
          {!isUnlimited && (
            <>
              {' / '}
              {formatValue(max)}
              {showPercentage && ` (${Math.round(percentage)}%)`}
            </>
          )}
          {isUnlimited && ' (Unlimited)'}
        </span>
      </div>
      {!isUnlimited && (
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              isAtLimit
                ? 'bg-destructive'
                : isNearLimit
                ? 'bg-yellow-500'
                : 'bg-primary'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to format bytes
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (!isFinite(bytes)) return 'Unlimited';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
