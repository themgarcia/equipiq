import { useState, useMemo, useEffect } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useDeviceType } from '@/hooks/use-mobile';
import { Layout } from '@/components/Layout';
import { formatCurrency } from '@/lib/calculations';
import { rollupEquipment, rollupToCSV, RollupLine, RollupTotals } from '@/lib/rollupEngine';
import { getCategoryDefaults } from '@/data/categoryDefaults';
import { formatBenchmarkRange } from '@/lib/benchmarkUtils';
import { useDistanceUnit } from '@/hooks/useDistanceUnit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter, 
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { Copy, Download, Check, FileSpreadsheet, ChevronRight, Construction, ExternalLink, Truck, Building2, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MobileTabSelect } from '@/components/MobileTabSelect';

interface ComingSoonTabProps {
  platformName: string;
  platformUrl: string;
}

function ComingSoonTab({ platformName, platformUrl }: ComingSoonTabProps) {
  return (
    <div className="bg-card border rounded-lg p-12 text-center">
      <Construction className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <h3 className="text-lg font-semibold mb-2">{platformName} Integration</h3>
      <p className="text-muted-foreground mb-4">
        We are currently engineering the data mapping for this bridge.
      </p>
      <a
        href={platformUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        Learn more about {platformName}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

const fmsOptions = [
  { value: 'lmn', label: 'LMN' },
  { value: 'synkedup', label: 'SynkedUp' },
  { value: 'dynamanage', label: 'DynaManage' },
  { value: 'aspire', label: 'Aspire' },
];

// ─── Copy Button ───────────────────────────────────────────────

function CopyButton({ cellId, value, copiedCell, onCopy }: { cellId: string; value: string; copiedCell: string | null; onCopy: (id: string, value: string) => void }) {
  const isCopied = copiedCell === cellId;
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 absolute -right-6 top-1/2 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-primary/10 shrink-0"
      onClick={(e) => { e.stopPropagation(); onCopy(cellId, value); }}
      title="Copy value"
    >
      {isCopied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

// ─── Cost Comparison Tooltip ───────────────────────────────────

function CostComparisonTooltip({ line, mode }: { line: RollupLine; mode: 'owned' | 'leased' }) {
  const avgMonthlyPayment = line.leasedItemCount > 0
    ? line.leasedItemMonthlyPayment / line.leasedItemCount
    : 0;
  const amortizedDeposit = (line.leasedItemCount > 0 && line.leasedItemAvgTermMonths > 0)
    ? (line.leasedItemDepositTotal / line.leasedItemCount) * 12 / line.leasedItemAvgTermMonths
    : 0;
  const leaseRecovery = avgMonthlyPayment * 12 + amortizedDeposit;
  const hasDeposit = line.leasedItemDepositTotal > 0;
  const ownedRecovery = line.avgUsefulLife > 0 
    ? (line.avgReplacementValue - line.avgEndValue) / line.avgUsefulLife 
    : 0;
  const diff = leaseRecovery - ownedRecovery;

  if (mode === 'leased') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs space-y-1">
            <p className="font-medium text-xs">Cost Comparison</p>
            <p className="text-xs">Lease recovery: {formatCurrency(leaseRecovery)}/yr</p>
            {hasDeposit && (
              <p className="text-xs text-muted-foreground">Incl. {formatCurrency(amortizedDeposit)}/yr deposit amortized over {Math.round(line.leasedItemAvgTermMonths)}mo term</p>
            )}
            <p className="text-xs">Owned recovery: {formatCurrency(ownedRecovery)}/yr</p>
            {diff > 0 && (
              <p className="text-xs text-warning">
                Lease costs {formatCurrency(diff)}/yr more. Consider switching to Owned Recovery.
              </p>
            )}
            {diff <= 0 && (
              <p className="text-xs text-success">
                {formatCurrency(Math.abs(diff))}/yr more competitive vs owned recovery.
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // For owned rows that have leased items in the category
  if (line.leasedItemCount > 0 && line.leasedItemMonthlyPayment > 0) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground/50 cursor-help inline ml-1" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs space-y-1">
            <p className="text-xs">This category includes leased items modeled as Owned for a more competitive rate.</p>
            <p className="text-xs text-muted-foreground">Owned recovery: {formatCurrency(ownedRecovery)}/yr</p>
            <p className="text-xs text-muted-foreground">Lease pass-through: {formatCurrency(leaseRecovery)}/yr</p>
            {hasDeposit && (
              <p className="text-xs text-muted-foreground/70">Incl. {formatCurrency(amortizedDeposit)}/yr deposit amortized over {Math.round(line.leasedItemAvgTermMonths)}mo term</p>
            )}
            {diff > 0 ? (
              <p className="text-xs text-success">{formatCurrency(diff)}/yr more competitive vs lease pass-through.</p>
            ) : (
              <p className="text-xs text-muted-foreground">Lease is {formatCurrency(Math.abs(diff))}/yr cheaper, but owned recovery keeps your rate consistent.</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}

// ─── Owned Rollup Table Component ──────────────────────────────

interface RollupSectionProps {
  title: string;
  icon: React.ReactNode;
  lines: RollupLine[];
  totals: RollupTotals;
  showType: boolean;
  copiedCell: string | null;
  onCopyCell: (id: string, value: string) => void;
  onSelectLine: (line: RollupLine) => void;
  isMobile: boolean;
  emptyMessage: string;
  emptyHint: string;
  distanceUnit: 'mi' | 'km';
}

function RollupSection({ 
  title, icon, lines, totals, showType, copiedCell, onCopyCell, onSelectLine, isMobile, emptyMessage, emptyHint, distanceUnit 
}: RollupSectionProps) {
  if (lines.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-8 text-center">
        <p className="text-muted-foreground font-medium">{emptyMessage}</p>
        <p className="text-sm text-muted-foreground mt-1">{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-semibold text-lg">{title}</h3>
        <Badge variant="secondary" className="ml-1">{totals.totalQty} items</Badge>
      </div>
      
      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        {isMobile ? (
          <div className="divide-y">
            {lines.map((line, idx) => (
              <div 
                key={`${line.category}-${line.lmnRecoveryMethod}-${idx}`}
                className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
                onClick={() => onSelectLine(line)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{line.category}</p>
                    {showType && (
                      <Badge variant={line.financingType === 'leased' ? 'outline' : 'secondary'} className="text-[10px] shrink-0">
                        {line.financingType === 'leased' ? 'Leased' : 'Owned'}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Qty: {line.qty}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="table-header-cell whitespace-nowrap">Category</TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap w-[80px]">Qty</TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap w-[160px]">Avg Replacement</TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap w-[100px]">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help inline-flex items-center gap-1">
                            Life (Yrs)
                            <Info className="h-3 w-3 text-muted-foreground" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p>Competitive useful life — how long the equipment helps you compete, not mechanical life. Benchmark context shown per category.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap hidden md:table-cell w-[140px]">Avg Resale Value</TableHead>
                  {showType && <TableHead className="table-header-cell text-center whitespace-nowrap w-[80px]">Type</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => {
                  const lineId = `${line.category}-${line.lmnRecoveryMethod}-${idx}`;
                  const catDef = getCategoryDefaults(line.category);
                  const formattedBenchmark = formatBenchmarkRange(catDef.benchmarkType, catDef.benchmarkRange, distanceUnit);
                  const benchmarkText = catDef.benchmarkRange
                    ? `Default ${Math.round(line.avgUsefulLife)} yrs based on ${formattedBenchmark} at commercial production.`
                    : `Default ${Math.round(line.avgUsefulLife)} yrs — calendar-based replacement.`;
                  return (
                    <TableRow key={lineId} className="group">
                      <TableCell className="font-medium">
                        <div className="relative">
                          <span>
                            {line.category}
                            <CostComparisonTooltip line={line} mode="owned" />
                          </span>
                          <CopyButton cellId={`${lineId}-cat`} value={line.category} copiedCell={copiedCell} onCopy={onCopyCell} />
                          {line.qty > 1 && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {line.itemNames.join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <div className="relative inline-flex justify-end">
                          <span>{line.qty}</span>
                          <CopyButton cellId={`${lineId}-qty`} value={String(line.qty)} copiedCell={copiedCell} onCopy={onCopyCell} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <div className="relative inline-flex justify-end">
                          <span>{formatCurrency(line.avgReplacementValue)}</span>
                          <CopyButton cellId={`${lineId}-rv`} value={String(Math.round(line.avgReplacementValue))} copiedCell={copiedCell} onCopy={onCopyCell} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="relative inline-flex justify-end cursor-help">
                                <span>{Math.round(line.avgUsefulLife)}</span>
                                <CopyButton cellId={`${lineId}-life`} value={String(Math.round(line.avgUsefulLife))} copiedCell={copiedCell} onCopy={onCopyCell} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p>{benchmarkText}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums hidden md:table-cell">
                        <div className="relative inline-flex justify-end">
                          <span>{formatCurrency(line.avgEndValue)}</span>
                          <CopyButton cellId={`${lineId}-ev`} value={String(Math.round(line.avgEndValue))} copiedCell={copiedCell} onCopy={onCopyCell} />
                        </div>
                      </TableCell>
                      {showType && (
                        <TableCell className="text-center">
                          <Badge variant={line.financingType === 'leased' ? 'outline' : 'secondary'} className="text-[10px]">
                            {line.financingType === 'leased' ? 'Leased' : 'Owned'}
                          </Badge>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono-nums">{totals.totalQty}</TableCell>
                  <TableCell className="text-right" />
                  <TableCell className="text-right" />
                  <TableCell className="text-right hidden md:table-cell" />
                  {showType && <TableCell />}
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Leased Rollup Table Component ─────────────────────────────

interface LeasedRollupSectionProps {
  lines: RollupLine[];
  totals: RollupTotals;
  copiedCell: string | null;
  onCopyCell: (id: string, value: string) => void;
  onSelectLine: (line: RollupLine) => void;
  isMobile: boolean;
}

function LeasedRollupSection({ lines, totals, copiedCell, onCopyCell, onSelectLine, isMobile }: LeasedRollupSectionProps) {
  if (lines.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">Leased</Badge>
        <span className="text-sm text-muted-foreground">
          {totals.totalQty} item{totals.totalQty !== 1 ? 's' : ''} in {lines.length} categor{lines.length !== 1 ? 'ies' : 'y'}
        </span>
      </div>
      
      <div className="bg-card border border-dashed rounded-lg shadow-sm overflow-hidden">
        {isMobile ? (
          <div className="divide-y">
            {lines.map((line, idx) => (
              <div 
                key={`leased-${line.category}-${idx}`}
                className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
                onClick={() => onSelectLine(line)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{line.category}</p>
                    <Badge variant="outline" className="text-[10px] shrink-0">Leased</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Qty: {line.qty} · {formatCurrency(line.totalMonthlyPayment / line.qty)}/mo
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="table-header-cell whitespace-nowrap">Category</TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap w-[80px]">Qty</TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap w-[160px]">Monthly Payment</TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap w-[120px]">Payments/Yr</TableHead>
                  <TableHead className="table-header-cell text-right whitespace-nowrap w-[120px]">Months Used</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((line, idx) => {
                  const lineId = `leased-${line.category}-${idx}`;
                  const avgMonthly = line.totalMonthlyPayment / line.qty;
                  return (
                    <TableRow key={lineId} className="group">
                      <TableCell className="font-medium">
                        <div className="relative">
                          <span>
                            {line.category}
                            <CostComparisonTooltip line={line} mode="leased" />
                          </span>
                          <CopyButton cellId={`${lineId}-cat`} value={line.category} copiedCell={copiedCell} onCopy={onCopyCell} />
                          {line.qty > 1 && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {line.itemNames.join(', ')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <div className="relative inline-flex justify-end">
                          <span>{line.qty}</span>
                          <CopyButton cellId={`${lineId}-qty`} value={String(line.qty)} copiedCell={copiedCell} onCopy={onCopyCell} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <div className="relative inline-flex justify-end">
                          <span>{formatCurrency(avgMonthly)}</span>
                          <CopyButton cellId={`${lineId}-mp`} value={String(Math.round(avgMonthly))} copiedCell={copiedCell} onCopy={onCopyCell} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <div className="relative inline-flex justify-end">
                          <span>{line.paymentsPerYear}</span>
                          <CopyButton cellId={`${lineId}-ppy`} value={String(line.paymentsPerYear)} copiedCell={copiedCell} onCopy={onCopyCell} />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        <div className="relative inline-flex justify-end">
                          <span>{line.monthsUsed}</span>
                          <CopyButton cellId={`${lineId}-mu`} value={String(line.monthsUsed)} copiedCell={copiedCell} onCopy={onCopyCell} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right font-mono-nums">{totals.totalQty}</TableCell>
                  <TableCell className="text-right" />
                  <TableCell className="text-right" />
                  <TableCell className="text-right" />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function FMSExport() {
  const { calculatedEquipment } = useEquipment();
  const { markStepComplete } = useOnboarding();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'phone' || deviceType === 'tablet';
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<RollupLine | null>(null);
  const [activeTab, setActiveTab] = useState('lmn');
  const { distanceUnit } = useDistanceUnit();

  useEffect(() => {
    markStepComplete('step_fms_exported');
  }, [markStepComplete]);

  const rollupResult = useMemo(() => {
    return rollupEquipment(calculatedEquipment);
  }, [calculatedEquipment]);

  const copyCell = async (id: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedCell(id);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const exportCSV = () => {
    const csvContent = rollupToCSV(rollupResult);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lmn-equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);

    const totalLines = rollupResult.fieldLines.length + rollupResult.overheadLines.length;
    toast({
      title: 'CSV exported',
      description: `${totalLines} category lines exported (${rollupResult.fieldTotals.totalQty + rollupResult.overheadTotals.totalQty} total items)`,
    });
  };

  const isLeased = selectedLine?.lmnRecoveryMethod === 'leased';

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold">FMS Export</h1>
            <p className="text-muted-foreground mt-1">
              Copy-ready data for Field Management Software
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {isMobile ? (
            <MobileTabSelect
              value={activeTab}
              onValueChange={setActiveTab}
              tabs={fmsOptions}
              className="w-full"
            />
          ) : (
            <TabsList>
              <TabsTrigger value="lmn">LMN</TabsTrigger>
              <TabsTrigger value="synkedup">SynkedUp</TabsTrigger>
              <TabsTrigger value="dynamanage">DynaManage</TabsTrigger>
              <TabsTrigger value="aspire">Aspire</TabsTrigger>
            </TabsList>
          )}

          {/* LMN Tab - Active Integration */}
          <TabsContent value="lmn" className="space-y-8">
            {/* Export Button */}
            <div className="flex justify-end">
              <Button onClick={exportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {/* Info */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Copy Values for LMN</h3>
                <p className="text-sm text-muted-foreground">
                  Equipment is rolled up by category to match how LMN expects data. Click <Copy className="h-3 w-3 inline mx-1" /> to copy individual values.
                  Items in the same category are combined into one line with averaged values. Replacement values include attachments.
                </p>
              </div>
            </div>

            {/* Field Equipment Section */}
            <div className="space-y-4">
              <RollupSection
                title="Field Equipment — LMN Equipment Budget"
                icon={<Truck className="h-5 w-5 text-primary" />}
                lines={rollupResult.fieldOwnedLines}
                totals={rollupResult.fieldOwnedTotals}
                showType={true}
                copiedCell={copiedCell}
                onCopyCell={copyCell}
                onSelectLine={setSelectedLine}
                isMobile={isMobile}
                emptyMessage="No field equipment"
                emptyHint="Add operational equipment to see it here. Items marked 'Yes — Field Equipment' appear in this section."
                distanceUnit={distanceUnit}
              />

              <LeasedRollupSection
                lines={rollupResult.fieldLeasedLines}
                totals={rollupResult.fieldLeasedTotals}
                copiedCell={copiedCell}
                onCopyCell={copyCell}
                onSelectLine={setSelectedLine}
                isMobile={isMobile}
              />
            </div>

            {/* Overhead Equipment Section */}
            <div className="space-y-4">
              <RollupSection
                title="Overhead Equipment — LMN Overhead Budget"
                icon={<Building2 className="h-5 w-5 text-muted-foreground" />}
                lines={rollupResult.overheadOwnedLines}
                totals={rollupResult.overheadOwnedTotals}
                showType={true}
                copiedCell={copiedCell}
                onCopyCell={copyCell}
                onSelectLine={setSelectedLine}
                isMobile={isMobile}
                emptyMessage="No overhead equipment"
                emptyHint="Items marked 'No — Overhead' or 'No — Owner Perk' appear in this section."
                distanceUnit={distanceUnit}
              />

              <LeasedRollupSection
                lines={rollupResult.overheadLeasedLines}
                totals={rollupResult.overheadLeasedTotals}
                copiedCell={copiedCell}
                onCopyCell={copyCell}
                onSelectLine={setSelectedLine}
                isMobile={isMobile}
              />
            </div>

            {/* Summary */}
            <div className="text-sm text-muted-foreground">
              <p>
                {rollupResult.fieldTotals.totalQty + rollupResult.overheadTotals.totalQty} active items across {rollupResult.fieldLines.length + rollupResult.overheadLines.length} category lines
              </p>
            </div>
          </TabsContent>

          {/* Coming Soon Tabs */}
          <TabsContent value="synkedup">
            <ComingSoonTab platformName="SynkedUp" platformUrl="https://synkedup.com/" />
          </TabsContent>
          <TabsContent value="dynamanage">
            <ComingSoonTab platformName="DynaManage" platformUrl="https://www.dynascape.com/solutions/manage360/" />
          </TabsContent>
          <TabsContent value="aspire">
            <ComingSoonTab platformName="Aspire" platformUrl="https://www.youraspire.com/" />
          </TabsContent>
        </Tabs>

        {/* Line Details Sheet (Mobile) */}
        <Sheet open={!!selectedLine} onOpenChange={(open) => !open && setSelectedLine(null)}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            {selectedLine && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedLine.category}</SheetTitle>
                  <SheetDescription>
                    {selectedLine.qty} item{selectedLine.qty > 1 ? 's' : ''} · {selectedLine.lmnRecoveryMethod === 'leased' ? 'Lease Recovery' : selectedLine.financingType === 'leased' ? 'Leased (Owned Recovery)' : 'Owned'}
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {isLeased ? (
                    // Leased recovery sheet fields
                    <>
                      {[
                        { label: 'Quantity', value: String(selectedLine.qty) },
                        { label: 'Monthly Payment', value: formatCurrency(selectedLine.totalMonthlyPayment / selectedLine.qty), raw: String(Math.round(selectedLine.totalMonthlyPayment / selectedLine.qty)) },
                        { label: 'Payments/Year', value: String(selectedLine.paymentsPerYear) },
                        { label: 'Months Used', value: String(selectedLine.monthsUsed) },
                      ].map(({ label, value, raw }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium font-mono-nums">{value}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCell(`sheet-${label}`, raw || value)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    // Owned recovery sheet fields
                    <>
                      {[
                        { label: 'Quantity', value: String(selectedLine.qty) },
                        { label: 'Avg Replacement Value', value: formatCurrency(selectedLine.avgReplacementValue), raw: String(Math.round(selectedLine.avgReplacementValue)) },
                        { label: 'Avg Useful Life (Yrs)', value: String(Math.round(selectedLine.avgUsefulLife)) },
                        { label: 'Avg Resale Value', value: formatCurrency(selectedLine.avgEndValue), raw: String(Math.round(selectedLine.avgEndValue)) },
                      ].map(({ label, value, raw }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium font-mono-nums">{value}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyCell(`sheet-${label}`, raw || value)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {selectedLine.itemNames.length > 0 && (
                    <div className="pt-2">
                      <p className="text-sm font-medium text-muted-foreground mb-2">Items in this group:</p>
                      <ul className="space-y-1">
                        {selectedLine.itemNames.map((name, i) => (
                          <li key={i} className="text-sm">{name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}
