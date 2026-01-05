import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ExtractedEquipment {
  make: string;
  model: string;
  year: number | null;
  serialVin: string | null;
  purchaseDate: string | null;
  purchasePrice: number | null;
  salesTax: number | null;
  freightSetup: number | null;
  financingType: 'owned' | 'financed' | 'leased' | null;
  depositAmount: number | null;
  financedAmount: number | null;
  monthlyPayment: number | null;
  termMonths: number | null;
  buyoutAmount: number | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

interface EquipmentImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEquipmentExtracted: (equipment: ExtractedEquipment[], sourceFile?: File) => void;
}

interface UploadedFile {
  file: File;
  preview?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

export function EquipmentImport({ open, onOpenChange, onEquipmentExtracted }: EquipmentImportProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>("");
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
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const validFiles: UploadedFile[] = [];
    
    for (const file of newFiles) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }
      
      if (!ACCEPTED_TYPES.includes(file.type) && !file.name.endsWith('.heic')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format`,
          variant: "destructive",
        });
        continue;
      }
      
      validFiles.push({ file });
    }
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const processDocuments = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const allExtractedEquipment: ExtractedEquipment[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const { file } = files[i];
        setProcessingStatus(`Processing ${file.name} (${i + 1}/${files.length})...`);

        const base64 = await fileToBase64(file);

        const { data, error } = await supabase.functions.invoke('parse-equipment-docs', {
          body: {
            documentBase64: base64,
            documentType: file.type || 'application/pdf',
            fileName: file.name,
          },
        });

        if (error) {
          console.error('Error processing document:', error);
          toast({
            title: "Processing Error",
            description: `Failed to process ${file.name}: ${error.message}`,
            variant: "destructive",
          });
          continue;
        }

        if (data.error) {
          toast({
            title: "Extraction Error",
            description: data.error,
            variant: "destructive",
          });
          continue;
        }

        if (data.equipment && data.equipment.length > 0) {
          allExtractedEquipment.push(...data.equipment);
        } else {
          toast({
            title: "No Equipment Found",
            description: `No equipment data could be extracted from ${file.name}`,
          });
        }
      }

      if (allExtractedEquipment.length > 0) {
        // Pass the first file as source document for attachment
        const sourceFile = files.length === 1 ? files[0].file : undefined;
        onEquipmentExtracted(allExtractedEquipment, sourceFile);
        setFiles([]);
        onOpenChange(false);
        toast({
          title: "Documents Processed",
          description: `Extracted ${allExtractedEquipment.length} equipment item(s) for review`,
        });
      }
    } catch (error) {
      console.error('Error processing documents:', error);
      toast({
        title: "Processing Failed",
        description: "An unexpected error occurred while processing documents",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStatus("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Equipment from Documents</DialogTitle>
          <DialogDescription>
            Upload purchase orders, invoices, financing agreements, or lease documents. 
            AI will extract equipment details for your review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop Zone */}
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
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, JPG, PNG, WebP • Max 10MB per file
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2 overflow-hidden">
              <p className="text-sm font-medium">Files to process:</p>
              {files.map((uploadedFile, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-2 bg-muted/50 rounded-md px-3 py-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                    <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate max-w-full">{uploadedFile.file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(uploadedFile.file.size / 1024 / 1024).toFixed(1)}MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="flex gap-2 p-3 bg-muted/50 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
            <p className="text-xs text-muted-foreground">
              AI will analyze your documents and extract equipment details including make, model, 
              pricing, and financing information. You'll be able to review and edit before importing.
            </p>
          </div>

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{processingStatus}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={processDocuments}
              disabled={files.length === 0 || isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                `Process ${files.length} Document${files.length !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
