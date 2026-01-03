import { EquipmentCategory } from '@/types/equipment';

export interface CategoryDefaults {
  category: EquipmentCategory;
  defaultUsefulLife: number;
  defaultResalePercent: number;
  notes: string;
  maintenancePercent: number; // % of purchase price per year
  insurancePercent: number;   // % of purchase price per year
}

export const categoryDefaults: CategoryDefaults[] = [
  {
    category: 'Mini Skid / Compact Power Carrier',
    defaultUsefulLife: 7,
    defaultResalePercent: 15,
    notes: 'Examples: Toro Dingo, Vermeer mini skid, Cormidi power dumper, Boxer. These machines have small components that take disproportionate abuse. They are often operated by less experienced crew members and are exposed to dirt, vibration, and frequent starts and stops. While they can run longer mechanically, after roughly seven years downtime increases, productivity drops, and operators begin avoiding them.',
    maintenancePercent: 6,
    insurancePercent: 1.0,
  },
  {
    category: 'Skid Steer (Standard)',
    defaultUsefulLife: 8,
    defaultResalePercent: 20,
    notes: 'Examples: Bobcat S/T series, CAT 242–262, Deere 300 series. Skid steers are core fleet workhorses with predictable wear patterns driven by tracks or tires, undercarriage, and hydraulics. They are designed for hard use, but after around eight years maintenance frequency increases and reliability becomes inconsistent compared to newer machines.',
    maintenancePercent: 5,
    insurancePercent: 1.5,
  },
  {
    category: 'Compact Track Loader',
    defaultUsefulLife: 9,
    defaultResalePercent: 20,
    notes: 'Examples: CAT 289, Deere 333, larger CTLs used as step-up machines. These machines are heavier and more capable than standard skid steers, with higher capital cost and typically better care. They age more gracefully but still experience significant hydraulic and attachment stress. After roughly nine years they remain usable, but no longer represent a competitive primary production unit.',
    maintenancePercent: 6,
    insurancePercent: 1.75,
  },
  {
    category: 'Large Loader',
    defaultUsefulLife: 10,
    defaultResalePercent: 25,
    notes: 'Examples: Wheel loaders, large CTLs, high-horsepower loaders. Large loaders are overbuilt for most landscape work and experience lower abuse per dollar of asset value. They are usually operated by senior staff and see more controlled usage. Failures are less frequent, though expensive. Ten years represents a conservative but realistic competitive life.',
    maintenancePercent: 4,
    insurancePercent: 2.0,
  },
  {
    category: 'Excavation',
    defaultUsefulLife: 10,
    defaultResalePercent: 25,
    notes: 'Excavators are designed for long duty cycles with predictable wear that can be serviced over time. However, beyond ten years downtime risk increases and productivity lags behind newer equipment. Pricing assumes reliability and consistency, not maximum possible runtime.',
    maintenancePercent: 4,
    insurancePercent: 1.5,
  },
  {
    category: 'Heavy Compaction Equipment',
    defaultUsefulLife: 10,
    defaultResalePercent: 20,
    notes: 'These machines are simple and overbuilt, with few complex systems. They can physically operate much longer, but vibration fatigue, engine wear, and reliability drift become meaningful after about ten years. At that point they stop being truly dependable.',
    maintenancePercent: 3,
    insurancePercent: 1.0,
  },
  {
    category: 'Light Compaction Equipment',
    defaultUsefulLife: 8,
    defaultResalePercent: 10,
    notes: 'Light compaction equipment has smaller engines and is exposed to constant vibration and frequent abuse. Rebuilds become more common after eight years and reliability declines. Eight years reflects realistic competitive usefulness, not mechanical survival.',
    maintenancePercent: 5,
    insurancePercent: 1.0,
  },
  {
    category: 'Commercial Mowers',
    defaultUsefulLife: 8,
    defaultResalePercent: 15,
    notes: 'Commercial mowers experience high seasonal intensity and visible wear to decks, hydros, bearings, and drivetrains. After roughly eight seasons, cut quality, uptime, and operator confidence decline. Productivity differences versus new units become noticeable.',
    maintenancePercent: 6,
    insurancePercent: 1.5,
  },
  {
    category: 'Handheld Lawn Equipment',
    defaultUsefulLife: 6,
    defaultResalePercent: 5,
    notes: 'Trimmers, blowers, and edgers are subject to constant vibration, dirt, moisture, and handling abuse. They are treated as consumables in practice. After six years repair effort and downtime outweigh reliability.',
    maintenancePercent: 8,
    insurancePercent: 0.5,
  },
  {
    category: 'Handheld Power Tools',
    defaultUsefulLife: 5,
    defaultResalePercent: 5,
    notes: 'Handheld power tools are frequently dropped, lost, stolen, and abused. Battery degradation alone limits effective life. Five years is a generous competitive assumption.',
    maintenancePercent: 8,
    insurancePercent: 0.5,
  },
  {
    category: 'Large Demo & Specialty Tools',
    defaultUsefulLife: 8,
    defaultResalePercent: 15,
    notes: 'Concrete saws, hammer drills, stump grinders. These tools are expensive and typically better cared for, but are used intermittently under high stress. After around eight years reliability declines sharply and parts availability becomes a concern.',
    maintenancePercent: 5,
    insurancePercent: 1.0,
  },
  {
    category: 'Truck / Vehicle',
    defaultUsefulLife: 10,
    defaultResalePercent: 30,
    notes: 'Vehicle downtime impacts entire crews. Maintenance cost accelerates after years eight and nine. At ten years vehicles remain usable and sellable but should no longer be priced as primary fleet assets.',
    maintenancePercent: 3,
    insurancePercent: 2.0,
  },
  {
    category: 'Trailer',
    defaultUsefulLife: 15,
    defaultResalePercent: 35,
    notes: 'Trailers have simple mechanical systems and low technological obsolescence. Rust and structural degradation end their life, not complexity. Fifteen years is conservative for planning.',
    maintenancePercent: 2,
    insurancePercent: 1.0,
  },
  {
    category: 'Snow Equipment',
    defaultUsefulLife: 10,
    defaultResalePercent: 25,
    notes: 'Seasonal use combined with heavy salt exposure accelerates corrosion and wear. After ten seasons reliability declines and repair risk increases.',
    maintenancePercent: 4,
    insurancePercent: 1.5,
  },
  {
    category: 'Shop / Other',
    defaultUsefulLife: 12,
    defaultResalePercent: 10,
    notes: 'These assets operate in controlled environments with low abuse and long service potential. Twelve years reflects extended usefulness without assuming indefinite life.',
    maintenancePercent: 3,
    insurancePercent: 1.0,
  }
];

export function getCategoryDefaults(category: EquipmentCategory): CategoryDefaults {
  return categoryDefaults.find(c => c.category === category) || categoryDefaults[categoryDefaults.length - 1];
}
