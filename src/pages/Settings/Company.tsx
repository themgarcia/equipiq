import { useEffect, useMemo, useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useCompanySettings, CompanySettings } from '@/hooks/useCompanySettings';
import { useEquipment } from '@/contexts/EquipmentContext';
import { ServiceDivisionsCard } from '@/components/settings/ServiceDivisionsCard';
import { DivisionMappingCard } from '@/components/settings/DivisionMappingCard';
import { CategoryAllocationsCard } from '@/components/settings/CategoryAllocationsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSearchParams } from 'react-router-dom';
import { annualRecovery, formatCurrency, RecoveryBasis } from '@/lib/calculations';

function parseOptional(v: string): number | null {
  const t = v.trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

export default function CompanySettingsPage() {
  const { settings, loading, save, saving } = useCompanySettings();
  const { calculatedEquipment } = useEquipment();

  const [fuel, setFuel] = useState('');
  const [rate, setRate] = useState('');
  const [hours, setHours] = useState('8');
  const [basis, setBasis] = useState<RecoveryBasis>('net_of_resale');
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'divisions' ? 'divisions' : 'costs';

  const reset = () => {
    setFuel(settings.fuel_price_per_litre?.toString() ?? '');
    setRate(settings.market_finance_rate_pct?.toString() ?? '');
    setHours(settings.default_hours_per_day.toString());
    setBasis(settings.recovery_basis);
  };
  const dirty =
    fuel !== (settings.fuel_price_per_litre?.toString() ?? '') ||
    rate !== (settings.market_finance_rate_pct?.toString() ?? '') ||
    hours !== settings.default_hours_per_day.toString() ||
    basis !== settings.recovery_basis;

  useEffect(() => {
    setFuel(settings.fuel_price_per_litre?.toString() ?? '');
    setRate(settings.market_finance_rate_pct?.toString() ?? '');
    setHours(settings.default_hours_per_day.toString());
    setBasis(settings.recovery_basis);
  }, [settings]);

  const example = useMemo(
    () => calculatedEquipment.find(e => e.status === 'Active' && e.usefulLifeUsed > 0),
    [calculatedEquipment]
  );

  const handleSave = async () => {
    const fuelN = parseOptional(fuel);
    const rateN = parseOptional(rate);
    const hoursN = Number(hours);
    if (Number.isNaN(fuelN) || (fuelN !== null && fuelN <= 0)) {
      toast({ title: 'Check fuel price', description: 'Enter a price above 0, or leave it blank.', variant: 'destructive' });
      return;
    }
    if (Number.isNaN(rateN) || (rateN !== null && (rateN < 0 || rateN > 100))) {
      toast({ title: 'Check finance rate', description: 'Enter a percentage between 0 and 100, or leave it blank.', variant: 'destructive' });
      return;
    }
    if (!Number.isFinite(hoursN) || hoursN <= 0 || hoursN > 24) {
      toast({ title: 'Check hours per day', description: 'Enter a number between 1 and 24.', variant: 'destructive' });
      return;
    }
    const next: CompanySettings = {
      fuel_price_per_litre: fuelN,
      market_finance_rate_pct: rateN,
      default_hours_per_day: hoursN,
      recovery_basis: basis,
    };
    try {
      await save(next);
      toast({ title: 'Company settings saved' });
    } catch {
      toast({ title: 'Could not save settings', description: 'Please try again.', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  const notYetUsed = (
    <Badge variant="outline" className="text-xs font-normal">For the upcoming LMN catalog export — not used in any calculation yet</Badge>
  );

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-3xl">
        <div className="space-y-6">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold">Company Settings</h1>
            <p className="text-muted-foreground mt-1">Numbers that apply to your whole business, not to one machine.</p>
          </div>

          <Tabs value={tab} onValueChange={v => setParams(v === 'divisions' ? { tab: 'divisions' } : {}, { replace: true })}>
            <TabsList>
              <TabsTrigger value="costs">Costs &amp; rates</TabsTrigger>
              <TabsTrigger value="divisions">Service divisions</TabsTrigger>
            </TabsList>

            <TabsContent value="costs" className="space-y-6 pb-24">

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recovery basis</CardTitle>
              <CardDescription>
                How Annual Recovery is worked out. This one setting is used on both Cashflow Analysis and the FMS Export, so the two always agree.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={basis} onValueChange={(v) => setBasis(v as RecoveryBasis)} className="space-y-3">
                <label className="flex gap-3 items-start cursor-pointer">
                  <RadioGroupItem value="net_of_resale" className="mt-1" />
                  <div>
                    <p className="font-medium">Net of resale (recommended)</p>
                    <p className="text-sm text-muted-foreground">
                      (Replacement cost − expected resale) ÷ useful life. You price jobs to recover only what the machine loses in value — the money you get when you sell it covers the rest.
                    </p>
                  </div>
                </label>
                <label className="flex gap-3 items-start cursor-pointer">
                  <RadioGroupItem value="gross" className="mt-1" />
                  <div>
                    <p className="font-medium">Gross</p>
                    <p className="text-sm text-muted-foreground">
                      Replacement cost ÷ useful life. You price jobs to recover the full replacement cost and treat any resale money as extra.
                    </p>
                  </div>
                </label>
              </RadioGroup>
              {example && (
                <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                  <p className="font-medium">Example: {example.name}</p>
                  <p className="text-muted-foreground">
                    Net of resale: ({formatCurrency(example.replacementCostUsed)} − {formatCurrency(example.expectedResaleUsed)}) ÷ {example.usefulLifeUsed} yrs = <span className="font-mono-nums text-foreground">{formatCurrency(annualRecovery(example, 'net_of_resale'))}/yr</span>
                  </p>
                  <p className="text-muted-foreground">
                    Gross: {formatCurrency(example.replacementCostUsed)} ÷ {example.usefulLifeUsed} yrs = <span className="font-mono-nums text-foreground">{formatCurrency(annualRecovery(example, 'gross'))}/yr</span>
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Note: the FMS Export columns you copy into LMN (replacement value, life, end-of-life value) are the same either way — LMN does its own math with them.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">Fuel price per litre</CardTitle>
                {notYetUsed}
              </div>
              <CardDescription>
                Use what you actually pay per litre, taken from your fuel invoices — not the price posted at the pump. After tax treatment and supplier discounts, the pump price is usually higher than your real cost.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="fuel" className="sr-only">Fuel price per litre</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <span className="text-muted-foreground">$</span>
                <Input id="fuel" inputMode="decimal" placeholder="e.g. 1.45" value={fuel} onChange={e => setFuel(e.target.value)} />
                <span className="text-muted-foreground text-sm">/ L</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">Market finance rate</CardTitle>
                {notYetUsed}
              </div>
              <CardDescription>
                The rate your business as a whole would pay to borrow money, or would expect to earn on it — your cost of money. This is not the interest rate on any single machine's loan or lease.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="rate" className="sr-only">Market finance rate</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input id="rate" inputMode="decimal" placeholder="e.g. 7.5" value={rate} onChange={e => setRate(e.target.value)} />
                <span className="text-muted-foreground text-sm">%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default hours per day</CardTitle>
              <CardDescription>
                How many hours a machine typically runs on a working day. Used later to convert between hours and days. Not used in any calculation yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="hours" className="sr-only">Default hours per day</Label>
              <div className="flex items-center gap-2 max-w-xs">
                <Input id="hours" inputMode="decimal" value={hours} onChange={e => setHours(e.target.value)} />
                <span className="text-muted-foreground text-sm">hours</span>
              </div>
            </CardContent>
          </Card>

            {dirty && (
              <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-lg border bg-card p-3 shadow-lg">
                <span className="text-sm">You have unsaved changes</span>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={reset} disabled={saving}>Discard</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save settings
                  </Button>
                </div>
              </div>
            )}
            </TabsContent>

            <TabsContent value="divisions" className="space-y-6">
              <ServiceDivisionsCard />
              <DivisionMappingCard />
              <CategoryAllocationsCard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
