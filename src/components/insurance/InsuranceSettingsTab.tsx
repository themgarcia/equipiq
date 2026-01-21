import { useState, useEffect } from 'react';
import { Save, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InsuranceSettings } from '@/types/insurance';
import { format, differenceInDays, parseISO } from 'date-fns';
import { CloseTheLoopModal } from './CloseTheLoopModal';

// Format phone number to (XXX) XXX-XXXX
function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  const limited = digits.slice(0, 10);
  
  if (limited.length === 0) return '';
  if (limited.length <= 3) return `(${limited}`;
  if (limited.length <= 6) return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
}

interface InsuranceSettingsTabProps {
  settings: InsuranceSettings | null;
  onSaveSettings: (updates: Partial<InsuranceSettings>) => Promise<void>;
  onCloseTheLoop: (policyNumber?: string, updates?: Partial<InsuranceSettings>) => Promise<void>;
}

export function InsuranceSettingsTab({
  settings,
  onSaveSettings,
  onCloseTheLoop,
}: InsuranceSettingsTabProps) {
  const [formData, setFormData] = useState({
    brokerName: '',
    brokerCompany: '',
    brokerEmail: '',
    brokerPhone: '',
    policyRenewalDate: '',
    renewalReminderDays: 60,
  });
  const [saving, setSaving] = useState(false);
  const [closeLoopModalOpen, setCloseLoopModalOpen] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        brokerName: settings.brokerName || '',
        brokerCompany: settings.brokerCompany || '',
        brokerEmail: settings.brokerEmail || '',
        brokerPhone: formatPhoneNumber(settings.brokerPhone || ''),
        policyRenewalDate: settings.policyRenewalDate || '',
        renewalReminderDays: settings.renewalReminderDays || 60,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSaveSettings({
        brokerName: formData.brokerName || null,
        brokerCompany: formData.brokerCompany || null,
        brokerEmail: formData.brokerEmail || null,
        brokerPhone: formData.brokerPhone || null,
        policyRenewalDate: formData.policyRenewalDate || null,
        renewalReminderDays: formData.renewalReminderDays,
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if we should show the "Close the Loop" prompt
  const showCloseLoopPrompt = settings?.policyRenewalDate && 
    differenceInDays(new Date(), parseISO(settings.policyRenewalDate)) >= 30 &&
    (!settings.renewalConfirmedAt || 
     parseISO(settings.renewalConfirmedAt) < parseISO(settings.policyRenewalDate));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Broker Contact */}
        <Card className="relative">
          <div className="absolute top-4 right-4">
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </div>
          <CardHeader className="opacity-60">
            <CardTitle>Broker Contact</CardTitle>
            <CardDescription>
              Your insurance broker's contact information for policy updates
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 opacity-60 pointer-events-none">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brokerName">Contact Name</Label>
                <Input
                  id="brokerName"
                  value={formData.brokerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, brokerName: e.target.value }))}
                  placeholder="John Smith"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brokerCompany">Company</Label>
                <Input
                  id="brokerCompany"
                  value={formData.brokerCompany}
                  onChange={(e) => setFormData(prev => ({ ...prev, brokerCompany: e.target.value }))}
                  placeholder="ABC Insurance"
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerEmail">Email</Label>
              <Input
                id="brokerEmail"
                type="email"
                value={formData.brokerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, brokerEmail: e.target.value }))}
                placeholder="john@abcinsurance.com"
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brokerPhone">Phone</Label>
              <Input
                id="brokerPhone"
                type="tel"
                value={formData.brokerPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, brokerPhone: formatPhoneNumber(e.target.value) }))}
                placeholder="(555) 123-4567"
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Policy Details */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
            <CardDescription>
              Your insurance policy information and renewal settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="policyRenewalDate">Renewal Date</Label>
                <Input
                  id="policyRenewalDate"
                  type="date"
                  value={formData.policyRenewalDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, policyRenewalDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="renewalReminderDays">Reminder (days before)</Label>
                <Input
                  id="renewalReminderDays"
                  type="number"
                  value={formData.renewalReminderDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, renewalReminderDays: parseInt(e.target.value) || 60 }))}
                  min={7}
                  max={120}
                />
              </div>
            </div>

            {settings?.renewalConfirmedAt && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    Last confirmed: {format(parseISO(settings.renewalConfirmedAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            )}

            {showCloseLoopPrompt && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning-foreground mb-3">
                  Your policy renewed on {format(parseISO(settings!.policyRenewalDate!), 'MMM d, yyyy')}. 
                  Please confirm your broker completed all changes.
                </p>
                <Button size="sm" onClick={() => setCloseLoopModalOpen(true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Close the Loop
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="lg:col-span-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <CloseTheLoopModal
        open={closeLoopModalOpen}
        onOpenChange={setCloseLoopModalOpen}
        settings={settings}
        onConfirm={onCloseTheLoop}
      />
    </>
  );
}
