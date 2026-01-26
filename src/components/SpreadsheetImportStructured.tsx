import { useState, useCallback } from 'react';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { SpreadsheetColumnMapper } from '@/components/SpreadsheetColumnMapper';
import { 
  SPREADSHEET_MAPPABLE_FIELDS, 
  ColumnMapping, 
  ValidationError, 
  parseValue, 
  validateRow 
} from '@/lib/spreadsheetFields';
import { ExtractedEquipmentBase, DocumentSummary, FieldConflict } from '@/types/equipment';

interface SpreadsheetImportStructuredProps {
  onEquipmentExtracted: (
    equipment: ExtractedEquipmentBase[], 
    documentSummaries?: DocumentSummary[],
    conflicts?: FieldConflict[],
    processingNotes?: string,
    sourceFiles?: File[]
  ) => void;
  onClose: () => void;
}

type Step = 'upload' | 'sheet' | 'header' | 'mapping' | 'validation';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PREVIEW_ROWS = 100;

export function SpreadsheetImportStructured({ onEquipmentExtracted, onClose }: SpreadsheetImportStructuredProps) {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [parsedData, setParsedData] = useState<any[][]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState<number>(0);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  }, []);

  const processFile = async (selectedFile: File) => {
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    const extension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV or Excel file (.csv, .xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      if (extension === 'csv') {
        // Parse CSV with PapaParse
        Papa.parse(selectedFile, {
          complete: (results) => {
            setParsedData(results.data as any[][]);
            autoDetectHeaderRow(results.data as any[][]);
            setStep('header');
            setIsProcessing(false);
          },
          error: (error) => {
            toast({
              title: "Parse Error",
              description: error.message,
              variant: "destructive",
            });
            setIsProcessing(false);
          },
        });
      } else {
        // Parse Excel with SheetJS
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetNames = workbook.SheetNames;
        
        setSheets(sheetNames);
        
        if (sheetNames.length === 1) {
          // Single sheet - parse immediately
          const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]], { header: 1 }) as any[][];
          setParsedData(data);
          setSelectedSheet(sheetNames[0]);
          autoDetectHeaderRow(data);
          setStep('header');
        } else {
          // Multiple sheets - let user select
          setSelectedSheet(sheetNames[0]);
          setStep('sheet');
        }
        setIsProcessing(false);
      }
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse the file. Please check the format.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    setIsProcessing(true);

    try {
      const arrayBuffer = await file!.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
      setParsedData(data);
      autoDetectHeaderRow(data);
      setStep('header');
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to read the selected sheet.",
        variant: "destructive",
      });
    }
    setIsProcessing(false);
  };

  const autoDetectHeaderRow = (data: any[][]) => {
    // Find first non-empty row
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const row = data[i];
      if (row && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
        setHeaderRowIndex(i);
        return;
      }
    }
    setHeaderRowIndex(0);
  };

  const getHeaders = (): string[] => {
    if (parsedData.length === 0 || headerRowIndex >= parsedData.length) return [];
    return parsedData[headerRowIndex].map((cell, i) => 
      cell ? String(cell) : `Column ${i + 1}`
    );
  };

  const getDataRows = (): any[][] => {
    if (parsedData.length === 0) return [];
    return parsedData.slice(headerRowIndex + 1).filter(row => 
      row && row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );
  };

  const handleHeaderConfirm = () => {
    // Auto-detect column mappings based on header names
    const headers = getHeaders();
    const newMappings: ColumnMapping = {};
    
    headers.forEach((header, index) => {
      const lowerHeader = header.toLowerCase();
      
      for (const field of SPREADSHEET_MAPPABLE_FIELDS) {
        const lowerLabel = field.label.toLowerCase();
        const lowerKey = field.key.toLowerCase();
        
        if (
          lowerHeader === lowerLabel ||
          lowerHeader === lowerKey ||
          lowerHeader.includes(lowerLabel) ||
          lowerLabel.includes(lowerHeader)
        ) {
          if (!newMappings[field.key]) {
            newMappings[field.key] = index;
          }
        }
      }
    });
    
    setColumnMappings(newMappings);
    setStep('mapping');
  };

  const handleMappingConfirm = () => {
    // Validate all rows
    const dataRows = getDataRows();
    const allErrors: ValidationError[] = [];
    
    dataRows.forEach((row, index) => {
      const rowErrors = validateRow(row, columnMappings, index + headerRowIndex + 2); // +2 for 1-based and header
      allErrors.push(...rowErrors);
    });
    
    setValidationErrors(allErrors);
    setStep('validation');
  };

  const handleImport = () => {
    const dataRows = getDataRows();
    const headers = getHeaders();
    
    const equipment: ExtractedEquipmentBase[] = dataRows
      .map((row, index) => {
        // Check if row has required fields
        const makeColIndex = columnMappings['make'];
        const modelColIndex = columnMappings['model'];
        
        const make = makeColIndex !== null && makeColIndex !== undefined 
          ? parseValue(row[makeColIndex], 'string') 
          : null;
        const model = modelColIndex !== null && modelColIndex !== undefined 
          ? parseValue(row[modelColIndex], 'string') 
          : null;
        
        if (!make || !model) return null;
        
        const getFieldValue = (key: string, type: 'string' | 'number' | 'currency' | 'date') => {
          const colIndex = columnMappings[key];
          if (colIndex === null || colIndex === undefined) return null;
          return parseValue(row[colIndex], type);
        };
        
        return {
          make,
          model,
          year: getFieldValue('year', 'number'),
          serialVin: getFieldValue('serialVin', 'string'),
          purchaseDate: getFieldValue('purchaseDate', 'date'),
          purchasePrice: getFieldValue('purchasePrice', 'currency'),
          salesTax: getFieldValue('salesTax', 'currency'),
          freightSetup: getFieldValue('freightSetup', 'currency'),
          financingType: getFieldValue('financingType', 'string') as 'owned' | 'financed' | 'leased' | null,
          depositAmount: getFieldValue('depositAmount', 'currency'),
          financedAmount: getFieldValue('financedAmount', 'currency'),
          monthlyPayment: getFieldValue('monthlyPayment', 'currency'),
          termMonths: getFieldValue('termMonths', 'number'),
          buyoutAmount: getFieldValue('buyoutAmount', 'currency'),
          confidence: 'high' as const,
          notes: null,
          suggestedType: 'equipment' as const,
          suggestedParentIndex: null,
          purchaseCondition: null,
          suggestedCategory: getFieldValue('category', 'string') as any,
        };
      })
      .filter((eq): eq is NonNullable<typeof eq> => eq !== null);
    
    if (equipment.length === 0) {
      toast({
        title: "No Equipment Found",
        description: "No valid equipment data could be extracted from the spreadsheet.",
        variant: "destructive",
      });
      return;
    }
    
    const documentSummary: DocumentSummary = {
      fileName: file?.name || 'spreadsheet',
      extracted: Object.keys(columnMappings).filter(k => columnMappings[k] !== null),
      itemsFound: equipment.map(e => `${e.make} ${e.model}`),
    };
    
    onEquipmentExtracted(
      equipment, 
      [documentSummary],
      [],
      `Imported ${equipment.length} items from spreadsheet`,
      file ? [file] : undefined
    );
    
    toast({
      title: "Spreadsheet Processed",
      description: `Extracted ${equipment.length} equipment items for review.`,
    });
    
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const validRowCount = getDataRows().length - validationErrors.filter((e, i, arr) => 
    arr.findIndex(x => x.row === e.row) === i
  ).length;
  const invalidRowCount = new Set(validationErrors.map(e => e.row)).size;

  return (
    <div className="space-y-4">
      {/* Step: Upload */}
      {step === 'upload' && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
            }
          `}
          onClick={() => document.getElementById('spreadsheet-input')?.click()}
        >
          <input
            id="spreadsheet-input"
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          {isProcessing ? (
            <>
              <Loader2 className="mx-auto h-10 w-10 text-muted-foreground mb-3 animate-spin" />
              <p className="text-sm font-medium">Processing file...</p>
            </>
          ) : (
            <>
              <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">
                Drag & drop a spreadsheet here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                CSV, XLSX, XLS • Max 10MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Step: Sheet Selection (XLSX only) */}
      {step === 'sheet' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file?.name}</span>
            <Button variant="ghost" size="sm" onClick={() => { setStep('upload'); setFile(null); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Sheet</label>
            <Select value={selectedSheet} onValueChange={handleSheetSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a sheet" />
              </SelectTrigger>
              <SelectContent>
                {sheets.map(sheet => (
                  <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Step: Header Row Selection */}
      {step === 'header' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file?.name}</span>
            {selectedSheet && <span className="text-muted-foreground">• {selectedSheet}</span>}
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Header Row</label>
            <p className="text-xs text-muted-foreground">
              Click on the row that contains your column headers.
            </p>
          </div>
          
          <ScrollArea className="h-64 border rounded-md">
            <div className="p-2">
              {parsedData.slice(0, 15).map((row, index) => (
                <div
                  key={index}
                  onClick={() => setHeaderRowIndex(index)}
                  className={`
                    p-2 rounded cursor-pointer text-xs font-mono flex gap-2 overflow-x-auto
                    ${index === headerRowIndex 
                      ? 'bg-primary/10 border border-primary' 
                      : 'hover:bg-muted'
                    }
                  `}
                >
                  <span className="text-muted-foreground w-6 shrink-0">
                    {index + 1}
                  </span>
                  {row.slice(0, 8).map((cell, cellIndex) => (
                    <span key={cellIndex} className="truncate min-w-[80px] max-w-[120px]">
                      {cell ?? '—'}
                    </span>
                  ))}
                  {row.length > 8 && <span className="text-muted-foreground">...</span>}
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button onClick={handleHeaderConfirm}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step: Column Mapping */}
      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file?.name}</span>
          </div>
          
          <SpreadsheetColumnMapper
            headers={getHeaders()}
            sampleRow={getDataRows()[0]}
            mappings={columnMappings}
            onMappingsChange={setColumnMappings}
          />
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('header')}>
              Back
            </Button>
            <Button onClick={handleMappingConfirm}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step: Validation */}
      {step === 'validation' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{file?.name}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span>{validRowCount} valid rows</span>
            </div>
            {invalidRowCount > 0 && (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>{invalidRowCount} rows with issues (will be skipped)</span>
              </div>
            )}
          </div>
          
          {validationErrors.length > 0 && (
            <ScrollArea className="h-40 border rounded-md p-3">
              <div className="space-y-2 text-xs">
                {validationErrors.slice(0, 20).map((error, index) => (
                  <div key={index} className="text-amber-600">
                    Row {error.row}: {error.message}
                  </div>
                ))}
                {validationErrors.length > 20 && (
                  <div className="text-muted-foreground">
                    ... and {validationErrors.length - 20} more issues
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('mapping')}>
              Back
            </Button>
            <Button onClick={handleImport} disabled={validRowCount === 0}>
              Import {validRowCount} Items
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
