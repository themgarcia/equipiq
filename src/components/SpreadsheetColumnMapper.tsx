import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SPREADSHEET_MAPPABLE_FIELDS, ColumnMapping } from '@/lib/spreadsheetFields';

interface SpreadsheetColumnMapperProps {
  headers: string[];
  sampleRow: any[] | undefined;
  mappings: ColumnMapping;
  onMappingsChange: (mappings: ColumnMapping) => void;
}

export function SpreadsheetColumnMapper({ 
  headers, 
  sampleRow, 
  mappings, 
  onMappingsChange 
}: SpreadsheetColumnMapperProps) {
  const handleMappingChange = (fieldKey: string, columnIndex: string) => {
    const newMappings = { ...mappings };
    if (columnIndex === 'none') {
      newMappings[fieldKey] = null;
    } else {
      newMappings[fieldKey] = parseInt(columnIndex, 10);
    }
    onMappingsChange(newMappings);
  };

  const getSampleValue = (columnIndex: number | null | undefined): string => {
    if (columnIndex === null || columnIndex === undefined || !sampleRow) return '—';
    const value = sampleRow[columnIndex];
    if (value === null || value === undefined || value === '') return '—';
    return String(value).substring(0, 30);
  };

  const requiredFields = SPREADSHEET_MAPPABLE_FIELDS.filter(f => f.required);
  const optionalFields = SPREADSHEET_MAPPABLE_FIELDS.filter(f => !f.required);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="text-sm font-medium">Map Columns to Fields</div>
        <p className="text-xs text-muted-foreground">
          Match your spreadsheet columns to EquipIQ fields. Required fields are marked with an asterisk.
        </p>
      </div>

      <ScrollArea className="h-80 pr-3">
        <div className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-3">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Required Fields
            </div>
            {requiredFields.map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <span className="text-sm font-medium">{field.label}</span>
                  <span className="text-destructive ml-0.5">*</span>
                </div>
                <Select
                  value={mappings[field.key]?.toString() ?? 'none'}
                  onValueChange={(v) => handleMappingChange(field.key, v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not mapped —</SelectItem>
                    {headers.map((header, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-24 text-xs text-muted-foreground truncate">
                  {getSampleValue(mappings[field.key])}
                </div>
              </div>
            ))}
          </div>

          {/* Optional Fields */}
          <div className="space-y-3 pt-2 border-t">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Optional Fields
            </div>
            {optionalFields.map(field => (
              <div key={field.key} className="flex items-center gap-3">
                <div className="w-32 shrink-0">
                  <span className="text-sm">{field.label}</span>
                </div>
                <Select
                  value={mappings[field.key]?.toString() ?? 'none'}
                  onValueChange={(v) => handleMappingChange(field.key, v)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not mapped —</SelectItem>
                    {headers.map((header, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {header}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="w-24 text-xs text-muted-foreground truncate">
                  {getSampleValue(mappings[field.key])}
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Mapping Summary */}
      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <span className="text-xs text-muted-foreground">Mapped:</span>
        {Object.entries(mappings)
          .filter(([_, v]) => v !== null)
          .map(([key]) => {
            const field = SPREADSHEET_MAPPABLE_FIELDS.find(f => f.key === key);
            return (
              <Badge key={key} variant="secondary" className="text-xs">
                {field?.label || key}
              </Badge>
            );
          })}
        {Object.values(mappings).filter(v => v !== null).length === 0 && (
          <span className="text-xs text-muted-foreground italic">No columns mapped yet</span>
        )}
      </div>
    </div>
  );
}
