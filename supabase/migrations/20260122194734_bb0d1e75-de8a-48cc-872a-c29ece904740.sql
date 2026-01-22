-- Create onboarding_progress table to track user onboarding completion
CREATE TABLE public.onboarding_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  step_dashboard_viewed BOOLEAN NOT NULL DEFAULT false,
  step_equipment_imported BOOLEAN NOT NULL DEFAULT false,
  step_insurance_uploaded BOOLEAN NOT NULL DEFAULT false,
  step_cashflow_viewed BOOLEAN NOT NULL DEFAULT false,
  step_buy_vs_rent_used BOOLEAN NOT NULL DEFAULT false,
  step_fms_exported BOOLEAN NOT NULL DEFAULT false,
  step_methodology_reviewed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own onboarding progress" 
ON public.onboarding_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress" 
ON public.onboarding_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress" 
ON public.onboarding_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_onboarding_progress_updated_at
BEFORE UPDATE ON public.onboarding_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();