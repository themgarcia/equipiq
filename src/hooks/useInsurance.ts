import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  InsuranceChangeLog,
  InsuranceSettings,
  InsuredEquipment,
  InsuranceMetrics,
  dbToInsuranceChangeLog,
  dbToInsuranceSettings,
} from '@/types/insurance';
import { differenceInDays, parseISO } from 'date-fns';

export function useInsurance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<InsuranceSettings | null>(null);
  const [changeLogs, setChangeLogs] = useState<InsuranceChangeLog[]>([]);
  const [insuredEquipment, setInsuredEquipment] = useState<InsuredEquipment[]>([]);
  const [unreviewedEquipment, setUnreviewedEquipment] = useState<InsuredEquipment[]>([]);

  // Fetch insurance settings
  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('insurance_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setSettings(data ? dbToInsuranceSettings(data) : null);
    } catch (error: any) {
      console.error('Failed to fetch insurance settings:', error);
    }
  }, [user]);

  // Fetch change logs
  const fetchChangeLogs = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('insurance_change_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChangeLogs((data || []).map(dbToInsuranceChangeLog));
    } catch (error: any) {
      console.error('Failed to fetch change logs:', error);
    }
  }, [user]);

  // Fetch insured equipment
  const fetchInsuredEquipment = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, category, serial_vin, is_insured, insurance_declared_value, purchase_price, financing_type, insurance_notes, insurance_reviewed_at, status')
        .eq('user_id', user.id)
        .eq('is_insured', true)
        .eq('status', 'Active');

      if (error) throw error;

      setInsuredEquipment((data || []).map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        serialVin: e.serial_vin,
        declaredValue: Number(e.insurance_declared_value) || Number(e.purchase_price),
        purchasePrice: Number(e.purchase_price),
        financingType: e.financing_type,
        insuranceNotes: e.insurance_notes,
        insuranceReviewedAt: e.insurance_reviewed_at,
      })));
    } catch (error: any) {
      console.error('Failed to fetch insured equipment:', error);
    }
  }, [user]);

  // Fetch unreviewed equipment (is_insured is null and status is Active)
  const fetchUnreviewedEquipment = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, category, serial_vin, is_insured, insurance_declared_value, purchase_price, financing_type, insurance_notes, insurance_reviewed_at, status')
        .eq('user_id', user.id)
        .is('is_insured', null)
        .eq('status', 'Active');

      if (error) throw error;

      setUnreviewedEquipment((data || []).map(e => ({
        id: e.id,
        name: e.name,
        category: e.category,
        serialVin: e.serial_vin,
        declaredValue: Number(e.insurance_declared_value) || Number(e.purchase_price),
        purchasePrice: Number(e.purchase_price),
        financingType: e.financing_type,
        insuranceNotes: e.insurance_notes,
        insuranceReviewedAt: e.insurance_reviewed_at,
      })));
    } catch (error: any) {
      console.error('Failed to fetch unreviewed equipment:', error);
    }
  }, [user]);

  // Calculate metrics
  const metrics: InsuranceMetrics = {
    totalInsuredCount: insuredEquipment.length,
    totalDeclaredValue: insuredEquipment.reduce((sum, e) => sum + e.declaredValue, 0),
    pendingChangesCount: changeLogs.filter(c => c.status === 'pending').length,
    daysToRenewal: settings?.policyRenewalDate
      ? differenceInDays(parseISO(settings.policyRenewalDate), new Date())
      : null,
    unreviewedCount: unreviewedEquipment.length,
  };

  // Save or update settings
  const saveSettings = useCallback(async (updates: Partial<InsuranceSettings>) => {
    if (!user) return;

    try {
      const dbUpdates: Record<string, any> = {};
      if (updates.brokerName !== undefined) dbUpdates.broker_name = updates.brokerName;
      if (updates.brokerCompany !== undefined) dbUpdates.broker_company = updates.brokerCompany;
      if (updates.brokerEmail !== undefined) dbUpdates.broker_email = updates.brokerEmail;
      if (updates.brokerPhone !== undefined) dbUpdates.broker_phone = updates.brokerPhone;
      if (updates.policyNumber !== undefined) dbUpdates.policy_number = updates.policyNumber;
      if (updates.policyRenewalDate !== undefined) dbUpdates.policy_renewal_date = updates.policyRenewalDate;
      if (updates.renewalReminderDays !== undefined) dbUpdates.renewal_reminder_days = updates.renewalReminderDays;
      if (updates.renewalConfirmedAt !== undefined) dbUpdates.renewal_confirmed_at = updates.renewalConfirmedAt;

      if (settings) {
        // Update existing
        const { error } = await supabase
          .from('insurance_settings')
          .update(dbUpdates)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('insurance_settings')
          .insert({ user_id: user.id, ...dbUpdates });

        if (error) throw error;
      }

      await fetchSettings();
      toast({
        title: "Settings saved",
        description: "Your insurance settings have been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to save settings",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, settings, fetchSettings, toast]);

  // Mark equipment as insured
  const markAsInsured = useCallback(async (equipmentId: string, declaredValue: number, notes?: string) => {
    if (!user) return;

    try {
      const { data: equipment, error: fetchError } = await supabase
        .from('equipment')
        .select('name, purchase_price')
        .eq('id', equipmentId)
        .single();

      if (fetchError) throw fetchError;

      // Update equipment
      const { error: updateError } = await supabase
        .from('equipment')
        .update({
          is_insured: true,
          insurance_declared_value: declaredValue,
          insurance_notes: notes || null,
          insurance_reviewed_at: new Date().toISOString(),
        })
        .eq('id', equipmentId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Create change log entry
      const { error: logError } = await supabase
        .from('insurance_change_log')
        .insert({
          user_id: user.id,
          equipment_id: equipmentId,
          equipment_name: equipment.name,
          change_type: 'added',
          reason: 'new_equipment',
          previous_declared_value: null,
          new_declared_value: declaredValue,
          effective_date: new Date().toISOString().split('T')[0],
          status: 'pending',
        });

      if (logError) throw logError;

      await Promise.all([fetchInsuredEquipment(), fetchUnreviewedEquipment(), fetchChangeLogs()]);

      toast({
        title: "Equipment insured",
        description: `${equipment.name} has been added to your insured equipment list.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update insurance status",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, fetchInsuredEquipment, fetchUnreviewedEquipment, fetchChangeLogs, toast]);

  // Exclude equipment from insurance
  const excludeFromInsurance = useCallback(async (equipmentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          is_insured: false,
          insurance_reviewed_at: new Date().toISOString(),
        })
        .eq('id', equipmentId)
        .eq('user_id', user.id);

      if (error) throw error;

      await Promise.all([fetchInsuredEquipment(), fetchUnreviewedEquipment()]);

      toast({
        title: "Equipment excluded",
        description: "This equipment has been marked as not insured.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update insurance status",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, fetchInsuredEquipment, fetchUnreviewedEquipment, toast]);

  // Update change log status
  const updateChangeStatus = useCallback(async (changeId: string, status: 'sent' | 'confirmed') => {
    if (!user) return;

    try {
      const updates: Record<string, any> = { status };
      if (status === 'sent') {
        updates.sent_at = new Date().toISOString();
      } else if (status === 'confirmed') {
        updates.confirmed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('insurance_change_log')
        .update(updates)
        .eq('id', changeId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchChangeLogs();

      toast({
        title: status === 'sent' ? "Marked as sent" : "Marked as confirmed",
        description: "Change log status has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, fetchChangeLogs, toast]);

  // Mark all pending as sent
  const markAllAsSent = useCallback(async () => {
    if (!user) return;

    const pendingIds = changeLogs.filter(c => c.status === 'pending').map(c => c.id);
    if (pendingIds.length === 0) return;

    try {
      const { error } = await supabase
        .from('insurance_change_log')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .in('id', pendingIds)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchChangeLogs();

      toast({
        title: "All marked as sent",
        description: `${pendingIds.length} changes have been marked as sent.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, changeLogs, fetchChangeLogs, toast]);

  // Close the loop (confirm renewal cycle complete)
  const closeTheLoop = useCallback(async (policyNumber?: string, updates?: Partial<InsuranceSettings>) => {
    if (!user) return;

    try {
      const allUpdates = {
        ...updates,
        renewalConfirmedAt: new Date().toISOString(),
        policyNumber: policyNumber || settings?.policyNumber,
      };

      await saveSettings(allUpdates);

      toast({
        title: "Renewal confirmed",
        description: "Your insurance renewal cycle has been closed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to close the loop",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, settings, saveSettings, toast]);

  // Apply policy import (bulk update equipment + settings)
  const applyPolicyImport = useCallback(async (
    settingsUpdates: Partial<InsuranceSettings>,
    equipmentUpdates: { id: string; declaredValue: number }[]
  ) => {
    if (!user) return;

    try {
      // Update settings
      await saveSettings(settingsUpdates);

      // Update each matched equipment
      for (const update of equipmentUpdates) {
        await supabase
          .from('equipment')
          .update({
            is_insured: true,
            insurance_declared_value: update.declaredValue,
            insurance_reviewed_at: new Date().toISOString(),
          })
          .eq('id', update.id)
          .eq('user_id', user.id);
      }

      await Promise.all([fetchInsuredEquipment(), fetchUnreviewedEquipment()]);

      toast({
        title: "Import applied",
        description: `Updated settings and ${equipmentUpdates.length} equipment item(s).`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to apply import",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [user, saveSettings, fetchInsuredEquipment, fetchUnreviewedEquipment, toast]);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchSettings(),
        fetchChangeLogs(),
        fetchInsuredEquipment(),
        fetchUnreviewedEquipment(),
      ]);
      setLoading(false);
    };

    if (user) {
      fetchAll();
    }
  }, [user, fetchSettings, fetchChangeLogs, fetchInsuredEquipment, fetchUnreviewedEquipment]);

  return {
    loading,
    settings,
    changeLogs,
    insuredEquipment,
    unreviewedEquipment,
    metrics,
    pendingChanges: changeLogs.filter(c => c.status === 'pending'),
    saveSettings,
    markAsInsured,
    excludeFromInsurance,
    updateChangeStatus,
    markAllAsSent,
    closeTheLoop,
    applyPolicyImport,
    refetch: async () => {
      await Promise.all([
        fetchSettings(),
        fetchChangeLogs(),
        fetchInsuredEquipment(),
        fetchUnreviewedEquipment(),
      ]);
    },
  };
}
