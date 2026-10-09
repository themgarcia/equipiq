import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useServiceDivisions } from '@/hooks/useServiceDivisions';
import { suggestShares, monthsMessage, sharesValid } from '@/lib/divisionShares';
import type { EquipmentCalculated } from '@/types/equipment';

type RateBasis = 'hourly' | 'seasonal' | 'per_event';
interface Row {
  divisionId: string;
  months: string;
  sharePct: string;
  hours: string;
  rateBasis: RateBasis;
  shareEdited: boolean;
}

const RATE_LABEL: Record<RateBasis, string> = { hourly: 'Hourly', seasonal: 'Seasonal', per_event: 'Per event' };
const num = (s: string) => (s.trim() === '' ? null : Number(s));

export function DivisionAllocationPanel({ equipment }: { equipment: EquipmentCalculated }) {
  const qc = useQueryClient();
  const { activeDivisions, divisions } = useServiceDivisions();
  const key = ['equipment_allocations', equipment.id];

  const { data: saved, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('equipment_division_allocations')
        .select('service_division_id, months_committed, share_of_year, expected_hours, rate_basis')
        .eq('equipment_id', equipment.id);
      if (error) throw error;
      return data ?? [];
    },
  });

  const [mode, setMode] = useState<'shared' | 'allocated'>('shared');
  const [sharedRate, setSharedRate] = useState<RateBasis>('hourly');
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const allocated = saved.filter(r => r.service_division_id);
    if (allocated.length === 0) {
      setMode('shared');
      setSharedRate((saved[0]?.rate_basis as RateBasis) ?? 'hourly');
      setRows([]);
    } else {
      setMode('allocated');
      setRows(allocated.map(r => ({
        divisionId: r.service_division_id!,
        months: r.months_committed?.toString() ?? '',
        sharePct: (Math.round(Number(r.share_of_year) * 1000) / 10).toString(),
        hours: r.expected_hours?.toString() ?? '',
        rateBasis: r.rate_basis as RateBasis,
        shareEdited: true,
      })));
    }
  }, [saved]);

  const monthsEntries = rows.map(r => ({ months: num(r.months) }));
  const message = monthsMessage(monthsEntries);
  const shares = rows.map(r => (Number(r.sharePct) || 0) / 100);
  const totalPct = shares.reduce((a, b) => a + b, 0) * 100;
  const valid = mode === 'shared' || sharesValid(shares);

  // Re-suggest shares the user hasn't edited when months change
  const applySuggestion = (next: Row[], force = false) => {
    const sug = suggestShares(next.map(r => ({ months: num(r.months) })));
    return next.map((r, i) => (force || !r.shareEdited ? { ...r, sharePct: (Math.round(sug[i] * 1000) / 10).toString(), shareEdited: force ? false : r.shareEdited } : r));
  };

  const setRow = (i: number, patch: Partial<Row>) => {
    let next = rows.map((r, j) => (j === i ? { ...r, ...patch } : r));
    if ('months' in patch) next = applySuggestion(next);
    setRows(next);
  };

  const addRow = (divisionId: string) => {
    const d = activeDivisions.find(x => x.id === divisionId);
    setRows(applySuggestion([...rows, { divisionId, months: d ? String(d.season_months) : '', sharePct: '', hours: '', rateBasis: 'hourly', shareEdited: false }]));
  };

  const unused = activeDivisions.filter(d => !rows.some(r => r.divisionId === d.id));
  const divName = (id: string) => divisions.find(d => d.id === id)?.name ?? 'Unknown';

  const handleSave = async () => {
    if (!valid) return;
    const method = equipment.lmnRecoveryMethod ?? 'owned';
    const payload = mode === 'shared'
      ? [{ service_division_id: null, months_committed: null, share_of_year: 1, expected_hours: null, recovery_method: method, rate_basis: sharedRate }]
      : rows.map((r, i) => ({
          service_division_id: r.divisionId,
          months_committed: num(r.months),
          share_of_year: shares[i] + (i === rows.length - 1 ? 1 - shares.reduce((a, b) => a + b, 0) : 0),
          expected_hours: num(r.hours),
          recovery_method: method,
          rate_basis: r.rateBasis,
        }));
    setSaving(true);
    const { error } = await supabase.rpc('replace_equipment_allocations', { _equipment_id: equipment.id, _rows: payload });
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save divisions', description: 'Shares must total 100%.', variant: 'destructive' });
      return;
    }
    await qc.invalidateQueries({ queryKey: key });
    toast({ title: 'Divisions saved' });
  };

  if (isLoading) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Divisions</h3>
        <p className="text-sm text-muted-foreground">Which of your service divisions this machine serves, and how much of its year each one takes.</p>
      </div>

      <RadioGroup value={mode} onValueChange={v => setMode(v as 'shared' | 'allocated')} className="space-y-2">
        <label className="flex gap-3 items-start cursor-pointer">
          <RadioGroupItem value="shared" className="mt-1" />
          <div>
            <p className="font-medium text-sm">Year-round shared</p>
            <p className="text-xs text-muted-foreground">One blended 12-month rate across all work.</p>
          </div>
        </label>
        <label className="flex gap-3 items-start cursor-pointer">
          <RadioGroupItem value="allocated" className="mt-1" disabled={activeDivisions.length === 0 && rows.length === 0} />
          <div>
            <p className="font-medium text-sm">Split across divisions</p>
            {activeDivisions.length === 0 && rows.length === 0 && (
              <p className="text-xs text-muted-foreground">Add service divisions in <Link to="/settings/company" className="underline">Company Settings</Link> first.</p>
            )}
          </div>
        </label>
      </RadioGroup>

      {mode === 'shared' && (
        <div className="space-y-1 max-w-[200px]">
          <Label>Rate basis</Label>
          <Select value={sharedRate} onValueChange={v => setSharedRate(v as RateBasis)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(RATE_LABEL) as RateBasis[]).map(k => <SelectItem key={k} value={k}>{RATE_LABEL[k]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {mode === 'allocated' && (
        <div className="space-y-3">
          {rows.map((r, i) => (
            <div key={r.divisionId} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{divName(r.divisionId)}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7" aria-label="Remove division" onClick={() => setRows(applySuggestion(rows.filter((_, j) => j !== i)))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Months committed</Label>
                  <Input inputMode="decimal" value={r.months} onChange={e => setRow(i, { months: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Share of year %</Label>
                  <Input inputMode="decimal" value={r.sharePct} onChange={e => setRow(i, { sharePct: e.target.value, shareEdited: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expected hours</Label>
                  <Input inputMode="decimal" value={r.hours} onChange={e => setRow(i, { hours: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rate basis</Label>
                  <Select value={r.rateBasis} onValueChange={v => setRow(i, { rateBasis: v as RateBasis })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(RATE_LABEL) as RateBasis[]).map(k => <SelectItem key={k} value={k}>{RATE_LABEL[k]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}

          {unused.length > 0 && (
            <Select value="" onValueChange={addRow}>
              <SelectTrigger className="max-w-[240px]"><Plus className="h-4 w-4 mr-1" /><SelectValue placeholder="Add a division" /></SelectTrigger>
              <SelectContent>
                {unused.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {rows.length > 0 && (
            <div className="space-y-2 text-sm">
              <p className={valid ? 'text-muted-foreground' : 'text-destructive font-medium'}>
                Total: <span className="font-mono-nums">{totalPct.toFixed(1)}%</span> of 100%
              </p>
              {message && (
                <div className="flex gap-2 rounded-md bg-warning/10 border border-warning/30 p-2">
                  <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p>{message}</p>
                    <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setRows(applySuggestion(rows, true))}>
                      Use suggested shares (split in proportion to months)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={handleSave} disabled={!valid || saving || (mode === 'allocated' && rows.length === 0)}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save divisions
        </Button>
      </div>
    </div>
  );
}
