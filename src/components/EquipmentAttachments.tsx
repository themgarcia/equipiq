import { useState, useEffect, useCallback } from 'react';
import { useEquipment } from '@/contexts/EquipmentContext';
import { EquipmentAttachment } from '@/types/equipment';
import { formatCurrency } from '@/lib/calculations';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil, Package, ImageIcon, X } from 'lucide-react';

interface EquipmentAttachmentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipmentId: string;
  equipmentName: string;
}

interface AttachmentFormData {
  name: string;
  value: string;
  serialNumber: string;
  description: string;
}

const defaultFormData: AttachmentFormData = {
  name: '',
  value: '',
  serialNumber: '',
  description: '',
};

export function EquipmentAttachments({
  open,
  onOpenChange,
  equipmentId,
  equipmentName,
}: EquipmentAttachmentsProps) {
  const { getAttachments, addAttachment, updateAttachment, deleteAttachment } = useEquipment();
  const [attachments, setAttachments] = useState<EquipmentAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState<EquipmentAttachment | null>(null);
  const [formData, setFormData] = useState<AttachmentFormData>(defaultFormData);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadAttachments = useCallback(async () => {
    if (!equipmentId) return;
    setLoading(true);
    try {
      const data = await getAttachments(equipmentId);
      setAttachments(data);
    } finally {
      setLoading(false);
    }
  }, [equipmentId, getAttachments]);

  useEffect(() => {
    if (open && equipmentId) {
      loadAttachments();
    }
  }, [open, equipmentId, loadAttachments]);

  const getPhotoUrl = (photoPath: string) => {
    const { data } = supabase.storage
      .from('equipment-documents')
      .getPublicUrl(photoPath);
    return data.publicUrl;
  };

  const handleOpenForm = (attachment?: EquipmentAttachment) => {
    if (attachment) {
      setEditingAttachment(attachment);
      setFormData({
        name: attachment.name,
        value: attachment.value.toString(),
        serialNumber: attachment.serialNumber || '',
        description: attachment.description || '',
      });
      if (attachment.photoPath) {
        setPhotoPreview(getPhotoUrl(attachment.photoPath));
      }
    } else {
      setEditingAttachment(null);
      setFormData(defaultFormData);
      setPhotoPreview(null);
    }
    setPhotoFile(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingAttachment(null);
    setFormData(defaultFormData);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const attachmentData = {
        name: formData.name.trim(),
        value: parseFloat(formData.value) || 0,
        serialNumber: formData.serialNumber.trim() || undefined,
        description: formData.description.trim() || undefined,
      };

      if (editingAttachment) {
        await updateAttachment(editingAttachment.id, attachmentData, photoFile || undefined);
      } else {
        await addAttachment(equipmentId, attachmentData, photoFile || undefined);
      }

      handleCloseForm();
      loadAttachments();
    } catch (error) {
      console.error('Failed to save attachment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (attachment: EquipmentAttachment) => {
    if (!confirm(`Delete "${attachment.name}"?`)) return;

    try {
      await deleteAttachment(attachment.id, attachment.photoPath);
      loadAttachments();
    } catch (error) {
      console.error('Failed to delete attachment:', error);
    }
  };

  const totalValue = attachments.reduce((sum, a) => sum + a.value, 0);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Attachments
            </SheetTitle>
            <SheetDescription>
              Accessories and implements for {equipmentName}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <Button onClick={() => handleOpenForm()} className="w-full gap-2">
              <Plus className="h-4 w-4" />
              Add Attachment
            </Button>

            {loading ? (
              <div className="py-8 text-center text-muted-foreground">
                Loading attachments...
              </div>
            ) : attachments.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No attachments yet. Add buckets, implements, or accessories.
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-card"
                  >
                    {attachment.photoPath ? (
                      <img
                        src={getPhotoUrl(attachment.photoPath)}
                        alt={attachment.name}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-muted rounded border">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{attachment.name}</p>
                      <p className="text-sm text-muted-foreground font-mono-nums">
                        {formatCurrency(attachment.value)}
                      </p>
                      {attachment.serialNumber && (
                        <p className="text-xs text-muted-foreground truncate">
                          S/N: {attachment.serialNumber}
                        </p>
                      )}
                      {attachment.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {attachment.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenForm(attachment)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(attachment)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Total Value */}
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Attachment Value
                  </span>
                  <span className="font-medium font-mono-nums">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingAttachment ? 'Edit Attachment' : 'Add Attachment'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder='e.g., 42" Bucket, Pallet Forks'
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value ($)</Label>
              <Input
                id="value"
                type="number"
                placeholder="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                placeholder="Optional"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                placeholder="Optional notes about this attachment"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Photo</Label>
              {photoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleRemovePhoto}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseForm}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || submitting}
            >
              {submitting ? 'Saving...' : editingAttachment ? 'Save Changes' : 'Add Attachment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}