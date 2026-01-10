// Insurance Control Types

export type InsuranceChangeType = 'added' | 'removed' | 'value_changed';
export type InsuranceChangeReason = 'sold' | 'retired' | 'lost' | 'traded' | 'new_equipment' | 'manual';
export type InsuranceChangeStatus = 'pending' | 'sent' | 'confirmed';

export interface InsuranceChangeLog {
  id: string;
  userId: string;
  equipmentId: string | null;
  equipmentName: string;
  changeType: InsuranceChangeType;
  reason: InsuranceChangeReason;
  previousDeclaredValue: number | null;
  newDeclaredValue: number | null;
  effectiveDate: string;
  status: InsuranceChangeStatus;
  sentAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface InsuranceSettings {
  id: string;
  userId: string;
  brokerName: string | null;
  brokerCompany: string | null;
  brokerEmail: string | null;
  brokerPhone: string | null;
  policyNumber: string | null;
  policyRenewalDate: string | null;
  renewalReminderDays: number;
  renewalConfirmedAt: string | null;
  lastPreRenewalReminderAt: string | null;
  lastPostRenewalReminderAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InsuredEquipment {
  id: string;
  name: string;
  category: string;
  serialVin: string | null;
  declaredValue: number;
  purchasePrice: number;
  financingType: string;
  insuranceNotes: string | null;
  insuranceReviewedAt: string | null;
}

export interface InsuranceMetrics {
  totalInsuredCount: number;
  totalDeclaredValue: number;
  pendingChangesCount: number;
  daysToRenewal: number | null;
  unreviewedCount: number;
}

// Helper to convert DB record to InsuranceChangeLog
export function dbToInsuranceChangeLog(record: any): InsuranceChangeLog {
  return {
    id: record.id,
    userId: record.user_id,
    equipmentId: record.equipment_id,
    equipmentName: record.equipment_name,
    changeType: record.change_type,
    reason: record.reason,
    previousDeclaredValue: record.previous_declared_value ? Number(record.previous_declared_value) : null,
    newDeclaredValue: record.new_declared_value ? Number(record.new_declared_value) : null,
    effectiveDate: record.effective_date,
    status: record.status,
    sentAt: record.sent_at,
    confirmedAt: record.confirmed_at,
    createdAt: record.created_at,
  };
}

// Helper to convert DB record to InsuranceSettings
export function dbToInsuranceSettings(record: any): InsuranceSettings {
  return {
    id: record.id,
    userId: record.user_id,
    brokerName: record.broker_name,
    brokerCompany: record.broker_company,
    brokerEmail: record.broker_email,
    brokerPhone: record.broker_phone,
    policyNumber: record.policy_number,
    policyRenewalDate: record.policy_renewal_date,
    renewalReminderDays: record.renewal_reminder_days,
    renewalConfirmedAt: record.renewal_confirmed_at,
    lastPreRenewalReminderAt: record.last_pre_renewal_reminder_at,
    lastPostRenewalReminderAt: record.last_post_renewal_reminder_at,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

// Types for policy document import
export interface ExtractedBrokerInfo {
  name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
}

export interface ExtractedPolicyInfo {
  policyNumber: string | null;
  effectiveDate: string | null;
  renewalDate: string | null;
}

export interface ExtractedScheduledEquipment {
  description: string;
  make: string | null;
  model: string | null;
  year: number | null;
  serialVin: string | null;
  declaredValue: number | null;
  coverageNotes: string | null;
  confidence: 'high' | 'medium' | 'low';
}

export interface ExtractedPolicyData {
  brokerInfo: ExtractedBrokerInfo;
  policyInfo: ExtractedPolicyInfo;
  scheduledEquipment: ExtractedScheduledEquipment[];
}
