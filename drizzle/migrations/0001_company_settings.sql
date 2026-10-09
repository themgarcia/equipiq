CREATE TYPE public.recovery_basis AS ENUM ('net_of_resale', 'gross');

CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  org_id uuid NULL,
  fuel_price_per_litre numeric(10,4) NULL CHECK (fuel_price_per_litre IS NULL OR fuel_price_per_litre > 0),
  market_finance_rate_pct numeric(6,3) NULL CHECK (market_finance_rate_pct IS NULL OR (market_finance_rate_pct >= 0 AND market_finance_rate_pct <= 100)),
  default_hours_per_day numeric(4,1) NOT NULL DEFAULT 8 CHECK (default_hours_per_day > 0 AND default_hours_per_day <= 24),
  recovery_basis public.recovery_basis NOT NULL DEFAULT 'net_of_resale',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.company_settings.org_id IS 'Reserved for future organisation scoping; unused today.';

GRANT SELECT, INSERT, UPDATE ON public.company_settings TO authenticated;
GRANT ALL ON public.company_settings TO service_role;

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own company settings" ON public.company_settings
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Users insert own company settings" ON public.company_settings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "Users update own company settings" ON public.company_settings
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND user_id = auth.uid()) WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "No deletes of company settings" ON public.company_settings
  FOR DELETE TO authenticated USING (false);

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();