import { useState, useEffect } from "react";
import { z } from "zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CompanyProfileData, RateLimitResult } from "@/contexts/AuthContext";
import { ProgressIndicator } from "./ProgressIndicator";
import { RateLimitAlert } from "./RateLimitAlert";
import { SignupStep1 } from "./SignupStep1";
import { SignupStep2 } from "./SignupStep2";
import { SignupStep3 } from "./SignupStep3";

// Step-specific validation schemas
const step1Schema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const step2Schema = z.object({
  companyName: z.string().min(1, "Company name is required").max(200, "Company name too long"),
  industry: z.string().min(1, "Industry is required"),
  fieldEmployees: z.string().min(1, "Number of field employees is required"),
});

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(1, "Full name is required").max(100, "Name too long"),
  companyName: z.string().min(1, "Company name is required").max(200, "Company name too long"),
  industry: z.string().min(1, "Industry is required"),
  fieldEmployees: z.string().min(1, "Number of field employees is required"),
  annualRevenue: z.string().optional(),
  yearsInBusiness: z.number().int().positive().max(200).optional().or(z.literal("")),
  region: z.string().optional(),
  companyWebsite: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

interface SignupWizardProps {
  signUp: (
    email: string,
    password: string,
    fullName: string,
    companyData: CompanyProfileData
  ) => Promise<{ error: Error | null }>;
  checkRateLimit: (
    action: "login" | "signup" | "password_reset",
    email?: string
  ) => Promise<RateLimitResult>;
  onSwitchToLogin: () => void;
}

export function SignupWizard({ signUp, checkRateLimit, onSwitchToLogin }: SignupWizardProps) {
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industry, setIndustry] = useState("");
  const [fieldEmployees, setFieldEmployees] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [region, setRegion] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [referralSource, setReferralSource] = useState("");

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(1);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">("left");
  const totalSteps = 3;

  // Rate limiting state
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitResult | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);

  const { toast } = useToast();

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

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Field-level validation for inline checkmarks
  const isFieldValid = (field: string): boolean => {
    switch (field) {
      case "fullName":
        return fullName.trim().length >= 1 && fullName.length <= 100;
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      case "password":
        return password.length >= 6;
      case "companyName":
        return companyName.trim().length >= 1 && companyName.length <= 200;
      case "industry":
        return industry.length > 0;
      case "fieldEmployees":
        return fieldEmployees.length > 0;
      default:
        return false;
    }
  };

  // Password strength calculation
  const getPasswordStrength = (
    pwd: string
  ): { level: "weak" | "medium" | "strong"; score: number } => {
    if (!pwd) return { level: "weak", score: 0 };

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
    if (score <= 2) return { level: "weak", score: Math.min((score / 7) * 100, 33) };
    if (score <= 4) return { level: "medium", score: Math.min((score / 7) * 100, 66) };
    return { level: "strong", score: Math.min((score / 7) * 100, 100) };
  };

  const passwordStrength = getPasswordStrength(password);

  const validateStep = (step: number): boolean => {
    setErrors({});

    if (step === 1) {
      const result = step1Schema.safeParse({ fullName, email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    } else if (step === 2) {
      const result = step2Schema.safeParse({ companyName, industry, fieldEmployees });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        return false;
      }
    }
    // Step 3 has no required fields
    return true;
  };

  const checkEmailExists = async (emailToCheck: string): Promise<boolean> => {
    try {
      // Attempt to sign in with a dummy password
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToCheck,
        password: "dummy_check_password_12345_!@#$%",
      });

      if (error) {
        // "Invalid login credentials" means email exists but password wrong
        if (error.message.includes("Invalid login credentials")) {
          return true;
        }
        return false;
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleNextStep = async () => {
    if (validateStep(currentStep)) {
      // On Step 1, check if email already exists
      if (currentStep === 1) {
        setCheckingEmail(true);
        const exists = await checkEmailExists(email);
        setCheckingEmail(false);

        if (exists) {
          setErrors({ email: "This email is already registered." });
          return;
        }
      }

      setSlideDirection("left");
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setErrors({});
    setSlideDirection("right");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
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
        result.error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Check rate limit before attempting signup
      const rateLimitResult = await checkRateLimit("signup", email);
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
        if (error.message.includes("already registered")) {
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
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Indicator */}
      <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />

      {/* Rate Limit Warning/Error */}
      <RateLimitAlert
        rateLimitInfo={rateLimitInfo}
        retryCountdown={retryCountdown}
        formatCountdown={formatCountdown}
      />

      <form onSubmit={handleSubmit}>
        {/* Step 1: Account Basics */}
        {currentStep === 1 && (
          <SignupStep1
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            errors={errors}
            isSubmitting={isSubmitting}
            isFieldValid={isFieldValid}
            passwordStrength={passwordStrength}
            slideDirection={slideDirection}
            onSwitchToLogin={onSwitchToLogin}
          />
        )}

        {/* Step 2: Company Essentials */}
        {currentStep === 2 && (
          <SignupStep2
            companyName={companyName}
            setCompanyName={setCompanyName}
            industry={industry}
            setIndustry={setIndustry}
            fieldEmployees={fieldEmployees}
            setFieldEmployees={setFieldEmployees}
            errors={errors}
            isSubmitting={isSubmitting}
            isFieldValid={isFieldValid}
            slideDirection={slideDirection}
          />
        )}

        {/* Step 3: Additional Details (Optional) */}
        {currentStep === 3 && (
          <SignupStep3
            annualRevenue={annualRevenue}
            setAnnualRevenue={setAnnualRevenue}
            region={region}
            setRegion={setRegion}
            yearsInBusiness={yearsInBusiness}
            setYearsInBusiness={setYearsInBusiness}
            companyWebsite={companyWebsite}
            setCompanyWebsite={setCompanyWebsite}
            referralSource={referralSource}
            setReferralSource={setReferralSource}
            errors={errors}
            isSubmitting={isSubmitting}
            slideDirection={slideDirection}
          />
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
              disabled={isSubmitting || checkingEmail}
            >
              {checkingEmail ? "Checking..." : "Next"}
              {!checkingEmail && <ChevronRight className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="flex gap-3 flex-1">
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Create Account"}
              </Button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
