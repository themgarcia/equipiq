import { SubscriptionPlan } from '@/hooks/useSubscription';
import {
  InsuranceSettings,
  InsuranceChangeLog,
  InsuredEquipment,
  InsuranceMetrics,
} from '@/types/insurance';
import { addDays, format } from 'date-fns';

// Calculate dynamic renewal date (30-45 days from now based on plan)
function getRenewalDate(daysFromNow: number): string {
  return format(addDays(new Date(), daysFromNow), 'yyyy-MM-dd');
}

// Demo Insurance Settings per plan
const DEMO_INSURANCE_SETTINGS: Record<SubscriptionPlan, InsuranceSettings> = {
  free: {
    id: 'demo-settings-free',
    userId: 'demo-user',
    brokerName: 'John Smith',
    brokerCompany: 'ABC Insurance Brokerage',
    brokerEmail: 'jsmith@abcinsurance.com',
    brokerPhone: '(555) 123-4567',
    policyNumber: 'EQ-2025-001234',
    policyRenewalDate: getRenewalDate(45),
    renewalReminderDays: 30,
    renewalConfirmedAt: null,
    lastPreRenewalReminderAt: null,
    lastPostRenewalReminderAt: null,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  professional: {
    id: 'demo-settings-pro',
    userId: 'demo-user',
    brokerName: 'John Smith',
    brokerCompany: 'ABC Insurance Brokerage',
    brokerEmail: 'jsmith@abcinsurance.com',
    brokerPhone: '(555) 123-4567',
    policyNumber: 'EQ-2025-001234',
    policyRenewalDate: getRenewalDate(30),
    renewalReminderDays: 30,
    renewalConfirmedAt: null,
    lastPreRenewalReminderAt: null,
    lastPostRenewalReminderAt: null,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  business: {
    id: 'demo-settings-biz',
    userId: 'demo-user',
    brokerName: 'John Smith',
    brokerCompany: 'ABC Insurance Brokerage',
    brokerEmail: 'jsmith@abcinsurance.com',
    brokerPhone: '(555) 123-4567',
    policyNumber: 'EQ-2025-001234',
    policyRenewalDate: getRenewalDate(30),
    renewalReminderDays: 30,
    renewalConfirmedAt: null,
    lastPreRenewalReminderAt: null,
    lastPostRenewalReminderAt: null,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
  beta: {
    id: 'demo-settings-beta',
    userId: 'demo-user',
    brokerName: 'John Smith',
    brokerCompany: 'ABC Insurance Brokerage',
    brokerEmail: 'jsmith@abcinsurance.com',
    brokerPhone: '(555) 123-4567',
    policyNumber: 'EQ-2025-001234',
    policyRenewalDate: getRenewalDate(30),
    renewalReminderDays: 30,
    renewalConfirmedAt: null,
    lastPreRenewalReminderAt: null,
    lastPostRenewalReminderAt: null,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z',
  },
};

// Demo Insured Equipment - uses equipment from demoEquipmentData
const DEMO_INSURED_EQUIPMENT: Record<SubscriptionPlan, InsuredEquipment[]> = {
  free: [
    {
      id: 'demo-1',
      name: '2022 Kubota KX040-4',
      category: 'Construction — Excavator — Compact',
      serialVin: 'DEMO123456',
      declaredValue: 55000,
      purchasePrice: 58000,
      financingType: 'financed',
      insuranceNotes: 'Primary excavator - full coverage',
      insuranceReviewedAt: '2024-11-15T00:00:00Z',
    },
    {
      id: 'demo-3',
      name: '2021 Bobcat S570',
      category: 'Construction — Loader — Skid Steer',
      serialVin: 'DEMO345678',
      declaredValue: 38000,
      purchasePrice: 42000,
      financingType: 'owned',
      insuranceNotes: null,
      insuranceReviewedAt: '2024-11-15T00:00:00Z',
    },
  ],
  professional: [
    {
      id: 'demo-1',
      name: '2022 Kubota KX040-4',
      category: 'Construction — Excavator — Compact',
      serialVin: 'DEMO123456',
      declaredValue: 55000,
      purchasePrice: 58000,
      financingType: 'financed',
      insuranceNotes: 'Primary excavator - full coverage',
      insuranceReviewedAt: '2024-11-15T00:00:00Z',
    },
    {
      id: 'demo-2',
      name: '2023 Ford F-250 XL',
      category: 'Fleet — Truck — 3/4 Ton',
      serialVin: 'DEMO789012',
      declaredValue: 48000,
      purchasePrice: 52000,
      financingType: 'leased',
      insuranceNotes: 'Company vehicle - collision + comprehensive',
      insuranceReviewedAt: '2024-11-20T00:00:00Z',
    },
    {
      id: 'demo-3',
      name: '2021 Bobcat S570',
      category: 'Construction — Loader — Skid Steer',
      serialVin: 'DEMO345678',
      declaredValue: 38000,
      purchasePrice: 42000,
      financingType: 'owned',
      insuranceNotes: null,
      insuranceReviewedAt: '2024-11-15T00:00:00Z',
    },
    {
      id: 'demo-5',
      name: '2020 CAT 320',
      category: 'Construction — Excavator — Standard',
      serialVin: null,
      declaredValue: 175000,
      purchasePrice: 185000,
      financingType: 'financed',
      insuranceNotes: 'High-value asset - verify coverage limits',
      insuranceReviewedAt: '2024-12-01T00:00:00Z',
    },
  ],
  business: [
    {
      id: 'demo-1',
      name: '2022 Kubota KX040-4',
      category: 'Construction — Excavator — Compact',
      serialVin: 'DEMO123456',
      declaredValue: 55000,
      purchasePrice: 58000,
      financingType: 'financed',
      insuranceNotes: 'Primary excavator - full coverage',
      insuranceReviewedAt: '2024-11-15T00:00:00Z',
    },
    {
      id: 'demo-2',
      name: '2023 Ford F-250 XL',
      category: 'Fleet — Truck — 3/4 Ton',
      serialVin: 'DEMO789012',
      declaredValue: 48000,
      purchasePrice: 52000,
      financingType: 'leased',
      insuranceNotes: 'Company vehicle - collision + comprehensive',
      insuranceReviewedAt: '2024-11-20T00:00:00Z',
    },
    {
      id: 'demo-3',
      name: '2021 Bobcat S570',
      category: 'Construction — Loader — Skid Steer',
      serialVin: 'DEMO345678',
      declaredValue: 38000,
      purchasePrice: 42000,
      financingType: 'owned',
      insuranceNotes: null,
      insuranceReviewedAt: '2024-11-15T00:00:00Z',
    },
    {
      id: 'demo-5',
      name: '2020 CAT 320',
      category: 'Construction — Excavator — Standard',
      serialVin: null,
      declaredValue: 175000,
      purchasePrice: 185000,
      financingType: 'financed',
      insuranceNotes: 'High-value asset - verify coverage limits',
      insuranceReviewedAt: '2024-12-01T00:00:00Z',
    },
    {
      id: 'demo-6',
      name: '2021 John Deere 310SL',
      category: 'Construction — Loader — Backhoe',
      serialVin: null,
      declaredValue: 90000,
      purchasePrice: 95000,
      financingType: 'financed',
      insuranceNotes: null,
      insuranceReviewedAt: '2024-12-01T00:00:00Z',
    },
  ],
  beta: [
    // Beta uses same demo data as business
    {
      id: 'demo-1',
      name: '2022 Kubota KX040-4',
      category: 'Construction — Excavator — Compact',
      serialVin: 'DEMO123456',
      declaredValue: 55000,
      purchasePrice: 58000,
      financingType: 'financed',
      insuranceNotes: 'Primary excavator - full coverage',
      insuranceReviewedAt: '2024-11-15T00:00:00Z',
    },
  ],
};

// Demo Unreviewed Equipment
const DEMO_UNREVIEWED_EQUIPMENT: Record<SubscriptionPlan, InsuredEquipment[]> = {
  free: [
    {
      id: 'demo-4',
      name: '2023 Big Tex 14ET',
      category: 'Fleet — Trailer — Flat Deck',
      serialVin: 'DEMO901234',
      declaredValue: 8500,
      purchasePrice: 8500,
      financingType: 'owned',
      insuranceNotes: null,
      insuranceReviewedAt: null,
    },
  ],
  professional: [
    {
      id: 'demo-4',
      name: '2023 Big Tex 14ET',
      category: 'Fleet — Trailer — Flat Deck',
      serialVin: 'DEMO901234',
      declaredValue: 8500,
      purchasePrice: 8500,
      financingType: 'owned',
      insuranceNotes: null,
      insuranceReviewedAt: null,
    },
  ],
  business: [
    {
      id: 'demo-4',
      name: '2023 Big Tex 14ET',
      category: 'Fleet — Trailer — Flat Deck',
      serialVin: 'DEMO901234',
      declaredValue: 8500,
      purchasePrice: 8500,
      financingType: 'owned',
      insuranceNotes: null,
      insuranceReviewedAt: null,
    },
  ],
  beta: [
    {
      id: 'demo-4',
      name: '2023 Big Tex 14ET',
      category: 'Fleet — Trailer — Flat Deck',
      serialVin: 'DEMO901234',
      declaredValue: 8500,
      purchasePrice: 8500,
      financingType: 'owned',
      insuranceNotes: null,
      insuranceReviewedAt: null,
    },
  ],
};

// Demo Change Logs
const DEMO_CHANGE_LOGS: Record<SubscriptionPlan, InsuranceChangeLog[]> = {
  free: [
    {
      id: 'demo-change-1',
      userId: 'demo-user',
      equipmentId: 'demo-1',
      equipmentName: '2022 Kubota KX040-4',
      changeType: 'added',
      reason: 'new_equipment',
      previousDeclaredValue: null,
      newDeclaredValue: 55000,
      effectiveDate: format(addDays(new Date(), -5), 'yyyy-MM-dd'),
      status: 'pending',
      sentAt: null,
      confirmedAt: null,
      createdAt: format(addDays(new Date(), -5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
  ],
  professional: [
    {
      id: 'demo-change-1',
      userId: 'demo-user',
      equipmentId: 'demo-5',
      equipmentName: '2020 CAT 320',
      changeType: 'added',
      reason: 'new_equipment',
      previousDeclaredValue: null,
      newDeclaredValue: 175000,
      effectiveDate: format(addDays(new Date(), -3), 'yyyy-MM-dd'),
      status: 'pending',
      sentAt: null,
      confirmedAt: null,
      createdAt: format(addDays(new Date(), -3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
    {
      id: 'demo-change-2',
      userId: 'demo-user',
      equipmentId: 'demo-3',
      equipmentName: '2021 Bobcat S570',
      changeType: 'value_changed',
      reason: 'manual',
      previousDeclaredValue: 42000,
      newDeclaredValue: 38000,
      effectiveDate: format(addDays(new Date(), -10), 'yyyy-MM-dd'),
      status: 'sent',
      sentAt: format(addDays(new Date(), -8), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      confirmedAt: null,
      createdAt: format(addDays(new Date(), -10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
  ],
  business: [
    {
      id: 'demo-change-1',
      userId: 'demo-user',
      equipmentId: 'demo-5',
      equipmentName: '2020 CAT 320',
      changeType: 'added',
      reason: 'new_equipment',
      previousDeclaredValue: null,
      newDeclaredValue: 175000,
      effectiveDate: format(addDays(new Date(), -3), 'yyyy-MM-dd'),
      status: 'pending',
      sentAt: null,
      confirmedAt: null,
      createdAt: format(addDays(new Date(), -3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
    {
      id: 'demo-change-2',
      userId: 'demo-user',
      equipmentId: 'demo-6',
      equipmentName: '2021 John Deere 310SL',
      changeType: 'added',
      reason: 'new_equipment',
      previousDeclaredValue: null,
      newDeclaredValue: 90000,
      effectiveDate: format(addDays(new Date(), -2), 'yyyy-MM-dd'),
      status: 'pending',
      sentAt: null,
      confirmedAt: null,
      createdAt: format(addDays(new Date(), -2), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
    {
      id: 'demo-change-3',
      userId: 'demo-user',
      equipmentId: 'demo-3',
      equipmentName: '2021 Bobcat S570',
      changeType: 'value_changed',
      reason: 'manual',
      previousDeclaredValue: 42000,
      newDeclaredValue: 38000,
      effectiveDate: format(addDays(new Date(), -10), 'yyyy-MM-dd'),
      status: 'sent',
      sentAt: format(addDays(new Date(), -8), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      confirmedAt: null,
      createdAt: format(addDays(new Date(), -10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
    {
      id: 'demo-change-4',
      userId: 'demo-user',
      equipmentId: null,
      equipmentName: '2018 Vermeer BC1000XL',
      changeType: 'removed',
      reason: 'sold',
      previousDeclaredValue: 35000,
      newDeclaredValue: null,
      effectiveDate: format(addDays(new Date(), -30), 'yyyy-MM-dd'),
      status: 'confirmed',
      sentAt: format(addDays(new Date(), -28), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      confirmedAt: format(addDays(new Date(), -25), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
      createdAt: format(addDays(new Date(), -30), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
  ],
  beta: [
    // Beta uses same demo change logs as free
    {
      id: 'demo-change-1',
      userId: 'demo-user',
      equipmentId: 'demo-1',
      equipmentName: '2022 Kubota KX040-4',
      changeType: 'added',
      reason: 'new_equipment',
      previousDeclaredValue: null,
      newDeclaredValue: 55000,
      effectiveDate: format(addDays(new Date(), -5), 'yyyy-MM-dd'),
      status: 'pending',
      sentAt: null,
      confirmedAt: null,
      createdAt: format(addDays(new Date(), -5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    },
  ],
};

// Calculate metrics for a plan
function calculateMetrics(plan: SubscriptionPlan): InsuranceMetrics {
  const insured = DEMO_INSURED_EQUIPMENT[plan];
  const unreviewed = DEMO_UNREVIEWED_EQUIPMENT[plan];
  const changes = DEMO_CHANGE_LOGS[plan];
  const settings = DEMO_INSURANCE_SETTINGS[plan];

  const daysToRenewal = settings.policyRenewalDate
    ? Math.ceil((new Date(settings.policyRenewalDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    totalInsuredCount: insured.length,
    totalDeclaredValue: insured.reduce((sum, e) => sum + e.declaredValue, 0),
    pendingChangesCount: changes.filter(c => c.status === 'pending').length,
    daysToRenewal,
    unreviewedCount: unreviewed.length,
  };
}

export interface DemoInsuranceData {
  settings: InsuranceSettings;
  changeLogs: InsuranceChangeLog[];
  insuredEquipment: InsuredEquipment[];
  unreviewedEquipment: InsuredEquipment[];
  metrics: InsuranceMetrics;
}

export function getDemoInsuranceData(plan: SubscriptionPlan): DemoInsuranceData {
  return {
    settings: DEMO_INSURANCE_SETTINGS[plan],
    changeLogs: DEMO_CHANGE_LOGS[plan],
    insuredEquipment: DEMO_INSURED_EQUIPMENT[plan],
    unreviewedEquipment: DEMO_UNREVIEWED_EQUIPMENT[plan],
    metrics: calculateMetrics(plan),
  };
}
