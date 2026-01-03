import { EquipmentCategory } from '@/types/equipment';

export interface CategoryDefaults {
  category: EquipmentCategory;
  defaultUsefulLife: number;
  defaultResalePercent: number;
  notes: string;
  // Buy vs. Rent defaults
  typicalDailyRental: number;
  maintenancePercent: number; // % of purchase price per year
  insurancePercent: number;   // % of purchase price per year
}

export const categoryDefaults: CategoryDefaults[] = [
  {
    category: 'Excavation',
    defaultUsefulLife: 7,
    defaultResalePercent: 25,
    notes: 'Mini excavators and compact equipment. High usage, significant wear. Resale conservative due to hour accumulation.',
    typicalDailyRental: 350,
    maintenancePercent: 4,
    insurancePercent: 1.5,
  },
  {
    category: 'Skid Steer / Loader',
    defaultUsefulLife: 6,
    defaultResalePercent: 20,
    notes: 'Heavy daily use expected. Hydraulics and undercarriage are major wear points. Resale depends heavily on hours.',
    typicalDailyRental: 275,
    maintenancePercent: 5,
    insurancePercent: 1.5,
  },
  {
    category: 'Truck / Vehicle',
    defaultUsefulLife: 5,
    defaultResalePercent: 30,
    notes: 'Work trucks depreciate fast but maintain some resale. Consider mileage and body condition.',
    typicalDailyRental: 150,
    maintenancePercent: 3,
    insurancePercent: 2,
  },
  {
    category: 'Heavy Compaction Equipment',
    defaultUsefulLife: 8,
    defaultResalePercent: 20,
    notes: 'Plate compactors, rollers. Durable but specialized market limits resale options.',
    typicalDailyRental: 200,
    maintenancePercent: 3,
    insurancePercent: 1,
  },
  {
    category: 'Light Compaction Equipment',
    defaultUsefulLife: 5,
    defaultResalePercent: 10,
    notes: 'Jumping jacks, small plates. High abuse rate, often replaced rather than repaired.',
    typicalDailyRental: 75,
    maintenancePercent: 5,
    insurancePercent: 1,
  },
  {
    category: 'Commercial Mowers',
    defaultUsefulLife: 4,
    defaultResalePercent: 15,
    notes: 'Zero-turns and stand-ons. High hours in season. Hydros and deck wear are primary concerns.',
    typicalDailyRental: 125,
    maintenancePercent: 6,
    insurancePercent: 1.5,
  },
  {
    category: 'Handheld Power Tools',
    defaultUsefulLife: 3,
    defaultResalePercent: 5,
    notes: 'Trimmers, blowers, chainsaws. Short life, minimal resale. Consider consumable in planning.',
    typicalDailyRental: 35,
    maintenancePercent: 8,
    insurancePercent: 0.5,
  },
  {
    category: 'Large Demo & Specialty Tools',
    defaultUsefulLife: 5,
    defaultResalePercent: 15,
    notes: 'Concrete saws, hammer drills, stump grinders. Specialized use may extend life if well-maintained.',
    typicalDailyRental: 150,
    maintenancePercent: 5,
    insurancePercent: 1,
  },
  {
    category: 'Trailer',
    defaultUsefulLife: 10,
    defaultResalePercent: 35,
    notes: 'Long useful life if maintained. Floor and tires are main wear items. Good resale if not abused.',
    typicalDailyRental: 50,
    maintenancePercent: 2,
    insurancePercent: 1,
  },
  {
    category: 'Snow Equipment',
    defaultUsefulLife: 8,
    defaultResalePercent: 25,
    notes: 'Plows, spreaders, pushers. Seasonal use extends calendar life. Salt damage is main concern.',
    typicalDailyRental: 175,
    maintenancePercent: 4,
    insurancePercent: 1.5,
  },
  {
    category: 'Shop / Other',
    defaultUsefulLife: 7,
    defaultResalePercent: 10,
    notes: 'Welders, compressors, generators. Varies widely. Default is conservative mid-range.',
    typicalDailyRental: 100,
    maintenancePercent: 3,
    insurancePercent: 1,
  }
];

export function getCategoryDefaults(category: EquipmentCategory): CategoryDefaults {
  return categoryDefaults.find(c => c.category === category) || categoryDefaults[categoryDefaults.length - 1];
}
