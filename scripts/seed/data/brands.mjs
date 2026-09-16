// Brand catalog for seeding. Prices are approximate new-car USD prices in the
// Korean market; `type` maps to CarType, `fuels` lists plausible drivetrains.
// `search` overrides the Wikimedia Commons query for the brand.
const G = 'GASOLINE', D = 'DIESEL', L = 'LPG', H = 'HYBRID', E = 'ELECTRIC', HY = 'HYDROGEN';
const m = (name, type, base, fuels = [G], seats = 5, search) => ({ name, type, base, fuels, seats, search });

export const BRANDS = [
	{ key: 'HYUNDAI', display: 'Hyundai', search: 'Hyundai', family: 'kr', weight: 22, models: [
		m('Avante', 'COMPACT', 18000, [G, L, H]), m('Sonata', 'MIDSIZE', 26000, [G, L, H]), m('Grandeur', 'LARGE', 34000, [G, L, H]),
		m('Tucson', 'SUV', 27000, [G, D, H]), m('Santa Fe', 'SUV', 33000, [G, D, H]), m('Palisade', 'SUV', 40000, [G, D], 7),
		m('Kona', 'SUV', 24000, [G, H, E]), m('Venue', 'SUV', 18000), m('Casper', 'LIGHT', 13000, [G, E], 4),
		m('Ioniq 5', 'SUV', 45000, [E]), m('Ioniq 6', 'MIDSIZE', 44000, [E]), m('Staria', 'OTHER', 32000, [D, L], 9),
		m('Porter II', 'TRUCK', 17000, [D, L, E], 3, 'Hyundai Porter'), m('Nexo', 'SUV', 55000, [HY]), m('Accent', 'COMPACT', 14000),
		m('i30', 'COMPACT', 19000), m('Veloster', 'COMPACT', 26000, [G], 4),
	] },
	{ key: 'KIA', display: 'Kia', search: 'Kia', family: 'kr', weight: 20, models: [
		m('Morning', 'LIGHT', 12000, [G], 5, 'Kia Picanto'), m('Ray', 'LIGHT', 12500, [G, E], 4), m('K3', 'COMPACT', 17500),
		m('K5', 'MIDSIZE', 25000, [G, L, H]), m('K8', 'LARGE', 33000, [G, L, H]), m('K9', 'LARGE', 55000),
		m('Seltos', 'SUV', 22000), m('Sportage', 'SUV', 26000, [G, D, H]), m('Sorento', 'SUV', 32000, [G, D, H], 7),
		m('Mohave', 'SUV', 42000, [D], 7), m('Carnival', 'OTHER', 34000, [G, D, H], 9), m('Niro', 'SUV', 26000, [H, E]),
		m('EV6', 'SUV', 46000, [E]), m('EV9', 'SUV', 62000, [E], 7), m('Stinger', 'LARGE', 38000),
		m('Bongo III', 'TRUCK', 16000, [D, L, E], 3, 'Kia Bongo'), m('Stonic', 'SUV', 17000),
	] },
	{ key: 'GENESIS', display: 'Genesis', search: 'Genesis', family: 'kr', weight: 8, models: [
		m('G70', 'MIDSIZE', 38000), m('G80', 'LARGE', 52000, [G, E]), m('G90', 'LARGE', 78000), m('GV60', 'SUV', 58000, [E]),
		m('GV70', 'SUV', 46000, [G, D, E]), m('GV80', 'SUV', 60000, [G, D], 7),
	] },
	{ key: 'CHEVROLET', display: 'Chevrolet', search: 'Chevrolet', family: 'us', weight: 10, models: [
		m('Spark', 'LIGHT', 11000), m('Malibu', 'MIDSIZE', 24000, [G, H]), m('Trax', 'SUV', 19000), m('Trailblazer', 'SUV', 24000),
		m('Equinox', 'SUV', 30000), m('Traverse', 'SUV', 42000, [G], 7), m('Colorado', 'TRUCK', 38000), m('Bolt EV', 'COMPACT', 33000, [E]),
		m('Tahoe', 'SUV', 70000, [G], 7), m('Camaro', 'MIDSIZE', 45000, [G], 4), m('Impala', 'LARGE', 32000),
	] },
	{ key: 'KGM', display: 'KGM', search: 'SsangYong', family: 'kr', weight: 5, models: [
		m('Torres', 'SUV', 27000, [G, E], 5, 'KGM Torres'), m('Tivoli', 'SUV', 18000), m('Korando', 'SUV', 23000, [G, D]),
		m('Rexton', 'SUV', 35000, [D], 7), m('Rexton Sports', 'TRUCK', 28000, [D]),
	] },
	{ key: 'RENAULT KOREA', display: 'Renault Korea', search: 'Renault Samsung', family: 'kr', weight: 5, models: [
		m('SM6', 'MIDSIZE', 24000, [G, L]), m('QM6', 'SUV', 26000, [G, L]), m('XM3', 'SUV', 21000, [G, H]),
		m('Grand Koleos', 'SUV', 33000, [H], 5, 'Renault Grand Koleos'), m('Zoe', 'COMPACT', 30000, [E], 5, 'Renault Zoe'),
		m('Master', 'OTHER', 30000, [D], 3, 'Renault Master'),
	] },
	{ key: 'BMW', display: 'BMW', search: 'BMW', family: 'de', weight: 12, models: [
		m('1 Series', 'COMPACT', 36000), m('2 Series', 'COMPACT', 40000), m('3 Series', 'MIDSIZE', 50000, [G, D, H]),
		m('4 Series', 'MIDSIZE', 55000), m('5 Series', 'LARGE', 62000, [G, D, H]), m('7 Series', 'LARGE', 110000),
		m('X1', 'SUV', 45000), m('X3', 'SUV', 58000, [G, D]), m('X5', 'SUV', 85000, [G, D, H]), m('X6', 'SUV', 95000),
		m('X7', 'SUV', 120000, [G, D], 7), m('i4', 'MIDSIZE', 65000, [E]), m('iX', 'SUV', 95000, [E]), m('iX3', 'SUV', 68000, [E]),
		m('M4', 'MIDSIZE', 95000, [G], 4), m('Z4', 'COMPACT', 60000, [G], 2),
	] },
	{ key: 'BENZ', display: 'Mercedes-Benz', search: 'Mercedes-Benz', family: 'de', weight: 12, models: [
		m('A-Class', 'COMPACT', 38000), m('CLA-Class', 'COMPACT', 45000, [G], 5, 'Mercedes-Benz CLA'), m('C-Class', 'MIDSIZE', 52000, [G, D, H]),
		m('E-Class', 'LARGE', 68000, [G, D, H]), m('S-Class', 'LARGE', 130000, [G, D, H]), m('GLA-Class', 'SUV', 42000, [G], 5, 'Mercedes-Benz GLA'),
		m('GLB-Class', 'SUV', 48000, [G, D], 7, 'Mercedes-Benz GLB'), m('GLC-Class', 'SUV', 60000, [G, D, H], 5, 'Mercedes-Benz GLC'),
		m('GLE-Class', 'SUV', 85000, [G, D], 5, 'Mercedes-Benz GLE'), m('GLS-Class', 'SUV', 120000, [G, D], 7, 'Mercedes-Benz GLS'),
		m('G-Class', 'SUV', 150000, [G, D], 5, 'Mercedes-Benz G-Class'), m('EQA', 'SUV', 55000, [E]), m('EQB', 'SUV', 60000, [E], 7),
		m('EQE', 'LARGE', 90000, [E]), m('EQS', 'LARGE', 140000, [E]), m('AMG GT', 'MIDSIZE', 160000, [G], 2, 'Mercedes-AMG GT'),
	] },
	{ key: 'AUDI', display: 'Audi', search: 'Audi', family: 'de', weight: 8, models: [
		m('A3', 'COMPACT', 38000), m('A4', 'MIDSIZE', 48000, [G, D]), m('A5', 'MIDSIZE', 55000), m('A6', 'LARGE', 65000, [G, D]),
		m('A7', 'LARGE', 78000), m('A8', 'LARGE', 110000), m('Q3', 'SUV', 45000), m('Q5', 'SUV', 58000, [G, D]),
		m('Q7', 'SUV', 82000, [G, D], 7), m('Q8', 'SUV', 95000), m('e-tron', 'SUV', 85000, [E]), m('Q4 e-tron', 'SUV', 62000, [E]),
		m('e-tron GT', 'LARGE', 120000, [E]), m('TT', 'COMPACT', 55000, [G], 2), m('RS6', 'LARGE', 130000, [G], 5, 'Audi RS 6'),
	] },
	{ key: 'TESLA', display: 'Tesla', search: 'Tesla', family: 'ev', weight: 8, models: [
		m('Model 3', 'MIDSIZE', 45000, [E]), m('Model Y', 'SUV', 52000, [E]), m('Model S', 'LARGE', 95000, [E]),
		m('Model X', 'SUV', 105000, [E], 7), m('Cybertruck', 'TRUCK', 90000, [E]),
	] },
	{ key: 'TOYOTA', display: 'Toyota', search: 'Toyota', family: 'jp', weight: 8, models: [
		m('Camry', 'MIDSIZE', 32000, [G, H]), m('Corolla', 'COMPACT', 22000, [G, H]), m('Prius', 'COMPACT', 30000, [H]),
		m('RAV4', 'SUV', 33000, [G, H]), m('Highlander', 'SUV', 45000, [H], 7), m('Sienna', 'OTHER', 48000, [H], 7),
		m('Alphard', 'OTHER', 65000, [H], 7), m('Land Cruiser', 'SUV', 90000, [G, D], 7), m('Crown', 'LARGE', 50000, [H]),
		m('GR86', 'COMPACT', 33000, [G], 4), m('Supra', 'MIDSIZE', 55000, [G], 2), m('Avalon', 'LARGE', 40000, [G, H]),
		m('Hilux', 'TRUCK', 35000, [D]), m('C-HR', 'SUV', 26000, [H]), m('bZ4X', 'SUV', 45000, [E]),
	] },
	{ key: 'LEXUS', display: 'Lexus', search: 'Lexus', family: 'jp', weight: 5, models: [
		m('ES', 'LARGE', 50000, [H, G]), m('IS', 'MIDSIZE', 45000), m('LS', 'LARGE', 90000, [H, G]), m('NX', 'SUV', 52000, [H, G]),
		m('RX', 'SUV', 65000, [H, G]), m('UX', 'SUV', 40000, [H, E]), m('GX', 'SUV', 70000, [G], 7), m('LX', 'SUV', 110000, [G], 7),
		m('LC', 'MIDSIZE', 110000, [G, H], 4), m('RZ', 'SUV', 70000, [E]),
	] },
	{ key: 'HONDA', display: 'Honda', search: 'Honda', family: 'jp', weight: 5, models: [
		m('Accord', 'MIDSIZE', 33000, [G, H]), m('Civic', 'COMPACT', 26000, [G, H]), m('CR-V', 'SUV', 35000, [G, H]),
		m('HR-V', 'SUV', 27000), m('Pilot', 'SUV', 42000, [G], 7), m('Odyssey', 'OTHER', 40000, [G], 7), m('Fit', 'COMPACT', 18000, [G, H]),
	] },
	{ key: 'VOLKSWAGEN', display: 'Volkswagen', search: 'Volkswagen', family: 'de', weight: 5, models: [
		m('Golf', 'COMPACT', 30000, [G, D]), m('Jetta', 'COMPACT', 27000), m('Passat', 'MIDSIZE', 35000, [G, D]),
		m('Arteon', 'LARGE', 48000, [G, D]), m('Tiguan', 'SUV', 38000, [G, D]), m('Touareg', 'SUV', 70000, [D, G]),
		m('ID.4', 'SUV', 50000, [E]), m('Polo', 'COMPACT', 22000), m('T-Roc', 'SUV', 30000), m('Atlas', 'SUV', 45000, [G], 7),
	] },
	{ key: 'PORSCHE', display: 'Porsche', search: 'Porsche', family: 'de', weight: 4, models: [
		m('911', 'MIDSIZE', 130000, [G], 4), m('Cayenne', 'SUV', 95000, [G, H]), m('Macan', 'SUV', 70000, [G, E]),
		m('Panamera', 'LARGE', 110000, [G, H]), m('Taycan', 'LARGE', 100000, [E]), m('718 Boxster', 'COMPACT', 75000, [G], 2),
		m('718 Cayman', 'COMPACT', 72000, [G], 2),
	] },
	{ key: 'VOLVO', display: 'Volvo', search: 'Volvo', family: 'de', weight: 4, models: [
		m('XC40', 'SUV', 45000, [G, E]), m('XC60', 'SUV', 60000, [G, H]), m('XC90', 'SUV', 82000, [G, H], 7),
		m('S60', 'MIDSIZE', 45000, [G, H]), m('S90', 'LARGE', 62000, [G, H]), m('V60', 'MIDSIZE', 48000, [G, H]),
		m('C40', 'SUV', 55000, [E]), m('EX30', 'SUV', 42000, [E]), m('V90', 'LARGE', 62000),
	] },
	{ key: 'FORD', display: 'Ford', search: 'Ford', family: 'us', weight: 4, models: [
		m('Explorer', 'SUV', 55000, [G], 7), m('Mustang', 'MIDSIZE', 50000, [G], 4), m('Bronco', 'SUV', 55000),
		m('F-150', 'TRUCK', 60000, [G, H]), m('Ranger', 'TRUCK', 45000, [D]), m('Mustang Mach-E', 'SUV', 58000, [E]),
		m('Escape', 'SUV', 35000, [G, H]), m('Expedition', 'SUV', 70000, [G], 7), m('Kuga', 'SUV', 36000),
	] },
	{ key: 'NISSAN', display: 'Nissan', search: 'Nissan', family: 'jp', weight: 3, models: [
		m('Altima', 'MIDSIZE', 28000), m('Rogue', 'SUV', 33000), m('Pathfinder', 'SUV', 45000, [G], 7), m('Leaf', 'COMPACT', 32000, [E]),
		m('Qashqai', 'SUV', 30000), m('Juke', 'SUV', 25000), m('X-Trail', 'SUV', 32000, [G, H]), m('Maxima', 'LARGE', 40000),
		m('GT-R', 'MIDSIZE', 120000, [G], 4), m('Murano', 'SUV', 40000),
	] },
	{ key: 'MAZDA', display: 'Mazda', search: 'Mazda', family: 'jp', weight: 3, models: [
		m('Mazda3', 'COMPACT', 24000), m('Mazda6', 'MIDSIZE', 30000), m('CX-5', 'SUV', 32000, [G, D]), m('CX-30', 'SUV', 27000),
		m('CX-60', 'SUV', 45000, [D, H]), m('CX-90', 'SUV', 55000, [H, G], 7), m('MX-5', 'COMPACT', 33000, [G], 2),
		m('CX-3', 'SUV', 24000), m('MX-30', 'SUV', 35000, [E]),
	] },
	{ key: 'LAND ROVER', display: 'Land Rover', search: 'Land Rover', family: 'de', weight: 3, models: [
		m('Range Rover', 'SUV', 130000, [G, D, H]), m('Range Rover Sport', 'SUV', 100000, [G, D, H]), m('Range Rover Evoque', 'SUV', 55000, [G, D]),
		m('Range Rover Velar', 'SUV', 70000), m('Discovery', 'SUV', 75000, [D, G], 7), m('Discovery Sport', 'SUV', 50000, [G, D], 7),
		m('Defender', 'SUV', 85000, [G, D]),
	] },
	{ key: 'MINI', display: 'MINI', search: 'Mini', family: 'de', weight: 3, models: [
		m('Cooper', 'COMPACT', 35000, [G], 4, 'Mini Cooper'), m('Countryman', 'SUV', 42000, [G, H], 5, 'Mini Countryman'),
		m('Clubman', 'COMPACT', 38000, [G], 5, 'Mini Clubman'), m('Cooper SE', 'COMPACT', 40000, [E], 4, 'Mini Cooper SE'),
		m('Cooper Convertible', 'COMPACT', 40000, [G], 4, 'Mini Cooper Convertible'), m('Aceman', 'SUV', 42000, [E], 5, 'Mini Aceman'),
	] },
	{ key: 'JEEP', display: 'Jeep', search: 'Jeep', family: 'us', weight: 3, models: [
		m('Wrangler', 'SUV', 55000, [G, H]), m('Grand Cherokee', 'SUV', 65000, [G, H]), m('Cherokee', 'SUV', 40000),
		m('Compass', 'SUV', 35000), m('Renegade', 'SUV', 30000), m('Gladiator', 'TRUCK', 60000),
	] },
	{ key: 'PEUGEOT', display: 'Peugeot', search: 'Peugeot', family: 'de', weight: 2, models: [
		m('208', 'COMPACT', 24000, [G, E]), m('308', 'COMPACT', 30000, [G, D, H]), m('2008', 'SUV', 28000, [G, E]),
		m('3008', 'SUV', 38000, [G, D, H]), m('5008', 'SUV', 42000, [D, G], 7), m('508', 'MIDSIZE', 40000, [G, D, H]),
	] },
	{ key: 'CADILLAC', display: 'Cadillac', search: 'Cadillac', family: 'us', weight: 2, models: [
		m('CT4', 'MIDSIZE', 45000), m('CT5', 'MIDSIZE', 55000), m('XT4', 'SUV', 45000), m('XT5', 'SUV', 55000),
		m('XT6', 'SUV', 65000, [G], 7), m('Escalade', 'SUV', 110000, [G], 7), m('Lyriq', 'SUV', 70000, [E]),
	] },
	{ key: 'JAGUAR', display: 'Jaguar', search: 'Jaguar', family: 'de', weight: 1, models: [
		m('XE', 'MIDSIZE', 45000), m('XF', 'LARGE', 55000, [G, D]), m('F-Pace', 'SUV', 60000, [G, D]), m('E-Pace', 'SUV', 48000),
		m('I-Pace', 'SUV', 80000, [E]), m('F-Type', 'MIDSIZE', 85000, [G], 2),
	] },
	{ key: 'MASERATI', display: 'Maserati', search: 'Maserati', family: 'de', weight: 1, models: [
		m('Ghibli', 'LARGE', 90000, [G, D]), m('Levante', 'SUV', 100000, [G, D]), m('Quattroporte', 'LARGE', 130000),
		m('Grecale', 'SUV', 85000, [G, H]), m('MC20', 'MIDSIZE', 230000, [G], 2),
	] },
	{ key: 'SUBARU', display: 'Subaru', search: 'Subaru', family: 'jp', weight: 1, models: [
		m('Outback', 'SUV', 38000), m('Forester', 'SUV', 35000, [G, H]), m('Crosstrek', 'SUV', 30000), m('Impreza', 'COMPACT', 25000),
		m('WRX', 'COMPACT', 35000), m('Legacy', 'MIDSIZE', 30000), m('BRZ', 'COMPACT', 32000, [G], 4),
	] },
	{ key: 'POLESTAR', display: 'Polestar', search: 'Polestar', family: 'ev', weight: 1, models: [
		m('Polestar 2', 'MIDSIZE', 55000, [E]), m('Polestar 3', 'SUV', 80000, [E]), m('Polestar 4', 'SUV', 65000, [E]),
	] },
	{ key: 'BYD', display: 'BYD', search: 'BYD', family: 'ev', weight: 1, models: [
		m('Atto 3', 'SUV', 35000, [E]), m('Seal', 'MIDSIZE', 40000, [E]), m('Dolphin', 'COMPACT', 28000, [E]),
		m('Sealion 7', 'SUV', 45000, [E]), m('Han', 'LARGE', 50000, [E]),
	] },
];

export const TRIMS = {
	// family fallbacks
	kr: ['Premium', 'Prestige', 'Inspiration', 'Signature', 'Modern', 'Smart', 'Exclusive', 'Noblesse', 'Calligraphy', 'GT-Line', 'Gravity', 'Trendy', 'Luxury'],
	de: ['Premium', 'Sport', 'Luxury', 'Executive'],
	jp: ['Limited', 'Touring', 'SE', 'XSE', 'Sport', 'Premium', 'Executive'],
	us: ['LT', 'Premier', 'Limited', 'Platinum'],
	ev: ['Long Range', 'Standard Range', 'Long Range AWD', 'Exclusive', 'Prestige', 'Premium'],
	// brand-specific trim names
	HYUNDAI: ['Premium', 'Prestige', 'Inspiration', 'Modern', 'Smart', 'Exclusive', 'Calligraphy', 'N Line'],
	KIA: ['Prestige', 'Noblesse', 'Signature', 'GT-Line', 'Gravity', 'Trendy', 'Luxury', 'X-Line'],
	GENESIS: ['Standard', 'Sport', 'Luxury', 'Sport Package', 'Prestige'],
	KGM: ['Standard', 'Premium', 'Ultimate', 'Black Edition', 'Prestige'],
	'RENAULT KOREA': ['LE', 'RE', 'RE Signature', 'Inspire', 'Techno', 'Esprit Alpine'],
	BMW: ['M Sport', 'Luxury Line', 'M Sport Pro', 'Sport Line', 'xDrive M Sport'],
	BENZ: ['AMG Line', 'Avantgarde', 'Exclusive', 'AMG Line Premium'],
	AUDI: ['S line', 'Premium', 'Prestige', 'quattro Premium', 'Sport'],
	VOLVO: ['Inscription', 'R-Design', 'Momentum', 'Ultimate', 'Plus'],
	'LAND ROVER': ['HSE', 'Autobiography', 'SE', 'Dynamic', 'X-Dynamic'],
	PORSCHE: ['S', '4S', 'GTS', 'Turbo', 'Base'],
	VOLKSWAGEN: ['Comfortline', 'Highline', 'R-Line', 'Premium', 'Elegance'],
	MINI: ['Classic', 'Signature', 'JCW Sport', 'Resolute Edition'],
	PEUGEOT: ['Allure', 'GT', 'GT Line', 'Active'],
	JAGUAR: ['R-Dynamic', 'HSE', 'S', 'SE'],
	MASERATI: ['GranLusso', 'GranSport', 'Modena', 'Trofeo', 'GT'],
	LEXUS: ['F Sport', 'Luxury', 'Executive', 'Premium', 'Ultra Luxury'],
	TOYOTA: ['XLE', 'XSE', 'Limited', 'Platinum', 'LE'],
	HONDA: ['EX', 'EX-L', 'Touring', 'Sport', 'Elite'],
	NISSAN: ['SV', 'SL', 'Platinum', 'Tekna', 'N-Connecta'],
	MAZDA: ['Signature', 'Premium', 'Touring', 'Grand Touring', 'Exclusive-Line'],
	SUBARU: ['Premium', 'Limited', 'Touring', 'Wilderness', 'Onyx'],
	CHEVROLET: ['LT', 'Premier', 'RS', 'LS', 'High Country'],
	FORD: ['XLT', 'Lariat', 'Limited', 'Platinum', 'Titanium', 'ST-Line'],
	JEEP: ['Sahara', 'Rubicon', 'Limited', 'Overland', 'Trailhawk', 'Summit'],
	CADILLAC: ['Luxury', 'Premium Luxury', 'Sport', 'Platinum'],
	TESLA: ['Long Range', 'Performance', 'Standard Range', 'Long Range AWD'],
	POLESTAR: ['Long Range Single Motor', 'Long Range Dual Motor', 'Performance'],
	BYD: ['Comfort', 'Design', 'Premium', 'Excellence'],
};

export const brandByKey = (key) => BRANDS.find((b) => b.key === key);
