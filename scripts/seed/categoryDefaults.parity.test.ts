// Parity check: database category_defaults must match the client-side array exactly.
// Run: bun test scripts/seed/categoryDefaults.parity.test.ts  (needs psql access)
import { test, expect } from 'bun:test';
import { categoryDefaults } from '../../src/data/categoryDefaults';

function loadDb() {
  const sql = `select coalesce(json_agg(t),'[]') from (select category, useful_life_years, resale_pct, maintenance_repair_pct, insurance_pct, default_lmn_unit, default_allocation, notes from public.category_defaults) t`;
  const out = Bun.spawnSync(['psql', '-At', '-c', sql]);
  if (out.exitCode !== 0) throw new Error(out.stderr.toString());
  return JSON.parse(out.stdout.toString()) as any[];
}

const db = loadDb();
const byName = new Map(db.map((r) => [r.category, r]));

test('category count is 94 on both sides', () => {
  expect(categoryDefaults.length).toBe(94);
  expect(db.length).toBe(94);
});

test('every category matches exactly', () => {
  const mismatches: string[] = [];
  for (const c of categoryDefaults) {
    const r = byName.get(c.category);
    if (!r) { mismatches.push(`${c.category}: missing in table`); continue; }
    const checks: [string, unknown, unknown][] = [
      ['useful life', Number(r.useful_life_years), c.defaultUsefulLife],
      ['resale %', Number(r.resale_pct), c.defaultResalePercent],
      ['maintenance %', Number(r.maintenance_repair_pct), c.maintenancePercent],
      ['insurance %', Number(r.insurance_pct), c.insurancePercent],
      ['unit', r.default_lmn_unit, c.unit.toLowerCase()],
      ['allocation', r.default_allocation, c.defaultAllocation],
      ['notes', r.notes, c.notes],
    ];
    for (const [f, a, b] of checks) if (a !== b) mismatches.push(`${c.category}: ${f} table=${a} array=${b}`);
  }
  if (mismatches.length) console.log(mismatches.join('\n'));
  expect(mismatches).toEqual([]);
});
