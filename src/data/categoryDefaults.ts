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
    category: 'Compaction (Heavy)',
    defaultUsefulLife: 10,
    defaultResalePercent: 20,
    notes: 'Ride-on rollers, plate compactors over 500 lbs. These machines are simple and overbuilt, with few complex systems. They can physically operate much longer, but vibration fatigue, engine wear, and reliability drift become meaningful after about ten years.',
    maintenancePercent: 3,
    insurancePercent: 1.0,
  },
  {
    category: 'Compaction (Light)',
    defaultUsefulLife: 8,
    defaultResalePercent: 10,
    notes: 'Walk-behind plate compactors, jumping jacks, vibratory rammers. Light compaction equipment has smaller engines and is exposed to constant vibration and frequent abuse. Rebuilds become more common after eight years.',
    maintenancePercent: 5,
    insurancePercent: 1.0,
  },
  {
    category: 'Excavator – Compact (≤ 6 ton)',
    defaultUsefulLife: 8,
    defaultResalePercent: 25,
    notes: 'Compact excavators experience high cycle counts, tight-access work, and higher abuse per dollar of value. Smaller components are worked hard, leading to higher relative maintenance and shorter competitive life.',
    maintenancePercent: 5.0,
    insurancePercent: 1.5,
  },
  {
    category: 'Excavator – Mid-Size (6–12 ton)',
    defaultUsefulLife: 10,
    defaultResalePercent: 25,
    notes: 'Mid-size excavators represent the best balance of strength and efficiency for many contractors. They are less abused per dollar of asset value, have longer competitive life, and are often the most economically efficient excavators in a fleet.',
    maintenancePercent: 4.0,
    insurancePercent: 2.0,
  },
  {
    category: 'Excavator – Large (12+ ton)',
    defaultUsefulLife: 12,
    defaultResalePercent: 25,
    notes: 'Large excavators are overbuilt relative to most landscape work, experience lower abuse per dollar of value, and retain competitive usefulness longer. Insurance exposure is higher due to asset value and operating risk.',
    maintenancePercent: 3.5,
    insurancePercent: 2.5,
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
    category: 'Lawn (Commercial)',
    defaultUsefulLife: 8,
    defaultResalePercent: 15,
    notes: 'Zero-turns, stand-ons, walk-behinds. Commercial mowers experience high seasonal intensity and visible wear to decks, hydros, bearings, and drivetrains. After roughly eight seasons, cut quality, uptime, and operator confidence decline.',
    maintenancePercent: 6,
    insurancePercent: 1.5,
  },
  {
    category: 'Lawn (Handheld)',
    defaultUsefulLife: 6,
    defaultResalePercent: 5,
    notes: 'Trimmers, blowers, edgers, hedge trimmers. Subject to constant vibration, dirt, moisture, and handling abuse. They are treated as consumables in practice. After six years repair effort and downtime outweigh reliability.',
    maintenancePercent: 8,
    insurancePercent: 0.5,
  },
  {
    category: 'Loader – Mid-Size',
    defaultUsefulLife: 10,
    defaultResalePercent: 18,
    notes: 'Larger CTLs and smaller wheel loaders. Heavier frames, higher capital cost, lower relative abuse per dollar. Bridge between compact loaders and full wheel loaders.',
    maintenancePercent: 4.5,
    insurancePercent: 2.0,
  },
  {
    category: 'Loader – Skid Steer',
    defaultUsefulLife: 8,
    defaultResalePercent: 20,
    notes: 'Wheeled skid steers and compact track loaders. High jobsite abuse, high wear per dollar of value, frequent undercarriage or tire costs. Core fleet workhorses with predictable wear patterns.',
    maintenancePercent: 5.5,
    insurancePercent: 1.75,
  },
  {
    category: 'Loader – Skid Steer Mini',
    defaultUsefulLife: 7,
    defaultResalePercent: 15,
    notes: 'Ditch Witch, Vermeer, Toro mini skids, compact power carriers. High wear rate, frequent attachment swaps, lower insurance exposure due to size. Often operated by less experienced crew members.',
    maintenancePercent: 6,
    insurancePercent: 1.0,
  },
  {
    category: 'Loader – Wheel / Large',
    defaultUsefulLife: 12,
    defaultResalePercent: 15,
    notes: 'Full wheel loaders and larger articulated loaders. Overbuilt for most landscape work, lower abuse per dollar of value, long competitive life. Usually operated by senior staff with more controlled usage.',
    maintenancePercent: 4.0,
    insurancePercent: 2.5,
  },
  {
    category: 'Shop / Other',
    defaultUsefulLife: 12,
    defaultResalePercent: 10,
    notes: 'These assets operate in controlled environments with low abuse and long service potential. Twelve years reflects extended usefulness without assuming indefinite life.',
    maintenancePercent: 3,
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
    category: 'Trailer',
    defaultUsefulLife: 15,
    defaultResalePercent: 35,
    notes: 'Trailers have simple mechanical systems and low technological obsolescence. Rust and structural degradation end their life, not complexity. Fifteen years is conservative for planning.',
    maintenancePercent: 2,
    insurancePercent: 1.0,
  },
  {
    category: 'Vehicle (Commercial)',
    defaultUsefulLife: 12,
    defaultResalePercent: 15,
    notes: 'Purpose-built work trucks: dump trucks, cab-and-chassis, service bodies, landscape trucks. Overbuilt for payload and jobsite use. Longer useful life due to commercial-grade construction.',
    maintenancePercent: 3.5,
    insurancePercent: 2.5,
  },
  {
    category: 'Vehicle (Light-Duty)',
    defaultUsefulLife: 8,
    defaultResalePercent: 20,
    notes: 'Pickups and mixed-use vehicles. High road mileage drives wear. Cycled sooner for reliability and image. Vehicle downtime impacts entire crews.',
    maintenancePercent: 4,
    insurancePercent: 2.0,
  }
];

export function getCategoryDefaults(category: EquipmentCategory): CategoryDefaults {
  return categoryDefaults.find(c => c.category === category) || categoryDefaults[categoryDefaults.length - 1];
}
