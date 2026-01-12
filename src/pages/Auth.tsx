import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { z } from 'zod';
import { useAuth, CompanyProfileData, RateLimitResult } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, User, Building2, Users, DollarSign, MapPin, Globe, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { 
  industryOptions, 
  fieldEmployeesOptions, 
  annualRevenueOptions, 
  regionOptions 
} from '@/data/signupOptions';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  companyName: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  industry: z.string().min(1, 'Industry is required'),
  fieldEmployees: z.string().min(1, 'Number of field employees is required'),
  annualRevenue: z.string().optional(),
  yearsInBusiness: z.number().int().positive().max(200).optional().or(z.literal('')),
  region: z.string().optional(),
  companyWebsite: z.string().url('Invalid website URL').optional().or(z.literal('')),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [fieldEmployees, setFieldEmployees] = useState('');
  const [annualRevenue, setAnnualRevenue] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [region, setRegion] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Rate limiting state
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitResult | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  
  const { signIn, signUp, user, loading, checkRateLimit, clearRateLimit } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (retryCountdown <= 0) return;

    const timer = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          setRateLimitInfo(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [retryCountdown]);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setCompanyName('');
    setIndustry('');
    setFieldEmployees('');
    setAnnualRevenue('');
    setYearsInBusiness('');
    setRegion('');
    setCompanyWebsite('');
    setErrors({});
    setResetEmailSent(false);
    setRateLimitInfo(null);
    setRetryCountdown(0);
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const result = forgotPasswordSchema.safeParse({ email });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Check rate limit before attempting password reset
      const rateLimitResult = await checkRateLimit('password_reset', email);
      if (!rateLimitResult.allowed) {
        setRateLimitInfo(rateLimitResult);
        setRetryCountdown(rateLimitResult.retryAfterSeconds || 0);
        setIsSubmitting(false);
        return;
      }

      // Store warning if present
      if (rateLimitResult.warning) {
        setRateLimitInfo(rateLimitResult);
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        toast({
          title: "Failed to send reset email",
          description: error.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Clear rate limit on success
      await clearRateLimit('password_reset', email);
      setRateLimitInfo(null);

      setResetEmailSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const result = loginSchema.safeParse({ email, password });
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            fieldErrors[issue.path[0]] = issue.message;
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        // Check rate limit before attempting login
        const rateLimitResult = await checkRateLimit('login', email);
        if (!rateLimitResult.allowed) {
          setRateLimitInfo(rateLimitResult);
          setRetryCountdown(rateLimitResult.retryAfterSeconds || 0);
          setIsSubmitting(false);
          return;
        }

        // Store warning if present
        if (rateLimitResult.warning) {
          setRateLimitInfo(rateLimitResult);
        }

        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
          setIsSubmitting(false);
          return;
        }

        // Clear rate limit info on success
        setRateLimitInfo(null);

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
        });
      } else {
        const yearsNum = yearsInBusiness ? parseInt(yearsInBusiness, 10) : undefined;
        const result = signupSchema.safeParse({ 
          email, 
          password, 
          fullName,
          companyName,
          industry,
          fieldEmployees,
          annualRevenue: annualRevenue || undefined,
          yearsInBusiness: yearsNum || undefined,
          region: region || undefined,
          companyWebsite: companyWebsite || undefined,
        });
        
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.issues.forEach(issue => {
            fieldErrors[issue.path[0] as string] = issue.message;
          });
          setErrors(fieldErrors);
          setIsSubmitting(false);
          return;
        }

        // Check rate limit before attempting signup
        const rateLimitResult = await checkRateLimit('signup', email);
        if (!rateLimitResult.allowed) {
          setRateLimitInfo(rateLimitResult);
          setRetryCountdown(rateLimitResult.retryAfterSeconds || 0);
          setIsSubmitting(false);
          return;
        }

        // Store warning if present
        if (rateLimitResult.warning) {
          setRateLimitInfo(rateLimitResult);
        }

        const companyData: CompanyProfileData = {
          companyName,
          industry,
          fieldEmployees,
          annualRevenue: annualRevenue || undefined,
          yearsInBusiness: yearsNum,
          region: region || undefined,
          companyWebsite: companyWebsite || undefined,
        };

        const { error } = await signUp(email, password, fullName, companyData);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account exists",
              description: "An account with this email already exists. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup failed",
              description: error.message,
              variant: "destructive",
            });
          }
          setIsSubmitting(false);
          return;
        }

        // Clear rate limit info on success
        setRateLimitInfo(null);

        toast({
          title: "Account created!",
          description: "Welcome to equipIQ!",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <EquipIQIcon className="h-14 w-14 mb-4" />
          <h1 className="text-2xl font-bold">equipIQ</h1>
          <p className="text-muted-foreground">Equipment intelligence for contractors</p>
          <span className="mt-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Open Beta – All features included
          </span>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle>
              {isForgotPassword 
                ? 'Reset Password' 
                : isLogin 
                  ? 'Welcome back' 
                  : 'Join the Open Beta'}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? resetEmailSent 
                  ? 'Check your email for the reset link'
                  : 'Enter your email to receive a reset link'
                : isLogin 
                  ? 'Enter your credentials to access your equipment' 
                  : 'Create your account and get full access'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              resetEmailSent ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <p className="text-sm text-muted-foreground">
                      We've sent a password reset link to <strong>{email}</strong>. 
                      Please check your inbox and follow the instructions to reset your password.
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      setIsForgotPassword(false);
                      setResetEmailSent(false);
                      resetForm();
                    }} 
                    variant="outline"
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        disabled={isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        resetForm();
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              )
            ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rate Limit Warning/Error */}
              {rateLimitInfo && !rateLimitInfo.allowed && (
                <Alert variant="destructive">
                  <Clock className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{rateLimitInfo.message || 'Too many attempts. Please try again later.'}</span>
                    {retryCountdown > 0 && (
                      <span className="font-mono text-sm ml-2">
                        {formatCountdown(retryCountdown)}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              {rateLimitInfo && rateLimitInfo.allowed && rateLimitInfo.warning && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {rateLimitInfo.warning}
                  </AlertDescription>
                </Alert>
              )}
              {!isLogin && (
                <>
                  {/* Personal Info Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="John Doe"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>
                  </div>

                  {/* Company Info Section */}
                  <div className="pt-4 border-t space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Company Information</p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="ABC Construction"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.companyName && (
                        <p className="text-sm text-destructive">{errors.companyName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="industry">Industry *</Label>
                      <Select value={industry} onValueChange={setIndustry} disabled={isSubmitting}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {industryOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.industry && (
                        <p className="text-sm text-destructive">{errors.industry}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fieldEmployees">Field Employees *</Label>
                        <Select value={fieldEmployees} onValueChange={setFieldEmployees} disabled={isSubmitting}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            {fieldEmployeesOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.fieldEmployees && (
                          <p className="text-sm text-destructive">{errors.fieldEmployees}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="annualRevenue">Annual Revenue</Label>
                        <Select value={annualRevenue} onValueChange={setAnnualRevenue} disabled={isSubmitting}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            {annualRevenueOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="region">Region</Label>
                        <Select value={region} onValueChange={setRegion} disabled={isSubmitting}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="yearsInBusiness">Years in Business</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="yearsInBusiness"
                            type="number"
                            placeholder="10"
                            min="0"
                            max="200"
                            value={yearsInBusiness}
                            onChange={(e) => setYearsInBusiness(e.target.value)}
                            className="pl-10"
                            disabled={isSubmitting}
                          />
                        </div>
                        {errors.yearsInBusiness && (
                          <p className="text-sm text-destructive">{errors.yearsInBusiness}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyWebsite">Company Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="companyWebsite"
                          type="url"
                          placeholder="https://yourcompany.com"
                          value={companyWebsite}
                          onChange={(e) => setCompanyWebsite(e.target.value)}
                          className="pl-10"
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.companyWebsite && (
                        <p className="text-sm text-destructive">{errors.companyWebsite}</p>
                      )}
                    </div>
                  </div>

                  {/* Account Info Section */}
                  <div className="pt-4 border-t space-y-4">
                    <p className="text-sm font-medium text-muted-foreground">Account Details</p>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email {!isLogin && '*'}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password {!isLogin && '*'}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
                {isLogin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setErrors({});
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting 
                  ? (isLogin ? 'Signing in...' : 'Creating account...') 
                  : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
            )}

            {!isForgotPassword && (
              <>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      resetForm();
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {isLogin 
                      ? "Don't have an account? Sign up" 
                      : "Already have an account? Sign in"}
                  </button>
                </div>

                {/* Legal Links */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    By continuing, you agree to our{' '}
                    <a 
                      href="/terms" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Terms of Service
                    </a>
                    {' '}and{' '}
                    <a 
                      href="/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
