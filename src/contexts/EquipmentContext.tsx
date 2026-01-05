import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Equipment, EquipmentCalculated, CategoryDefaults, EquipmentDocument, EquipmentAttachment } from '@/types/equipment';
import { categoryDefaults as defaultCategories } from '@/data/categoryDefaults';
import { calculateEquipment } from '@/lib/calculations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EquipmentContextType {
  equipment: Equipment[];
  calculatedEquipment: EquipmentCalculated[];
  categoryDefaults: CategoryDefaults[];
  loading: boolean;
  addEquipment: (equipment: Omit<Equipment, 'id'>) => Promise<void>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  updateCategoryDefaults: (category: string, updates: Partial<CategoryDefaults>) => void;
  refetch: () => Promise<void>;
  // Document management
  getDocuments: (equipmentId: string) => Promise<EquipmentDocument[]>;
  uploadDocument: (equipmentId: string, file: File, notes?: string) => Promise<void>;
  deleteDocument: (documentId: string, filePath: string) => Promise<void>;
  // Attachment management
  getAttachments: (equipmentId: string) => Promise<EquipmentAttachment[]>;
  addAttachment: (equipmentId: string, attachment: Omit<EquipmentAttachment, 'id' | 'equipmentId' | 'createdAt'>, photo?: File) => Promise<void>;
  updateAttachment: (id: string, updates: Partial<Omit<EquipmentAttachment, 'id' | 'equipmentId' | 'createdAt'>>, photo?: File) => Promise<void>;
  deleteAttachment: (id: string, photoPath?: string) => Promise<void>;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

// Legacy category mapping for renamed categories
const LEGACY_CATEGORY_MAP: Record<string, string> = {
  'Loader (Mini-Skid)': 'Loader – Skid Steer Mini',
  'Loader (Skid / CTL)': 'Loader – Skid Steer',
  'Loader (Mid-Size)': 'Loader – Mid-Size',
  'Loader (Large / Wheel)': 'Loader – Wheel / Large',
};

// Helper to convert DB record to Equipment type
function dbToEquipment(record: any): Equipment {
  const category = LEGACY_CATEGORY_MAP[record.category] || record.category;
  return {
    id: record.id,
    name: record.name,
    category,
    status: record.status,
    assetId: record.asset_id || undefined,
    make: record.make,
    model: record.model,
    year: record.year,
    serialVin: record.serial_vin || undefined,
    purchaseDate: record.purchase_date,
    purchasePrice: Number(record.purchase_price),
    salesTax: Number(record.sales_tax),
    freightSetup: Number(record.freight_setup),
    otherCapEx: Number(record.other_cap_ex),
    cogsPercent: Number(record.cogs_percent),
    usefulLifeOverride: record.useful_life_override || undefined,
    replacementCostNew: Number(record.replacement_cost_new),
    replacementCostAsOfDate: record.replacement_cost_as_of_date || undefined,
    expectedResaleOverride: record.expected_resale_override ? Number(record.expected_resale_override) : undefined,
    saleDate: record.sale_date || undefined,
    salePrice: record.sale_price ? Number(record.sale_price) : undefined,
    // Financing fields (cashflow visibility only)
    financingType: record.financing_type || 'owned',
    depositAmount: Number(record.deposit_amount) || 0,
    financedAmount: Number(record.financed_amount) || 0,
    monthlyPayment: Number(record.monthly_payment) || 0,
    termMonths: Number(record.term_months) || 0,
    buyoutAmount: Number(record.buyout_amount) || 0,
    financingStartDate: record.financing_start_date || undefined,
  };
}

// Helper to convert Equipment to DB record
function equipmentToDb(equipment: Omit<Equipment, 'id'>, userId: string) {
  return {
    user_id: userId,
    name: equipment.name,
    category: equipment.category,
    status: equipment.status,
    asset_id: equipment.assetId || null,
    make: equipment.make,
    model: equipment.model,
    year: equipment.year,
    serial_vin: equipment.serialVin || null,
    purchase_date: equipment.purchaseDate,
    purchase_price: equipment.purchasePrice,
    sales_tax: equipment.salesTax,
    freight_setup: equipment.freightSetup,
    other_cap_ex: equipment.otherCapEx,
    cogs_percent: equipment.cogsPercent,
    useful_life_override: equipment.usefulLifeOverride || null,
    replacement_cost_new: equipment.replacementCostNew,
    replacement_cost_as_of_date: equipment.replacementCostAsOfDate || null,
    expected_resale_override: equipment.expectedResaleOverride || null,
    sale_date: equipment.saleDate || null,
    sale_price: equipment.salePrice || null,
    // Financing fields (cashflow visibility only)
    financing_type: equipment.financingType || 'owned',
    deposit_amount: equipment.depositAmount || 0,
    financed_amount: equipment.financedAmount || 0,
    monthly_payment: equipment.monthlyPayment || 0,
    term_months: equipment.termMonths || 0,
    buyout_amount: equipment.buyoutAmount || 0,
    financing_start_date: equipment.financingStartDate || null,
  };
}

export function EquipmentProvider({ children }: { children: React.ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [categoryDefaultsState, setCategoryDefaults] = useState<CategoryDefaults[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const calculatedEquipment = equipment.map(e => calculateEquipment(e, categoryDefaultsState));

  const fetchEquipment = useCallback(async () => {
    if (!user) {
      setEquipment([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEquipment(data.map(dbToEquipment));
    } catch (error: any) {
      toast({
        title: "Failed to load equipment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchEquipment();
  }, [fetchEquipment]);

  const addEquipment = useCallback(async (newEquipment: Omit<Equipment, 'id'>) => {
    if (!user) return;

    try {
      // Ensure name is generated from year/make/model
      const equipmentWithName = {
        ...newEquipment,
        name: `${newEquipment.year} ${newEquipment.make.trim()} ${newEquipment.model.trim()}`,
      };

      const { data, error } = await supabase
        .from('equipment')
        .insert(equipmentToDb(equipmentWithName, user.id))
        .select()
        .single();

      if (error) throw error;

      setEquipment(prev => [dbToEquipment(data), ...prev]);
      toast({
        title: "Equipment added",
        description: `${equipmentWithName.name} has been added to your inventory.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to add equipment",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
    if (!user) return;

    try {
      // Find current equipment to merge with updates for name generation
      const currentEquipment = equipment.find(e => e.id === id);
      if (!currentEquipment) return;

      const mergedData = { ...currentEquipment, ...updates };
      // Regenerate name from year/make/model
      const generatedName = `${mergedData.year} ${mergedData.make.trim()} ${mergedData.model.trim()}`;
      const updatesWithName = { ...updates, name: generatedName };

      // Convert updates to DB format
      const dbUpdates: Record<string, any> = {};
      dbUpdates.name = generatedName;
      if (updatesWithName.category !== undefined) dbUpdates.category = updatesWithName.category;
      if (updatesWithName.status !== undefined) dbUpdates.status = updatesWithName.status;
      if (updatesWithName.assetId !== undefined) dbUpdates.asset_id = updatesWithName.assetId || null;
      if (updatesWithName.make !== undefined) dbUpdates.make = updatesWithName.make;
      if (updatesWithName.model !== undefined) dbUpdates.model = updatesWithName.model;
      if (updatesWithName.year !== undefined) dbUpdates.year = updatesWithName.year;
      if (updatesWithName.serialVin !== undefined) dbUpdates.serial_vin = updatesWithName.serialVin || null;
      if (updatesWithName.purchaseDate !== undefined) dbUpdates.purchase_date = updatesWithName.purchaseDate;
      if (updatesWithName.purchasePrice !== undefined) dbUpdates.purchase_price = updatesWithName.purchasePrice;
      if (updatesWithName.salesTax !== undefined) dbUpdates.sales_tax = updatesWithName.salesTax;
      if (updatesWithName.freightSetup !== undefined) dbUpdates.freight_setup = updatesWithName.freightSetup;
      if (updatesWithName.otherCapEx !== undefined) dbUpdates.other_cap_ex = updatesWithName.otherCapEx;
      if (updatesWithName.cogsPercent !== undefined) dbUpdates.cogs_percent = updatesWithName.cogsPercent;
      if (updatesWithName.usefulLifeOverride !== undefined) dbUpdates.useful_life_override = updatesWithName.usefulLifeOverride || null;
      if (updatesWithName.replacementCostNew !== undefined) dbUpdates.replacement_cost_new = updatesWithName.replacementCostNew;
      if (updatesWithName.replacementCostAsOfDate !== undefined) dbUpdates.replacement_cost_as_of_date = updatesWithName.replacementCostAsOfDate || null;
      if (updatesWithName.expectedResaleOverride !== undefined) dbUpdates.expected_resale_override = updatesWithName.expectedResaleOverride || null;
      if (updatesWithName.saleDate !== undefined) dbUpdates.sale_date = updatesWithName.saleDate || null;
      if (updatesWithName.salePrice !== undefined) dbUpdates.sale_price = updatesWithName.salePrice || null;
      // Financing fields
      if (updatesWithName.financingType !== undefined) dbUpdates.financing_type = updatesWithName.financingType;
      if (updatesWithName.depositAmount !== undefined) dbUpdates.deposit_amount = updatesWithName.depositAmount;
      if (updatesWithName.financedAmount !== undefined) dbUpdates.financed_amount = updatesWithName.financedAmount;
      if (updatesWithName.monthlyPayment !== undefined) dbUpdates.monthly_payment = updatesWithName.monthlyPayment;
      if (updatesWithName.termMonths !== undefined) dbUpdates.term_months = updatesWithName.termMonths;
      if (updatesWithName.buyoutAmount !== undefined) dbUpdates.buyout_amount = updatesWithName.buyoutAmount;
      if (updatesWithName.financingStartDate !== undefined) dbUpdates.financing_start_date = updatesWithName.financingStartDate || null;

      const { error } = await supabase
        .from('equipment')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEquipment(prev => 
        prev.map(e => e.id === id ? { ...e, ...updatesWithName } : e)
      );
      toast({
        title: "Equipment updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update equipment",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, equipment, toast]);

  const deleteEquipment = useCallback(async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEquipment(prev => prev.filter(e => e.id !== id));
      toast({
        title: "Equipment deleted",
        description: "The equipment has been removed from your inventory.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete equipment",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const updateCategoryDefaults = useCallback((category: string, updates: Partial<CategoryDefaults>) => {
    setCategoryDefaults(prev =>
      prev.map(c => c.category === category ? { ...c, ...updates } : c)
    );
  }, []);

  // Get documents for an equipment item
  const getDocuments = useCallback(async (equipmentId: string): Promise<EquipmentDocument[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('equipment_documents')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('user_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(doc => ({
        id: doc.id,
        equipmentId: doc.equipment_id,
        fileName: doc.file_name,
        filePath: doc.file_path,
        fileSize: doc.file_size,
        fileType: doc.file_type,
        notes: doc.notes || undefined,
        uploadedAt: doc.uploaded_at,
      }));
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      return [];
    }
  }, [user]);

  // Upload a document for an equipment item
  const uploadDocument = useCallback(async (equipmentId: string, file: File, notes?: string): Promise<void> => {
    if (!user) return;

    try {
      // Upload file to storage
      const filePath = `${user.id}/${equipmentId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('equipment-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { error: dbError } = await supabase
        .from('equipment_documents')
        .insert({
          equipment_id: equipmentId,
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          notes: notes || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: `${file.name} has been attached to this equipment.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to upload document",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  // Delete a document
  const deleteDocument = useCallback(async (documentId: string, filePath: string): Promise<void> => {
    if (!user) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('equipment-documents')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete database record
      const { error: dbError } = await supabase
        .from('equipment_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (dbError) throw dbError;

      toast({
        title: "Document deleted",
        description: "The document has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete document",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  // Get attachments for an equipment item
  const getAttachments = useCallback(async (equipmentId: string): Promise<EquipmentAttachment[]> => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('equipment_attachments')
        .select('*')
        .eq('equipment_id', equipmentId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(att => ({
        id: att.id,
        equipmentId: att.equipment_id,
        name: att.name,
        description: att.description || undefined,
        value: Number(att.value),
        serialNumber: att.serial_number || undefined,
        photoPath: att.photo_path || undefined,
        createdAt: att.created_at,
      }));
    } catch (error: any) {
      console.error('Failed to load attachments:', error);
      return [];
    }
  }, [user]);

  // Add an attachment to an equipment item
  const addAttachment = useCallback(async (
    equipmentId: string, 
    attachment: Omit<EquipmentAttachment, 'id' | 'equipmentId' | 'createdAt'>,
    photo?: File
  ): Promise<void> => {
    if (!user) return;

    try {
      let photoPath: string | null = null;

      // Upload photo if provided
      if (photo) {
        photoPath = `${user.id}/${equipmentId}/attachments/${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage
          .from('equipment-documents')
          .upload(photoPath, photo);

        if (uploadError) throw uploadError;
      }

      // Create database record
      const { error: dbError } = await supabase
        .from('equipment_attachments')
        .insert({
          equipment_id: equipmentId,
          user_id: user.id,
          name: attachment.name,
          description: attachment.description || null,
          value: attachment.value,
          serial_number: attachment.serialNumber || null,
          photo_path: photoPath,
        });

      if (dbError) throw dbError;

      toast({
        title: "Attachment added",
        description: `${attachment.name} has been added.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to add attachment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  // Update an attachment
  const updateAttachment = useCallback(async (
    id: string, 
    updates: Partial<Omit<EquipmentAttachment, 'id' | 'equipmentId' | 'createdAt'>>,
    photo?: File
  ): Promise<void> => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.value !== undefined) dbUpdates.value = updates.value;
      if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber || null;

      // Handle photo upload if new photo provided
      if (photo) {
        // First get the current attachment to find the equipment_id
        const { data: currentAtt } = await supabase
          .from('equipment_attachments')
          .select('equipment_id, photo_path')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (currentAtt) {
          // Delete old photo if exists
          if (currentAtt.photo_path) {
            await supabase.storage
              .from('equipment-documents')
              .remove([currentAtt.photo_path]);
          }

          // Upload new photo
          const photoPath = `${user.id}/${currentAtt.equipment_id}/attachments/${Date.now()}-${photo.name}`;
          const { error: uploadError } = await supabase.storage
            .from('equipment-documents')
            .upload(photoPath, photo);

          if (uploadError) throw uploadError;
          dbUpdates.photo_path = photoPath;
        }
      }

      const { error } = await supabase
        .from('equipment_attachments')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Attachment updated",
        description: "Your changes have been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update attachment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  // Delete an attachment
  const deleteAttachment = useCallback(async (id: string, photoPath?: string): Promise<void> => {
    if (!user) return;

    try {
      // Delete photo from storage if exists
      if (photoPath) {
        await supabase.storage
          .from('equipment-documents')
          .remove([photoPath]);
      }

      // Delete database record
      const { error } = await supabase
        .from('equipment_attachments')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Attachment deleted",
        description: "The attachment has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete attachment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  return (
    <EquipmentContext.Provider value={{
      equipment,
      calculatedEquipment,
      categoryDefaults: categoryDefaultsState,
      loading,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      updateCategoryDefaults,
      refetch: fetchEquipment,
      getDocuments,
      uploadDocument,
      deleteDocument,
      getAttachments,
      addAttachment,
      updateAttachment,
      deleteAttachment,
    }}>
      {children}
    </EquipmentContext.Provider>
  );
}

export function useEquipment() {
  const context = useContext(EquipmentContext);
  if (context === undefined) {
    throw new Error('useEquipment must be used within an EquipmentProvider');
  }
  return context;
}
