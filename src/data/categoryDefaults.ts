import { CategoryDefaults, EquipmentCategory } from '@/types/equipment';

export const categoryDefaults: CategoryDefaults[] = [
  {
    category: 'Excavation',
    defaultUsefulLife: 7,
    defaultResalePercent: 25,
    notes: 'Mini excavators and compact equipment. High usage, significant wear. Resale conservative due to hour accumulation.'
  },
  {
    category: 'Skid Steer / Loader',
    defaultUsefulLife: 6,
    defaultResalePercent: 20,
    notes: 'Heavy daily use expected. Hydraulics and undercarriage are major wear points. Resale depends heavily on hours.'
  },
  {
    category: 'Truck / Vehicle',
    defaultUsefulLife: 5,
    defaultResalePercent: 30,
    notes: 'Work trucks depreciate fast but maintain some resale. Consider mileage and body condition.'
  },
  {
    category: 'Heavy Compaction Equipment',
    defaultUsefulLife: 8,
    defaultResalePercent: 20,
    notes: 'Plate compactors, rollers. Durable but specialized market limits resale options.'
  },
  {
    category: 'Light Compaction Equipment',
    defaultUsefulLife: 5,
    defaultResalePercent: 10,
    notes: 'Jumping jacks, small plates. High abuse rate, often replaced rather than repaired.'
  },
  {
    category: 'Commercial Mowers',
    defaultUsefulLife: 4,
    defaultResalePercent: 15,
    notes: 'Zero-turns and stand-ons. High hours in season. Hydros and deck wear are primary concerns.'
  },
  {
    category: 'Handheld Power Tools',
    defaultUsefulLife: 3,
    defaultResalePercent: 5,
    notes: 'Trimmers, blowers, chainsaws. Short life, minimal resale. Consider consumable in planning.'
  },
  {
    category: 'Large Demo & Specialty Tools',
    defaultUsefulLife: 5,
    defaultResalePercent: 15,
    notes: 'Concrete saws, hammer drills, stump grinders. Specialized use may extend life if well-maintained.'
  },
  {
    category: 'Trailer',
    defaultUsefulLife: 10,
    defaultResalePercent: 35,
    notes: 'Long useful life if maintained. Floor and tires are main wear items. Good resale if not abused.'
  },
  {
    category: 'Snow Equipment',
    defaultUsefulLife: 8,
    defaultResalePercent: 25,
    notes: 'Plows, spreaders, pushers. Seasonal use extends calendar life. Salt damage is main concern.'
  },
  {
    category: 'Shop / Other',
    defaultUsefulLife: 7,
    defaultResalePercent: 10,
    notes: 'Welders, compressors, generators. Varies widely. Default is conservative mid-range.'
  }
];

export function getCategoryDefaults(category: EquipmentCategory): CategoryDefaults {
  return categoryDefaults.find(c => c.category === category) || categoryDefaults[categoryDefaults.length - 1];
}
