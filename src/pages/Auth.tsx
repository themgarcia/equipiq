import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipIQIcon } from "@/components/EquipIQIcon";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupWizard } from "@/components/auth/SignupWizard";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const { signIn, signUp, user, loading, checkRateLimit, clearRateLimit } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate(from, { replace: true });
    }
  }, [user, loading, navigate, from]);

  const getStepTitle = () => {
    return "Account Basics";
  };

  const getStepDescription = () => {
    return "Let's start with your account info";
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
            <h1 className="text-2xl font-bold group-hover:text-primary transition-colors">
              equipIQ
            </h1>
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
                ? "Reset Password"
                : isLogin
                ? "Welcome back"
                : getStepTitle()}
            </CardTitle>
            <CardDescription>
              {isForgotPassword
                ? "Enter your email to receive a reset link"
                : isLogin
                ? "Enter your credentials to access your equipment"
                : getStepDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <ForgotPasswordForm
                onBack={() => setIsForgotPassword(false)}
                checkRateLimit={checkRateLimit}
                clearRateLimit={clearRateLimit}
              />
            ) : isLogin ? (
              <LoginForm
                onForgotPassword={() => setIsForgotPassword(true)}
                signIn={signIn}
                checkRateLimit={checkRateLimit}
              />
            ) : (
              <SignupWizard
                signUp={signUp}
                checkRateLimit={checkRateLimit}
                onSwitchToLogin={() => setIsLogin(true)}
              />
            )}

            {!isForgotPassword && (
              <>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
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
                    By continuing, you agree to our{" "}
                    <a
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-foreground transition-colors"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
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
