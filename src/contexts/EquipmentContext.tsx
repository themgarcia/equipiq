import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Equipment, EquipmentCalculated, CategoryDefaults } from '@/types/equipment';
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
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

// Helper to convert DB record to Equipment type
function dbToEquipment(record: any): Equipment {
  return {
    id: record.id,
    name: record.name,
    category: record.category,
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
    expectedResaleOverride: record.expected_resale_override ? Number(record.expected_resale_override) : undefined,
    saleDate: record.sale_date || undefined,
    salePrice: record.sale_price ? Number(record.sale_price) : undefined,
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
    expected_resale_override: equipment.expectedResaleOverride || null,
    sale_date: equipment.saleDate || null,
    sale_price: equipment.salePrice || null,
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
      const { data, error } = await supabase
        .from('equipment')
        .insert(equipmentToDb(newEquipment, user.id))
        .select()
        .single();

      if (error) throw error;

      setEquipment(prev => [dbToEquipment(data), ...prev]);
      toast({
        title: "Equipment added",
        description: `${newEquipment.name} has been added to your inventory.`,
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
      // Convert updates to DB format
      const dbUpdates: Record<string, any> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.assetId !== undefined) dbUpdates.asset_id = updates.assetId || null;
      if (updates.make !== undefined) dbUpdates.make = updates.make;
      if (updates.model !== undefined) dbUpdates.model = updates.model;
      if (updates.year !== undefined) dbUpdates.year = updates.year;
      if (updates.serialVin !== undefined) dbUpdates.serial_vin = updates.serialVin || null;
      if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
      if (updates.purchasePrice !== undefined) dbUpdates.purchase_price = updates.purchasePrice;
      if (updates.salesTax !== undefined) dbUpdates.sales_tax = updates.salesTax;
      if (updates.freightSetup !== undefined) dbUpdates.freight_setup = updates.freightSetup;
      if (updates.otherCapEx !== undefined) dbUpdates.other_cap_ex = updates.otherCapEx;
      if (updates.cogsPercent !== undefined) dbUpdates.cogs_percent = updates.cogsPercent;
      if (updates.usefulLifeOverride !== undefined) dbUpdates.useful_life_override = updates.usefulLifeOverride || null;
      if (updates.replacementCostNew !== undefined) dbUpdates.replacement_cost_new = updates.replacementCostNew;
      if (updates.expectedResaleOverride !== undefined) dbUpdates.expected_resale_override = updates.expectedResaleOverride || null;
      if (updates.saleDate !== undefined) dbUpdates.sale_date = updates.saleDate || null;
      if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice || null;

      const { error } = await supabase
        .from('equipment')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEquipment(prev => 
        prev.map(e => e.id === id ? { ...e, ...updates } : e)
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
  }, [user, toast]);

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
