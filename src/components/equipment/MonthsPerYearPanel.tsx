import { useState } from 'react';
import { Pencil, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEquipment } from '@/contexts/EquipmentContext';
import { parseRequiredNumber } from '@/lib/numericInput';
import type { EquipmentCalculated } from '@/types/equipment';

const SOURCE_TEXT = {
  unit: 'Set for this machine (override)',
  category: 'From category default',
  default: 'Not set — using 12 months',
} as const;

/** Months per year this machine is used — sent to LMN's budget calculator. Same layout as Operating Costs rows. */
export function MonthsPerYearPanel({ equipment }: { equipment: EquipmentCalculated }) {
  const { updateEquipment, categoryDefaults } = useEquipment();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const categoryMonths = categoryDefaults.find(c => c.category === equipment.category)?.monthsPerYearUsed;

  const commit = async () => {
    const r = parseRequiredNumber(draft, 1, 12, 'Months per year');
    if (r.ok === false) { setError(r.error); return; }
    await updateEquipment(equipment.id, { monthsPerYearUsed: r.value });
    setEditing(false);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">Months per year used</h3>
      <div className="rounded-md border p-3 space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-sm">Months used</span>
          <span className="font-mono-nums font-medium">{equipment.monthsPerYearUsedResolved}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {SOURCE_TEXT[equipment.monthsPerYearSource]}
          {equipment.monthsPerYearSource === 'unit' && ` · Category default: ${categoryMonths ?? 12} months`}
          . Goes into "months per year you use it" on the LMN budget.
        </p>
        {editing ? (
          <div className="flex items-center gap-2 pt-1">
            <Input autoFocus inputMode="decimal" value={draft} onChange={(e) => { setDraft(e.target.value); setError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && commit()} className="h-8 w-24 font-mono-nums" placeholder="1–12" aria-label="Months per year used" />
            <Button size="sm" className="h-8" onClick={commit}>Save</Button>
            <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <div className="flex gap-3 pt-0.5">
            <button type="button" className="text-xs text-primary hover:underline inline-flex items-center gap-1"
              onClick={() => { setDraft(equipment.monthsPerYearUsed != null ? String(equipment.monthsPerYearUsed) : ''); setEditing(true); }}>
              <Pencil className="h-3 w-3" /> {equipment.monthsPerYearUsed != null ? 'Change override' : 'Set override'}
            </button>
            {equipment.monthsPerYearUsed != null && (
              <button type="button" className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
                onClick={() => updateEquipment(equipment.id, { monthsPerYearUsed: null })}>
                <RotateCcw className="h-3 w-3" /> Reset to default
              </button>
            )}
          </div>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
