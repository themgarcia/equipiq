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

type ColumnKey = keyof LMNExportData;

interface ColumnConfig {
  key: ColumnKey;
  label: string;
  format: (value: LMNExportData[ColumnKey]) => string;
  align: 'left' | 'right';
}

const columns: ColumnConfig[] = [
  { 
    key: 'equipmentName', 
    label: 'Equipment Name', 
    format: (v) => String(v),
    align: 'left'
  },
  { 
    key: 'purchasePrice', 
    label: 'Purchase Price', 
    format: (v) => String(v),
    align: 'right'
  },
  { 
    key: 'additionalPurchaseFees', 
    label: "Add'l Fees", 
    format: (v) => String(v),
    align: 'right'
  },
  { 
    key: 'replacementValue', 
    label: 'Replacement', 
    format: (v) => String(v),
    align: 'right'
  },
  { 
    key: 'expectedValueAtEndOfLife', 
    label: 'End Value', 
    format: (v) => String(v),
    align: 'right'
  },
  { 
    key: 'usefulLife', 
    label: 'Life (yrs)', 
    format: (v) => String(v),
    align: 'right'
  },
  { 
    key: 'cogsPercent', 
    label: 'COGS %', 
    format: (v) => String(v),
    align: 'right'
  },
  { 
    key: 'overheadPercent', 
    label: 'OH %', 
    format: (v) => String(v),
    align: 'right'
  },
];

export default function LMNExport() {
  const { calculatedEquipment } = useEquipment();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copiedColumn, setCopiedColumn] = useState<ColumnKey | null>(null);

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

  const copyColumn = async (columnKey: ColumnKey) => {
    const dataToUse = selectedIds.size > 0 
      ? exportData.filter(e => selectedIds.has(e.id))
      : exportData;
    
    const values = dataToUse.map(e => String(e.data[columnKey]));
    await navigator.clipboard.writeText(values.join('\n'));
    
    setCopiedColumn(columnKey);
    setTimeout(() => setCopiedColumn(null), 2000);
    
    const column = columns.find(c => c.key === columnKey);
    toast({
      title: 'Column copied',
      description: `${dataToUse.length} ${column?.label || columnKey} values copied`,
    });
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

  const formatCellValue = (key: ColumnKey, value: LMNExportData[ColumnKey]) => {
    if (key === 'equipmentName') return String(value);
    if (key === 'usefulLife') return String(value);
    if (key === 'cogsPercent' || key === 'overheadPercent') return `${value}%`;
    return formatCurrency(value as number);
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
            <h3 className="font-semibold mb-1">Per-Column Copy for LMN</h3>
            <p className="text-sm text-muted-foreground">
              LMN requires pasting one field at a time. Click the <Copy className="h-3 w-3 inline mx-1" /> 
              button on any column header to copy all values in that column. 
              Select specific rows using checkboxes to copy only those items.
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
                  {columns.map(col => (
                    <TableHead 
                      key={col.key} 
                      className={`table-header-cell ${col.align === 'right' ? 'text-right' : ''}`}
                    >
                      <div className={`flex items-center gap-2 ${col.align === 'right' ? 'justify-end' : ''}`}>
                        <span>{col.label}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-primary/10"
                          onClick={() => copyColumn(col.key)}
                          title={`Copy all ${col.label} values`}
                        >
                          {copiedColumn === col.key ? (
                            <Check className="h-3 w-3 text-success" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
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
                      {columns.map(col => (
                        <TableCell 
                          key={col.key}
                          className={`${col.align === 'right' ? 'text-right font-mono-nums' : ''} ${col.key === 'equipmentName' ? 'font-medium' : ''}`}
                        >
                          {formatCellValue(col.key, data[col.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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
      </div>
    </Layout>
  );
}
