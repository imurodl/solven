// Sellers (AGENT), garages (MECHANIC) and buyers (USER). Phones are synthetic.
// Avatars come from randomuser.me portrait files (free to use in demos).

export const AGENTS = [
	{ nick: 'seoulmotors', name: 'Seoul Motors', gender: 'men', city: 'SEOUL', addr: 'Gangnam-gu, Seoul', desc: 'Certified pre-owned dealer in Gangnam since 2011. Every car comes with a 150-point inspection report, accident history check and a 3-month powertrain warranty.' },
	{ nick: 'kim.dealer', name: 'Kim Min-jun', gender: 'men', city: 'SEOUL', addr: 'Seocho-gu, Seoul', desc: 'Independent dealer specialising in German sedans and SUVs. I personally test-drive every car before it goes on sale and I am happy to meet at your mechanic for a pre-purchase check.' },
	{ nick: 'busanauto', name: 'Busan Auto Plaza', gender: 'women', city: 'BUSAN', addr: 'Haeundae-gu, Busan', desc: 'The largest used-car showroom in Haeundae. Domestic and imported cars, on-site financing, trade-ins welcome. Open seven days a week.' },
	{ nick: 'evgarage', name: 'EV Garage Korea', gender: 'men', city: 'SEOUL', addr: 'Seongdong-gu, Seoul', desc: 'Electric and hybrid specialists. We publish battery state-of-health reports for every EV we sell and can install a home charger for you.' },
	{ nick: 'lee.cars', name: 'Lee Ji-woo', gender: 'women', city: 'INCHEON', addr: 'Yeonsu-gu, Incheon', desc: 'Family-run dealership near Songdo. We keep our prices honest and our descriptions accurate. Ask for the full service history on any car.' },
	{ nick: 'daeguprime', name: 'Daegu Prime Cars', gender: 'men', city: 'DAEGU', addr: 'Suseong-gu, Daegu', desc: 'Premium imports and low-mileage domestic cars in Daegu. Nationwide delivery available with a signed inspection report.' },
	{ nick: 'park.autos', name: 'Park Seo-yeon', gender: 'women', city: 'SEOUL', addr: 'Mapo-gu, Seoul', desc: 'I sell what I would drive myself: well-kept, one-owner cars with complete records. No pressure, no hidden fees.' },
	{ nick: 'gwangjumtr', name: 'Gwangju Motors', gender: 'men', city: 'GWANGJU', addr: 'Seo-gu, Gwangju', desc: 'Twenty years in the Honam region. SUVs, family vans and commercial trucks with financing from 3.9% APR.' },
	{ nick: 'choi.import', name: 'Choi Import Cars', gender: 'men', city: 'SEOUL', addr: 'Yongsan-gu, Seoul', desc: 'Direct importer of European and Japanese cars. Every vehicle is customs-cleared, inspected and registered before listing.' },
	{ nick: 'jejuwheels', name: 'Jeju Wheels', gender: 'women', city: 'JEJU', addr: 'Jeju-si, Jeju', desc: 'Island-friendly cars: EVs, small SUVs and rental fleet retirements with full maintenance logs. Ferry shipping to the mainland arranged.' },
	{ nick: 'daejeoncar', name: 'Daejeon Car Center', gender: 'men', city: 'DAEJON', addr: 'Yuseong-gu, Daejeon', desc: 'Volume dealer in Daejeon with over 80 cars in stock. Same-day paperwork and free 1-month return on any car under 60,000 km.' },
	{ nick: 'han.premium', name: 'Han Premium Motors', gender: 'men', city: 'SEOUL', addr: 'Songpa-gu, Seoul', desc: 'Luxury and performance cars only: Porsche, Mercedes-AMG, BMW M. Consignment sales available for private owners.' },
	{ nick: 'greenline', name: 'GreenLine Hybrid', gender: 'women', city: 'INCHEON', addr: 'Namdong-gu, Incheon', desc: 'Hybrids and plug-ins at fair prices. We explain battery warranties in plain language and let you charge-test before buying.' },
	{ nick: 'jeonjuauto', name: 'Jeonju Auto', gender: 'men', city: 'CHONJU', addr: 'Wansan-gu, Jeonju', desc: 'Small dealership, big attention to detail. Every car is detailed and photographed in daylight so what you see is what you get.' },
	{ nick: 'yoon.trade', name: 'Yoon Ha-eun', gender: 'women', city: 'SEOUL', addr: 'Gangseo-gu, Seoul', desc: 'Trade-in specialist near Gimpo airport. Bring your old car, leave with a newer one the same day. Korean and English spoken.' },
	{ nick: 'bek.motors', name: 'Bek Motors', gender: 'men', city: 'SEOUL', addr: 'Dongdaemun-gu, Seoul', desc: 'Serving the Central Asian community in Seoul. Export paperwork to Uzbekistan and Kazakhstan handled in-house. Uzbek, Russian and Korean spoken.' },
	{ nick: 'busanev', name: 'Busan EV Hub', gender: 'men', city: 'BUSAN', addr: 'Suyeong-gu, Busan', desc: 'Used Teslas, Ioniqs and EV6s with verified charging history. We also buy EVs for cash.' },
	{ nick: 'song.cars', name: 'Song Do-yun', gender: 'men', city: 'DAEGU', addr: 'Dalseo-gu, Daegu', desc: 'Former Hyundai service advisor turned dealer. I know these cars inside out and will tell you exactly what needs attention.' },
	{ nick: 'gyeongjuauto', name: 'Gyeongju Auto', gender: 'women', city: 'GYEONGJU', addr: 'Hwangseong-dong, Gyeongju', desc: 'Countryside dealership with low-mileage cars from local owners. Test drives on quiet roads, no city traffic.' },
	{ nick: 'north.motor', name: 'North Motors', gender: 'men', city: 'SEOUL', addr: 'Nowon-gu, Seoul', desc: 'Budget-friendly first cars and family SUVs. Financing for students and foreign residents with an ARC.' },
	{ nick: 'jang.select', name: 'Jang Select', gender: 'women', city: 'SEOUL', addr: 'Gwangjin-gu, Seoul', desc: 'Hand-picked stock only: no accident history, no flood cars, no rental returns. Read our reviews and see for yourself.' },
	{ nick: 'incheonport', name: 'Incheon Port Autos', gender: 'men', city: 'INCHEON', addr: 'Seo-gu, Incheon', desc: 'Right next to the export terminal. Great prices on cars that are ready to ship abroad, but we sell locally too.' },
	{ nick: 'oh.autoland', name: 'Oh Autoland', gender: 'men', city: 'BUSAN', addr: 'Busanjin-gu, Busan', desc: 'Two showrooms in Seomyeon with 120+ cars. Certified technicians on site and a free coffee while you browse.' },
	{ nick: 'lim.garage', name: 'Lim Ye-jin', gender: 'women', city: 'SEOUL', addr: 'Yeongdeungpo-gu, Seoul', desc: 'Private seller network: I help owners sell their cars directly, so you get owner-level honesty with dealer-level paperwork.' },
	{ nick: 'gwangsan', name: 'Gwangsan Cars', gender: 'men', city: 'GWANGJU', addr: 'Gwangsan-gu, Gwangju', desc: 'Trucks, vans and work vehicles for small businesses. Porter, Bongo, Staria and Carnival always in stock.' },
	{ nick: 'shin.motors', name: 'Shin Motors', gender: 'men', city: 'DAEJON', addr: 'Seo-gu, Daejeon', desc: 'Mid-size family dealership. We offer a written 30-day guarantee and will buy the car back if the inspection finds an undisclosed issue.' },
	{ nick: 'topgear.kr', name: 'TopGear Korea', gender: 'men', city: 'SEOUL', addr: 'Seocho-gu, Seoul', desc: 'Enthusiast cars for enthusiasts: manuals, coupes, hot hatches and the occasional oddball. Service records or it does not get listed.' },
	{ nick: 'moon.cars', name: 'Moon Cars', gender: 'women', city: 'INCHEON', addr: 'Bupyeong-gu, Incheon', desc: 'Affordable compacts and city cars, most under 15,000 USD. Great for commuters and new drivers.' },
	{ nick: 'jejugreen', name: 'Jeju Green Mobility', gender: 'men', city: 'JEJU', addr: 'Seogwipo-si, Jeju', desc: 'EVs from Jeju\'s carbon-free island programme. Low mileage, warm-climate batteries, full charging logs.' },
	{ nick: 'kangprestige', name: 'Kang Prestige', gender: 'men', city: 'SEOUL', addr: 'Gangnam-gu, Seoul', desc: 'Genesis, Lexus and Mercedes in the Apgujeong showroom. Concierge delivery anywhere in the Seoul metro area.' },
];

export const MECHANICS = [
	{ nick: 'gangnamcare', name: 'Gangnam Auto Care', gender: 'men', city: 'SEOUL', addr: 'Gangnam-gu, Seoul', desc: 'Full-service garage: engine diagnostics, transmission rebuilds, brakes and pre-purchase inspections. Hyundai and Kia factory-trained technicians, German-car specialists on staff.' },
	{ nick: 'evfixseoul', name: 'EV Fix Seoul', gender: 'women', city: 'SEOUL', addr: 'Seongdong-gu, Seoul', desc: 'High-voltage certified workshop for Tesla, Ioniq, EV6 and Niro. Battery health reports, charging port repairs, software updates.' },
	{ nick: 'busanbody', name: 'Busan Body & Paint', gender: 'men', city: 'BUSAN', addr: 'Sasang-gu, Busan', desc: 'Collision repair, paintless dent removal and full resprays in a downdraft booth. Colour-matched to factory codes with a lifetime paint warranty.' },
	{ nick: 'daegutire', name: 'Daegu Tire & Wheel', gender: 'men', city: 'DAEGU', addr: 'Buk-gu, Daegu', desc: 'Tyres, alignment, wheel refurbishment and seasonal changeovers. We stock Hankook, Kumho, Michelin and Continental.' },
	{ nick: 'incheondtl', name: 'Incheon Detailing Lab', gender: 'women', city: 'INCHEON', addr: 'Michuhol-gu, Incheon', desc: 'Ceramic coating, paint correction, interior deep-cleaning and PPF. Perfect before you list a car for sale.' },
];

const FIRST = {
	kr_m: ['Min-jun', 'Seo-jun', 'Do-yun', 'Ye-jun', 'Si-woo', 'Ha-jun', 'Ji-ho', 'Jun-seo', 'Hyun-woo', 'Woo-jin', 'Tae-yang', 'Sung-min', 'Jae-hyun', 'Dong-hyun', 'Young-ho'],
	kr_f: ['Seo-yeon', 'Ji-woo', 'Ha-eun', 'Ye-jin', 'Su-bin', 'Min-seo', 'Chae-won', 'Yu-na', 'Ji-min', 'Hye-jin', 'Eun-ji', 'So-hee', 'Na-yeon', 'Da-eun', 'Ga-eul'],
	uz_m: ['Jasur', 'Bekzod', 'Sardor', 'Otabek', 'Shohruh', 'Nodir', 'Ulugbek', 'Farrux', 'Doston', 'Javohir'],
	uz_f: ['Malika', 'Dilnoza', 'Nilufar', 'Sevara', 'Madina', 'Gulnora', 'Zarina', 'Feruza'],
	en_m: ['Daniel', 'James', 'Michael', 'Alex', 'Chris', 'Ryan', 'Ivan', 'Dmitry', 'Ahmed', 'Kenji'],
	en_f: ['Emily', 'Sarah', 'Anna', 'Olivia', 'Elena', 'Yuki', 'Maria', 'Sofia'],
};
const LAST = {
	kr: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim', 'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong'],
	uz: ['Karimov', 'Rashidov', 'Yusupov', 'Tashkentov', 'Mirzaev', 'Saidov', 'Umarov', 'Aliyeva', 'Nazarova', 'Toshmatov'],
	en: ['Miller', 'Smith', 'Petrov', 'Tanaka', 'Novak', 'Garcia', 'Brown', 'Ivanova', 'Sato', 'Weber'],
};
const CITIES = [
	['SEOUL', ['Gangnam-gu', 'Seocho-gu', 'Songpa-gu', 'Mapo-gu', 'Yongsan-gu', 'Gangseo-gu', 'Yeongdeungpo-gu', 'Seongdong-gu', 'Gwangjin-gu', 'Nowon-gu', 'Guro-gu', 'Dongdaemun-gu', 'Jongno-gu', 'Gangdong-gu'], 'Seoul', 35],
	['INCHEON', ['Yeonsu-gu', 'Namdong-gu', 'Bupyeong-gu', 'Seo-gu', 'Michuhol-gu', 'Gyeyang-gu'], 'Incheon', 14],
	['BUSAN', ['Haeundae-gu', 'Suyeong-gu', 'Busanjin-gu', 'Sasang-gu', 'Dongnae-gu', 'Nam-gu', 'Geumjeong-gu'], 'Busan', 15],
	['DAEGU', ['Suseong-gu', 'Dalseo-gu', 'Buk-gu', 'Jung-gu', 'Dong-gu'], 'Daegu', 9],
	['GWANGJU', ['Seo-gu', 'Buk-gu', 'Gwangsan-gu', 'Nam-gu'], 'Gwangju', 6],
	['DAEJON', ['Yuseong-gu', 'Seo-gu', 'Jung-gu', 'Daedeok-gu'], 'Daejeon', 7],
	['CHONJU', ['Wansan-gu', 'Deokjin-gu'], 'Jeonju', 5],
	['GYEONGJU', ['Hwangseong-dong', 'Dongcheon-dong', 'Yongkang-dong'], 'Gyeongju', 3],
	['JEJU', ['Jeju-si', 'Seogwipo-si', 'Aewol-eup'], 'Jeju', 6],
];

export const randomAddress = (r, city) => {
	const row = city ? CITIES.find((c) => c[0] === city) : r.weighted(CITIES.map((c) => [c, c[3]]));
	return { city: row[0], address: `${r.pick(row[1])}, ${row[2]}` };
};

const USER_BIOS = [
	'Commuter between Seoul and Pangyo, looking for something efficient.',
	'Weekend camper. SUVs with roof rails get my attention.',
	'First-time buyer, saving up for a small hatchback.',
	'Family of five, we need seven seats and a big boot.',
	'EV convert since 2022. Never going back to petrol.',
	'Car photographer on weekends, buyer on weekdays.',
	'Exchange student in Busan, need a cheap runabout for a year.',
	'Small business owner, always looking at vans and trucks.',
	'Retired teacher, gentle driver, cars stay in the garage.',
	'Moved to Korea last year, learning how the used-car market works.',
	'Mechanic by trade, buyer by necessity.',
	'I read every review before I buy anything.',
	'',
	'',
	'',
];

// 60 buyers with a mix of Korean, Uzbek and international names.
export function buildUsers(r) {
	const users = [];
	const seen = new Set();
	for (let i = 0; i < 60; i++) {
		const origin = r.weighted([['kr', 60], ['uz', 22], ['en', 18]]);
		const gender = r.chance(0.52) ? 'm' : 'f';
		const first = r.pick(FIRST[`${origin}_${gender}`]);
		const last = r.pick(LAST[origin]);
		let base = `${first.toLowerCase().replace(/[^a-z]/g, '')}.${last.toLowerCase().slice(0, 4)}`;
		base = base.slice(0, 10);
		let nick = base;
		let n = 1;
		while (seen.has(nick)) nick = `${base.slice(0, 10)}${++n}`;
		seen.add(nick);
		const { city, address } = randomAddress(r);
		users.push({
			nick,
			name: `${first} ${last}`,
			gender: gender === 'm' ? 'men' : 'women',
			city,
			addr: address,
			desc: r.pick(USER_BIOS),
			portrait: r.int(0, 99),
			email: r.chance(0.7) ? `${nick.replace('.', '')}@example.com` : undefined,
		});
	}
	return users;
}

export const phoneFor = (r) => `010${String(r.int(2000, 9999))}${String(r.int(1000, 9999))}`;
