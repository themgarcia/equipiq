import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Pencil, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCategoryDefaultsTable } from '@/hooks/useCategoryDefaultsTable';
import { resolveOperatingCosts, ResolvedCost, OperatingCostSource } from '@/lib/operatingCosts';
import type { Equipment, EquipmentCalculated } from '@/types/equipment';

const SOURCE_LABEL: Record<OperatingCostSource, string> = {
  override: 'Your override',
  category_default: 'Category default',
  premium: 'Actual premium',
  estimate_declared: 'Estimate',
  estimate_replacement: 'Estimate',
  not_set: 'Not set',
};

type OverrideKey = 'maintenanceAnnualOverride' | 'licensingAnnualOverride' | 'fuelConsumptionLphOverride';

interface Props {
  equipment: EquipmentCalculated;
  onUpdate: (id: string, data: Omit<Equipment, 'id'>) => void;
}

export function OperatingCostsPanel({ equipment, onUpdate }: Props) {
  const { data } = useCategoryDefaultsTable();
  const cat = data?.costDefaults[equipment.category] ?? {
    maintenancePercent: null, insurancePercent: null, licensingAnnual: null, fuelConsumptionLph: null,
  };
  const r = resolveOperatingCosts(equipment, cat);

  const save = (key: OverrideKey, value: number | null) => {
    const { id, ...rest } = equipment;
    onUpdate(id, { ...rest, [key]: value });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        <h3 className="text-sm font-medium text-muted-foreground">Operating Costs</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              Category percentages apply to Replacement Cost (Today), not the original purchase price, so an older machine
              gets an allowance in today's dollars. Insurance estimates use your declared value when you have one.
              These figures are for reference and are not yet used in any rate or export.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <CostRow label="Maintenance + repair" unit="/yr" cost={r.maintenance}
        current={equipment.maintenanceAnnualOverride} onSave={(v) => save('maintenanceAnnualOverride', v)} />
      <CostRow label="Insurance" unit="/yr" cost={r.insurance} readOnly />
      <CostRow label="Licensing" unit="/yr" cost={r.licensing}
        current={equipment.licensingAnnualOverride} onSave={(v) => save('licensingAnnualOverride', v)} />
      <CostRow label="Fuel consumption" unit="L/hr" cost={r.fuel}
        current={equipment.fuelConsumptionLphOverride} onSave={(v) => save('fuelConsumptionLphOverride', v)} />
    </div>
  );
}

function CostRow({ label, unit, cost, current, onSave, readOnly }: {
  label: string; unit: string; cost: ResolvedCost;
  current?: number | null; onSave?: (v: number | null) => void; readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const fmt = (v: number) => unit === 'L/hr' ? `${v} L/hr` : `$${Math.round(v).toLocaleString('en-US')}${unit}`;

  const commit = () => {
    const t = draft.trim();
    if (t === '') { setEditing(false); return; }
    const n = parseFloat(t);
    if (isNaN(n) || n < 0) return;
    onSave?.(n);
    setEditing(false);
  };

  return (
    <div className="rounded-md border p-3 space-y-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">{SOURCE_LABEL[cost.source]}</Badge>
          <span className={`text-sm font-semibold font-mono-nums ${cost.value == null ? 'text-muted-foreground' : ''}`}>
            {cost.value == null ? 'Not set' : fmt(cost.value)}
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{cost.derivation}</p>
      {readOnly ? (
        <Link to="/insurance" className="text-xs text-primary hover:underline">Edit premium on Insurance page</Link>
      ) : editing ? (
        <div className="flex items-center gap-2 pt-1">
          <Input autoFocus type="number" min="0" step="any" value={draft} onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && commit()} className="h-8 w-32 font-mono-nums"
            placeholder={unit === 'L/hr' ? 'L/hr' : '$ per year'} />
          <Button size="sm" className="h-8" onClick={commit}>Save</Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      ) : (
        <div className="flex gap-3 pt-0.5">
          <button type="button" className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            onClick={() => { setDraft(current != null ? String(current) : ''); setEditing(true); }}>
            <Pencil className="h-3 w-3" /> {current != null ? 'Change override' : 'Set override'}
          </button>
          {current != null && (
            <button type="button" className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
              onClick={() => onSave?.(null)}>
              <RotateCcw className="h-3 w-3" /> Reset to default
            </button>
          )}
        </div>
      )}
    </div>
  );
}
