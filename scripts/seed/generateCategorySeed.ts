// Generates seed SQL for category_defaults + category_consumables from the client-side array.
// Values are copied, never retyped. Run: bun scripts/seed/generateCategorySeed.ts
import { categoryDefaults } from '../../src/data/categoryDefaults';

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
const n = (v: number | null) => (v === null ? 'NULL' : String(v));
const num = (s: string) => Number(s.replace(/,/g, ''));

export function parseUsage(c: (typeof categoryDefaults)[number]) {
  let lifeMin: number | null = null, lifeMax: number | null = null;
  if (c.benchmarkType !== 'calendar' && c.benchmarkRange) {
    const m = c.benchmarkRange.match(/^([\d,]+)–([\d,]+) (hrs|mi)$/);
    if (m) { lifeMin = num(m[1]); lifeMax = num(m[2]); }
  }
  let annMin: number | null = null, annMax: number | null = null;
  const a = c.notes.match(/([\d,]+)–([\d,]+) hrs\/yr/);
  if (a) { annMin = num(a[1]); annMax = num(a[2]); }
  return { lifeMin, lifeMax, annMin, annMax };
}

export const consumables: { category: string; name: string; interval: number | null; note: string }[] = [
  { category: 'Construction — Attachment', name: 'Bits/teeth/edges', interval: null, note: 'Bits/teeth/edges consumable' },
  { category: 'Construction — Saw — Cut-Off', name: 'Blades', interval: null, note: 'Blades consumable' },
  { category: 'Irrigation — Trencher — Walk-Behind', name: 'Chain/teeth', interval: null, note: 'Chain/teeth consumable' },
  { category: 'Tree — Stump Grinder', name: 'Teeth', interval: null, note: 'Teeth consumable' },
  { category: 'Construction — Loader — CTL', name: 'Track undercarriage', interval: 2000, note: 'Track undercarriage at ~2,000 hrs is major cost' },
];

if (import.meta.main) {
  const rows = categoryDefaults.map((c, i) => {
    const u = parseUsage(c);
    return `(${q(c.category)},${q(c.division)},${c.defaultUsefulLife},${c.defaultResalePercent},${q(c.defaultAllocation)},${q(c.notes)},${c.maintenancePercent},${c.insurancePercent},NULL,NULL,${q(c.unit.toLowerCase())},${q(c.benchmarkType)},${n(u.lifeMin)},${n(u.lifeMax)},${n(u.annMin)},${n(u.annMax)},${i})`;
  });
  let sql = `INSERT INTO public.category_defaults (category,division,useful_life_years,resale_pct,default_allocation,notes,maintenance_repair_pct,insurance_pct,licensing_annual,fuel_consumption_lph,default_lmn_unit,usage_basis,lifetime_usage_min,lifetime_usage_max,annual_usage_min,annual_usage_max,sort_order) VALUES\n${rows.join(',\n')}\nON CONFLICT (category) DO NOTHING;\n`;
  sql += `INSERT INTO public.category_consumables (category_id,name,interval_hours,source_note) SELECT d.id, v.name, v.iv, v.note FROM (VALUES ${consumables.map(c => `(${q(c.category)},${q(c.name)},${n(c.interval)}::numeric,${q(c.note)})`).join(',')}) AS v(cat,name,iv,note) JOIN public.category_defaults d ON d.category = v.cat ON CONFLICT DO NOTHING;\n`;
  console.log(sql);
}
