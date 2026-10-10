import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useServiceDivisions } from '@/hooks/useServiceDivisions';
import { useCategoryAllocations } from '@/hooks/useCategoryAllocations';
import { useEquipment } from '@/contexts/EquipmentContext';
import { getCategoryDefaults } from '@/data/categoryDefaults';
import { describeAllocation, type AllocationRow } from '@/lib/divisionAllocation';
import { AllocationEditor } from '@/components/equipment/AllocationEditor';

/** Category-level allocation defaults for the categories in this fleet. */
export function CategoryAllocationsCard() {
  const { user } = useAuth();
  const { divisions } = useServiceDivisions();
  const { byCategory, replace } = useCategoryAllocations();
  const { calculatedEquipment } = useEquipment();
  const [editing, setEditing] = useState<string | null>(null);
  const [pending, setPending] = useState<AllocationRow[] | null>(null);

  const active = useMemo(() => calculatedEquipment.filter(e => e.status === 'Active'), [calculatedEquipment]);
  const groups = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const c of [...new Set(active.map(e => e.category))].sort()) {
      const tax = getCategoryDefaults(c).division as string;
      m.set(tax, [...(m.get(tax) ?? []), c]);
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [active]);

  // Which machines have their own setting (so a category change won't touch them)
  const { data: overrideIds } = useQuery({
    queryKey: ['equipment_allocations', 'overrides', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from('equipment_division_allocations').select('equipment_id').eq('is_override', true);
      if (error) throw error;
      return new Set((data ?? []).map(r => r.equipment_id));
    },
  });

  const divName = (id: string) => divisions.find(d => d.id === id)?.name ?? 'Unknown';
  const unitsIn = (c: string) => active.filter(e => e.category === c);
  const countOverrides = (c: string) => unitsIn(c).filter(e => overrideIds?.has(e.id)).length;

  const confirmSave = async () => {
    if (!editing || !pending) return;
    try {
      await replace(editing, pending);
      toast({ title: 'Category allocation saved' });
      setEditing(null); setPending(null);
    } catch {
      toast({ title: 'Could not save', description: 'Shares must total 100%.', variant: 'destructive' });
    }
  };

  if (groups.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Category allocations</CardTitle>
        <CardDescription>Set each category once. Machines follow it unless you set one on its own.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.map(([tax, cats]) => (
          <div key={tax} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tax}</p>
            {cats.map(c => {
              const rows = byCategory[c];
              return (
                <div key={c} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
                  <div className="flex-1 min-w-[180px]">
                    <p className="text-sm font-medium">{c}</p>
                    <p className="text-xs text-muted-foreground">{rows ? describeAllocation(rows, divName) : 'Year-round shared'} · {unitsIn(c).length} {unitsIn(c).length === 1 ? 'machine' : 'machines'}</p>
                  </div>
                  <Badge variant="outline" className="text-xs font-normal">{rows ? 'Category default' : 'Not set'}</Badge>
                  <Button size="sm" variant="outline" onClick={() => { setEditing(c); setPending(null); }}>Edit</Button>
                </div>
              );
            })}
          </div>
        ))}
      </CardContent>

      <Dialog open={!!editing} onOpenChange={o => { if (!o) { setEditing(null); setPending(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing}</DialogTitle>
            <DialogDescription>Default split for every machine in this category.</DialogDescription>
          </DialogHeader>
          {editing && !pending && (
            <AllocationEditor
              initialRows={byCategory[editing] ?? []}
              onSave={async rows => setPending(rows)}
              saveLabel="Review and save"
              routerFallbackLabel="Same as each machine's own setting"
            />
          )}
          {editing && pending && (() => {
            const total = unitsIn(editing).length, kept = countOverrides(editing);
            return (
              <div className="space-y-4">
                <p className="text-sm">New default: <span className="font-medium">{describeAllocation(pending, divName)}</span></p>
                <p className="text-sm text-muted-foreground">
                  Applies to {total - kept} {total - kept === 1 ? 'machine' : 'machines'}.
                  {kept > 0 && ` ${kept} ${kept === 1 ? 'machine has its' : 'machines have their'} own setting and won't change.`}
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setPending(null)}>Back</Button>
                  <Button onClick={confirmSave}>Save</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
