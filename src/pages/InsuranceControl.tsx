import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useInsurance } from '@/hooks/useInsurance';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceMetricsRow } from '@/components/insurance/InsuranceMetricsRow';
import { InsuredRegisterTab } from '@/components/insurance/InsuredRegisterTab';
import { PendingChangesTab } from '@/components/insurance/PendingChangesTab';
import { UnreviewedAssetsTab } from '@/components/insurance/UnreviewedAssetsTab';
import { InsuranceSettingsTab } from '@/components/insurance/InsuranceSettingsTab';

export default function InsuranceControl() {
  const { user } = useAuth();
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
  } = useInsurance();

  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    companyName: string;
    email: string;
  } | null>(null);

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
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Insurance Control</h1>
            <p className="text-muted-foreground">
              Manage insured equipment and communicate changes to your broker
            </p>
          </div>
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
              <TabsList>
                <TabsTrigger value="register">
                  Insured Register
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
      </div>
    </Layout>
  );
}
