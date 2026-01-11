import { useState, useEffect } from 'react';
import { ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExtractedPolicyData } from '@/types/insurance';
import { InsurancePolicyImport } from '@/components/insurance/InsurancePolicyImport';
import { InsurancePolicyImportReview } from '@/components/insurance/InsurancePolicyImportReview';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InsuranceContentSkeleton } from '@/components/PageSkeletons';
import { useInsurance } from '@/hooks/useInsurance';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipment } from '@/contexts/EquipmentContext';
import { useDeviceType } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceMetricsRow } from '@/components/insurance/InsuranceMetricsRow';
import { InsuredRegisterTab } from '@/components/insurance/InsuredRegisterTab';
import { PendingChangesTab } from '@/components/insurance/PendingChangesTab';
import { UnreviewedAssetsTab } from '@/components/insurance/UnreviewedAssetsTab';
import { InsuranceSettingsTab } from '@/components/insurance/InsuranceSettingsTab';
import { MobileTabSelect } from '@/components/MobileTabSelect';

export default function InsuranceControl() {
  const { user } = useAuth();
  const { equipment } = useEquipment();
  const deviceType = useDeviceType();
  const isMobile = deviceType === 'phone';
  const {
    loading,
    settings,
    changeLogs,
    insuredEquipment,
    unreviewedEquipment,
    metrics,
    pendingChanges,
    saveSettings,
    markAsInsured,
    excludeFromInsurance,
    updateChangeStatus,
    markAllAsSent,
    closeTheLoop,
    applyPolicyImport,
    updateInsuredEquipment,
    removeFromInsurance,
  } = useInsurance();

  const [activeTab, setActiveTab] = useState('register');
  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    companyName: string;
    email: string;
  } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [extractedPolicyData, setExtractedPolicyData] = useState<ExtractedPolicyData | null>(null);

  const tabOptions = [
    { value: 'register', label: 'Insured List' },
    { value: 'changes', label: 'Pending Changes', badge: pendingChanges.length },
    { value: 'unreviewed', label: 'Unreviewed', badge: unreviewedEquipment.length },
    { value: 'settings', label: 'Settings' },
  ];

  // Fetch user profile for email templates
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, company_name')
          .eq('id', user.id)
          .single();

        setUserProfile({
          fullName: data?.full_name || user.user_metadata?.full_name || 'User',
          companyName: data?.company_name || 'Company',
          email: user.email || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">Insurance</h1>
            <p className="text-muted-foreground mt-1">
              Manage insured equipment and communicate changes to your broker
            </p>
          </div>
          <Button variant="outline" onClick={() => setImportModalOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Import from Policy
          </Button>
        </div>

        {loading ? (
          <InsuranceContentSkeleton />
        ) : (
          <>
            {/* Metrics */}
            <InsuranceMetricsRow metrics={metrics} />

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 min-w-0">
              {isMobile ? (
                <MobileTabSelect
                  value={activeTab}
                  onValueChange={setActiveTab}
                  tabs={tabOptions}
                  className="w-full"
                />
              ) : (
                <TabsList className="h-auto flex-wrap justify-start gap-1">
                  <TabsTrigger value="register">
                    Insured List
                  </TabsTrigger>
                  <TabsTrigger value="changes" className="relative">
                    Pending Changes
                    {pendingChanges.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium bg-amber-500 text-white rounded-full">
                        {pendingChanges.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="unreviewed" className="relative">
                    Unreviewed
                    {unreviewedEquipment.length > 0 && (
                      <span className="ml-2 inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium bg-muted-foreground text-muted rounded-full">
                        {unreviewedEquipment.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
              )}

              <TabsContent value="register">
                <InsuredRegisterTab
                  equipment={insuredEquipment}
                  settings={settings}
                  userProfile={userProfile}
                  onUpdateInsurance={updateInsuredEquipment}
                  onRemoveFromInsurance={removeFromInsurance}
                />
              </TabsContent>

              <TabsContent value="changes">
                <PendingChangesTab
                  changes={pendingChanges}
                  allChanges={changeLogs}
                  settings={settings}
                  userProfile={userProfile}
                  onUpdateStatus={updateChangeStatus}
                  onMarkAllAsSent={markAllAsSent}
                />
              </TabsContent>

              <TabsContent value="unreviewed">
                <UnreviewedAssetsTab
                  equipment={unreviewedEquipment}
                  onMarkAsInsured={markAsInsured}
                  onExcludeFromInsurance={excludeFromInsurance}
                />
              </TabsContent>

              <TabsContent value="settings">
                <InsuranceSettingsTab
                  settings={settings}
                  onSaveSettings={saveSettings}
                  onCloseTheLoop={closeTheLoop}
                />
              </TabsContent>
            </Tabs>
          </>
        )}

        <InsurancePolicyImport
          open={importModalOpen}
          onOpenChange={setImportModalOpen}
          onPolicyExtracted={(data) => {
            setExtractedPolicyData(data);
            setReviewModalOpen(true);
          }}
        />

        <InsurancePolicyImportReview
          open={reviewModalOpen}
          onOpenChange={setReviewModalOpen}
          extractedData={extractedPolicyData}
          existingEquipment={equipment}
          onApplyImport={applyPolicyImport}
        />
      </div>
    </Layout>
  );
}
