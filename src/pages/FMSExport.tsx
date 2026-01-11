import { useState, useMemo } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useDeviceType } from '@/hooks/use-mobile';
import { Layout } from '@/components/Layout';
import { toFMSExport, formatCurrency } from '@/lib/calculations';
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
import { Copy, Download, Check, FileSpreadsheet, ArrowUp, ArrowDown, ArrowUpDown, ChevronRight } from 'lucide-react';
import { FMSExportData } from '@/types/equipment';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

type ColumnKey = keyof FMSExportData;
type SortDirection = 'asc' | 'desc';

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  format: (value: FMSExportData[ColumnKey]) => string;
  align: 'left' | 'right';
  sortType: 'string' | 'number';
  hideOnMobile?: boolean;
}

const columns: ColumnConfig[] = [
  { 
    key: 'equipmentName', 
    label: 'Equipment Name', 
    format: (v) => String(v),
    align: 'left',
    sortType: 'string'
  },
  { 
    key: 'replacementValue', 
    label: 'Replacement Value', 
    format: (v) => String(v),
    align: 'right',
    sortType: 'number'
  },
  { 
    key: 'usefulLife', 
    label: 'Useful Life (yrs)', 
    format: (v) => String(v),
    align: 'right',
    sortType: 'number'
  },
  { 
    key: 'expectedValueAtEndOfLife', 
    label: 'End Value', 
    format: (v) => String(v),
    align: 'right',
    sortType: 'number',
    hideOnMobile: true,
  },
  { 
    key: 'cogsAllocatedCost', 
    label: 'COGS $', 
    format: (v) => String(v),
    align: 'right',
    sortType: 'number',
    hideOnMobile: true,
  },
  { 
    key: 'overheadAllocatedCost', 
    label: 'OH $', 
    format: (v) => String(v),
    align: 'right',
    sortType: 'number',
    hideOnMobile: true,
  },
];

export default function FMSExport() {
  const { calculatedEquipment, attachmentsByEquipmentId } = useEquipment();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'phone' || deviceType === 'tablet';
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<ColumnKey>('equipmentName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedEquipmentForSheet, setSelectedEquipmentForSheet] = useState<{ id: string; data: FMSExportData } | null>(null);

  const activeEquipment = calculatedEquipment.filter(e => e.status === 'Active');
  
  const exportData = useMemo(() => {
    const data = activeEquipment.map(e => {
      const attachments = attachmentsByEquipmentId[e.id] || [];
      const attachmentTotal = attachments.reduce((sum, a) => sum + a.value, 0);
      return { id: e.id, data: toFMSExport(e, attachmentTotal) };
    });
    
    const columnConfig = columns.find(c => c.key === sortColumn);
    if (!columnConfig) return data;
    
    return [...data].sort((a, b) => {
      const aVal = a.data[sortColumn];
      const bVal = b.data[sortColumn];
      
      let comparison = 0;
      if (columnConfig.sortType === 'string') {
        comparison = String(aVal).localeCompare(String(bVal));
      } else {
        comparison = (Number(aVal) || 0) - (Number(bVal) || 0);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [activeEquipment, attachmentsByEquipmentId, sortColumn, sortDirection]);

  const handleSort = (columnKey: ColumnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: ColumnKey) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />;
  };

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

  const copyCell = async (id: string, columnKey: ColumnKey, value: FMSExportData[ColumnKey]) => {
    const cellId = `${id}-${columnKey}`;
    
    // For currency columns, round to nearest dollar (no decimals)
    let copyValue: string;
    if (columnKey === 'equipmentName' || columnKey === 'usefulLife') {
      copyValue = String(value);
    } else {
      copyValue = String(Math.round(Number(value)));
    }
    
    await navigator.clipboard.writeText(copyValue);
    
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const exportCSV = () => {
    const headers = columns.map(c => c.label);

    const dataToExport = selectedIds.size > 0 
      ? exportData.filter(e => selectedIds.has(e.id))
      : exportData;

    const csvContent = [
      headers.join(','),
      ...dataToExport.map(e => [
        `"${e.data.equipmentName}"`,
        Math.round(e.data.replacementValue),
        e.data.usefulLife,
        Math.round(e.data.expectedValueAtEndOfLife),
        e.data.cogsAllocatedCost > 0 ? Math.round(e.data.cogsAllocatedCost) : '',
        e.data.overheadAllocatedCost > 0 ? Math.round(e.data.overheadAllocatedCost) : '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `fms-equipment-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'CSV exported',
      description: `${dataToExport.length} rows exported successfully`,
    });
  };

  const formatCellValue = (key: ColumnKey, value: FMSExportData[ColumnKey]) => {
    if (key === 'equipmentName') return String(value);
    if (key === 'usefulLife') return String(value);
    
    // For COGS/OH columns, show blank if $0
    if (key === 'cogsAllocatedCost' || key === 'overheadAllocatedCost') {
      const numValue = value as number;
      return numValue > 0 ? formatCurrency(numValue) : '';
    }
    
    return formatCurrency(value as number);
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">FMS Export</h1>
            <p className="text-muted-foreground mt-1">
              Copy-ready data for Field Management Software
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <h3 className="font-semibold mb-1">Copy Values for FMS</h3>
            <p className="text-sm text-muted-foreground">
              Most FMS tools require pasting one field at a time. Click the <Copy className="h-3 w-3 inline mx-1" /> 
              button next to any value to copy it to your clipboard. Click column headers to sort. Replacement value includes equipment + attachments.
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
          {isMobile ? (
            /* Mobile Card View */
            <div className="divide-y">
              {exportData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active equipment to export. Add equipment and set status to "Active".
                </div>
              ) : (
                exportData.map(({ id, data }) => (
                  <div 
                    key={id}
                    className="flex items-center justify-between p-4 hover:bg-muted/30 cursor-pointer"
                    onClick={() => setSelectedEquipmentForSheet({ id, data })}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Checkbox 
                        checked={selectedIds.has(id)}
                        onCheckedChange={() => toggleSelect(id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{data.equipmentName}</p>
                        <p className="text-sm text-muted-foreground font-mono-nums">
                          {formatCurrency(data.replacementValue)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                  </div>
                ))
              )}
            </div>
          ) : (
            /* Desktop Table View */
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
                    {columns.map(col => (
                      <TableHead 
                        key={col.key} 
                        className={`table-header-cell cursor-pointer hover:bg-muted/70 transition-colors ${col.align === 'right' ? 'text-right' : ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                        onClick={() => handleSort(col.key)}
                      >
                        <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                          <span>{col.label}</span>
                          {getSortIcon(col.key)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center py-8 text-muted-foreground">
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
                        {columns.map(col => {
                          const cellId = `${id}-${col.key}`;
                          const isCopied = copiedCell === cellId;
                          return (
                            <TableCell 
                              key={col.key}
                              className={`${col.align === 'right' ? 'text-right' : ''} ${col.key === 'equipmentName' ? 'font-medium' : ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                            >
                              <div className={`flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end' : ''}`}>
                                <span className={col.align === 'right' ? 'font-mono-nums' : ''}>
                                  {formatCellValue(col.key, data[col.key])}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-primary/10 shrink-0"
                                  onClick={() => copyCell(id, col.key, data[col.key])}
                                  title="Copy value"
                                >
                                  {isCopied ? (
                                    <Check className="h-3 w-3 text-success" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            {selectedIds.size > 0 
              ? `${selectedIds.size} of ${exportData.length} items selected`
              : `${exportData.length} active equipment items ready for export`
            }
          </p>
        </div>

        {/* FMS Equipment Details Sheet (Mobile) */}
        <Sheet open={!!selectedEquipmentForSheet} onOpenChange={(open) => !open && setSelectedEquipmentForSheet(null)}>
          <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
            {selectedEquipmentForSheet && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedEquipmentForSheet.data.equipmentName}</SheetTitle>
                  <SheetDescription>FMS Export Values</SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {columns.map(col => (
                    <div key={col.key} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-muted-foreground">{col.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono-nums">
                          {formatCellValue(col.key, selectedEquipmentForSheet.data[col.key])}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyCell(selectedEquipmentForSheet.id, col.key, selectedEquipmentForSheet.data[col.key])}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}