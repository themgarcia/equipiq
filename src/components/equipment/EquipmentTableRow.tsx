import { ChevronDown, ChevronRight, CornerDownRight, User, Building2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/calculations';
import { EquipmentCalculated, EquipmentAttachment } from '@/types/equipment';

interface EquipmentTableRowProps {
  equipment: EquipmentCalculated;
  attachments: EquipmentAttachment[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClick: () => void;
}

export function EquipmentTableRow({
  equipment,
  attachments,
  isExpanded,
  onToggleExpand,
  onClick,
}: EquipmentTableRowProps) {
  const hasAttachments = attachments.length > 0;

  return (
    <>
      <TableRow 
        className="group hover:bg-muted/30 cursor-pointer" 
        onClick={onClick}
      >
        <TableCell>
          <div className="flex items-center gap-2">
            {hasAttachments && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
                className="p-0.5 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
            )}
            <div className="truncate min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate text-sm md:text-base">{equipment.name}</p>
                {hasAttachments && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    ({attachments.length})
                  </span>
                )}
              </div>
              {equipment.assetId && (
                <p className="text-xs text-muted-foreground truncate">
                  {equipment.assetId}
                </p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="w-[130px]">
          <div className="flex items-center gap-1.5">
            <StatusBadge status={equipment.status} />
            {equipment.allocationType === 'owner_perk' && (
              <Badge variant="outline" className="text-warning border-warning/50 text-[10px] px-1.5 py-0">
                <User className="h-3 w-3 mr-0.5" />
                Perk
              </Badge>
            )}
            {equipment.allocationType === 'overhead_only' && (
              <Badge variant="outline" className="text-info border-info/50 text-[10px] px-1.5 py-0">
                <Building2 className="h-3 w-3 mr-0.5" />
                OH
              </Badge>
            )}
          </div>
        </TableCell>
        <TableCell className="w-[120px] text-right font-mono-nums">
          {formatCurrency(equipment.totalCostBasis)}
        </TableCell>
        <TableCell className="w-[80px] text-right font-mono-nums hidden md:table-cell">
          <span className={equipment.estimatedYearsLeft <= 1 ? 'text-warning font-semibold' : ''}>
            {equipment.estimatedYearsLeft.toFixed(1)}
          </span>
        </TableCell>
        <TableCell className="w-[120px] text-right font-mono-nums hidden md:table-cell">
          {formatCurrency(equipment.replacementCostUsed)}
        </TableCell>
      </TableRow>
      
      {/* Collapsible attachment rows */}
      {hasAttachments && isExpanded && attachments.map(attachment => (
        <TableRow 
          key={`att-${attachment.id}`} 
          className="bg-muted/20 hover:bg-muted/40"
        >
          <TableCell className="pl-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CornerDownRight className="h-3 w-3" />
              <span>{attachment.name}</span>
            </div>
          </TableCell>
          <TableCell className="w-[90px]">
            <span className="text-xs text-muted-foreground">Attachment</span>
          </TableCell>
          <TableCell className="w-[120px] text-right font-mono-nums text-muted-foreground">
            {formatCurrency(attachment.value)}
          </TableCell>
          <TableCell className="w-[80px] hidden md:table-cell"></TableCell>
          <TableCell className="w-[120px] hidden md:table-cell"></TableCell>
        </TableRow>
      ))}
    </>
  );
}
