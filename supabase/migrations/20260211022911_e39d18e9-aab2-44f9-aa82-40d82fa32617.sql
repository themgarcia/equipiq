
-- Taxonomy v5: Rename 37 categories in existing equipment records
-- Each UPDATE matches old name → new name exactly

UPDATE equipment SET category = 'Construction — Loader — CTL' WHERE category = 'Construction — Compact Track Loader (CTL)';
UPDATE equipment SET category = 'Construction — Loader — Stand-On' WHERE category = 'Construction — Compact Utility (Stand-On)';
UPDATE equipment SET category = 'Construction — Loader — Wheel' WHERE category = 'Construction — Loader — Wheel Compact';
UPDATE equipment SET category = 'Construction — Saw — Cut-Off' WHERE category = 'Construction — Saw — Cutoff/Demo';
UPDATE equipment SET category = 'Construction — Saw — Masonry' WHERE category = 'Construction — Saw — Masonry/Tile';
UPDATE equipment SET category = 'Construction — Saw — Concrete' WHERE category = 'Construction — Saw — Walk-Behind';
UPDATE equipment SET category = 'Construction — Sweeper' WHERE category = 'Construction — Sweeper — Walk-Behind';
UPDATE equipment SET category = 'Construction — Tractor' WHERE category = 'Construction — Tractor — Compact Utility';
UPDATE equipment SET category = 'Construction — Concrete Mixer' WHERE category = 'Construction — Concrete Mixer — Towable';
UPDATE equipment SET category = 'Fleet — Trailer — Flat Deck' WHERE category = 'Fleet — Trailer — Equipment';
UPDATE equipment SET category = 'Fleet — Truck — Cab Over Body' WHERE category = 'Fleet — Truck — Cab Over';
UPDATE equipment SET category = 'Fleet — Truck — 1/2 Ton' WHERE category = 'Fleet — Truck — Crew Cab 1/2 Ton';
UPDATE equipment SET category = 'Fleet — Truck — 3/4 Ton' WHERE category = 'Fleet — Truck — Crew Cab 3/4 Ton';
UPDATE equipment SET category = 'Fleet — Truck — 1 Ton' WHERE category = 'Fleet — Truck — Crew Cab 1 Ton';
UPDATE equipment SET category = 'Fleet — Truck — Dump Single' WHERE category = 'Fleet — Truck — Dump Single Axle';
UPDATE equipment SET category = 'Fleet — Truck — Dump Tandem' WHERE category = 'Fleet — Truck — Dump Tandem';
UPDATE equipment SET category = 'Fleet — Truck — Flatbed' WHERE category = 'Fleet — Truck — Flatbed/Stake';
UPDATE equipment SET category = 'Irrigation — Directional Drill' WHERE category = 'Irrigation — Underground — Directional Drill';
UPDATE equipment SET category = 'Irrigation — Vibratory Plow' WHERE category = 'Irrigation — Underground — Vibratory Plow';
UPDATE equipment SET category = 'Lawn — Blower — Walk-Behind' WHERE category = 'Lawn — Blower — Wheeled';
UPDATE equipment SET category = 'Lawn — Debris Loader' WHERE category = 'Lawn — Debris Loader — Truck Mount';
UPDATE equipment SET category = 'Lawn — Dethatcher' WHERE category = 'Lawn — Dethatcher — Walk-Behind';
UPDATE equipment SET category = 'Lawn — Hedge Trimmer — Pole' WHERE category = 'Lawn — Hedge Trimmer — Extended Reach';
UPDATE equipment SET category = 'Lawn — Mower — Brush' WHERE category = 'Lawn — Mower — Brush/Front Mount';
UPDATE equipment SET category = 'Lawn — Mower — Robotic' WHERE category = 'Lawn — Mower — Robotic Commercial';
UPDATE equipment SET category = 'Lawn — Mower — 21" Push' WHERE category = 'Lawn — Mower — Walk-Behind 21"';
UPDATE equipment SET category = 'Lawn — Mower — Walk-Behind' WHERE category = 'Lawn — Mower — Walk-Behind 32"+';
UPDATE equipment SET category = 'Lawn — Spreader — Push' WHERE category = 'Lawn — Spreader — Broadcast Push';
UPDATE equipment SET category = 'Lawn — Spreader — Ride-On' WHERE category = 'Lawn — Spreader — Ride-On Applicator';
UPDATE equipment SET category = 'Lawn — Sprayer — Tank' WHERE category = 'Lawn — Sprayer — Pull-Behind/Skid';
UPDATE equipment SET category = 'Snow — Blower' WHERE category = 'Snow — Blower — Walk-Behind';
UPDATE equipment SET category = 'Snow — Brine Sprayer' WHERE category = 'Snow — Brine/Liquid Sprayer';
UPDATE equipment SET category = 'Snow — Spreader — V-Box' WHERE category = 'Snow — Spreader — Hopper (V-Box)';
UPDATE equipment SET category = 'Snow — Spreader — Push' WHERE category = 'Snow — Spreader — Walk-Behind';
UPDATE equipment SET category = 'Tree — Chipper — 6"' WHERE category = 'Tree — Chipper — Brush 6"';
UPDATE equipment SET category = 'Tree — Chipper — 12"+' WHERE category = 'Tree — Chipper — Brush 12"+';
