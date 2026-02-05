import { useState } from "react";
import { z } from "zod";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { RateLimitResult } from "@/contexts/AuthContext";
import { RateLimitAlert } from "./RateLimitAlert";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

interface ForgotPasswordFormProps {
  onBack: () => void;
  checkRateLimit: (action: "login" | "signup" | "password_reset", email?: string) => Promise<RateLimitResult>;
  clearRateLimit: (action: "login" | "signup" | "password_reset", email?: string) => Promise<void>;
}

export function ForgotPasswordForm({ onBack, checkRateLimit, clearRateLimit }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitResult | null>(null);
  const [retryCountdown, setRetryCountdown] = useState(0);
  const { toast } = useToast();

  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      const result = forgotPasswordSchema.safeParse({ email });
      if (!result.success) {
        const fieldErrors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          fieldErrors[issue.path[0] as string] = issue.message;
        });
        setErrors(fieldErrors);
        setIsSubmitting(false);
        return;
      }

      // Check rate limit before attempting password reset
      const rateLimitResult = await checkRateLimit("password_reset", email);
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
      await clearRateLimit("password_reset", email);
      setRateLimitInfo(null);

      setResetEmailSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a password reset link.",
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

  if (resetEmailSent) {
    return (
      <div className="space-y-4">
        <div className="text-center py-4">
          <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            We've sent a password reset link to <strong>{email}</strong>. Please check your inbox
            and follow the instructions to reset your password.
          </p>
        </div>
        <Button onClick={onBack} variant="outline" className="w-full">
          Back to Sign In
        </Button>
      </div>
    );
  }

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
            className="pl-10"
            disabled={isSubmitting}
          />
        </div>
        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Reset Link"}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Back to Sign In
        </button>
      </div>
    </form>
  );
}
