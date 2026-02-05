import { Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RateLimitResult } from "@/contexts/AuthContext";

interface RateLimitAlertProps {
  rateLimitInfo: RateLimitResult | null;
  retryCountdown: number;
  formatCountdown: (seconds: number) => string;
}

export function RateLimitAlert({ rateLimitInfo, retryCountdown, formatCountdown }: RateLimitAlertProps) {
  if (!rateLimitInfo) return null;

  if (!rateLimitInfo.allowed) {
    return (
      <Alert variant="destructive">
        <Clock className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{rateLimitInfo.message || "Too many attempts. Please try again later."}</span>
          {retryCountdown > 0 && (
            <span className="font-mono text-sm ml-2">{formatCountdown(retryCountdown)}</span>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (rateLimitInfo.warning) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{rateLimitInfo.warning}</AlertDescription>
      </Alert>
    );
  }

  return null;
}
