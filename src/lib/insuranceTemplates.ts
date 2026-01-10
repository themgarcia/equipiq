import { InsuranceChangeLog, InsuredEquipment } from '@/types/insurance';
import { format } from 'date-fns';

interface TemplateContext {
  userName: string;
  companyName: string;
  userEmail: string;
  brokerName: string;
}

/**
 * Generate a formatted change summary for broker communication
 */
export function generateChangeSummaryTemplate(
  changes: InsuranceChangeLog[],
  context: TemplateContext
): string {
  const added = changes.filter(c => c.changeType === 'added');
  const removed = changes.filter(c => c.changeType === 'removed');
  const valueChanged = changes.filter(c => c.changeType === 'value_changed');

  const addedValue = added.reduce((sum, c) => sum + (c.newDeclaredValue || 0), 0);
  const removedValue = removed.reduce((sum, c) => sum + (c.previousDeclaredValue || 0), 0);
  const netChange = addedValue - removedValue;

  let template = `Hi ${context.brokerName || 'there'},

Please update our equipment insurance policy with the following changes:

`;

  if (removed.length > 0) {
    template += `REMOVED FROM COVERAGE:\n`;
    removed.forEach(change => {
      template += `• ${change.equipmentName}\n`;
      template += `  Declared Value: $${(change.previousDeclaredValue || 0).toLocaleString()}\n`;
      template += `  Effective Date: ${format(new Date(change.effectiveDate), 'MMM d, yyyy')}\n`;
      template += `  Reason: ${formatReason(change.reason)}\n\n`;
    });
  }

  if (added.length > 0) {
    template += `ADDED TO COVERAGE:\n`;
    added.forEach(change => {
      template += `• ${change.equipmentName}\n`;
      template += `  Declared Value: $${(change.newDeclaredValue || 0).toLocaleString()}\n`;
      template += `  Effective Date: ${format(new Date(change.effectiveDate), 'MMM d, yyyy')}\n\n`;
    });
  }

  if (valueChanged.length > 0) {
    template += `VALUE CHANGES:\n`;
    valueChanged.forEach(change => {
      template += `• ${change.equipmentName}\n`;
      template += `  Previous: $${(change.previousDeclaredValue || 0).toLocaleString()}\n`;
      template += `  New: $${(change.newDeclaredValue || 0).toLocaleString()}\n`;
      template += `  Effective Date: ${format(new Date(change.effectiveDate), 'MMM d, yyyy')}\n\n`;
    });
  }

  template += `---
NET CHANGE IN DECLARED VALUE: ${netChange >= 0 ? '+' : ''}$${netChange.toLocaleString()}

Please confirm receipt and processing of these changes.

Thank you,
${context.userName}
${context.companyName}
${context.userEmail}`;

  return template;
}

/**
 * Generate a full insured equipment register for broker communication
 */
export function generateFullRegisterTemplate(
  equipment: InsuredEquipment[],
  context: TemplateContext
): string {
  const totalValue = equipment.reduce((sum, e) => sum + e.declaredValue, 0);

  let template = `Hi ${context.brokerName || 'there'},

Please find our complete insured equipment register for policy review:

INSURED EQUIPMENT (${equipment.length} items)
Total Declared Value: $${totalValue.toLocaleString()}

`;

  equipment.forEach((item, index) => {
    template += `${index + 1}. ${item.name}\n`;
    template += `   Category: ${item.category}\n`;
    if (item.serialVin) {
      template += `   Serial/VIN: ${item.serialVin}\n`;
    }
    template += `   Declared Value: $${item.declaredValue.toLocaleString()}\n`;
    template += `   Financing: ${formatFinancingType(item.financingType)}\n`;
    if (item.insuranceNotes) {
      template += `   Notes: ${item.insuranceNotes}\n`;
    }
    template += `\n`;
  });

  template += `---
Please confirm this matches your records.

Thank you,
${context.userName}
${context.companyName}
${context.userEmail}`;

  return template;
}

/**
 * Generate email subject line for change summary
 */
export function generateChangeEmailSubject(companyName: string): string {
  return `Equipment Insurance Update - ${companyName}`;
}

/**
 * Generate email subject line for full register
 */
export function generateRegisterEmailSubject(companyName: string): string {
  return `Complete Insured Equipment Register - ${companyName}`;
}

function formatReason(reason: string): string {
  const reasonMap: Record<string, string> = {
    sold: 'Equipment sold',
    retired: 'Equipment retired',
    lost: 'Equipment lost/stolen',
    traded: 'Equipment traded in',
    new_equipment: 'New acquisition',
    manual: 'Manual adjustment',
  };
  return reasonMap[reason] || reason;
}

function formatFinancingType(type: string): string {
  const typeMap: Record<string, string> = {
    owned: 'Owned outright',
    financed: 'Financed',
    leased: 'Leased',
  };
  return typeMap[type] || type;
}
