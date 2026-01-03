import { useState, useMemo } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { Layout } from '@/components/Layout';
import { toLMNExport, formatCurrency } from '@/lib/calculations';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Copy, Download, Check, FileSpreadsheet } from 'lucide-react';
import { LMNExportData } from '@/types/equipment';

export default function LMNExport() {
  const { calculatedEquipment } = useEquipment();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeEquipment = calculatedEquipment.filter(e => e.status === 'Active');
  const exportData = useMemo(() => 
    activeEquipment.map(e => ({ id: e.id, data: toLMNExport(e) })),
    [activeEquipment]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === exportData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(exportData.map(e => e.id)));
    }
  };

  const formatForCopy = (data: LMNExportData): string => {
    return [
      data.itemName,
      data.category,
      data.status,
      data.purchasePrice,
      data.additionalPurchaseFees,
      data.replacementValue,
      data.expectedValueAtEndOfLife,
      data.usefulLife,
      data.cogsPercent,
      data.overheadPercent,
    ].join('\t');
  };

  const copyRow = async (id: string, data: LMNExportData) => {
    await navigator.clipboard.writeText(formatForCopy(data));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'Row data ready to paste into LMN',
    });
  };

  const copySelected = async () => {
    const headers = [
      'Item Name',
      'Category',
      'Status',
      'Purchase Price',
      'Additional Fees',
      'Replacement Value',
      'Expected End Value',
      'Useful Life',
      'COGS %',
      'Overhead %',
    ].join('\t');

    const rows = exportData
      .filter(e => selectedIds.has(e.id))
      .map(e => formatForCopy(e.data));

    await navigator.clipboard.writeText([headers, ...rows].join('\n'));
    toast({
      title: 'Copied to clipboard',
      description: `${selectedIds.size} rows copied with headers`,
    });
  };

  const exportCSV = () => {
    const headers = [
      'Item Name',
      'Category',
      'Status',
      'Purchase Price',
      'Additional Fees',
      'Replacement Value',
      'Expected End Value',
      'Useful Life',
      'COGS %',
      'Overhead %',
    ];

    const dataToExport = selectedIds.size > 0 
      ? exportData.filter(e => selectedIds.has(e.id))
      : exportData;

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(e => [
        `"${e.data.itemName}"`,
        `"${e.data.category}"`,
        e.data.status,
        e.data.purchasePrice,
        e.data.additionalPurchaseFees,
        e.data.replacementValue,
        e.data.expectedValueAtEndOfLife,
        e.data.usefulLife,
        e.data.cogsPercent,
        e.data.overheadPercent,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lmn-equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'CSV exported',
      description: `${dataToExport.length} rows exported successfully`,
    });
  };

  return (
    <Layout>
      <div className="p-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">LMN Export</h1>
            <p className="text-muted-foreground mt-1">
              Copy-ready data for LMN's Owned Equipment Calculator
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={copySelected}
              disabled={selectedIds.size === 0}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Selected ({selectedIds.size})
            </Button>
            <Button onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 flex items-start gap-3">
          <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h3 className="font-semibold mb-1">LMN-Ready Format</h3>
            <p className="text-sm text-muted-foreground">
              This view shows only the fields needed for LMN's Owned Equipment Calculator. 
              Click the copy button on any row to get tab-separated values ready to paste into LMN, 
              or select multiple rows to copy them all at once with headers.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedIds.size === exportData.length && exportData.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead className="table-header-cell">Item Name</TableHead>
                  <TableHead className="table-header-cell">Category</TableHead>
                  <TableHead className="table-header-cell text-right">Purchase Price</TableHead>
                  <TableHead className="table-header-cell text-right">Add'l Fees</TableHead>
                  <TableHead className="table-header-cell text-right">Replacement</TableHead>
                  <TableHead className="table-header-cell text-right">End Value</TableHead>
                  <TableHead className="table-header-cell text-right">Life (yrs)</TableHead>
                  <TableHead className="table-header-cell text-right">COGS %</TableHead>
                  <TableHead className="table-header-cell text-right">OH %</TableHead>
                  <TableHead className="table-header-cell w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exportData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No active equipment to export. Add equipment and set status to "Active".
                    </TableCell>
                  </TableRow>
                ) : (
                  exportData.map(({ id, data }) => (
                    <TableRow key={id} className="group">
                      <TableCell>
                        <Checkbox 
                          checked={selectedIds.has(id)}
                          onCheckedChange={() => toggleSelect(id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{data.itemName}</TableCell>
                      <TableCell className="text-sm">{data.category}</TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {formatCurrency(data.purchasePrice)}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {formatCurrency(data.additionalPurchaseFees)}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {formatCurrency(data.replacementValue)}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {formatCurrency(data.expectedValueAtEndOfLife)}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {data.usefulLife}
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {data.cogsPercent}%
                      </TableCell>
                      <TableCell className="text-right font-mono-nums">
                        {data.overheadPercent}%
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyRow(id, data)}
                        >
                          {copiedId === id ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>{exportData.length} active equipment items ready for export</p>
        </div>
      </div>
    </Layout>
  );
}
