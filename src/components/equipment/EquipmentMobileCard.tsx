import { ChevronRight } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/calculations';
import { EquipmentCalculated, EquipmentAttachment } from '@/types/equipment';

interface EquipmentMobileCardProps {
  equipment: EquipmentCalculated;
  attachments: EquipmentAttachment[];
  onClick: () => void;
}

export function EquipmentMobileCard({
  equipment,
  attachments,
  onClick,
}: EquipmentMobileCardProps) {
  const hasAttachments = attachments.length > 0;

  return (
    <div 
      className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{equipment.name}</p>
          {hasAttachments && (
            <span className="text-xs text-muted-foreground shrink-0">
              ({attachments.length})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={equipment.status} />
          <span className="text-sm text-muted-foreground font-mono-nums">
            {formatCurrency(equipment.totalCostBasis)}
          </span>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
    </div>
  );
}
