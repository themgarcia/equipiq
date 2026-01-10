import { useState, useEffect } from 'react';
import { ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExtractedPolicyData } from '@/types/insurance';
import { InsurancePolicyImport } from '@/components/insurance/InsurancePolicyImport';
import { InsurancePolicyImportReview } from '@/components/insurance/InsurancePolicyImportReview';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useInsurance } from '@/hooks/useInsurance';
import { useAuth } from '@/contexts/AuthContext';
import { useEquipment } from '@/contexts/EquipmentContext';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceMetricsRow } from '@/components/insurance/InsuranceMetricsRow';
import { InsuredRegisterTab } from '@/components/insurance/InsuredRegisterTab';
import { PendingChangesTab } from '@/components/insurance/PendingChangesTab';
import { UnreviewedAssetsTab } from '@/components/insurance/UnreviewedAssetsTab';
import { InsuranceSettingsTab } from '@/components/insurance/InsuranceSettingsTab';

export default function InsuranceControl() {
  const { user } = useAuth();
  const { equipment } = useEquipment();
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
  } = useInsurance();

  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    companyName: string;
    email: string;
  } | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [extractedPolicyData, setExtractedPolicyData] = useState<ExtractedPolicyData | null>(null);

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
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="accent-line mb-4" />
            <h1 className="text-3xl font-bold">Insurance Control</h1>
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
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </div>
        ) : (
          <>
            {/* Metrics */}
            <InsuranceMetricsRow metrics={metrics} />

            {/* Tabs */}
            <Tabs defaultValue="register" className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto">
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

              <TabsContent value="register">
                <InsuredRegisterTab
                  equipment={insuredEquipment}
                  settings={settings}
                  userProfile={userProfile}
                />
              </TabsContent>

              <TabsContent value="changes">
                <PendingChangesTab
                  changes={pendingChanges}
                  allChanges={changeLogs}
                  settings={settings}
                  insuredEquipment={insuredEquipment}
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
