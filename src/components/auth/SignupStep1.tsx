import { User, Mail, Lock, Eye, EyeOff, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SignupStep1Props {
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isFieldValid: (field: string) => boolean;
  passwordStrength: { level: "weak" | "medium" | "strong"; score: number };
  slideDirection: "left" | "right";
  onSwitchToLogin: () => void;
}

export function SignupStep1({
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  errors,
  isSubmitting,
  isFieldValid,
  passwordStrength,
  slideDirection,
  onSwitchToLogin,
}: SignupStep1Props) {
  return (
    <div
      key="step-1"
      className={`space-y-4 ${
        slideDirection === "left" ? "animate-slide-in-from-right" : "animate-slide-in-from-left"
      }`}
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
          {isFieldValid("fullName") && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
          )}
        </div>
        {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
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
          {isFieldValid("email") && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
          )}
        </div>
        {errors.email && (
          <p className="text-sm text-destructive">
            {errors.email}{" "}
            {errors.email.includes("already registered") && (
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="underline hover:text-foreground transition-colors"
              >
                Sign in here
              </button>
            )}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password *</Label>
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
            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${
              isFieldValid("password") ? "right-9" : "right-3"
            }`}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {isFieldValid("password") && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
          )}
        </div>
        {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
        {/* Password Strength Indicator */}
        {password.length > 0 && (
          <div className="space-y-1.5">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  passwordStrength.level === "weak"
                    ? "bg-destructive"
                    : passwordStrength.level === "medium"
                    ? "bg-warning"
                    : "bg-success"
                }`}
                style={{ width: `${passwordStrength.score}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <p
                className={`text-xs font-medium ${
                  passwordStrength.level === "weak"
                    ? "text-destructive"
                    : passwordStrength.level === "medium"
                    ? "text-warning"
                    : "text-success"
                }`}
              >
                {passwordStrength.level === "weak" && "Weak"}
                {passwordStrength.level === "medium" && "Medium"}
                {passwordStrength.level === "strong" && "Strong"}
              </p>
              <p className="text-xs text-muted-foreground">
                {password.length < 6
                  ? `${6 - password.length} more chars needed`
                  : "Min. 6 characters ✓"}
              </p>
            </div>
          </div>
        )}
        {password.length === 0 && (
          <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
        )}
      </div>
    </div>
  );
}
