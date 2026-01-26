import { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Users, Package, DollarSign, TrendingUp, Wallet, Building2, MapPin, MessageSquare, Bug, Lightbulb, HelpCircle, MessageCircle, Trash2, Mail, Send, Megaphone, Reply, Loader2, History, ChevronRight, Check, ShieldCheck, Activity, AlertTriangle, CalendarIcon, Download, X, Search, RefreshCw, UserCheck } from 'lucide-react';
import { UserActivityTab } from '@/components/admin/UserActivityTab';
import { ErrorLogTab } from '@/components/admin/ErrorLogTab';
import { EntrySourcesTab } from '@/components/admin/EntrySourcesTab';

import { UserDisplayCell } from '@/components/admin/UserDisplayCell';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { useDeviceType } from '@/hooks/use-mobile';
import { downloadCSV } from '@/lib/csvExport';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { format, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell } from 'recharts';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MobileTabSelect } from '@/components/MobileTabSelect';
import { 
  getIndustryLabel, 
  getFieldEmployeesLabel, 
  getAnnualRevenueLabel, 
  getRegionLabel,
  getReferralSourceLabel,
} from '@/data/signupOptions';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useNavigate } from 'react-router-dom';

interface UserStats {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
  equipmentCount: number;
  totalValue: number;
  companyName: string | null;
  industry: string | null;
  fieldEmployees: string | null;
  annualRevenue: string | null;
  region: string | null;
  betaAccess: boolean;
  betaAccessGrantedAt: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  billingInterval: string | null;
  isPaidSubscription: boolean;
  isAdmin: boolean;
}

interface CategoryStats {
  category: string;
  count: number;
  avgPurchasePrice: number;
  totalValue: number;
  avgAge: number;
}

interface FinancingStats {
  type: string;
  count: number;
  totalAmount: number;
  totalPurchaseValue: number;
}

interface MarketInsight {
  name: string;
  value: number;
  label?: string;
}

interface FeedbackItem {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  description: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  userName?: string;
  userEmail?: string;
  replies?: FeedbackReply[];
}

interface FeedbackReply {
  id: string;
  feedback_id: string;
  user_id: string;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

interface ActivityLogEntry {
  id: string;
  action_type: string;
  target_user_id: string;
  target_user_email: string;
  performed_by_user_id: string;
  performed_by_email: string;
  details: any;
  created_at: string;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const categoryIcons: Record<string, React.ReactNode> = {
  bug: <Bug className="h-4 w-4" />,
  feature: <Lightbulb className="h-4 w-4" />,
  general: <MessageCircle className="h-4 w-4" />,
  question: <HelpCircle className="h-4 w-4" />,
};

const categoryLabels: Record<string, string> = {
  bug: 'Bug Report',
  feature: 'Feature Request',
  general: 'General Feedback',
  question: 'Question',
};

const statusColors: Record<string, string> = {
  new: 'bg-info/10 text-info border-info/30',
  reviewed: 'bg-warning/10 text-warning border-warning/30',
  in_progress: 'bg-accent/10 text-accent-foreground border-accent/30',
  resolved: 'bg-success/10 text-success border-success/30',
  closed: 'bg-muted text-muted-foreground border-border',
};

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
  const [togglingBeta, setTogglingBeta] = useState<string | null>(null);
  const [togglingAdmin, setTogglingAdmin] = useState<string | null>(null);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [updatingFeedback, setUpdatingFeedback] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [sendingTestEmail, setSendingTestEmail] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loadingActivityLog, setLoadingActivityLog] = useState(false);
  const [selectedUserForSheet, setSelectedUserForSheet] = useState<UserStats | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [activityStartDate, setActivityStartDate] = useState<Date | undefined>(undefined);
  const [activityEndDate, setActivityEndDate] = useState<Date | undefined>(undefined);
  const [activitySearchTerm, setActivitySearchTerm] = useState('');
  const [impersonating, setImpersonating] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const deviceType = useDeviceType();
  const isMobileOrTablet = deviceType !== 'desktop';
  const { fetchProfiles, getDisplayName } = useUserProfiles();
  const { startImpersonation } = useImpersonation();

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

      // Refresh activity log
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
      
      // Fetch user profiles for target users AND performed by users
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

  // Filter activity log
  const filteredActivityLog = activityLog.filter(entry => {
    const targetDisplayInfo = getDisplayName(entry.target_user_id);
    const performedByDisplayInfo = getDisplayName(entry.performed_by_user_id);
    
    const matchesSearch = activitySearchTerm === '' ||
      targetDisplayInfo.name.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
      (targetDisplayInfo.company?.toLowerCase().includes(activitySearchTerm.toLowerCase()) ?? false) ||
      performedByDisplayInfo.name.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
      entry.action_type.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
      entry.target_user_email.toLowerCase().includes(activitySearchTerm.toLowerCase()) ||
      entry.performed_by_email.toLowerCase().includes(activitySearchTerm.toLowerCase());
    
    // Date filtering
    const entryDate = new Date(entry.created_at);
    const matchesStartDate = !activityStartDate || isAfter(entryDate, startOfDay(activityStartDate));
    const matchesEndDate = !activityEndDate || isBefore(entryDate, endOfDay(activityEndDate));
    
    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const handleExportActivityLog = () => {
    const headers = ['Date & Time', 'Action', 'Target User', 'Target Company', 'Target Email', 'Performed By', 'Performed By Email', 'Details'];
    const rows = [headers];
    
    filteredActivityLog.forEach(entry => {
      const targetDisplay = getDisplayName(entry.target_user_id);
      const performedByDisplay = getDisplayName(entry.performed_by_user_id);
      rows.push([
        format(new Date(entry.created_at), 'MMM d, yyyy h:mm a'),
        formatActionType(entry.action_type),
        targetDisplay.name,
        targetDisplay.company || '',
        entry.target_user_email,
        performedByDisplay.name,
        entry.performed_by_email,
        formatDetails(entry.details),
      ]);
    });
    
    downloadCSV(rows, `admin-activity-log-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const clearActivityDateFilters = () => {
    setActivityStartDate(undefined);
    setActivityEndDate(undefined);
  };

  const formatActionType = (action: string): string => {
    const labels: Record<string, string> = {
      'admin_granted': 'Admin Granted',
      'admin_revoked': 'Admin Revoked',
      'plan_changed': 'Plan Changed',
      'beta_toggled': 'Beta Toggled',
      'user_deleted': 'User Deleted',
      'feedback_status_changed': 'Feedback Updated',
      'admin_reply_sent': 'Reply Sent',
      'impersonation_started': 'Impersonation Started',
    };
    return labels[action] || action;
  };

  const getActionBadgeVariant = (action: string): "default" | "secondary" | "destructive" | "outline" => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'admin_granted': 'default',
      'admin_revoked': 'destructive',
      'user_deleted': 'destructive',
      'plan_changed': 'secondary',
      'beta_toggled': 'outline',
      'feedback_status_changed': 'secondary',
      'admin_reply_sent': 'outline',
      'impersonation_started': 'secondary',
    };
    return variants[action] || 'outline';
  };

  const formatDetails = (details: Record<string, any> | null): string => {
    if (!details) return '—';

    if (details.old_plan && details.new_plan) {
      return `${details.old_plan} → ${details.new_plan}`;
    }
    if (details.beta_access !== undefined) {
      return details.beta_access ? 'Enabled' : 'Disabled';
    }
    if (details.new_status) {
      return `→ ${details.new_status}`;
    }
    if (details.reply_preview) {
      return `"${details.reply_preview}"`;
    }
    if (details.deleted_user_name) {
      return details.deleted_user_name;
    }
    return '—';
  };

  const sendTestEmail = async (emailType: 'welcome' | 'password-reset') => {
    setSendingTestEmail(emailType);
    try {
      const { data, error } = await supabase.functions.invoke('admin-test-email', {
        body: { emailType },
      });

      if (error) throw error;

      toast({
        title: "Test email sent!",
        description: `Check your inbox at ${data.sentTo}`,
      });
    } catch (error: any) {
      console.error('Error sending test email:', error);
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSendingTestEmail(null);
    }
  };

  const deleteUser = async (userId: string, userName: string) => {
    setDeletingUser(userId);
    try {
      // Get user email before deletion
      const userToDelete = userStats.find(u => u.id === userId);
      const userEmail = userToDelete?.email || userName;

      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { userIdToDelete: userId },
      });

      if (error) throw error;

      // Log the action
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Fetch all profiles with new columns
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at, company_name, industry, field_employees, annual_revenue, region, years_in_business, company_website, referral_source');
      
      if (profilesError) throw profilesError;

      // Fetch subscriptions for plan and beta access info
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('user_id, plan, status, billing_interval, beta_access, beta_access_granted_at, stripe_subscription_id');
      
      if (subscriptionsError) throw subscriptionsError;

      // Fetch admin roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');
      
      if (rolesError) throw rolesError;

      const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

      // Create a map for quick subscription lookup
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

      // Fetch all equipment
      const { data: equipment, error: equipmentError } = await supabase
        .from('equipment')
        .select('*');

      if (equipmentError) throw equipmentError;

      // Calculate user stats
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

      // Aggregate equipment data by user
      equipment?.forEach(item => {
        const userStat = userStatsMap.get(item.user_id);
        if (userStat) {
          userStat.equipmentCount++;
          userStat.totalValue += Number(item.purchase_price) + Number(item.sales_tax) + 
                                  Number(item.freight_setup) + Number(item.other_cap_ex);
        }
      });

      const userStatsArray = Array.from(userStatsMap.values());

      // Calculate market insights from profiles
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
      })).sort((a, b) => b.value - a.value).slice(0, 10)); // Top 10 regions

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

      // Fetch replies for all feedback
      const feedbackIds = feedback?.map(f => f.id) || [];
      const { data: replies, error: repliesError } = await supabase
        .from('feedback_replies')
        .select('*')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: true });

      if (repliesError) throw repliesError;

      // Match feedback with user names and replies
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

  const updateFeedbackStatus = async (feedbackId: string, newStatus: string) => {
    setUpdatingFeedback(feedbackId);
    try {
      // Get the feedback item to find the user and old status
      const feedbackItem = feedbackList.find(fb => fb.id === feedbackId);
      const oldStatus = feedbackItem?.status || 'unknown';

      const { error } = await supabase
        .from('feedback')
        .update({ status: newStatus })
        .eq('id', feedbackId);

      if (error) throw error;

      // Create a notification for the user about status change
      if (feedbackItem) {
        await supabase.from('user_notifications').insert({
          user_id: feedbackItem.user_id,
          type: 'feedback_status_change',
          title: 'Feedback status updated',
          message: `Your feedback "${feedbackItem.subject}" has been marked as ${newStatus.replace('_', ' ')}.`,
          reference_id: feedbackId,
          reference_type: 'feedback',
        });

        // Log the action
        await logAdminAction(
          'feedback_status_changed',
          feedbackItem.user_id,
          feedbackItem.userEmail || 'Unknown',
          { old_status: oldStatus, new_status: newStatus, subject: feedbackItem.subject }
        );
      }

      setFeedbackList(prev => prev.map(fb => 
        fb.id === feedbackId ? { ...fb, status: newStatus } : fb
      ));

      toast({
        title: 'Status updated',
        description: `Feedback marked as ${newStatus.replace('_', ' ')}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUpdatingFeedback(null);
    }
  };

  const sendAdminReply = async (feedbackId: string, feedbackUserId: string, feedbackSubject: string) => {
    const message = replyText[feedbackId]?.trim();
    if (!message) return;

    setSendingReply(feedbackId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the feedback item
      const feedbackItem = feedbackList.find(fb => fb.id === feedbackId);

      // Insert the reply
      const { data: reply, error } = await supabase
        .from('feedback_replies')
        .insert({
          feedback_id: feedbackId,
          user_id: user.id,
          message,
          is_admin_reply: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Create a notification for the user
      await supabase.from('user_notifications').insert({
        user_id: feedbackUserId,
        type: 'feedback_reply',
        title: 'New reply to your feedback',
        message: `Admin replied to "${feedbackSubject}": ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
        reference_id: feedbackId,
        reference_type: 'feedback',
      });

      // Log the action
      await logAdminAction(
        'admin_reply_sent',
        feedbackUserId,
        feedbackItem?.userEmail || 'Unknown',
        { 
          feedback_subject: feedbackSubject,
          reply_preview: message.substring(0, 50) + (message.length > 50 ? '...' : '')
        }
      );

      // Update local state
      setFeedbackList(prev => prev.map(fb => 
        fb.id === feedbackId 
          ? { ...fb, replies: [...(fb.replies || []), reply] }
          : fb
      ));

      // Clear the reply text
      setReplyText(prev => ({ ...prev, [feedbackId]: '' }));

      toast({
        title: 'Reply sent',
        description: 'The user will be notified of your response.',
      });
    } catch (error: any) {
      toast({
        title: 'Error sending reply',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSendingReply(null);
    }
  };

  // toggleBetaAccess removed - beta is now just a plan type

  const updateUserPlan = async (userId: string, newPlan: string) => {
    setChangingPlan(userId);
    try {
      const targetUser = userStats.find(u => u.id === userId);
      const oldPlan = targetUser?.subscriptionPlan || 'unknown';

      const upsertData = {
        user_id: userId,
        plan: newPlan,
        status: 'active',
        // Clear Stripe IDs since this is an admin override
        stripe_customer_id: null,
        stripe_subscription_id: null,
        billing_interval: null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('subscriptions')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (error) throw error;

      // Log the action
      await logAdminAction('plan_changed', userId, targetUser?.email || 'Unknown', {
        old_plan: oldPlan,
        new_plan: newPlan
      });

      // Update local state
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
        // Insert admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
        if (error) throw error;
      } else {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) throw error;
      }

      // Log the action
      await logAdminAction(
        makeAdmin ? 'admin_granted' : 'admin_revoked',
        userId,
        targetUser?.email || 'Unknown'
      );

      // Update local state
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getPlanBadgeVariant = (plan: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (plan) {
      case 'business': return "default";
      case 'beta': return "default";
      case 'professional': return "secondary";
      default: return "outline";
    }
  };

  const formatPlanDisplay = (plan: string, interval: string | null): string => {
    if (plan === 'beta') return 'Beta';
    
    const planName = plan === 'professional' ? 'Pro' : plan.charAt(0).toUpperCase() + plan.slice(1);
    
    if (plan === 'free') return 'Free';
    
    const intervalLabel = interval === 'year' ? 'Annual' : interval === 'month' ? 'Monthly' : '';
    return intervalLabel ? `${planName} (${intervalLabel})` : planName;
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
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform analytics and user management</p>
        </div>

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

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Overview of all platform users and their companies</CardDescription>
              </CardHeader>
              <CardContent>
                {isMobileOrTablet ? (
                  /* Mobile/Tablet Card View */
                  <div className="grid grid-cols-1 gap-3">
                    {userStats.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedUserForSheet(user)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{user.fullName}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user.companyName || 'No company'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPlanBadgeVariant(user.subscriptionPlan)}`}
                          >
                            {formatPlanDisplay(user.subscriptionPlan, user.billingInterval)}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Desktop Table View - Simplified with clickable rows */
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead>Industry</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-center">Admin</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userStats.map((user) => (
                        <TableRow 
                          key={user.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setSelectedUserForSheet(user)}
                        >
                          <TableCell className="font-medium">
                            <div>
                              <p>{user.companyName || 'No company'}</p>
                              <p className="text-xs text-muted-foreground">{user.fullName}</p>
                            </div>
                          </TableCell>
                          <TableCell>{user.industry ? getIndustryLabel(user.industry) : '—'}</TableCell>
                          <TableCell>{format(new Date(user.createdAt), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPlanBadgeVariant(user.subscriptionPlan)}`}
                            >
                              {formatPlanDisplay(user.subscriptionPlan, user.billingInterval)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {user.isPaidSubscription ? (
                              <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/30">
                                Paid
                              </Badge>
                            ) : user.subscriptionPlan === 'beta' ? (
                              <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                                Beta
                              </Badge>
                            ) : user.subscriptionPlan !== 'free' ? (
                              <Badge variant="outline" className="text-xs bg-accent/10 text-accent-foreground border-accent/30">
                                Admin
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {user.isAdmin ? (
                              <ShieldCheck className="h-4 w-4 text-destructive mx-auto" />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* User Details Sheet */}
            <Sheet open={!!selectedUserForSheet} onOpenChange={(open) => !open && setSelectedUserForSheet(null)}>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                {selectedUserForSheet && (
                  <>
                    <SheetHeader>
                      <SheetTitle>{selectedUserForSheet.companyName || 'No company'}</SheetTitle>
                      <SheetDescription>
                        {selectedUserForSheet.fullName}
                      </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-6">
                      {/* User Info */}
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Industry</span>
                          <span className="text-sm font-medium">
                            {selectedUserForSheet.industry ? getIndustryLabel(selectedUserForSheet.industry) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Employees</span>
                          <span className="text-sm font-medium">
                            {selectedUserForSheet.fieldEmployees ? getFieldEmployeesLabel(selectedUserForSheet.fieldEmployees) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Revenue</span>
                          <span className="text-sm font-medium">
                            {selectedUserForSheet.annualRevenue ? getAnnualRevenueLabel(selectedUserForSheet.annualRevenue) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Region</span>
                          <span className="text-sm font-medium">
                            {selectedUserForSheet.region ? getRegionLabel(selectedUserForSheet.region) : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Joined</span>
                          <span className="text-sm font-medium">
                            {format(new Date(selectedUserForSheet.createdAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Equipment</span>
                          <span className="text-sm font-medium">{selectedUserForSheet.equipmentCount}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Total Value</span>
                          <span className="text-sm font-medium">{formatCurrency(selectedUserForSheet.totalValue)}</span>
                        </div>
                      </div>

                      {/* Plan Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Subscription Plan</label>
                        <Select
                          value={selectedUserForSheet.subscriptionPlan}
                          onValueChange={(value) => {
                            updateUserPlan(selectedUserForSheet.id, value);
                            setSelectedUserForSheet({ ...selectedUserForSheet, subscriptionPlan: value });
                          }}
                          disabled={changingPlan === selectedUserForSheet.id}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="beta">Beta</SelectItem>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="business">Business</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Admin Toggle */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Admin Role</p>
                            <p className="text-xs text-muted-foreground">Grant admin access</p>
                          </div>
                          <Switch 
                            checked={selectedUserForSheet.isAdmin}
                            onCheckedChange={(checked) => {
                              toggleAdminRole(selectedUserForSheet.id, checked);
                              setSelectedUserForSheet({ ...selectedUserForSheet, isAdmin: checked });
                            }}
                            disabled={togglingAdmin === selectedUserForSheet.id || selectedUserForSheet.id === currentUserId}
                          />
                        </div>
                      </div>

                      {/* Impersonate Button */}
                      {selectedUserForSheet.id !== currentUserId && (
                        <Button 
                          variant="outline" 
                          className="w-full"
                          disabled={impersonating === selectedUserForSheet.id}
                          onClick={async () => {
                            setImpersonating(selectedUserForSheet.id);
                            const success = await startImpersonation(selectedUserForSheet.id);
                            setImpersonating(null);
                            if (success) {
                              setSelectedUserForSheet(null);
                              navigate('/dashboard');
                            }
                          }}
                        >
                          {impersonating === selectedUserForSheet.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <UserCheck className="h-4 w-4 mr-2" />
                          )}
                          Impersonate User
                        </Button>
                      )}

                      {/* Delete Button */}
                      {!selectedUserForSheet.isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="destructive" 
                              className="w-full"
                              disabled={deletingUser === selectedUserForSheet.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{selectedUserForSheet.fullName}</strong>
                                {selectedUserForSheet.companyName && ` from ${selectedUserForSheet.companyName}`}? 
                                This will permanently remove their account and all associated data 
                                ({selectedUserForSheet.equipmentCount} equipment items).
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => {
                                  deleteUser(selectedUserForSheet.id, selectedUserForSheet.fullName);
                                  setSelectedUserForSheet(null);
                                }}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </>
                )}
              </SheetContent>
            </Sheet>
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  User Feedback
                </CardTitle>
                <CardDescription>Review, manage, and reply to feedback from users</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No feedback submissions yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedbackList.map((item) => (
                      <div key={item.id} className="border rounded-lg overflow-hidden">
                        {/* Main feedback card */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {categoryIcons[item.category]}
                              <span className="font-medium">{item.subject}</span>
                              <Badge variant="outline" className="text-xs">
                                {categoryLabels[item.category]}
                              </Badge>
                              {(item.replies?.length ?? 0) > 0 && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.replies?.length} {item.replies?.length === 1 ? 'reply' : 'replies'}
                                </Badge>
                              )}
                            </div>
                            <Select
                              value={item.status}
                              onValueChange={(value) => updateFeedbackStatus(item.id, value)}
                              disabled={updatingFeedback === item.id}
                            >
                              <SelectTrigger className={`w-32 h-8 text-xs ${statusColors[item.status]}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{item.userName}</span>
                              <span>•</span>
                              <span>{format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs"
                              onClick={() => setExpandedFeedback(expandedFeedback === item.id ? null : item.id)}
                            >
                              <Reply className="h-3 w-3" />
                              {expandedFeedback === item.id ? 'Hide' : 'Reply'}
                            </Button>
                          </div>
                        </div>

                        {/* Expanded reply section */}
                        {expandedFeedback === item.id && (
                          <div className="border-t bg-muted/30 p-4 space-y-4">
                            {/* Conversation thread */}
                            {(item.replies?.length ?? 0) > 0 && (
                              <div className="space-y-3">
                                <span className="text-xs font-medium text-muted-foreground">Conversation</span>
                                {item.replies?.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className={`p-3 rounded-lg text-sm ${
                                      reply.is_admin_reply
                                        ? 'bg-primary/10 border border-primary/20 ml-4'
                                        : 'bg-background border mr-4'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`text-xs font-medium ${reply.is_admin_reply ? 'text-primary' : 'text-foreground'}`}>
                                        {reply.is_admin_reply ? 'Admin' : item.userName}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {format(new Date(reply.created_at), 'MMM d, h:mm a')}
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground">{reply.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Write a reply..."
                                className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                value={replyText[item.id] || ''}
                                onChange={(e) => setReplyText(prev => ({ ...prev, [item.id]: e.target.value }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendAdminReply(item.id, item.user_id, item.subject);
                                  }
                                }}
                              />
                              <Button
                                size="sm"
                                onClick={() => sendAdminReply(item.id, item.user_id, item.subject)}
                                disabled={sendingReply === item.id || !replyText[item.id]?.trim()}
                              >
                                {sendingReply === item.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="outline" className="mt-4" onClick={fetchAllFeedback}>
                  Refresh Feedback
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Log Tab */}
          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Admin Activity Log
                    </CardTitle>
                    <CardDescription>
                      Recent administrative actions and audit trail
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExportActivityLog} disabled={filteredActivityLog.length === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchActivityLog} disabled={loadingActivityLog}>
                      <RefreshCw className={`h-4 w-4 mr-2 ${loadingActivityLog ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, or action..."
                      value={activitySearchTerm}
                      onChange={(e) => setActivitySearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "justify-start text-left font-normal",
                            !activityStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activityStartDate ? format(activityStartDate, "MMM d") : "From"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={activityStartDate}
                          onSelect={setActivityStartDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "justify-start text-left font-normal",
                            !activityEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {activityEndDate ? format(activityEndDate, "MMM d") : "To"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={activityEndDate}
                          onSelect={setActivityEndDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    
                    {(activityStartDate || activityEndDate) && (
                      <Button variant="ghost" size="sm" onClick={clearActivityDateFilters}>
                        <X className="h-4 w-4 mr-1" />
                        Clear dates
                      </Button>
                    )}
                  </div>
                </div>

                {loadingActivityLog ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredActivityLog.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity logged yet. Actions will appear here as they are performed.
                  </div>
                ) : (
                  <TooltipProvider>
                    <ScrollArea className="w-full">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Target User</TableHead>
                            <TableHead>Performed By</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredActivityLog.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getActionBadgeVariant(entry.action_type)}>
                                  {formatActionType(entry.action_type)}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <UserDisplayCell
                                  userId={entry.target_user_id}
                                  displayName={getDisplayName(entry.target_user_id)}
                                />
                              </TableCell>
                              <TableCell>
                                <UserDisplayCell
                                  userId={entry.performed_by_user_id}
                                  displayName={getDisplayName(entry.performed_by_user_id)}
                                />
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px]">
                                {formatDetails(entry.details)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Insights Tab */}
          <TabsContent value="market" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Industry Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Industry Distribution
                  </CardTitle>
                  <CardDescription>Users by industry type</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {industryStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <BarChart 
                        data={industryStats} 
                        layout="vertical"
                      >
                        <XAxis type="number" />
                        <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 12 }} />
                        <ChartTooltip 
                          content={({ payload }) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                  <p className="font-medium">{data.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.value} companies
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No industry data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Size Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Company Size
                  </CardTitle>
                  <CardDescription>Distribution by field employees</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {companySizeStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <PieChart>
                        <Pie
                          data={companySizeStats}
                          dataKey="value"
                          nameKey="label"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ label, value }) => `${label}: ${value}`}
                        >
                          {companySizeStats.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No company size data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Revenue Distribution
                  </CardTitle>
                  <CardDescription>Companies by annual revenue range</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {revenueStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <BarChart data={revenueStats}>
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <ChartTooltip 
                          content={({ payload }) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                  <p className="font-medium">{data.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.value} companies
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Top Regions
                  </CardTitle>
                  <CardDescription>Geographic distribution of users</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {regionStats.length > 0 ? (
                    <ChartContainer config={{}} className="h-full w-full">
                      <BarChart 
                        data={regionStats} 
                        layout="vertical"
                      >
                        <XAxis type="number" />
                        <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 12 }} />
                        <ChartTooltip 
                          content={({ payload }) => {
                            if (payload && payload[0]) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                  <p className="font-medium">{data.label}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {data.value} users
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" fill="hsl(var(--chart-3))" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      No region data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Categories/Equipment Data Tab */}
          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Equipment by Category</CardTitle>
                  <CardDescription>Distribution across equipment categories</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={{}} className="h-full w-full">
                    <BarChart 
                      data={categoryStats.map(cat => ({
                        ...cat,
                        percent: totals.totalEquipment > 0 
                          ? ((cat.count / totals.totalEquipment) * 100)
                          : 0,
                      }))} 
                      layout="vertical"
                    >
                      <XAxis type="number" tickFormatter={(value) => `${value.toFixed(0)}%`} />
                      <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 12 }} />
                      <ChartTooltip 
                        content={({ payload }) => {
                          if (payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-md px-3 py-2 shadow-md">
                                <p className="font-medium">{data.category}</p>
                                <p className="text-sm text-muted-foreground">
                                  {data.percent.toFixed(1)}% ({data.count} items)
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="percent" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financing Distribution</CardTitle>
                  <CardDescription>Owned vs Financed vs Leased</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ChartContainer config={{}} className="h-full w-full">
                    <PieChart>
                      <Pie
                        data={financingStats}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ type, count }) => {
                          const total = financingStats.reduce((sum, s) => sum + s.count, 0);
                          const percent = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                          return `${type}: ${percent}%`;
                        }}
                      >
                        {financingStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Category Analytics</CardTitle>
                <CardDescription>Detailed breakdown by equipment category</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Avg Purchase Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Avg Age (Years)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryStats.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell className="font-medium">{cat.category}</TableCell>
                        <TableCell className="text-right">{cat.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.avgPurchasePrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(cat.totalValue)}</TableCell>
                        <TableCell className="text-right">{cat.avgAge.toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financing Tab */}
          <TabsContent value="financing" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {financingStats.map((stat) => (
                <Card key={stat.type}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium capitalize">{stat.type}</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.count}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.type === 'owned' 
                        ? `${formatCurrency(stat.totalPurchaseValue)} total value`
                        : stat.totalAmount > 0 
                          ? `${formatCurrency(stat.totalAmount)} financed`
                          : `${formatCurrency(stat.totalPurchaseValue)} total value`}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Financing Breakdown</CardTitle>
                <CardDescription>Detailed financing analytics across all users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Financing Type</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Financed Amount</TableHead>
                      <TableHead className="text-right">% of Fleet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {financingStats.map((stat) => (
                      <TableRow key={stat.type}>
                        <TableCell className="font-medium capitalize">{stat.type}</TableCell>
                        <TableCell className="text-right">{stat.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(stat.totalPurchaseValue)}</TableCell>
                        <TableCell className="text-right">
                          {stat.type !== 'owned' ? formatCurrency(stat.totalAmount) : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          {totals.totalEquipment > 0 
                            ? ((stat.count / totals.totalEquipment) * 100).toFixed(1) + '%'
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Marketing Tab */}
          <TabsContent value="marketing" className="space-y-4">
            {/* Referral Source Analytics */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Referral Source Analytics</CardTitle>
                </div>
                <CardDescription>Track where signups are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                {referralSourceStats.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium">No referral data yet</p>
                    <p className="text-sm">Data will appear as users sign up with referral source</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Distribution</h4>
                      <ChartContainer
                        config={Object.fromEntries(
                          referralSourceStats.map((stat, index) => [
                            stat.name,
                            { label: stat.label, color: CHART_COLORS[index % CHART_COLORS.length] },
                          ])
                        )}
                        className="h-[250px]"
                      >
                        <PieChart>
                          <Pie
                            data={referralSourceStats}
                            dataKey="value"
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                          >
                            {referralSourceStats.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ChartContainer>
                    </div>

                    {/* Stats Table */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Breakdown</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Source</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                            <TableHead className="text-right">%</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {referralSourceStats.map((stat) => {
                            const totalReferrals = referralSourceStats.reduce((sum, s) => sum + s.value, 0);
                            const percentage = totalReferrals > 0 ? ((stat.value / totalReferrals) * 100).toFixed(1) : '0';
                            return (
                              <TableRow key={stat.name}>
                                <TableCell className="font-medium">{stat.label}</TableCell>
                                <TableCell className="text-right">{stat.value}</TableCell>
                                <TableCell className="text-right">{percentage}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Sources Cards */}
            {referralSourceStats.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {referralSourceStats.slice(0, 4).map((stat, index) => (
                  <Card key={stat.name}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                      <Badge variant={index === 0 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <p className="text-xs text-muted-foreground">
                        {((stat.value / referralSourceStats.reduce((sum, s) => sum + s.value, 0)) * 100).toFixed(1)}% of referrals
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Email Tools Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Marketing & Communications</CardTitle>
                </div>
                <CardDescription>Tools for user communication and marketing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Test Email Templates Section */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">Test Email Templates</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send sample emails to your own inbox to verify templates before sending to users.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() => sendTestEmail('welcome')}
                      disabled={sendingTestEmail !== null}
                      className="gap-2"
                    >
                      {sendingTestEmail === 'welcome' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Welcome Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => sendTestEmail('password-reset')}
                      disabled={sendingTestEmail !== null}
                      className="gap-2"
                    >
                      {sendingTestEmail === 'password-reset' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      Send Password Changed Email
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
