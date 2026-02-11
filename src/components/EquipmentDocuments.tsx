import { useState, useEffect, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEquipment } from '@/contexts/EquipmentContext';
import { EquipmentDocument } from '@/types/equipment';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Trash2, Download, Loader2, FileIcon, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EquipmentDocumentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
}

interface DocumentWithPreview extends EquipmentDocument {
  previewUrl?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  return '📎';
};

const isPreviewable = (fileType: string): boolean => {
  return fileType.includes('image') || fileType.includes('pdf');
};

export function EquipmentDocuments({ 
  open, 
  onOpenChange, 
  equipmentId, 
  equipmentName 
}: EquipmentDocumentsProps) {
  const { getDocuments, uploadDocument, deleteDocument } = useEquipment();
  const [documents, setDocuments] = useState<DocumentWithPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<EquipmentDocument | null>(null);
  const [lightboxImage, setLightboxImage] = useState<DocumentWithPreview | null>(null);
  const [pdfViewerDoc, setPdfViewerDoc] = useState<DocumentWithPreview | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const docs = await getDocuments(equipmentId);
    
    // Generate preview URLs for images
    const docsWithPreviews: DocumentWithPreview[] = await Promise.all(
      docs.map(async (doc) => {
        if (isPreviewable(doc.fileType)) {
          try {
            const { data } = await supabase.storage
              .from('equipment-documents')
              .createSignedUrl(doc.filePath, 3600); // 1 hour expiry
            return { ...doc, previewUrl: data?.signedUrl };
          } catch {
            return doc;
          }
        }
        return doc;
      })
    );
    
    setDocuments(docsWithPreviews);
    setLoading(false);
  }, [equipmentId, getDocuments]);

  useEffect(() => {
    if (open) {
      loadDocuments();
    }
  }, [open, loadDocuments]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Max 20MB
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 20MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      await uploadDocument(equipmentId, selectedFile, notes || undefined);
      setSelectedFile(null);
      setNotes('');
      await loadDocuments();
    } catch (error) {
      // Error handled in context
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: EquipmentDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('equipment-documents')
        .createSignedUrl(doc.filePath, 60); // 60 second expiry

      if (error) throw error;

      // Open in new tab
      window.open(data.signedUrl, '_blank');
    } catch (error: any) {
      toast({
        title: "Failed to download",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (doc: EquipmentDocument) => {
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete.id, documentToDelete.filePath);
      await loadDocuments();
    } catch (error) {
      // Error handled in context
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const ImageThumbnail = ({ doc }: { doc: DocumentWithPreview }) => {
    const [failed, setFailed] = useState(false);
    return (
      <button
        type="button"
        onClick={() => setLightboxImage(doc)}
        className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
        title="Click to view full size"
      >
        {failed ? (
          <span className="text-2xl flex items-center justify-center w-full h-full">🖼️</span>
        ) : (
          <img 
            src={doc.previewUrl} 
            alt={doc.fileName}
            className="w-full h-full object-cover"
            onError={() => setFailed(true)}
          />
        )}
      </button>
    );
  };

  const renderThumbnail = (doc: DocumentWithPreview) => {
    const isImage = doc.fileType.includes('image');
    
    if (doc.previewUrl && isImage) {
      return <ImageThumbnail doc={doc} />;
    }
    
    if (doc.previewUrl && doc.fileType.includes('pdf')) {
      return (
        <button
          type="button"
          onClick={() => setPdfViewerDoc(doc)}
          className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center border cursor-pointer hover:ring-2 hover:ring-primary transition-all"
          title="Click to view PDF"
        >
          <span className="text-2xl">📄</span>
        </button>
      );
    }
    
    return (
      <div className="w-12 h-12 rounded bg-muted flex-shrink-0 flex items-center justify-center">
        <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
      </div>
    );
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-xl">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </SheetTitle>
            <SheetDescription>
              Manage documents for {equipmentName}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Upload Section */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium">Upload Document</Label>
              
              {selectedFile ? (
                <div className="flex items-center gap-2 p-2 bg-background rounded border">
                  <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="flex-1 text-sm truncate min-w-0">{selectedFile.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{formatFileSize(selectedFile.size)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    type="file"
                    onChange={handleFileSelect}
                    className="cursor-pointer"
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.txt"
                  />
                </div>
              )}

              {selectedFile && (
                <>
                  <Textarea
                    placeholder="Add notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-20 resize-none"
                  />
                  <Button 
                    onClick={handleUpload} 
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Document
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>

            {/* Documents List - matching container style */}
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label className="text-sm font-medium">
                Attached Documents ({documents.length})
              </Label>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No documents attached</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-4">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col gap-2 p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {renderThumbnail(doc)}
                          <div className="flex-1 min-w-0">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="font-medium text-sm break-all line-clamp-2">{doc.fileName}</p>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-xs">
                                  <p className="break-all">{doc.fileName}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.fileSize)} • {formatDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{doc.notes}</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.fileName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Lightbox */}
      <Dialog open={!!lightboxImage} onOpenChange={(open) => !open && setLightboxImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-sm font-medium truncate pr-8">
              {lightboxImage?.fileName}
            </DialogTitle>
          </DialogHeader>
          {lightboxImage?.previewUrl && (
            <div className="flex items-center justify-center p-4 pt-0 max-h-[calc(90vh-80px)] overflow-auto">
              <img
                src={lightboxImage.previewUrl}
                alt={lightboxImage.fileName}
                className="max-w-full max-h-full object-contain rounded"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* PDF Viewer Modal */}
      <Dialog open={!!pdfViewerDoc} onOpenChange={(open) => !open && setPdfViewerDoc(null)}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="p-4 pb-2 flex-shrink-0">
            <div className="flex items-center justify-between pr-8">
              <DialogTitle className="text-sm font-medium truncate">
                {pdfViewerDoc?.fileName}
              </DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pdfViewerDoc && handleDownload(pdfViewerDoc)}
                className="ml-2 flex-shrink-0"
              >
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </DialogHeader>
          {pdfViewerDoc?.previewUrl && (
            <div className="flex-1 p-4 pt-0 min-h-0">
              <iframe
                src={pdfViewerDoc.previewUrl}
                className="w-full h-full rounded border"
                title={pdfViewerDoc.fileName}
              />
            </div>
          )}
          <div className="p-3 border-t bg-muted/30 text-center text-xs text-muted-foreground flex-shrink-0">
            PDF not displaying? <button onClick={() => pdfViewerDoc && handleDownload(pdfViewerDoc)} className="text-primary hover:underline">Download the file</button> instead.
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
