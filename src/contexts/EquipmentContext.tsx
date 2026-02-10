import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Equipment, EquipmentCalculated, CategoryDefaults, EquipmentDocument, EquipmentAttachment } from '@/types/equipment';
import { categoryDefaults as defaultCategories } from '@/data/categoryDefaults';
import { calculateEquipment } from '@/lib/calculations';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminMode } from '@/contexts/AdminModeContext';
import { useToast } from '@/hooks/use-toast';
import { getDemoEquipmentForPlan, getDemoAttachmentsForPlan, getDemoDocumentsForPlan } from '@/data/demoEquipmentData';

interface EquipmentContextType {
  equipment: Equipment[];
  calculatedEquipment: EquipmentCalculated[];
  categoryDefaults: CategoryDefaults[];
  loading: boolean;
  attachmentsByEquipmentId: Record<string, EquipmentAttachment[]>;
  isDemoData: boolean;
  addEquipment: (equipment: Omit<Equipment, 'id'>, entrySource?: 'manual' | 'ai_document' | 'spreadsheet') => Promise<string | undefined>;
  updateEquipment: (id: string, updates: Partial<Equipment>) => Promise<void>;
  deleteEquipment: (id: string) => Promise<void>;
  updateCategoryDefaults: (category: string, updates: Partial<CategoryDefaults>) => void;
  refetch: () => Promise<void>;
  refetchAttachments: () => Promise<void>;
  // Document management
  getDocuments: (equipmentId: string) => Promise<EquipmentDocument[]>;
  uploadDocument: (equipmentId: string, file: File, notes?: string) => Promise<void>;
  deleteDocument: (documentId: string, filePath: string) => Promise<void>;
  // Attachment management
  getAttachments: (equipmentId: string) => Promise<EquipmentAttachment[]>;
  addAttachment: (equipmentId: string, attachment: Omit<EquipmentAttachment, 'id' | 'equipmentId' | 'createdAt'>, photo?: File) => Promise<void>;
  updateAttachment: (id: string, updates: Partial<Omit<EquipmentAttachment, 'id' | 'createdAt'>>, photo?: File) => Promise<void>;
  deleteAttachment: (id: string, photoPath?: string) => Promise<void>;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

// Helper to convert DB record to Equipment type
function dbToEquipment(record: any): Equipment {
  const category = record.category;
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
    financingType: record.financing_type || 'owned',
    depositAmount: Number(record.deposit_amount) || 0,
    financedAmount: Number(record.financed_amount) || 0,
    monthlyPayment: Number(record.monthly_payment) || 0,
    termMonths: Number(record.term_months) || 0,
    buyoutAmount: Number(record.buyout_amount) || 0,
    financingStartDate: record.financing_start_date || undefined,
    purchaseCondition: record.purchase_condition || 'new',
    allocationType: record.allocation_type || 'operational',
  };
}

// Helper to convert Equipment to DB record
function equipmentToDb(equipment: Omit<Equipment, 'id'>, userId: string, entrySource?: 'manual' | 'ai_document' | 'spreadsheet') {
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
    financing_type: equipment.financingType || 'owned',
    deposit_amount: equipment.depositAmount || 0,
    financed_amount: equipment.financedAmount || 0,
    monthly_payment: equipment.monthlyPayment || 0,
    term_months: equipment.termMonths || 0,
    buyout_amount: equipment.buyoutAmount || 0,
    financing_start_date: equipment.financingStartDate || null,
    purchase_condition: equipment.purchaseCondition || 'new',
    allocation_type: equipment.allocationType || 'operational',
    entry_source: entrySource || 'manual',
  };
}

// Fetch functions for React Query
async function fetchEquipmentData(userId: string): Promise<Equipment[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(dbToEquipment);
}

async function fetchAttachmentsData(userId: string): Promise<Record<string, EquipmentAttachment[]>> {
  const { data, error } = await supabase
    .from('equipment_attachments')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;

  const grouped: Record<string, EquipmentAttachment[]> = {};
  (data || []).forEach(att => {
    const eqId = att.equipment_id;
    if (!grouped[eqId]) grouped[eqId] = [];
    grouped[eqId].push({
      id: att.id,
      equipmentId: att.equipment_id,
      name: att.name,
      description: att.description || undefined,
      value: Number(att.value),
      serialNumber: att.serial_number || undefined,
      photoPath: att.photo_path || undefined,
      createdAt: att.created_at,
    });
  });
  return grouped;
}

export function EquipmentProvider({ children }: { children: React.ReactNode }) {
  const [categoryDefaultsState, setCategoryDefaults] = useState<CategoryDefaults[]>(defaultCategories);
  const { user } = useAuth();
  const { adminModeActive, demoDataEnabled, demoPlan } = useAdminMode();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Determine if we're showing demo data
  const isDemoData = adminModeActive && demoDataEnabled;

  // Get impersonation state
  const isImpersonating = useMemo(() => {
    try {
      const storedState = localStorage.getItem('equipiq_impersonation_state');
      return !!storedState;
    } catch {
      return false;
    }
  }, []);

  // React Query for equipment
  const {
    data: equipment = [],
    isLoading: equipmentLoading,
    refetch: refetchEquipmentQuery,
  } = useQuery({
    queryKey: ['equipment', user?.id],
    queryFn: () => fetchEquipmentData(user!.id),
    enabled: !!user && !isDemoData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // React Query for attachments
  const {
    data: attachmentsByEquipmentId = {},
    refetch: refetchAttachmentsQuery,
  } = useQuery({
    queryKey: ['attachments', user?.id],
    queryFn: () => fetchAttachmentsData(user!.id),
    enabled: !!user && !isDemoData,
    staleTime: 5 * 60 * 1000,
  });

  // Use demo data when in demo mode
  const effectiveEquipment = useMemo(() => {
    if (isDemoData) {
      return getDemoEquipmentForPlan(demoPlan || 'free');
    }
    return equipment;
  }, [isDemoData, demoPlan, equipment]);

  const effectiveAttachmentsByEquipmentId = useMemo(() => {
    if (isDemoData) {
      return getDemoAttachmentsForPlan(demoPlan || 'free');
    }
    return attachmentsByEquipmentId;
  }, [isDemoData, demoPlan, attachmentsByEquipmentId]);

  const calculatedEquipment = useMemo(() => 
    effectiveEquipment.map(e => {
      const attachments = effectiveAttachmentsByEquipmentId[e.id] || [];
      const attachmentTotal = attachments.reduce((sum, a) => sum + a.value, 0);
      return calculateEquipment(e, categoryDefaultsState, attachmentTotal);
    }),
    [effectiveEquipment, categoryDefaultsState, effectiveAttachmentsByEquipmentId]
  );

  const loading = equipmentLoading;

  // Helper to log user activity
  const logActivity = useCallback(async (actionType: string, actionDetails: Record<string, any>) => {
    if (!user) return;
    try {
      await supabase.from('user_activity_log').insert({
        user_id: user.id,
        action_type: actionType,
        action_details: actionDetails,
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, [user]);

  // Mutation for adding equipment
  const addEquipmentMutation = useMutation({
    mutationFn: async ({ newEquipment, entrySource }: { newEquipment: Omit<Equipment, 'id'>; entrySource?: 'manual' | 'ai_document' | 'spreadsheet' }) => {
      if (!user) throw new Error('Not authenticated');
      
      const equipmentWithName = {
        ...newEquipment,
        name: `${newEquipment.year} ${newEquipment.make.trim()} ${newEquipment.model.trim()}`,
      };

      const { data, error } = await supabase
        .from('equipment')
        .insert(equipmentToDb(equipmentWithName, user.id, entrySource))
        .select()
        .single();

      if (error) throw error;
      return { data, equipmentWithName };
    },
    onSuccess: async ({ data, equipmentWithName }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', user?.id] });
      await logActivity('equipment_create', {
        equipmentId: data.id,
        equipmentName: equipmentWithName.name,
        category: equipmentWithName.category,
        purchasePrice: equipmentWithName.purchasePrice,
      });
      toast({
        title: "Equipment added",
        description: `${equipmentWithName.name} has been added to your inventory.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add equipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for updating equipment
  const updateEquipmentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Equipment> }) => {
      if (!user) throw new Error('Not authenticated');

      const currentEquipment = equipment.find(e => e.id === id);
      if (!currentEquipment) throw new Error('Equipment not found');

      const mergedData = { ...currentEquipment, ...updates };
      const generatedName = `${mergedData.year} ${mergedData.make.trim()} ${mergedData.model.trim()}`;
      const updatesWithName = { ...updates, name: generatedName };

      const dbUpdates: Record<string, any> = { name: generatedName };
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
      if (updatesWithName.financingType !== undefined) dbUpdates.financing_type = updatesWithName.financingType;
      if (updatesWithName.depositAmount !== undefined) dbUpdates.deposit_amount = updatesWithName.depositAmount;
      if (updatesWithName.financedAmount !== undefined) dbUpdates.financed_amount = updatesWithName.financedAmount;
      if (updatesWithName.monthlyPayment !== undefined) dbUpdates.monthly_payment = updatesWithName.monthlyPayment;
      if (updatesWithName.termMonths !== undefined) dbUpdates.term_months = updatesWithName.termMonths;
      if (updatesWithName.buyoutAmount !== undefined) dbUpdates.buyout_amount = updatesWithName.buyoutAmount;
      if (updatesWithName.financingStartDate !== undefined) dbUpdates.financing_start_date = updatesWithName.financingStartDate || null;
      if (updatesWithName.purchaseCondition !== undefined) dbUpdates.purchase_condition = updatesWithName.purchaseCondition;
      if (updatesWithName.allocationType !== undefined) dbUpdates.allocation_type = updatesWithName.allocationType;

      const { error } = await supabase
        .from('equipment')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { id, generatedName, updates };
    },
    onSuccess: async ({ id, generatedName, updates }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', user?.id] });
      await logActivity('equipment_update', {
        equipmentId: id,
        equipmentName: generatedName,
        updatedFields: Object.keys(updates),
      });
      toast({
        title: "Equipment updated",
        description: "Your changes have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update equipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting equipment
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error('Not authenticated');

      const equipmentToDelete = equipment.find(e => e.id === id);
      
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return { id, equipmentToDelete };
    },
    onSuccess: async ({ id, equipmentToDelete }) => {
      queryClient.invalidateQueries({ queryKey: ['equipment', user?.id] });
      if (equipmentToDelete) {
        await logActivity('equipment_delete', {
          equipmentId: id,
          equipmentName: equipmentToDelete.name,
          category: equipmentToDelete.category,
        });
      }
      toast({
        title: "Equipment deleted",
        description: "The equipment has been removed from your inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete equipment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Wrapper functions that check demo/impersonation states
  const addEquipment = useCallback(async (newEquipment: Omit<Equipment, 'id'>, entrySource?: 'manual' | 'ai_document' | 'spreadsheet'): Promise<string | undefined> => {
    if (!user) return undefined;
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to make changes.", variant: "destructive" });
      return undefined;
    }
    try {
      const result = await addEquipmentMutation.mutateAsync({ newEquipment, entrySource });
      return result.data.id;
    } catch {
      return undefined;
    }
  }, [user, isDemoData, addEquipmentMutation, toast]);

  const updateEquipment = useCallback(async (id: string, updates: Partial<Equipment>) => {
    if (!user) return;
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to make changes.", variant: "destructive" });
      return;
    }
    await updateEquipmentMutation.mutateAsync({ id, updates });
  }, [user, isDemoData, updateEquipmentMutation, toast]);

  const deleteEquipment = useCallback(async (id: string) => {
    if (!user) return;
    if (isImpersonating) {
      toast({ title: "Action blocked", description: "Destructive actions are disabled while impersonating a user.", variant: "destructive" });
      return;
    }
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to make changes.", variant: "destructive" });
      return;
    }
    await deleteEquipmentMutation.mutateAsync(id);
  }, [user, isImpersonating, isDemoData, deleteEquipmentMutation, toast]);

  const updateCategoryDefaults = useCallback((category: string, updates: Partial<CategoryDefaults>) => {
    setCategoryDefaults(prev =>
      prev.map(c => c.category === category ? { ...c, ...updates } : c)
    );
  }, []);

  const refetch = useCallback(async () => {
    await refetchEquipmentQuery();
  }, [refetchEquipmentQuery]);

  const refetchAttachments = useCallback(async () => {
    await refetchAttachmentsQuery();
  }, [refetchAttachmentsQuery]);

  // Document management (kept as callbacks - could be converted to mutations later)
  const getDocuments = useCallback(async (equipmentId: string): Promise<EquipmentDocument[]> => {
    if (isDemoData) {
      const demoDocuments = getDemoDocumentsForPlan(demoPlan || 'free');
      return demoDocuments[equipmentId] || [];
    }
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
  }, [user, isDemoData, demoPlan]);

  const uploadDocument = useCallback(async (equipmentId: string, file: File, notes?: string): Promise<void> => {
    if (!user) return;
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to upload documents.", variant: "destructive" });
      return;
    }
    try {
      const filePath = `${user.id}/${equipmentId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('equipment-documents').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from('equipment_documents').insert({
        equipment_id: equipmentId,
        user_id: user.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        notes: notes || null,
      });
      if (dbError) throw dbError;
      toast({ title: "Document uploaded", description: `${file.name} has been attached to this equipment.` });
    } catch (error: any) {
      toast({ title: "Failed to upload document", description: error.message, variant: "destructive" });
      throw error;
    }
  }, [user, toast, isDemoData]);

  const deleteDocument = useCallback(async (documentId: string, filePath: string): Promise<void> => {
    if (!user) return;
    if (isImpersonating) {
      toast({ title: "Action blocked", description: "Destructive actions are disabled while impersonating a user.", variant: "destructive" });
      return;
    }
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to delete documents.", variant: "destructive" });
      return;
    }
    try {
      const { error: storageError } = await supabase.storage.from('equipment-documents').remove([filePath]);
      if (storageError) throw storageError;
      const { error: dbError } = await supabase.from('equipment_documents').delete().eq('id', documentId).eq('user_id', user.id);
      if (dbError) throw dbError;
      toast({ title: "Document deleted", description: "The document has been removed." });
    } catch (error: any) {
      toast({ title: "Failed to delete document", description: error.message, variant: "destructive" });
      throw error;
    }
  }, [user, toast, isDemoData, isImpersonating]);

  // Attachment management
  const getAttachments = useCallback(async (equipmentId: string): Promise<EquipmentAttachment[]> => {
    if (isDemoData) {
      const demoAttachments = getDemoAttachmentsForPlan(demoPlan || 'free');
      return demoAttachments[equipmentId] || [];
    }
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
  }, [user, isDemoData, demoPlan]);

  const addAttachment = useCallback(async (
    equipmentId: string, 
    attachment: Omit<EquipmentAttachment, 'id' | 'equipmentId' | 'createdAt'>,
    photo?: File
  ): Promise<void> => {
    if (!user) return;
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to make changes.", variant: "destructive" });
      return;
    }
    try {
      let photoPath: string | null = null;
      if (photo) {
        photoPath = `${user.id}/${equipmentId}/attachments/${Date.now()}-${photo.name}`;
        const { error: uploadError } = await supabase.storage.from('equipment-documents').upload(photoPath, photo);
        if (uploadError) throw uploadError;
      }
      const { error: dbError } = await supabase.from('equipment_attachments').insert({
        equipment_id: equipmentId,
        user_id: user.id,
        name: attachment.name,
        description: attachment.description || null,
        value: attachment.value,
        serial_number: attachment.serialNumber || null,
        photo_path: photoPath,
      });
      if (dbError) throw dbError;
      queryClient.invalidateQueries({ queryKey: ['attachments', user.id] });
      toast({ title: "Attachment added", description: `${attachment.name} has been added.` });
    } catch (error: any) {
      toast({ title: "Failed to add attachment", description: error.message, variant: "destructive" });
      throw error;
    }
  }, [user, toast, isDemoData, queryClient]);

  const updateAttachment = useCallback(async (
    id: string, 
    updates: Partial<Omit<EquipmentAttachment, 'id' | 'createdAt'>>,
    photo?: File
  ): Promise<void> => {
    if (!user) return;
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to make changes.", variant: "destructive" });
      return;
    }
    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined) dbUpdates.description = updates.description || null;
      if (updates.value !== undefined) dbUpdates.value = updates.value;
      if (updates.serialNumber !== undefined) dbUpdates.serial_number = updates.serialNumber || null;
      if (updates.equipmentId !== undefined) dbUpdates.equipment_id = updates.equipmentId;

      if (photo) {
        const { data: currentAtt } = await supabase
          .from('equipment_attachments')
          .select('equipment_id, photo_path')
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (currentAtt) {
          if (currentAtt.photo_path) {
            await supabase.storage.from('equipment-documents').remove([currentAtt.photo_path]);
          }
          const targetEquipmentId = updates.equipmentId || currentAtt.equipment_id;
          const photoPath = `${user.id}/${targetEquipmentId}/attachments/${Date.now()}-${photo.name}`;
          const { error: uploadError } = await supabase.storage.from('equipment-documents').upload(photoPath, photo);
          if (uploadError) throw uploadError;
          dbUpdates.photo_path = photoPath;
        }
      }

      const { error } = await supabase.from('equipment_attachments').update(dbUpdates).eq('id', id).eq('user_id', user.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['attachments', user.id] });
      toast({ title: "Attachment updated", description: updates.equipmentId ? "Attachment has been reassigned." : "Your changes have been saved." });
    } catch (error: any) {
      toast({ title: "Failed to update attachment", description: error.message, variant: "destructive" });
      throw error;
    }
  }, [user, toast, isDemoData, queryClient]);

  const deleteAttachment = useCallback(async (id: string, photoPath?: string): Promise<void> => {
    if (!user) return;
    if (isImpersonating) {
      toast({ title: "Action blocked", description: "Destructive actions are disabled while impersonating a user.", variant: "destructive" });
      return;
    }
    if (isDemoData) {
      toast({ title: "Demo mode active", description: "Switch to real data to make changes.", variant: "destructive" });
      return;
    }
    try {
      if (photoPath) {
        await supabase.storage.from('equipment-documents').remove([photoPath]);
      }
      const { error } = await supabase.from('equipment_attachments').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['attachments', user.id] });
      toast({ title: "Attachment deleted", description: "The attachment has been removed." });
    } catch (error: any) {
      toast({ title: "Failed to delete attachment", description: error.message, variant: "destructive" });
      throw error;
    }
  }, [user, toast, isDemoData, isImpersonating, queryClient]);

  return (
    <EquipmentContext.Provider value={{
      equipment: effectiveEquipment,
      calculatedEquipment,
      categoryDefaults: categoryDefaultsState,
      loading,
      attachmentsByEquipmentId: effectiveAttachmentsByEquipmentId,
      isDemoData,
      addEquipment,
      updateEquipment,
      deleteEquipment,
      updateCategoryDefaults,
      refetch,
      refetchAttachments,
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
