import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react';
import { useServiceDivisions } from '@/hooks/useServiceDivisions';
import { suggestShares, monthsMessage, sharesValid } from '@/lib/divisionShares';
import type { AllocationRow } from '@/lib/divisionAllocation';

interface Row {
  divisionId: string;
  months: string;
  sharePct: string;
  hours: string;
  router: string; // '' = same as the machine's own setting
  shareEdited: boolean;
}

export const ROUTER_LABEL: Record<string, string> = {
  operational: 'Field Equipment (price list)',
  overhead_only: 'Overhead (division budget)',
  owner_perk: 'Owner Perk (division budget)',
};
const SAME = '__same__';
const num = (s: string) => (s.trim() === '' ? null : Number(s));

/**
 * Edits one allocation set — either a single machine's or a category default.
 * Text is held as typed; shares are suggested from months but the user decides.
 * onSave receives [] for "Year-round shared".
 */
export function AllocationEditor({
  initialRows, onSave, saveLabel, routerFallbackLabel,
}: {
  initialRows: AllocationRow[];
  onSave: (rows: AllocationRow[]) => Promise<void>;
  saveLabel: string;
  routerFallbackLabel: string;
}) {
  const { activeDivisions, divisions } = useServiceDivisions();
  const [mode, setMode] = useState<'shared' | 'allocated'>('shared');
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const split = initialRows.filter(r => r.service_division_id);
    setMode(split.length ? 'allocated' : 'shared');
    setRows(split.map(r => ({
      divisionId: r.service_division_id!,
      months: r.months_committed?.toString() ?? '',
      sharePct: (Math.round(r.share_of_year * 1000) / 10).toString(),
      hours: r.expected_hours?.toString() ?? '',
      router: r.allocation_type ?? '',
      shareEdited: true,
    })));
  }, [initialRows]);

  const message = monthsMessage(rows.map(r => ({ months: num(r.months) })));
  const shares = rows.map(r => (Number(r.sharePct) || 0) / 100);
  const totalPct = shares.reduce((a, b) => a + b, 0) * 100;
  const hoursOk = rows.every(r => r.hours.trim() === '' || (Number.isFinite(Number(r.hours)) && Number(r.hours) >= 0));
  const valid = mode === 'shared' || (rows.length > 0 && sharesValid(shares) && hoursOk);

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
    setRows(applySuggestion([...rows, { divisionId, months: d ? String(d.season_months) : '', sharePct: '', hours: '', router: '', shareEdited: false }]));
  };
  const unused = activeDivisions.filter(d => !rows.some(r => r.divisionId === d.id));
  const divName = (id: string) => divisions.find(d => d.id === id)?.name ?? 'Unknown';

  const handleSave = async () => {
    if (!valid) return;
    const out: AllocationRow[] = mode === 'shared' ? [] : rows.map((r, i) => ({
      service_division_id: r.divisionId,
      months_committed: num(r.months),
      // absorb rounding into the last row so the set totals exactly 100%
      share_of_year: shares[i] + (i === rows.length - 1 ? 1 - shares.reduce((a, b) => a + b, 0) : 0),
      expected_hours: num(r.hours),
      allocation_type: r.router || null,
    }));
    setSaving(true);
    try { await onSave(out); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <RadioGroup value={mode} onValueChange={v => setMode(v as 'shared' | 'allocated')} className="space-y-2">
        <label className="flex gap-3 items-start cursor-pointer">
          <RadioGroupItem value="shared" className="mt-1" />
          <div>
            <p className="font-medium text-sm">Year-round shared</p>
            <p className="text-xs text-muted-foreground">Not split — one blended 12-month cost across all work.</p>
          </div>
        </label>
        <label className="flex gap-3 items-start cursor-pointer">
          <RadioGroupItem value="allocated" className="mt-1" disabled={activeDivisions.length === 0 && rows.length === 0} />
          <div>
            <p className="font-medium text-sm">Split across divisions</p>
            {activeDivisions.length === 0 && rows.length === 0 && (
              <p className="text-xs text-muted-foreground">Add service divisions in <Link to="/settings/company?tab=divisions" className="underline">Company Settings</Link> first.</p>
            )}
          </div>
        </label>
      </RadioGroup>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Months committed</Label>
                  <Input inputMode="decimal" value={r.months} onChange={e => setRow(i, { months: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Share of year %</Label>
                  <Input inputMode="decimal" value={r.sharePct} onChange={e => setRow(i, { sharePct: e.target.value, shareEdited: true })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expected hours per machine (optional)</Label>
                  <Input inputMode="decimal" value={r.hours} onChange={e => setRow(i, { hours: e.target.value })} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">How this share is recovered</Label>
                <Select value={r.router || SAME} onValueChange={v => setRow(i, { router: v === SAME ? '' : v })}>
                  <SelectTrigger className="sm:max-w-[300px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SAME}>{routerFallbackLabel}</SelectItem>
                    {Object.entries(ROUTER_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
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
              <p className={sharesValid(shares) ? 'text-muted-foreground' : 'text-destructive font-medium'}>
                Total: <span className="font-mono-nums">{totalPct.toFixed(1)}%</span> of 100%
              </p>
              {!hoursOk && <p className="text-destructive">Hours must be a number of 0 or more, or blank.</p>}
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
        <Button size="sm" onClick={handleSave} disabled={!valid || saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{saveLabel}
        </Button>
      </div>
    </div>
  );
}
