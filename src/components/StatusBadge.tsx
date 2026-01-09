import { forwardRef } from 'react';
import { EquipmentStatus } from '@/types/equipment';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: EquipmentStatus;
  className?: string;
}

const statusStyles: Record<EquipmentStatus, string> = {
  Active: 'bg-success/10 text-success border-success/20',
  Sold: 'bg-muted text-muted-foreground border-muted-foreground/20',
  Retired: 'bg-warning/10 text-warning border-warning/20',
  Lost: 'bg-destructive/10 text-destructive border-destructive/20',
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status, className }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'status-badge border',
          statusStyles[status],
          className
        )}
      >
        {status}
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';
