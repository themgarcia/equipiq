CREATE TABLE public.category_division_allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  service_division_id uuid REFERENCES public.service_divisions(id) ON DELETE CASCADE,
  months_committed numeric CHECK (months_committed IS NULL OR (months_committed > 0 AND months_committed <= 12)),
  share_of_year numeric NOT NULL CHECK (share_of_year > 0 AND share_of_year <= 1),
  expected_hours_per_unit numeric CHECK (expected_hours_per_unit IS NULL OR expected_hours_per_unit >= 0),
  allocation_type text CHECK (allocation_type IS NULL OR allocation_type IN ('operational','overhead_only','owner_perk')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX category_division_allocations_uniq ON public.category_division_allocations (user_id, category, COALESCE(service_division_id, '00000000-0000-0000-0000-000000000000'::uuid));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.category_division_allocations TO authenticated;
GRANT ALL ON public.category_division_allocations TO service_role;
ALTER TABLE public.category_division_allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cda own select" ON public.category_division_allocations FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "cda own insert" ON public.category_division_allocations FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "cda own update" ON public.category_division_allocations FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cda own delete" ON public.category_division_allocations FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE TRIGGER update_cda_updated_at BEFORE UPDATE ON public.category_division_allocations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.check_category_allocation_shares()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE _uid uuid; _cat text; _n int; _sum numeric;
BEGIN
  _uid := COALESCE(NEW.user_id, OLD.user_id); _cat := COALESCE(NEW.category, OLD.category);
  SELECT count(*), COALESCE(sum(share_of_year),0) INTO _n, _sum FROM public.category_division_allocations WHERE user_id = _uid AND category = _cat;
  IF _n > 0 AND abs(_sum - 1) > 0.001 THEN
    RAISE EXCEPTION 'Division shares for this category total % %%, they must total 100%%', round(_sum*100,1);
  END IF;
  RETURN NULL;
END; $$;
CREATE CONSTRAINT TRIGGER cda_shares_total_100 AFTER INSERT OR UPDATE OR DELETE ON public.category_division_allocations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.check_category_allocation_shares();

CREATE OR REPLACE FUNCTION public.replace_category_allocations(_category text, _rows jsonb)
RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  DELETE FROM public.category_division_allocations WHERE user_id = auth.uid() AND category = _category;
  INSERT INTO public.category_division_allocations (user_id, category, service_division_id, months_committed, share_of_year, expected_hours_per_unit, allocation_type)
  SELECT auth.uid(), _category, NULLIF(r->>'service_division_id','')::uuid, (r->>'months_committed')::numeric,
         (r->>'share_of_year')::numeric, (r->>'expected_hours_per_unit')::numeric, NULLIF(r->>'allocation_type','')
  FROM jsonb_array_elements(_rows) r;
END; $$;

CREATE TABLE public.taxonomy_division_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  taxonomy_division text NOT NULL CHECK (taxonomy_division IN ('Construction','Fleet','Irrigation','Lawn','Shop','Snow','Tree')),
  service_division_ids uuid[] NOT NULL DEFAULT '{}',
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, taxonomy_division)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.taxonomy_division_mappings TO authenticated;
GRANT ALL ON public.taxonomy_division_mappings TO service_role;
ALTER TABLE public.taxonomy_division_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tdm own select" ON public.taxonomy_division_mappings FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "tdm own insert" ON public.taxonomy_division_mappings FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "tdm own update" ON public.taxonomy_division_mappings FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tdm own delete" ON public.taxonomy_division_mappings FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE TRIGGER update_tdm_updated_at BEFORE UPDATE ON public.taxonomy_division_mappings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.equipment_division_allocations ADD COLUMN is_override boolean NOT NULL DEFAULT false;
ALTER TABLE public.equipment_division_allocations ADD COLUMN allocation_type text CHECK (allocation_type IS NULL OR allocation_type IN ('operational','overhead_only','owner_perk'));
UPDATE public.equipment_division_allocations a SET allocation_type = e.allocation_type FROM public.equipment e WHERE e.id = a.equipment_id;
UPDATE public.equipment_division_allocations a SET is_override = true
  WHERE a.equipment_id IN (SELECT equipment_id FROM public.equipment_division_allocations WHERE service_division_id IS NOT NULL);

COMMENT ON COLUMN public.equipment_division_allocations.rate_basis IS 'DEPRECATED: LMN unit is category_defaults.default_lmn_unit; seasonal recovery is allocation_type';
COMMENT ON COLUMN public.equipment.allocation_type IS 'DEPRECATED at 9C: per-division value lives on equipment_division_allocations.allocation_type (synced by trigger until then)';

CREATE OR REPLACE FUNCTION public.equipment_default_allocation()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.equipment_division_allocations (user_id, equipment_id, share_of_year, recovery_method, allocation_type)
    VALUES (NEW.user_id, NEW.id, 1, COALESCE(NEW.lmn_recovery_method,'owned'), NEW.allocation_type);
  ELSE
    IF NEW.lmn_recovery_method IS DISTINCT FROM OLD.lmn_recovery_method THEN
      UPDATE public.equipment_division_allocations SET recovery_method = COALESCE(NEW.lmn_recovery_method,'owned') WHERE equipment_id = NEW.id;
    END IF;
    IF NEW.allocation_type IS DISTINCT FROM OLD.allocation_type THEN
      UPDATE public.equipment_division_allocations SET allocation_type = NEW.allocation_type WHERE equipment_id = NEW.id;
    END IF;
  END IF;
  RETURN NULL;
END; $$;

CREATE OR REPLACE FUNCTION public.replace_equipment_allocations(_equipment_id uuid, _rows jsonb)
 RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE _atype text;
BEGIN
  SELECT allocation_type INTO _atype FROM public.equipment WHERE id = _equipment_id;
  DELETE FROM public.equipment_division_allocations WHERE equipment_id = _equipment_id;
  INSERT INTO public.equipment_division_allocations (user_id, equipment_id, service_division_id, months_committed, share_of_year, expected_hours, recovery_method, allocation_type, is_override)
  SELECT auth.uid(), _equipment_id, NULLIF(r->>'service_division_id','')::uuid, (r->>'months_committed')::numeric,
         (r->>'share_of_year')::numeric, (r->>'expected_hours')::numeric,
         COALESCE(r->>'recovery_method','owned'), COALESCE(NULLIF(r->>'allocation_type',''), _atype), true
  FROM jsonb_array_elements(_rows) r;
END; $$;

CREATE OR REPLACE FUNCTION public.reset_equipment_allocations_to_inherit(_equipment_id uuid)
 RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE _m text; _atype text;
BEGIN
  SELECT COALESCE(lmn_recovery_method,'owned'), allocation_type INTO _m, _atype FROM public.equipment WHERE id = _equipment_id;
  DELETE FROM public.equipment_division_allocations WHERE equipment_id = _equipment_id;
  INSERT INTO public.equipment_division_allocations (user_id, equipment_id, share_of_year, recovery_method, allocation_type, is_override)
  VALUES (auth.uid(), _equipment_id, 1, _m, _atype, false);
END; $$;