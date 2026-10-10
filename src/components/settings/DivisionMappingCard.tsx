import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useServiceDivisions } from '@/hooks/useServiceDivisions';
import { useCategoryAllocations, useTaxonomyMappings } from '@/hooks/useCategoryAllocations';
import { useEquipment } from '@/contexts/EquipmentContext';
import { getCategoryDefaults } from '@/data/categoryDefaults';
import { proposeFromMapping, describeAllocation, type CategoryProposal } from '@/lib/divisionAllocation';
import { monthsMessage } from '@/lib/divisionShares';
import { SourceBadge, ConflictBanner } from '@/components/review/ReviewBadges';

/**
 * One question per taxonomy division present in the fleet. Answers PROPOSE
 * category defaults; nothing is saved until the user applies the selected rows.
 */
export function DivisionMappingCard() {
  const { activeDivisions, divisions } = useServiceDivisions();
  const { calculatedEquipment } = useEquipment();
  const { byCategory, replace } = useCategoryAllocations();
  const { answers: savedAnswers, saveAnswers } = useTaxonomyMappings();

  const fleet = useMemo(() => {
    const cats = [...new Set(calculatedEquipment.filter(e => e.status === 'Active').map(e => e.category))];
    return cats.map(category => ({ category, taxonomyDivision: getCategoryDefaults(category).division as string }))
      .sort((a, b) => a.category.localeCompare(b.category));
  }, [calculatedEquipment]);
  const taxonomyDivisions = useMemo(() => [...new Set(fleet.map(f => f.taxonomyDivision))].sort(), [fleet]);

  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [proposals, setProposals] = useState<CategoryProposal[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);

  useEffect(() => { setAnswers(a => (Object.keys(a).length ? a : savedAnswers)); }, [savedAnswers]);

  const divName = (id: string) => divisions.find(d => d.id === id)?.name ?? 'Unknown';
  const toggleAnswer = (tax: string, id: string) => setAnswers(a => {
    const cur = a[tax] ?? [];
    return { ...a, [tax]: cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id] };
  });

  const buildProposals = () => {
    const full = Object.fromEntries(taxonomyDivisions.map(t => [t, answers[t] ?? []]));
    const p = proposeFromMapping(full, activeDivisions, fleet);
    setProposals(p);
    // Pre-select rows with no existing default; conflicts start unselected ("keep current").
    setSelected(new Set(p.filter(x => !byCategory[x.category]).map(x => x.category)));
  };

  const apply = async () => {
    if (!proposals) return;
    setApplying(true);
    try {
      await saveAnswers(Object.fromEntries(taxonomyDivisions.map(t => [t, answers[t] ?? []])));
      for (const p of proposals.filter(x => selected.has(x.category))) {
        await replace(p.category, p.rows);
      }
      toast({ title: 'Category allocations applied', description: `${selected.size} categories updated. Machines with their own setting were not changed.` });
      setProposals(null);
    } catch {
      toast({ title: 'Could not apply', description: 'Nothing past the error was saved. Please try again.', variant: 'destructive' });
    } finally {
      setApplying(false);
    }
  };

  if (activeDivisions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match equipment to divisions</CardTitle>
          <CardDescription>Add your service divisions above first. Then answer one question per equipment group.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const conflicts = proposals?.filter(p => byCategory[p.category]) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Match equipment to divisions</CardTitle>
        <CardDescription>
          One question per equipment group in your fleet. Your answers suggest a split for every category in that group — you review it before anything is saved.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {taxonomyDivisions.map(tax => (
          <div key={tax} className="rounded-md border p-3 space-y-2">
            <p className="text-sm font-medium">Equipment in the {tax} group — which of your service divisions does it serve?</p>
            <p className="text-xs text-muted-foreground">Pick none for year-round shared.</p>
            <div className="flex flex-wrap gap-4">
              {activeDivisions.map(d => (
                <label key={d.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={(answers[tax] ?? []).includes(d.id)} onCheckedChange={() => toggleAnswer(tax, d.id)} />
                  {d.name}
                </label>
              ))}
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={buildProposals}>Suggest category splits</Button>

        {proposals && (
          <div className="space-y-3">
            {conflicts.length > 0 && (
              <ConflictBanner title={`${conflicts.length} ${conflicts.length === 1 ? 'category already has' : 'categories already have'} a setting`}>
                <p className="text-sm text-muted-foreground">These are left unticked so your current setting is kept. Tick one to use the suggestion instead.</p>
              </ConflictBanner>
            )}
            {proposals.map(p => {
              const msg = monthsMessage(p.rows.map(r => ({ months: r.months_committed })));
              const existing = byCategory[p.category];
              const tax = fleet.find(f => f.category === p.category)?.taxonomyDivision;
              return (
                <label key={p.category} className="flex gap-3 items-start rounded-md border p-3 cursor-pointer">
                  <Checkbox
                    className="mt-1"
                    checked={selected.has(p.category)}
                    onCheckedChange={() => setSelected(s => { const n = new Set(s); n.has(p.category) ? n.delete(p.category) : n.add(p.category); return n; })}
                  />
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium">{p.category}<SourceBadge>Suggested from your {tax} answer</SourceBadge></p>
                    <p className="text-sm">{describeAllocation(p.rows, divName)}</p>
                    {existing && <p className="text-xs text-muted-foreground">Current: {describeAllocation(existing, divName)}</p>}
                    {msg && <p className="text-xs text-warning">{msg} You can fine-tune shares per category below after applying.</p>}
                    {p.rows.length > 0 && <p className="text-xs text-muted-foreground">Hours are blank — optional for now.</p>}
                  </div>
                </label>
              );
            })}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setProposals(null)}>Cancel</Button>
              <Button onClick={apply} disabled={applying || selected.size === 0}>
                {applying && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Apply selected ({selected.size})
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
