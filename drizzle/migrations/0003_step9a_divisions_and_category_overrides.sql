CREATE TABLE public.user_category_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  useful_life_years integer CHECK (useful_life_years IS NULL OR (useful_life_years >= 1 AND useful_life_years <= 50)),
  resale_pct numeric CHECK (resale_pct IS NULL OR (resale_pct >= 0 AND resale_pct <= 100)),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_category_overrides TO authenticated;
GRANT ALL ON public.user_category_overrides TO service_role;
ALTER TABLE public.user_category_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own category overrides select" ON public.user_category_overrides FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own category overrides insert" ON public.user_category_overrides FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own category overrides update" ON public.user_category_overrides FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own category overrides delete" ON public.user_category_overrides FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE TRIGGER update_user_category_overrides_updated_at BEFORE UPDATE ON public.user_category_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_divisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  org_id uuid,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  season_months numeric NOT NULL CHECK (season_months > 0 AND season_months <= 12),
  season_start_month integer CHECK (season_start_month IS NULL OR season_start_month BETWEEN 1 AND 12),
  season_end_month integer CHECK (season_end_month IS NULL OR season_end_month BETWEEN 1 AND 12),
  events_per_season numeric CHECK (events_per_season IS NULL OR events_per_season > 0),
  sort_order integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_divisions TO authenticated;
GRANT ALL ON public.service_divisions TO service_role;
ALTER TABLE public.service_divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own divisions select" ON public.service_divisions FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own divisions insert" ON public.service_divisions FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own divisions update" ON public.service_divisions FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own divisions delete" ON public.service_divisions FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE TRIGGER update_service_divisions_updated_at BEFORE UPDATE ON public.service_divisions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.equipment_division_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  equipment_id uuid NOT NULL REFERENCES public.equipment(id) ON DELETE CASCADE,
  service_division_id uuid REFERENCES public.service_divisions(id) ON DELETE RESTRICT,
  months_committed numeric CHECK (months_committed IS NULL OR (months_committed > 0 AND months_committed <= 12)),
  share_of_year numeric NOT NULL CHECK (share_of_year > 0 AND share_of_year <= 1),
  expected_hours numeric CHECK (expected_hours IS NULL OR expected_hours >= 0),
  recovery_method text NOT NULL DEFAULT 'owned' CHECK (recovery_method IN ('owned','leased')),
  rate_basis text NOT NULL DEFAULT 'hourly' CHECK (rate_basis IN ('hourly','seasonal','per_event')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (equipment_id, service_division_id)
);
CREATE INDEX idx_eda_equipment ON public.equipment_division_allocations(equipment_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.equipment_division_allocations TO authenticated;
GRANT ALL ON public.equipment_division_allocations TO service_role;
ALTER TABLE public.equipment_division_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own allocations select" ON public.equipment_division_allocations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own allocations insert" ON public.equipment_division_allocations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own allocations update" ON public.equipment_division_allocations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Own allocations delete" ON public.equipment_division_allocations FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE TRIGGER update_eda_updated_at BEFORE UPDATE ON public.equipment_division_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Shares must total 100% per unit (checked at commit; empty = unit deleted)
CREATE OR REPLACE FUNCTION public.check_allocation_shares()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE _eid uuid; _n int; _sum numeric;
BEGIN
  _eid := COALESCE(NEW.equipment_id, OLD.equipment_id);
  SELECT count(*), COALESCE(sum(share_of_year),0) INTO _n, _sum FROM public.equipment_division_allocations WHERE equipment_id = _eid;
  IF _n > 0 AND abs(_sum - 1) > 0.001 THEN
    RAISE EXCEPTION 'Division shares for this unit total % %%, they must total 100%%', round(_sum*100,1);
  END IF;
  RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER eda_shares_total_100 AFTER INSERT OR UPDATE OR DELETE ON public.equipment_division_allocations
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_allocation_shares();

-- Atomic replace of a unit's allocations (invoker rights, RLS applies)
CREATE OR REPLACE FUNCTION public.replace_equipment_allocations(_equipment_id uuid, _rows jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM public.equipment_division_allocations WHERE equipment_id = _equipment_id;
  INSERT INTO public.equipment_division_allocations (user_id, equipment_id, service_division_id, months_committed, share_of_year, expected_hours, recovery_method, rate_basis)
  SELECT auth.uid(), _equipment_id, NULLIF(r->>'service_division_id','')::uuid, (r->>'months_committed')::numeric,
         (r->>'share_of_year')::numeric, (r->>'expected_hours')::numeric,
         COALESCE(r->>'recovery_method','owned'), COALESCE(r->>'rate_basis','hourly')
  FROM jsonb_array_elements(_rows) r;
END; $$;
GRANT EXECUTE ON FUNCTION public.replace_equipment_allocations(uuid, jsonb) TO authenticated;

-- New equipment gets a year-round shared row; method changes stay in sync
CREATE OR REPLACE FUNCTION public.equipment_default_allocation()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.equipment_division_allocations (user_id, equipment_id, share_of_year, recovery_method)
    VALUES (NEW.user_id, NEW.id, 1, COALESCE(NEW.lmn_recovery_method,'owned'));
  ELSIF NEW.lmn_recovery_method IS DISTINCT FROM OLD.lmn_recovery_method THEN
    UPDATE public.equipment_division_allocations SET recovery_method = COALESCE(NEW.lmn_recovery_method,'owned') WHERE equipment_id = NEW.id;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER equipment_default_allocation_ins AFTER INSERT ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.equipment_default_allocation();
CREATE TRIGGER equipment_default_allocation_upd AFTER UPDATE OF lmn_recovery_method ON public.equipment FOR EACH ROW EXECUTE FUNCTION public.equipment_default_allocation();

INSERT INTO public.equipment_division_allocations (user_id, equipment_id, share_of_year, recovery_method, rate_basis)
SELECT user_id, id, 1, COALESCE(lmn_recovery_method,'owned'), 'hourly' FROM public.equipment;

COMMENT ON COLUMN public.equipment.lmn_recovery_method IS 'DEPRECATED: replaced by equipment_division_allocations.recovery_method (kept in sync by trigger until 9C cutover)';