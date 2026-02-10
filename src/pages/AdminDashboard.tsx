import { useState, useEffect, useCallback } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Package, DollarSign, TrendingUp, Wand2, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserActivityTab } from '@/components/admin/UserActivityTab';
import { ErrorLogTab } from '@/components/admin/ErrorLogTab';
import { EntrySourcesTab } from '@/components/admin/EntrySourcesTab';
import { UsersTab, UserStats } from '@/components/admin/UsersTab';
import { FeedbackTab, FeedbackItem } from '@/components/admin/FeedbackTab';
import { AdminActivityTab, ActivityLogEntry } from '@/components/admin/AdminActivityTab';
import { MarketInsightsTab, MarketInsight } from '@/components/admin/MarketInsightsTab';
import { EquipmentDataTab, CategoryStats, FinancingStats } from '@/components/admin/EquipmentDataTab';
import { FinancingTab } from '@/components/admin/FinancingTab';
import { MarketingTab } from '@/components/admin/MarketingTab';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useDeviceType } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MobileTabSelect } from '@/components/MobileTabSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { categoryDefaults } from '@/data/categoryDefaults';
import { 
  getIndustryLabel, 
  getFieldEmployeesLabel, 
  getAnnualRevenueLabel, 
  getRegionLabel,
  getReferralSourceLabel,
} from '@/data/signupOptions';

// Build grouped categories for the dropdown
const v3Categories = categoryDefaults.map(c => c.category);
const categoryByDivision = categoryDefaults.reduce((acc, c) => {
  if (!acc[c.division]) acc[c.division] = [];
  acc[c.division].push(c.category);
  return acc;
}, {} as Record<string, string[]>);

export default function AdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [financingStats, setFinancingStats] = useState<FinancingStats[]>([]);
  const [industryStats, setIndustryStats] = useState<MarketInsight[]>([]);
  const [companySizeStats, setCompanySizeStats] = useState<MarketInsight[]>([]);
  const [revenueStats, setRevenueStats] = useState<MarketInsight[]>([]);
  const [regionStats, setRegionStats] = useState<MarketInsight[]>([]);
  const [referralSourceStats, setReferralSourceStats] = useState<MarketInsight[]>([]);
  const [totals, setTotals] = useState({
    totalUsers: 0,
    totalEquipment: 0,
    totalFleetValue: 0,
    avgEquipmentPerUser: 0,
  });
  const [loading, setLoading] = useState(true);
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loadingActivityLog, setLoadingActivityLog] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [migrationOpen, setMigrationOpen] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [migrationResults, setMigrationResults] = useState<Array<{ id: string; name: string; oldCategory: string; newCategory: string }> | null>(null);
  const [migrationMessage, setMigrationMessage] = useState('');
  const [uncategorizedItems, setUncategorizedItems] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [updatedIds, setUpdatedIds] = useState<Set<string>>(new Set());
  const [loadingUncategorized, setLoadingUncategorized] = useState(false);
  const { toast } = useToast();
  const deviceType = useDeviceType();
  const isMobileOrTablet = deviceType !== 'desktop';
  const { fetchProfiles } = useUserProfiles();

  // Helper function to log admin actions
  const logAdminAction = async (
    actionType: string,
    targetUserId: string,
    targetUserEmail: string,
    details?: Record<string, any>
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('admin_activity_log').insert({
        action_type: actionType,
        target_user_id: targetUserId,
        target_user_email: targetUserEmail,
        performed_by_user_id: user.id,
        performed_by_email: user.email || 'Unknown',
        details: details || null,
      });

      fetchActivityLog();
    } catch (error) {
      console.error('Failed to log admin action:', error);
    }
  };

  const fetchActivityLog = async () => {
    setLoadingActivityLog(true);
    try {
      const { data, error } = await supabase
        .from('admin_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivityLog(data || []);
      
      const targetUserIds = (data || []).map(entry => entry.target_user_id);
      const performedByUserIds = (data || []).map(entry => entry.performed_by_user_id);
      const allUserIds = [...new Set([...targetUserIds, ...performedByUserIds])];
      await fetchProfiles(allUserIds);
    } catch (error) {
      console.error('Failed to fetch activity log:', error);
    } finally {
      setLoadingActivityLog(false);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    setDeletingUser(userId);
    try {
      const userToDelete = userStats.find(u => u.id === userId);
      const userEmail = userToDelete?.email || userName;

      const { error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userIdToDelete: userId },
      });

      if (error) throw error;

      await logAdminAction('user_deleted', userId, userEmail, {
        deleted_user_name: userName,
      });

      setUserStats(prev => prev.filter(user => user.id !== userId));
      toast({
        title: "User deleted",
        description: `${userName} has been removed from the platform.`,
      });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Failed to delete user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingUser(null);
    }
  };

  useEffect(() => {
    fetchAdminData();
    fetchAllFeedback();
    fetchActivityLog();
  }, []);

  const fetchAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, company_name, industry, field_employees, annual_revenue, region, years_in_business, company_website, referral_source');
      
      if (profilesError) throw profilesError;

      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status, billing_interval, beta_access, beta_access_granted_at, stripe_subscription_id');
      
      if (subscriptionsError) throw subscriptionsError;

      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');
      
      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      const subscriptionMap = new Map<string, { 
        plan: string; 
        status: string; 
        billingInterval: string | null;
        betaAccess: boolean; 
        betaAccessGrantedAt: string | null;
        isPaidSubscription: boolean;
      }>();
      subscriptions?.forEach(sub => {
        subscriptionMap.set(sub.user_id, {
          plan: sub.plan || 'free',
          status: sub.status || 'active',
          billingInterval: sub.billing_interval,
          betaAccess: sub.beta_access || false,
          betaAccessGrantedAt: sub.beta_access_granted_at,
          isPaidSubscription: !!sub.stripe_subscription_id,
        });
      });

      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');

      if (equipmentError) throw equipmentError;

      const userStatsMap = new Map<string, UserStats>();
      
      profiles?.forEach(profile => {
        const subInfo = subscriptionMap.get(profile.id);
        userStatsMap.set(profile.id, {
          id: profile.id,
          email: '',
          fullName: profile.full_name || 'Unknown',
          createdAt: profile.created_at,
          equipmentCount: 0,
          totalValue: 0,
          companyName: profile.company_name,
          industry: profile.industry,
          fieldEmployees: profile.field_employees,
          annualRevenue: profile.annual_revenue,
          region: profile.region,
          betaAccess: subInfo?.betaAccess || false,
          betaAccessGrantedAt: subInfo?.betaAccessGrantedAt || null,
          subscriptionPlan: subInfo?.plan || 'free',
          subscriptionStatus: subInfo?.status || 'active',
          billingInterval: subInfo?.billingInterval || null,
          isPaidSubscription: subInfo?.isPaidSubscription || false,
          isAdmin: adminUserIds.has(profile.id),
        });
      });

      equipment?.forEach(item => {
        const userStat = userStatsMap.get(item.user_id);
        if (userStat) {
          userStat.equipmentCount++;
          userStat.totalValue += Number(item.purchase_price) + Number(item.sales_tax) + 
                                  Number(item.freight_setup) + Number(item.other_cap_ex);
        }
      });

      const userStatsArray = Array.from(userStatsMap.values());

      // Calculate market insights
      const industryMap = new Map<string, number>();
      const sizeMap = new Map<string, number>();
      const revenueMap = new Map<string, number>();
      const regionMap = new Map<string, number>();
      const referralSourceMap = new Map<string, number>();

      profiles?.forEach(profile => {
        if (profile.industry) {
          industryMap.set(profile.industry, (industryMap.get(profile.industry) || 0) + 1);
        }
        if (profile.field_employees) {
          sizeMap.set(profile.field_employees, (sizeMap.get(profile.field_employees) || 0) + 1);
        }
        if (profile.annual_revenue) {
          revenueMap.set(profile.annual_revenue, (revenueMap.get(profile.annual_revenue) || 0) + 1);
        }
        if (profile.region) {
          regionMap.set(profile.region, (regionMap.get(profile.region) || 0) + 1);
        }
        if (profile.referral_source) {
          referralSourceMap.set(profile.referral_source, (referralSourceMap.get(profile.referral_source) || 0) + 1);
        }
      });

      setIndustryStats(Array.from(industryMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getIndustryLabel(name),
      })).sort((a, b) => b.value - a.value));

      setCompanySizeStats(Array.from(sizeMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getFieldEmployeesLabel(name),
      })));

      setRevenueStats(Array.from(revenueMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getAnnualRevenueLabel(name),
      })));

      setRegionStats(Array.from(regionMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getRegionLabel(name),
      })).sort((a, b) => b.value - a.value).slice(0, 10));

      setReferralSourceStats(Array.from(referralSourceMap.entries()).map(([name, value]) => ({
        name,
        value,
        label: getReferralSourceLabel(name),
      })).sort((a, b) => b.value - a.value));

      // Calculate category stats
      const categoryMap = new Map<string, CategoryStats>();
      const currentYear = new Date().getFullYear();

      equipment?.forEach(item => {
        const existing = categoryMap.get(item.category) || {
          category: item.category,
          count: 0,
          avgPurchasePrice: 0,
          totalValue: 0,
          avgAge: 0,
        };
        
        const itemValue = Number(item.purchase_price) + Number(item.sales_tax) + 
                          Number(item.freight_setup) + Number(item.other_cap_ex);
        
        existing.count++;
        existing.totalValue += itemValue;
        existing.avgAge += (currentYear - item.year);
        
        categoryMap.set(item.category, existing);
      });

      const categoryStatsArray = Array.from(categoryMap.values()).map(cat => ({
        ...cat,
        avgPurchasePrice: cat.totalValue / cat.count,
        avgAge: cat.avgAge / cat.count,
      }));

      // Calculate financing stats
      const financingMap = new Map<string, FinancingStats>();
      
      equipment?.forEach(item => {
        const type = item.financing_type || 'owned';
        const existing = financingMap.get(type) || {
          type,
          count: 0,
          totalAmount: 0,
          totalPurchaseValue: 0,
        };
        
        const itemValue = Number(item.purchase_price) + Number(item.sales_tax) + 
                          Number(item.freight_setup) + Number(item.other_cap_ex);
        
        existing.count++;
        existing.totalPurchaseValue += itemValue;
        
        if (type !== 'owned') {
          let financedValue = Number(item.financed_amount) || 0;
          if (financedValue === 0 && Number(item.monthly_payment) > 0) {
            financedValue = Number(item.monthly_payment) * Number(item.term_months);
          }
          existing.totalAmount += financedValue;
        }
        
        financingMap.set(type, existing);
      });

      const financingStatsArray = Array.from(financingMap.values());

      // Calculate totals
      const totalUsers = profiles?.length || 0;
      const totalEquipment = equipment?.length || 0;
      const totalFleetValue = equipment?.reduce((sum, item) => 
        sum + Number(item.purchase_price) + Number(item.sales_tax) + 
        Number(item.freight_setup) + Number(item.other_cap_ex), 0) || 0;

      setUserStats(userStatsArray);
      setCategoryStats(categoryStatsArray);
      setFinancingStats(financingStatsArray);
      setTotals({
        totalUsers,
        totalEquipment,
        totalFleetValue,
        avgEquipmentPerUser: totalUsers > 0 ? totalEquipment / totalUsers : 0,
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllFeedback = async () => {
    try {
      const { data: feedback, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const feedbackIds = feedback?.map(f => f.id) || [];
      const { data: replies, error: repliesError } = await supabase
        .from('feedback_replies')
        .select('*')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      const feedbackWithUsers = feedback?.map(fb => {
        const user = userStats.find(u => u.id === fb.user_id);
        const feedbackReplies = replies?.filter(r => r.feedback_id === fb.id) || [];
        return {
          ...fb,
          userName: user?.fullName || 'Unknown',
          userEmail: user?.companyName || '',
          replies: feedbackReplies,
        };
      }) || [];

      setFeedbackList(feedbackWithUsers);
    } catch (error) {
      console.error('Error fetching feedback:', error);
    }
  };

  const updateUserPlan = async (userId: string, newPlan: string) => {
    setChangingPlan(userId);
    try {
      const targetUser = userStats.find(u => u.id === userId);
      const oldPlan = targetUser?.subscriptionPlan || 'unknown';

      const upsertData = {
        user_id: userId,
        plan: newPlan,
        status: 'active',
        stripe_customer_id: null,
        stripe_subscription_id: null,
        billing_interval: null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('subscriptions')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (error) throw error;

      await logAdminAction('plan_changed', userId, targetUser?.email || 'Unknown', {
        old_plan: oldPlan,
        new_plan: newPlan
      });

      setUserStats(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, subscriptionPlan: newPlan, billingInterval: null, isPaidSubscription: false }
          : user
      ));

      toast({
        title: "Plan updated",
        description: `User plan changed to ${newPlan}.`,
      });
    } catch (error: any) {
      console.error('Error updating user plan:', error);
      toast({
        title: "Failed to update plan",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChangingPlan(null);
    }
  };

  const toggleAdminRole = async (userId: string, makeAdmin: boolean) => {
    setTogglingAdmin(userId);
    try {
      const targetUser = userStats.find(u => u.id === userId);

      if (makeAdmin) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      }

      await logAdminAction(
        makeAdmin ? 'admin_granted' : 'admin_revoked',
        userId,
        targetUser?.email || 'Unknown'
      );

      setUserStats(prev => prev.map(user => 
        user.id === userId ? { ...user, isAdmin: makeAdmin } : user
      ));

      toast({
        title: makeAdmin ? "Admin access granted" : "Admin access revoked",
        description: makeAdmin 
          ? "User now has full administrative privileges."
          : "User has been removed from admin role.",
      });
    } catch (error: any) {
      console.error('Error toggling admin role:', error);
      toast({
        title: "Failed to update admin role",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setTogglingAdmin(null);
    }
  };

  const runCategoryMigration = async () => {
    setMigrating(true);
    setMigrationResults(null);
    setMigrationMessage('');
    setUpdatedIds(new Set());
    try {
      const { data, error } = await supabase.functions.invoke('migrate-categories');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMigrationResults(data.results || []);
      setMigrationMessage(data.message || 'Migration complete');
      toast({
        title: "Category migration complete",
        description: data.message,
      });
      // Auto-fetch uncategorized after migration
      fetchUncategorizedItems();
    } catch (error: any) {
      console.error('Migration error:', error);
      toast({
        title: "Migration failed",
        description: error.message,
        variant: "destructive",
      });
      setMigrationMessage(`Error: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const fetchUncategorizedItems = useCallback(async () => {
    setLoadingUncategorized(true);
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('id, name, category')
        .not('category', 'in', `(${v3Categories.map(c => `"${c}"`).join(',')})`);
      if (error) throw error;
      setUncategorizedItems(data || []);
    } catch (error) {
      console.error('Error fetching uncategorized items:', error);
    } finally {
      setLoadingUncategorized(false);
    }
  }, []);

  const handleCategoryOverride = async (itemId: string, newCategory: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ category: newCategory })
        .eq('id', itemId);
      if (error) throw error;
      
      setUpdatedIds(prev => new Set(prev).add(itemId));
      
      // Update migration results if present
      setMigrationResults(prev => prev?.map(r => 
        r.id === itemId ? { ...r, newCategory } : r
      ) || null);
      
      // Remove from uncategorized if it was there
      setUncategorizedItems(prev => prev.filter(item => item.id !== itemId));
      
      toast({ title: "Category updated" });
    } catch (error: any) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading admin data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform analytics and user management</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMigrationOpen(true)}
            className="shrink-0"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Migrate Categories
          </Button>
        </div>

{/* Category Migration Dialog */}
        <Dialog open={migrationOpen} onOpenChange={(open) => {
          setMigrationOpen(open);
          if (open && !migrationResults) fetchUncategorizedItems();
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Category Migration</DialogTitle>
              <DialogDescription>
                Re-categorize equipment into the v3 taxonomy. You can override any assignment using the dropdowns.
              </DialogDescription>
            </DialogHeader>

            {!migrationResults && !migrating && (
              <div className="space-y-4">
                {uncategorizedItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{uncategorizedItems.length} item(s) need categorization</p>
                      <Button variant="ghost" size="sm" onClick={fetchUncategorizedItems} disabled={loadingUncategorized}>
                        <RefreshCw className={`h-3 w-3 mr-1 ${loadingUncategorized ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                    </div>
                    <div className="border rounded-md overflow-auto max-h-[300px]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Current Category</TableHead>
                            <TableHead>Assign Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {uncategorizedItems.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium text-sm">{item.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{item.category}</TableCell>
                              <TableCell>
                                <Select onValueChange={(val) => handleCategoryOverride(item.id, val)}>
                                  <SelectTrigger className="h-8 w-[220px] text-xs">
                                    <SelectValue placeholder="Pick category…" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(categoryByDivision).map(([division, cats]) => (
                                      <SelectGroup key={division}>
                                        <SelectLabel className="text-xs font-bold">{division}</SelectLabel>
                                        {cats.map((cat) => (
                                          <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                        ))}
                                      </SelectGroup>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                {uncategorizedItems.length === 0 && !loadingUncategorized && (
                  <p className="text-sm text-muted-foreground">All items already use v3 categories.</p>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMigrationOpen(false)}>Cancel</Button>
                  <Button onClick={runCategoryMigration}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Run AI Migration
                  </Button>
                </DialogFooter>
              </div>
            )}

            {migrating && (
              <div className="space-y-3 py-4">
                <p className="text-sm text-muted-foreground">AI is analyzing equipment and assigning categories...</p>
                <Progress value={undefined} className="animate-pulse" />
              </div>
            )}

            {migrationMessage && !migrating && (
              <p className="text-sm font-medium">{migrationMessage}</p>
            )}

            {migrationResults && migrationResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Use the dropdowns to override any AI assignment.</p>
                <div className="border rounded-md overflow-auto max-h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead>Old Category</TableHead>
                        <TableHead>New Category</TableHead>
                        <TableHead className="w-8"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrationResults.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-sm">{r.name}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{r.oldCategory}</TableCell>
                          <TableCell>
                            <Select value={r.newCategory} onValueChange={(val) => handleCategoryOverride(r.id, val)}>
                              <SelectTrigger className="h-8 w-[220px] text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(categoryByDivision).map(([division, cats]) => (
                                  <SelectGroup key={division}>
                                    <SelectLabel className="text-xs font-bold">{division}</SelectLabel>
                                    {cats.map((cat) => (
                                      <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>
                                    ))}
                                  </SelectGroup>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {updatedIds.has(r.id) && <Check className="h-4 w-4 text-primary" />}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {migrationResults && migrationResults.length === 0 && !migrating && (
              <p className="text-sm text-muted-foreground py-4">No items needed migration — all equipment already uses v3 categories.</p>
            )}
          </DialogContent>
        </Dialog>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Equipment</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.totalEquipment}</div>
              <p className="text-xs text-muted-foreground">
                {totals.avgEquipmentPerUser.toFixed(1)} avg per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Fleet Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totals.totalFleetValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categoryStats.length}</div>
              <p className="text-xs text-muted-foreground">unique categories</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {isMobileOrTablet ? (
            <MobileTabSelect
              value={activeTab}
              onValueChange={setActiveTab}
              tabs={[
                { value: 'users', label: 'Users' },
                { value: 'feedback', label: 'Feedback' },
                { value: 'activity', label: 'Admin Activity' },
                { value: 'user-activity', label: 'User Activity' },
                { value: 'errors', label: 'Errors' },
                { value: 'entry-sources', label: 'Entry Sources' },
                { value: 'market', label: 'Market Insights' },
                { value: 'categories', label: 'Equipment Data' },
                { value: 'financing', label: 'Financing' },
                { value: 'marketing', label: 'Marketing' },
              ]}
              className="w-full"
            />
          ) : (
            <TabsList className="h-auto flex-wrap justify-start gap-1">
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="activity">Admin Activity</TabsTrigger>
              <TabsTrigger value="user-activity">User Activity</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
              <TabsTrigger value="entry-sources">Entry Sources</TabsTrigger>
              <TabsTrigger value="market">Market Insights</TabsTrigger>
              <TabsTrigger value="categories">Equipment Data</TabsTrigger>
              <TabsTrigger value="financing">Financing</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
            </TabsList>
          )}

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <UsersTab
              userStats={userStats}
              setUserStats={setUserStats}
              currentUserId={currentUserId}
              updateUserPlan={updateUserPlan}
              toggleAdminRole={toggleAdminRole}
              deleteUser={deleteUser}
              changingPlan={changingPlan}
              togglingAdmin={togglingAdmin}
              deletingUser={deletingUser}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <FeedbackTab
              feedbackList={feedbackList}
              setFeedbackList={setFeedbackList}
              fetchAllFeedback={fetchAllFeedback}
              logAdminAction={logAdminAction}
            />
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <AdminActivityTab
              activityLog={activityLog}
              loadingActivityLog={loadingActivityLog}
              fetchActivityLog={fetchActivityLog}
            />
          </TabsContent>

          {/* Market Insights Tab */}
          <TabsContent value="market" className="space-y-4">
            <MarketInsightsTab
              industryStats={industryStats}
              companySizeStats={companySizeStats}
              revenueStats={revenueStats}
              regionStats={regionStats}
            />
          </TabsContent>

          {/* Categories/Equipment Data Tab */}
          <TabsContent value="categories" className="space-y-4">
            <EquipmentDataTab
              categoryStats={categoryStats}
              financingStats={financingStats}
              totalEquipment={totals.totalEquipment}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          {/* Financing Tab */}
          <TabsContent value="financing" className="space-y-4">
            <FinancingTab
              financingStats={financingStats}
              totalEquipment={totals.totalEquipment}
              formatCurrency={formatCurrency}
            />
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="space-y-4">
            <MarketingTab referralSourceStats={referralSourceStats} />
          </TabsContent>

          {/* User Activity Tab */}
          <TabsContent value="user-activity">
            <UserActivityTab />
          </TabsContent>

          {/* Error Log Tab */}
          <TabsContent value="errors">
            <ErrorLogTab />
          </TabsContent>

          {/* Entry Sources Tab */}
          <TabsContent value="entry-sources">
            <EntrySourcesTab />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
