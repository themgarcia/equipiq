CREATE TYPE public.lmn_unit AS ENUM ('hours','days');
CREATE TYPE public.usage_basis AS ENUM ('hours','miles','calendar');

CREATE TABLE public.category_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL UNIQUE,
  division text NOT NULL CHECK (division IN ('Construction','Fleet','Irrigation','Lawn','Shop','Snow','Tree')),
  useful_life_years integer NOT NULL,
  resale_pct numeric NOT NULL,
  default_allocation text NOT NULL CHECK (default_allocation IN ('operational','overhead_only')),
  notes text NOT NULL DEFAULT '',
  maintenance_repair_pct numeric NOT NULL,
  insurance_pct numeric NOT NULL,
  licensing_annual numeric,
  fuel_consumption_lph numeric,
  default_lmn_unit public.lmn_unit NOT NULL,
  usage_basis public.usage_basis NOT NULL,
  lifetime_usage_min numeric,
  lifetime_usage_max numeric,
  annual_usage_min numeric,
  annual_usage_max numeric,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_defaults TO authenticated;
GRANT ALL ON public.category_defaults TO service_role;
ALTER TABLE public.category_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read category defaults" ON public.category_defaults FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert category defaults" ON public.category_defaults FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update category defaults" ON public.category_defaults FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete category defaults" ON public.category_defaults FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_category_defaults_updated_at BEFORE UPDATE ON public.category_defaults FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.category_consumables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.category_defaults(id) ON DELETE CASCADE,
  name text NOT NULL,
  interval_hours numeric,
  source_note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_consumables TO authenticated;
GRANT ALL ON public.category_consumables TO service_role;
ALTER TABLE public.category_consumables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can read consumables" ON public.category_consumables FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can insert consumables" ON public.category_consumables FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update consumables" ON public.category_consumables FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete consumables" ON public.category_consumables FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND public.has_role(auth.uid(),'admin'));