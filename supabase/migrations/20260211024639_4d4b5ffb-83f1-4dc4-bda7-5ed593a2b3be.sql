-- Rename "Fleet — Truck — Cab Over Body" to "Fleet — Truck — Cab Over"
UPDATE public.equipment SET category = 'Fleet — Truck — Cab Over' WHERE category = 'Fleet — Truck — Cab Over Body';