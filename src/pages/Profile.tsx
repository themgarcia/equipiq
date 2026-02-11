import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, User, Building2, AlertTriangle, Ruler } from 'lucide-react';
import { DeleteAccountDialog } from '@/components/DeleteAccountDialog';
import { useDistanceUnit } from '@/hooks/useDistanceUnit';
import {
  industryOptions,
  fieldEmployeesOptions,
  annualRevenueOptions,
  regionOptions,
} from '@/data/signupOptions';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  fieldEmployees: z.string().min(1, 'Number of field employees is required'),
  annualRevenue: z.string().optional(),
  yearsInBusiness: z.coerce.number().min(0).optional().or(z.literal('')),
  region: z.string().optional(),
  companyWebsite: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { distanceUnit, updateDistanceUnit } = useDistanceUnit();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      companyName: '',
      industry: '',
      fieldEmployees: '',
      annualRevenue: '',
      yearsInBusiness: '',
      region: '',
      companyWebsite: '',
    },
  });

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    async function loadProfile() {
      // Only load once on initial mount
      if (!user || hasLoadedRef.current) return;
      
      hasLoadedRef.current = true;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          form.reset({
            fullName: data.full_name || '',
            companyName: data.company_name || '',
            industry: data.industry || '',
            fieldEmployees: data.field_employees || '',
            annualRevenue: data.annual_revenue || '',
            yearsInBusiness: data.years_in_business ?? '',
            region: data.region || '',
            companyWebsite: data.company_website || '',
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: 'Error loading profile',
          description: 'Could not load your profile data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [user]);

  async function onSubmit(data: ProfileFormData) {
    if (!user) return;

    setSaving(true);
    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.fullName,
          company_name: data.companyName,
          industry: data.industry,
          field_employees: data.fieldEmployees,
          annual_revenue: data.annualRevenue || null,
          years_in_business: data.yearsInBusiness ? Number(data.yearsInBusiness) : null,
          region: data.region || null,
          company_website: data.companyWebsite || null,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update user metadata for full_name
      const { error: metaError } = await supabase.auth.updateUser({
        data: { full_name: data.fullName },
      });

      if (metaError) throw metaError;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error saving profile',
        description: 'Could not save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your personal and company information</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>Your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <Input value={user?.email || ''} disabled className="bg-muted" />
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Details about your business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Contractors" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {industryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fieldEmployees"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field Employees</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fieldEmployeesOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Annual Revenue (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {annualRevenueOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsInBusiness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years in Business (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="e.g. 10"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {regionOptions.map((group) => (
                            <SelectGroup key={group.group}>
                              <SelectLabel>{group.group}</SelectLabel>
                              {group.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Form>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Preferences
            </CardTitle>
            <CardDescription>Display and unit preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Distance Units</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Controls how mileage benchmarks are displayed (e.g., Fleet trucks)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={distanceUnit === 'mi' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateDistanceUnit('mi')}
                >
                  Miles
                </Button>
                <Button
                  type="button"
                  variant={distanceUnit === 'km' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateDistanceUnit('km')}
                >
                  Kilometers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible account actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-foreground">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <DeleteAccountDialog />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
