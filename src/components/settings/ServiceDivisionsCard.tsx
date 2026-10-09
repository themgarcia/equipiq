import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Undo2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useServiceDivisions } from '@/hooks/useServiceDivisions';

export function ServiceDivisionsCard() {
  const { divisions, add, update, remove } = useServiceDivisions();
  const [name, setName] = useState('');
  const [months, setMonths] = useState('');
  const [events, setEvents] = useState('');

  const handleAdd = async () => {
    const m = Number(months);
    const ev = events.trim() === '' ? null : Number(events);
    if (!name.trim()) return toast({ title: 'Enter a division name', variant: 'destructive' });
    if (!Number.isFinite(m) || m <= 0 || m > 12) return toast({ title: 'Season length must be 1 to 12 months', variant: 'destructive' });
    if (ev !== null && (!Number.isFinite(ev) || ev <= 0)) return toast({ title: 'Events per season must be above 0, or blank', variant: 'destructive' });
    try {
      await add({ name: name.trim(), season_months: m, events_per_season: ev });
      setName(''); setMonths(''); setEvents('');
    } catch {
      toast({ title: 'Could not add division', description: 'Names must be unique.', variant: 'destructive' });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const r = await remove(id);
      toast({ title: r === 'archived' ? 'Division archived' : 'Division removed', description: r === 'archived' ? 'Machines are still allocated to it, so it was archived instead of deleted.' : undefined });
    } catch {
      toast({ title: 'Could not remove division', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Service divisions</CardTitle>
        <CardDescription>
          Name these to match your LMN budgets. Fleet and Shop are support, not services — leave them out.
          Season length is how many months of the year the division runs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {divisions.length === 0 && (
          <p className="text-sm text-muted-foreground">No service divisions yet.</p>
        )}
        <div className="space-y-2">
          {divisions.map(d => (
            <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-md border p-2">
              <span className="font-medium flex-1 min-w-[120px]">{d.name}</span>
              <span className="text-sm text-muted-foreground font-mono-nums">{d.season_months} mo season</span>
              {d.events_per_season !== null && (
                <span className="text-sm text-muted-foreground font-mono-nums">· {d.events_per_season} events</span>
              )}
              {d.archived_at ? (
                <>
                  <Badge variant="outline">Archived</Badge>
                  <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Restore ${d.name}`} onClick={() => update(d.id, { archived_at: null })}>
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Remove ${d.name}`} onClick={() => handleRemove(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px_auto] gap-2 items-end">
          <div className="space-y-1">
            <Label htmlFor="div-name">Name</Label>
            <Input id="div-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="div-months">Season (months)</Label>
            <Input id="div-months" inputMode="decimal" value={months} onChange={e => setMonths(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="div-events">Events / season</Label>
            <Input id="div-events" inputMode="decimal" placeholder="Optional" value={events} onChange={e => setEvents(e.target.value)} />
          </div>
          <Button onClick={handleAdd}><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
        <p className="text-xs text-muted-foreground">Events per season is optional — useful if you bid per push or per event.</p>
      </CardContent>
    </Card>
  );
}
