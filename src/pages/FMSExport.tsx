import { useState, useMemo, useEffect } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useDeviceType } from '@/hooks/use-mobile';
import { Layout } from '@/components/Layout';
import { formatCurrency } from '@/lib/calculations';
import { differenceInMonths, parseISO } from 'date-fns';
import { rollupEquipment, rollupToCSV, RollupLine, RollupTotals } from '@/lib/rollupEngine';
import { getCategoryDefaults } from '@/data/categoryDefaults';
import { formatBenchmarkRange } from '@/lib/benchmarkUtils';
import { useDistanceUnit } from '@/hooks/useDistanceUnit';
import { EquipmentCalculated } from '@/types/equipment';
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
import { Copy, Download, Check, FileSpreadsheet, ChevronRight, Construction, ExternalLink, Truck, Building2, Info, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

// ─── Cash Gap Summary Card ─────────────────────────────────────

interface CashGapItem {
  name: string;
  ownedRecovery: number;
  actualLeaseCost: number;
  gap: number;
}

function isPaymentComplete(item: EquipmentCalculated): boolean {
  if (!item.financingStartDate || !item.termMonths || item.termMonths <= 0) return false;
  const elapsed = differenceInMonths(new Date(), parseISO(item.financingStartDate));
  return elapsed >= item.termMonths;
}

function CashGapSummary({ calculatedEquipment }: { calculatedEquipment: EquipmentCalculated[] }) {
  const gapItems = useMemo(() => {
    const items: CashGapItem[] = [];
    for (const item of calculatedEquipment) {
      if (item.status !== 'Active') continue;
      if (item.financingType !== 'leased') continue;
      if ((item as any).lmnRecoveryMethod === 'leased') continue;
      if (isPaymentComplete(item)) continue;
      
      const life = item.usefulLifeUsed || 1;
      const ownedRecovery = (item.replacementCostUsed - item.expectedResaleUsed) / life;
      const depositAmort = item.termMonths > 0 ? (item.depositAmount * 12 / item.termMonths) : 0;
      const actualLeaseCost = (item.monthlyPayment * 12) + depositAmort;
      const gap = actualLeaseCost - ownedRecovery;
      
      if (gap > 0) {
        items.push({ name: item.name, ownedRecovery, actualLeaseCost, gap });
      }
    }
    return items;
  }, [calculatedEquipment]);

  if (gapItems.length === 0) return null;

  const totalRecovery = gapItems.reduce((s, i) => s + i.ownedRecovery, 0);
  const totalPayments = gapItems.reduce((s, i) => s + i.actualLeaseCost, 0);
  const totalGap = totalPayments - totalRecovery;

  return (
    <div className="rounded-lg border border-warning/50 bg-warning/10 p-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-warning mt-0.5 shrink-0" />
      <div className="space-y-2 flex-1">
        <h3 className="font-semibold text-sm">Cash Gap Warning</h3>
        <p className="text-sm text-muted-foreground">
          {gapItems.length} leased item{gapItems.length !== 1 ? 's' : ''} modeled as "Owned Recovery" {gapItems.length !== 1 ? 'have' : 'has'} actual payments exceeding the recovery amount.
        </p>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Annual Recovery</p>
            <p className="font-mono-nums font-medium">{formatCurrency(totalRecovery)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Annual Payments</p>
            <p className="font-mono-nums font-medium">{formatCurrency(totalPayments)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Cash Gap</p>
            <p className="font-mono-nums font-medium text-warning">{formatCurrency(totalGap)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          This is normal for short-term leases — your recovery rate is lower than your actual payments. 
          <a href="/definitions#lease-recovery" className="text-primary hover:underline ml-1">Learn more</a>
        </p>
      </div>
    </div>
  );
}

// ─── Cost Comparison Tooltip ───────────────────────────────────

interface CostComparisonTooltipProps {
  line: RollupLine;
  mode: 'owned' | 'leased';
  calculatedEquipment: EquipmentCalculated[];
  onToggleRecovery?: (category: string, itemCount: number) => void;
}

function CostComparisonTooltip({ line, mode, calculatedEquipment, onToggleRecovery }: CostComparisonTooltipProps) {
  // Get per-item data for this category
  const categoryItems = useMemo(() => {
    return calculatedEquipment.filter(
      item => item.status === 'Active' && item.category === line.category && item.financingType === 'leased'
    );
  }, [calculatedEquipment, line.category]);

  if (categoryItems.length === 0 && mode === 'owned' && line.leasedItemCount === 0) return null;

  // Per-item calculations
  const itemBreakdowns = categoryItems.map(item => {
    const life = item.usefulLifeUsed || 1;
    const ownedRecovery = (item.replacementCostUsed - item.expectedResaleUsed) / life;
    const paidOff = isPaymentComplete(item);
    const depositAmort = item.termMonths > 0 ? (item.depositAmount * 12 / item.termMonths) : 0;
    const actualLeaseCost = paidOff ? 0 : (item.monthlyPayment * 12) + depositAmort;
    const diff = actualLeaseCost - ownedRecovery;
    return { name: item.name, ownedRecovery, actualLeaseCost, depositAmort, diff, hasDeposit: item.depositAmount > 0, termMonths: item.termMonths, paidOff };
  });

  const targetMethod = mode === 'owned' ? 'leased' : 'owned';
  const toggleLabel = mode === 'owned' ? 'Switch to Lease Pass-Through' : 'Switch to Owned Recovery';

  if (mode === 'leased') {
    // Lease pass-through tooltip
    const totalLeaseRecovery = itemBreakdowns.reduce((s, i) => s + i.actualLeaseCost, 0) / (itemBreakdowns.length || 1);
    const totalOwnedRecovery = itemBreakdowns.reduce((s, i) => s + i.ownedRecovery, 0) / (itemBreakdowns.length || 1);

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline ml-1" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm space-y-2">
            <p className="font-medium text-xs">Recovery Method: Lease Pass-Through</p>
            <p className="text-xs text-muted-foreground">Your LMN rate is based on actual lease payments — what you pay is what you charge.</p>
            {itemBreakdowns.map((item, i) => (
              <div key={i} className="text-xs border-t border-border/50 pt-1">
                <p className="font-medium">{item.name}</p>
                {item.paidOff ? (
                  <p className="text-success">✓ Payments complete</p>
                ) : (
                  <>
                    <p>Lease recovery: {formatCurrency(item.actualLeaseCost)}/yr</p>
                    {item.hasDeposit && <p className="text-muted-foreground">Incl. {formatCurrency(item.depositAmort)}/yr deposit over {Math.round(item.termMonths)}mo</p>}
                    <p className="text-muted-foreground">Owned comparison: {formatCurrency(item.ownedRecovery)}/yr</p>
                  </>
                )}
              </div>
            ))}
            {itemBreakdowns.every(i => i.paidOff) ? (
              <p className="text-xs text-success">✓ All payments complete</p>
            ) : (
              <p className="text-xs text-success">✓ No cash gap — recovery matches your payments.</p>
            )}
            {onToggleRecovery && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleRecovery(line.category, categoryItems.length); }}
                className="text-xs text-primary hover:underline cursor-pointer block"
              >
                {toggleLabel}
              </button>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Owned recovery tooltip (for rows with leased items modeled as owned)
  if (line.leasedItemCount > 0 && line.leasedItemMonthlyPayment > 0) {
    const hasGap = itemBreakdowns.some(i => i.diff > 0);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className={`h-3.5 w-3.5 cursor-help inline ml-1 ${hasGap ? 'text-warning' : 'text-muted-foreground/50'}`} />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm space-y-2">
            <p className="font-medium text-xs">Recovery Method: Owned (Replacement Value)</p>
            {itemBreakdowns.map((item, i) => (
              <div key={i} className="text-xs border-t border-border/50 pt-1">
                <p className="font-medium">{item.name}</p>
                {item.paidOff ? (
                  <>
                    <p>Owned recovery: {formatCurrency(item.ownedRecovery)}/yr</p>
                    <p className="text-success">✓ Payments complete — no active cash gap</p>
                  </>
                ) : (
                  <>
                    <p>Owned recovery: {formatCurrency(item.ownedRecovery)}/yr</p>
                    <p>Actual lease cost: {formatCurrency(item.actualLeaseCost)}/yr</p>
                    {item.hasDeposit && <p className="text-muted-foreground">Incl. {formatCurrency(item.depositAmort)}/yr deposit over {Math.round(item.termMonths)}mo</p>}
                    {item.diff > 0 ? (
                      <p className="text-warning">⚠ {formatCurrency(item.diff)}/yr cash gap</p>
                    ) : (
                      <p className="text-success">✓ {formatCurrency(Math.abs(item.diff))}/yr more competitive</p>
                    )}
                  </>
                )}
              </div>
            ))}
            {onToggleRecovery && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleRecovery(line.category, categoryItems.length); }}
                className="text-xs text-primary hover:underline cursor-pointer block border-t border-border/50 pt-1"
              >
                {toggleLabel}
              </button>
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
  calculatedEquipment: EquipmentCalculated[];
  onToggleRecovery?: (category: string, itemCount: number) => void;
}

function RollupSection({ 
  title, icon, lines, totals, showType, copiedCell, onCopyCell, onSelectLine, isMobile, emptyMessage, emptyHint, distanceUnit, calculatedEquipment, onToggleRecovery 
}: RollupSectionProps) {
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const toggleExpand = (lineId: string) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };
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
                    <>
                    <TableRow key={lineId} className="group">
                      <TableCell className="font-medium">
                         <div className="relative inline-flex items-center">
                          {line.qty > 1 && (
                            <button
                              onClick={() => toggleExpand(lineId)}
                              className="p-0.5 hover:bg-muted rounded mr-1 shrink-0"
                              title="View items in this group"
                            >
                              <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expandedLines.has(lineId) ? 'rotate-90' : ''}`} />
                            </button>
                          )}
                          <span>
                            {line.category}
                            <CostComparisonTooltip line={line} mode="owned" calculatedEquipment={calculatedEquipment} onToggleRecovery={onToggleRecovery} />
                          </span>
                          <CopyButton cellId={`${lineId}-cat`} value={line.category} copiedCell={copiedCell} onCopy={onCopyCell} />
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
                    {expandedLines.has(lineId) && line.itemNames && line.itemNames.length > 0 && (
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={showType ? 6 : 5} className="py-2 pl-8">
                          <p className="text-sm text-muted-foreground">
                            {line.itemNames.join(', ')}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    </>
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
  calculatedEquipment: EquipmentCalculated[];
  onToggleRecovery?: (category: string, itemCount: number) => void;
}

function LeasedRollupSection({ lines, totals, copiedCell, onCopyCell, onSelectLine, isMobile, calculatedEquipment, onToggleRecovery }: LeasedRollupSectionProps) {
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());
  const toggleExpand = (lineId: string) => {
    setExpandedLines(prev => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };
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
                    <>
                    <TableRow key={lineId} className="group">
                      <TableCell className="font-medium">
                        <div className="relative inline-flex items-center">
                          {line.qty > 1 && (
                            <button
                              onClick={() => toggleExpand(lineId)}
                              className="p-0.5 hover:bg-muted rounded mr-1 shrink-0"
                              title="View items in this group"
                            >
                              <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${expandedLines.has(lineId) ? 'rotate-90' : ''}`} />
                            </button>
                          )}
                          <span>
                            {line.category}
                            <CostComparisonTooltip line={line} mode="leased" calculatedEquipment={calculatedEquipment} onToggleRecovery={onToggleRecovery} />
                          </span>
                          <CopyButton cellId={`${lineId}-cat`} value={line.category} copiedCell={copiedCell} onCopy={onCopyCell} />
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
                    {expandedLines.has(lineId) && line.itemNames && line.itemNames.length > 0 && (
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={5} className="py-2 pl-8">
                          <p className="text-sm text-muted-foreground">
                            {line.itemNames.join(', ')}
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                    </>
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
  const { calculatedEquipment, updateEquipment } = useEquipment();
  const { markStepComplete } = useOnboarding();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'phone' || deviceType === 'tablet';
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [selectedLine, setSelectedLine] = useState<RollupLine | null>(null);
  const [activeTab, setActiveTab] = useState('lmn');
  const { distanceUnit } = useDistanceUnit();
  const [toggleConfirm, setToggleConfirm] = useState<{ category: string; itemCount: number; targetMethod: 'owned' | 'leased' } | null>(null);

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

  const handleToggleRecovery = (category: string, itemCount: number) => {
    // Determine current method for items in this category
    const categoryItems = calculatedEquipment.filter(
      item => item.status === 'Active' && item.category === category && item.financingType === 'leased'
    );
    if (categoryItems.length === 0) return;
    
    const currentMethod = (categoryItems[0] as any).lmnRecoveryMethod || 'owned';
    const targetMethod: 'owned' | 'leased' = currentMethod === 'owned' ? 'leased' : 'owned';

    if (itemCount === 1) {
      // Single item — toggle immediately
      updateEquipment(categoryItems[0].id, { lmnRecoveryMethod: targetMethod });
      toast({
        title: 'Recovery method updated',
        description: `${categoryItems[0].name} switched to ${targetMethod === 'leased' ? 'Lease Pass-Through' : 'Owned Recovery'}.`,
      });
    } else {
      // Multi-item — show confirmation
      setToggleConfirm({ category, itemCount, targetMethod });
    }
  };

  const confirmBatchToggle = async () => {
    if (!toggleConfirm) return;
    const categoryItems = calculatedEquipment.filter(
      item => item.status === 'Active' && item.category === toggleConfirm.category && item.financingType === 'leased'
    );
    for (const item of categoryItems) {
      await updateEquipment(item.id, { lmnRecoveryMethod: toggleConfirm.targetMethod });
    }
    toast({
      title: 'Recovery method updated',
      description: `${categoryItems.length} items in ${toggleConfirm.category} switched to ${toggleConfirm.targetMethod === 'leased' ? 'Lease Pass-Through' : 'Owned Recovery'}.`,
    });
    setToggleConfirm(null);
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
              <CashGapSummary calculatedEquipment={calculatedEquipment} />
              
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
                calculatedEquipment={calculatedEquipment}
                onToggleRecovery={handleToggleRecovery}
              />

              <LeasedRollupSection
                lines={rollupResult.fieldLeasedLines}
                totals={rollupResult.fieldLeasedTotals}
                copiedCell={copiedCell}
                onCopyCell={copyCell}
                onSelectLine={setSelectedLine}
                isMobile={isMobile}
                calculatedEquipment={calculatedEquipment}
                onToggleRecovery={handleToggleRecovery}
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
                calculatedEquipment={calculatedEquipment}
                onToggleRecovery={handleToggleRecovery}
              />

              <LeasedRollupSection
                lines={rollupResult.overheadLeasedLines}
                totals={rollupResult.overheadLeasedTotals}
                copiedCell={copiedCell}
                onCopyCell={copyCell}
                onSelectLine={setSelectedLine}
                isMobile={isMobile}
                calculatedEquipment={calculatedEquipment}
                onToggleRecovery={handleToggleRecovery}
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

        {/* Batch Toggle Confirmation Dialog */}
        <AlertDialog open={!!toggleConfirm} onOpenChange={(open) => !open && setToggleConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Recovery Method</AlertDialogTitle>
              <AlertDialogDescription>
                This will switch {toggleConfirm?.itemCount} items in "{toggleConfirm?.category}" to{' '}
                {toggleConfirm?.targetMethod === 'leased' ? 'Lease Pass-Through' : 'Owned Recovery'}.
                The FMS Export will update automatically.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmBatchToggle}>
                Switch {toggleConfirm?.itemCount} Items
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
