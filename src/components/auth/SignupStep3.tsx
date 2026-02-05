import { Calendar, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { annualRevenueOptions, regionOptions, referralSourceOptions } from "@/data/signupOptions";

interface SignupStep3Props {
  annualRevenue: string;
  setAnnualRevenue: (value: string) => void;
  region: string;
  setRegion: (value: string) => void;
  yearsInBusiness: string;
  setYearsInBusiness: (value: string) => void;
  companyWebsite: string;
  setCompanyWebsite: (value: string) => void;
  referralSource: string;
  setReferralSource: (value: string) => void;
  errors: Record<string, string>;
  isSubmitting: boolean;
  slideDirection: "left" | "right";
}

export function SignupStep3({
  annualRevenue,
  setAnnualRevenue,
  region,
  setRegion,
  yearsInBusiness,
  setYearsInBusiness,
  companyWebsite,
  setCompanyWebsite,
  referralSource,
  setReferralSource,
  errors,
  isSubmitting,
  slideDirection,
}: SignupStep3Props) {
  return (
    <div
      key="step-3"
      className={`space-y-4 ${
        slideDirection === "left" ? "animate-slide-in-from-right" : "animate-slide-in-from-left"
      }`}
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
              onClick={() => setReferralSource(referralSource === option.value ? "" : option.value)}
              disabled={isSubmitting}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                referralSource === option.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background hover:bg-muted border-border text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
