import { Building2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { industryOptions, fieldEmployeesOptions } from "@/data/signupOptions";

interface SignupStep2Props {
  companyName: string;
  setCompanyName: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  fieldEmployees: string;
  setFieldEmployees: (value: string) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isFieldValid: (field: string) => boolean;
  slideDirection: "left" | "right";
}

export function SignupStep2({
  companyName,
  setCompanyName,
  industry,
  setIndustry,
  fieldEmployees,
  setFieldEmployees,
  errors,
  isSubmitting,
  isFieldValid,
  slideDirection,
}: SignupStep2Props) {
  return (
    <div
      key="step-2"
      className={`space-y-4 ${
        slideDirection === "left" ? "animate-slide-in-from-right" : "animate-slide-in-from-left"
      }`}
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
          {isFieldValid("companyName") && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-success animate-checkmark-pop" />
          )}
        </div>
        {errors.companyName && <p className="text-sm text-destructive">{errors.companyName}</p>}
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
          {isFieldValid("industry") && (
            <Check className="h-4 w-4 text-success animate-checkmark-pop shrink-0" />
          )}
        </div>
        {errors.industry && <p className="text-sm text-destructive">{errors.industry}</p>}
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
          {isFieldValid("fieldEmployees") && (
            <Check className="h-4 w-4 text-success animate-checkmark-pop shrink-0" />
          )}
        </div>
        {errors.fieldEmployees && (
          <p className="text-sm text-destructive">{errors.fieldEmployees}</p>
        )}
      </div>
    </div>
  );
}
