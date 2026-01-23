import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { z } from 'zod';
import { useAuth, CompanyProfileData, RateLimitResult } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, Lock, User, Building2, Users, DollarSign, MapPin, Globe, Calendar, AlertTriangle, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EquipIQIcon } from '@/components/EquipIQIcon';
import { 
  industryOptions, 
  fieldEmployeesOptions, 
  annualRevenueOptions, 
  regionOptions,
  referralSourceOptions,
} from '@/data/signupOptions';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Step-specific validation schemas for signup
const step1Schema = z.object({
  fullName: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const step2Schema = z.object({
  companyName: z.string().min(1, 'Company name is required').max(200, 'Company name too long'),
  industry: z.string().min(1, 'Industry is required'),
  fieldEmployees: z.string().min(1, 'Number of field employees is required'),
});

// Step 3 is all optional - no strict validation needed

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

// Progress Indicator Component
function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-6">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              i + 1 < currentStep 
                ? 'bg-primary text-primary-foreground' 
                : i + 1 === currentStep 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i + 1 < currentStep ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < totalSteps - 1 && (
            <div className={`w-8 sm:w-12 h-1 mx-1 transition-colors ${i + 1 < currentStep ? 'bg-primary' : 'bg-muted'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

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
  const [referralSource, setReferralSource] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  
  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');
  const totalSteps = 3;
  
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
    setReferralSource('');
    setErrors({});
    setResetEmailSent(false);
    setRateLimitInfo(null);
    setRetryCountdown(0);
    setCurrentStep(1);
  };

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const validateStep = (step: number): boolean => {
    setErrors({});
    
    if (step === 1) {
      const result = step1Schema.safeParse({ fullName, email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    } else if (step === 2) {
      const result = step2Schema.safeParse({ companyName, industry, fieldEmployees });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach(issue => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    }
    // Step 3 has no required fields
    return true;
  };

  // Field-level validation for inline checkmarks
  const isFieldValid = (field: string): boolean => {
    switch (field) {
      case 'fullName':
        return fullName.trim().length >= 1 && fullName.length <= 100;
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case 'password':
        return password.length >= 6;
      case 'companyName':
        return companyName.trim().length >= 1 && companyName.length <= 200;
      case 'industry':
        return industry.length > 0;
      case 'fieldEmployees':
        return fieldEmployees.length > 0;
      default:
        return false;
    }
  };

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { level: 'weak' | 'medium' | 'strong'; score: number } => {
    if (!pwd) return { level: 'weak', score: 0 };
    
    let score = 0;
    
    // Length checks
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1;
    
    // Determine level based on score (max 7)
    if (score <= 2) return { level: 'weak', score: Math.min(score / 7 * 100, 33) };
    if (score <= 4) return { level: 'medium', score: Math.min(score / 7 * 100, 66) };
    return { level: 'strong', score: Math.min(score / 7 * 100, 100) };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setSlideDirection('left');
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setSlideDirection('right');
    setCurrentStep(prev => Math.max(prev - 1, 1));
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
          referralSource: referralSource || undefined,
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

  const getStepTitle = () => {
    if (currentStep === 1) return 'Account Basics';
    if (currentStep === 2) return 'Company Essentials';
    return 'Additional Details';
  };

  const getStepDescription = () => {
    if (currentStep === 1) return 'Let\'s start with your account info';
    if (currentStep === 2) return 'Tell us about your company';
    return 'Optional info to personalize your experience';
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
          <Link to="/" className="flex flex-col items-center group">
            <EquipIQIcon className="h-14 w-14 mb-4 transition-transform group-hover:scale-105" />
            <h1 className="text-2xl font-bold group-hover:text-primary transition-colors">equipIQ</h1>
          </Link>
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
                  : getStepTitle()}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? resetEmailSent 
                  ? 'Check your email for the reset link'
                  : 'Enter your email to receive a reset link'
                : isLogin 
                  ? 'Enter your credentials to access your equipment' 
                  : getStepDescription()}
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
            ) : isLogin ? (
              // Login Form
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

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
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
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              // Multi-Step Signup Form
              <div className="space-y-4">
                {/* Progress Indicator */}
                <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
                
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

                <form onSubmit={handleSubmit}>
                  {/* Step 1: Account Basics */}
                  {currentStep === 1 && (
                    <div 
                      key="step-1"
                      className={`space-y-4 ${slideDirection === 'left' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'}`}
                    >
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
                            className="pl-10 pr-10"
                            disabled={isSubmitting}
                          />
                          {isFieldValid('fullName') && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
                          )}
                        </div>
                        {errors.fullName && (
                          <p className="text-sm text-destructive">{errors.fullName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 pr-10"
                            disabled={isSubmitting}
                          />
                          {isFieldValid('email') && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
                          )}
                        </div>
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10"
                            disabled={isSubmitting}
                          />
                          {isFieldValid('password') && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
                          )}
                        </div>
                        {errors.password && (
                          <p className="text-sm text-destructive">{errors.password}</p>
                        )}
                        {/* Password Strength Indicator */}
                        {password.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 rounded-full ${
                                  passwordStrength.level === 'weak' 
                                    ? 'bg-destructive' 
                                    : passwordStrength.level === 'medium' 
                                      ? 'bg-warning' 
                                      : 'bg-success'
                                }`}
                                style={{ width: `${passwordStrength.score}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <p className={`text-xs font-medium ${
                                passwordStrength.level === 'weak' 
                                  ? 'text-destructive' 
                                  : passwordStrength.level === 'medium' 
                                    ? 'text-warning' 
                                    : 'text-success'
                              }`}>
                                {passwordStrength.level === 'weak' && 'Weak'}
                                {passwordStrength.level === 'medium' && 'Medium'}
                                {passwordStrength.level === 'strong' && 'Strong'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {password.length < 6 ? `${6 - password.length} more chars needed` : 'Min. 6 characters ✓'}
                              </p>
                            </div>
                          </div>
                        )}
                        {password.length === 0 && (
                          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Company Essentials */}
                  {currentStep === 2 && (
                    <div 
                      key="step-2"
                      className={`space-y-4 ${slideDirection === 'left' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'}`}
                    >
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
                            className="pl-10 pr-10"
                            disabled={isSubmitting}
                          />
                          {isFieldValid('companyName') && (
                            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
                          )}
                        </div>
                        {errors.companyName && (
                          <p className="text-sm text-destructive">{errors.companyName}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry *</Label>
                        <div className="flex items-center gap-2">
                          <Select value={industry} onValueChange={setIndustry} disabled={isSubmitting}>
                            <SelectTrigger className="flex-1">
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
                          {isFieldValid('industry') && (
                            <Check className="h-4 w-4 text-success animate-checkmark-pop shrink-0" />
                          )}
                        </div>
                        {errors.industry && (
                          <p className="text-sm text-destructive">{errors.industry}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="fieldEmployees">Field Employees *</Label>
                        <div className="flex items-center gap-2">
                          <Select value={fieldEmployees} onValueChange={setFieldEmployees} disabled={isSubmitting}>
                            <SelectTrigger className="flex-1">
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
                          {isFieldValid('fieldEmployees') && (
                            <Check className="h-4 w-4 text-success animate-checkmark-pop shrink-0" />
                          )}
                        </div>
                        {errors.fieldEmployees && (
                          <p className="text-sm text-destructive">{errors.fieldEmployees}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Additional Details (Optional) */}
                  {currentStep === 3 && (
                    <div 
                      key="step-3"
                      className={`space-y-4 ${slideDirection === 'left' ? 'animate-slide-in-from-right' : 'animate-slide-in-from-left'}`}
                    >
                      <p className="text-sm text-muted-foreground text-center mb-2">
                        All fields on this page are optional
                      </p>
                      
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

                      {/* How did you hear about us - Chip Selector */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <Label className="text-sm font-medium">How did you hear about us?</Label>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {referralSourceOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setReferralSource(referralSource === option.value ? '' : option.value)}
                              disabled={isSubmitting}
                              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                referralSource === option.value
                                  ? 'bg-primary text-primary-foreground border-primary'
                                  : 'bg-background hover:bg-muted border-border text-foreground'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex gap-3 mt-6">
                    {currentStep > 1 && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handlePrevStep}
                        disabled={isSubmitting}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                    )}
                    
                    {currentStep < totalSteps ? (
                      <Button 
                        type="button" 
                        className="flex-1 flex items-center justify-center gap-1"
                        onClick={handleNextStep}
                        disabled={isSubmitting}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <div className="flex gap-3 flex-1">
                        <Button 
                          type="submit" 
                          className="flex-1" 
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Creating account...' : 'Create Account'}
                        </Button>
                      </div>
                    )}
                  </div>
                </form>
              </div>
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
