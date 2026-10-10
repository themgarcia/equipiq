import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useServiceDivisions } from '@/hooks/useServiceDivisions';
import { useCategoryAllocations } from '@/hooks/useCategoryAllocations';
import { resolveAllocation, describeAllocation, type AllocationRow, type UnitAllocationRow } from '@/lib/divisionAllocation';
import { AllocationEditor, ROUTER_LABEL } from '@/components/equipment/AllocationEditor';
import type { EquipmentCalculated } from '@/types/equipment';

const SOURCE_LABEL = {
  unit: 'Set for this machine (override)',
  category: 'From category default',
  shared: 'Year-round shared (no category default set)',
} as const;

export function DivisionAllocationPanel({ equipment }: { equipment: EquipmentCalculated }) {
  const qc = useQueryClient();
  const { divisions } = useServiceDivisions();
  const { byCategory } = useCategoryAllocations();
  const key = ['equipment_allocations', equipment.id];
  const [editing, setEditing] = useState(false);

  const { data: saved, isLoading } = useQuery({
    queryKey: key,
    queryFn: async (): Promise<UnitAllocationRow[]> => {
      const { data, error } = await supabase
        .from('equipment_division_allocations')
        .select('service_division_id, months_committed, share_of_year, expected_hours, allocation_type, is_override')
        .eq('equipment_id', equipment.id);
      if (error) throw error;
      return (data ?? []).map(r => ({
        service_division_id: r.service_division_id,
        months_committed: r.months_committed === null ? null : Number(r.months_committed),
        share_of_year: Number(r.share_of_year),
        expected_hours: r.expected_hours === null ? null : Number(r.expected_hours),
        allocation_type: r.allocation_type,
        is_override: r.is_override,
      }));
    },
  });

  const categoryRows = byCategory[equipment.category] ?? [];
  const resolved = useMemo(() => resolveAllocation(saved ?? [], categoryRows), [saved, categoryRows]);
  const divName = (id: string) => divisions.find(d => d.id === id)?.name ?? 'Unknown';
  const machineRouter = ROUTER_LABEL[equipment.allocationType] ?? 'Field Equipment';

  const saveOverride = async (rows: AllocationRow[]) => {
    const method = equipment.lmnRecoveryMethod ?? 'owned';
    const payload = (rows.length ? rows : [{ service_division_id: null, months_committed: null, share_of_year: 1, expected_hours: null, allocation_type: null }])
      .map(r => ({ ...r, recovery_method: method }));
    const { error } = await supabase.rpc('replace_equipment_allocations', { _equipment_id: equipment.id, _rows: payload });
    if (error) {
      toast({ title: 'Could not save divisions', description: 'Shares must total 100%.', variant: 'destructive' });
      return;
    }
    await qc.invalidateQueries({ queryKey: key });
    setEditing(false);
    toast({ title: 'Saved for this machine' });
  };

  const resetToCategory = async () => {
    const { error } = await supabase.rpc('reset_equipment_allocations_to_inherit', { _equipment_id: equipment.id });
    if (error) {
      toast({ title: 'Could not reset', variant: 'destructive' });
      return;
    }
    await qc.invalidateQueries({ queryKey: key });
    setEditing(false);
    toast({ title: 'Now using the category default' });
  };

  if (isLoading) return null;

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold">Divisions</h3>
        <p className="text-sm text-muted-foreground">Which service divisions this machine serves, and how much of its year each one takes.</p>
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs font-normal">{SOURCE_LABEL[resolved.source]}</Badge>
          {resolved.source === 'category' && <span className="text-xs text-muted-foreground">{equipment.category}</span>}
        </div>
        <p className="text-sm font-medium">{describeAllocation(resolved.rows, divName)}</p>
        <div className="flex flex-wrap gap-2">
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              {resolved.source === 'unit' ? 'Edit' : 'Override for this machine'}
            </Button>
          )}
          {resolved.source === 'unit' && (
            <Button size="sm" variant="ghost" onClick={resetToCategory}>Reset to category default</Button>
          )}
          {resolved.source !== 'unit' && (
            <Button size="sm" variant="link" className="px-0" asChild>
              <Link to="/settings/company?tab=divisions">Set for the whole category</Link>
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <div className="rounded-md border p-3 space-y-3">
          <AllocationEditor
            initialRows={resolved.rows}
            onSave={saveOverride}
            saveLabel="Save for this machine"
            routerFallbackLabel={`Same as this machine (${machineRouter})`}
          />
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
