import React, { createContext, useContext, useState, useCallback } from 'react';
import { Equipment, EquipmentCalculated, CategoryDefaults } from '@/types/equipment';
import { mockEquipment } from '@/data/mockEquipment';
import { categoryDefaults as defaultCategories } from '@/data/categoryDefaults';
import { calculateEquipment } from '@/lib/calculations';

interface EquipmentContextType {
  equipment: Equipment[];
  calculatedEquipment: EquipmentCalculated[];
  categoryDefaults: CategoryDefaults[];
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;
  updateCategoryDefaults: (category: string, updates: Partial<CategoryDefaults>) => void;
}

const EquipmentContext = createContext<EquipmentContextType | undefined>(undefined);

export function EquipmentProvider({ children }: { children: React.ReactNode }) {
  const [equipment, setEquipment] = useState<Equipment[]>(mockEquipment);
  const [categoryDefaultsState, setCategoryDefaults] = useState<CategoryDefaults[]>(defaultCategories);

  const calculatedEquipment = equipment.map(e => calculateEquipment(e));

  const addEquipment = useCallback((newEquipment: Omit<Equipment, 'id'>) => {
    const id = crypto.randomUUID();
    setEquipment(prev => [...prev, { ...newEquipment, id }]);
  }, []);

  const updateEquipment = useCallback((id: string, updates: Partial<Equipment>) => {
    setEquipment(prev => 
      prev.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  }, []);

  const deleteEquipment = useCallback((id: string) => {
    setEquipment(prev => prev.filter(e => e.id !== id));
  }, []);

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
      addEquipment,
      updateEquipment,
      deleteEquipment,
      updateCategoryDefaults,
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
