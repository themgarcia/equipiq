import { useState, useEffect } from "react";
import { z } from "zod";
import { Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { RateLimitResult } from "@/contexts/AuthContext";
import { RateLimitAlert } from "./RateLimitAlert";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

interface LoginFormProps {
  onForgotPassword: () => void;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  checkRateLimit: (action: "login" | "signup" | "password_reset", email?: string) => Promise<RateLimitResult>;
}

export function LoginForm({ onForgotPassword, signIn, checkRateLimit }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const isFieldValid = (field: string): boolean => {
    if (field === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Check rate limit before attempting login
      const rateLimitResult = await checkRateLimit("login", email);
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
        if (error.message.includes("Invalid login credentials")) {
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

      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem("equipiq-remember-me", "true");
      } else {
        localStorage.removeItem("equipiq-remember-me");
        // Set a session-only flag that will be checked on page load
        sessionStorage.setItem("equipiq-session-only", "true");
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <RateLimitAlert
        rateLimitInfo={rateLimitInfo}
        retryCountdown={retryCountdown}
        formatCountdown={formatCountdown}
      />

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
            className="pl-10 pr-10"
            disabled={isSubmitting}
          />
          {isFieldValid("email") && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
          )}
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-10 pr-10"
            disabled={isSubmitting}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="remember-me"
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(checked === true)}
            />
            <label
              htmlFor="remember-me"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Forgot password?
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
