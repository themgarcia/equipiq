ALTER TABLE public.equipment
  ADD COLUMN maintenance_annual_override numeric,
  ADD COLUMN licensing_annual_override numeric,
  ADD COLUMN fuel_consumption_lph_override numeric,
  ADD COLUMN insurance_annual_premium numeric;
ALTER TABLE public.equipment
  ADD CONSTRAINT equipment_maintenance_annual_override_nonneg CHECK (maintenance_annual_override IS NULL OR maintenance_annual_override >= 0),
  ADD CONSTRAINT equipment_licensing_annual_override_nonneg CHECK (licensing_annual_override IS NULL OR licensing_annual_override >= 0),
  ADD CONSTRAINT equipment_fuel_consumption_lph_override_nonneg CHECK (fuel_consumption_lph_override IS NULL OR fuel_consumption_lph_override >= 0),
  ADD CONSTRAINT equipment_insurance_annual_premium_nonneg CHECK (insurance_annual_premium IS NULL OR insurance_annual_premium >= 0);