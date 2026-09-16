// Text templates for listings, reviews and conversations. Placeholders are
// filled by the seed scripts: {year} {brand} {model} {trim} {km} {fuel} {city} {seller} {owners} {opt1} {opt2}

export const DESC_OPENERS = [
	'{year} {brand} {model} {trim} in excellent condition with {km} km on the clock.',
	'Well-maintained {brand} {model} ({year}), {km} km, {fuel}, sold by {seller} in {city}.',
	'Clean {year} {model} {trim} from {owners}. Full service history available on request.',
	'Low-mileage {year} {brand} {model}: only {km} km, garage-kept and never smoked in.',
	'{brand} {model} {trim}, {year} model year, {km} km. Ready to drive away today.',
	'Selling my {year} {brand} {model}. {owners}, all services done on time at the dealer.',
	'Immaculate {year} {model} {trim} with {km} km. Non-smoker, no pets, no accidents.',
	'Just arrived: {year} {brand} {model} {trim}, {km} km, {fuel}. Inspected and detailed.',
	'{owners} {year} {brand} {model} with complete records and two keys.',
	'Sharp-looking {year} {model} {trim}. {km} km, {fuel}, recently serviced with new tyres.',
];

export const DESC_BODY = [
	'Highlights include {opt1} and {opt2}. Tyres have plenty of tread and the brakes were replaced at the last service.',
	'Options: {opt1}, {opt2}. The interior is spotless and everything works as it should.',
	'Comes with {opt1} and {opt2}. Cabin smells like new and the paint has been ceramic-coated.',
	'Equipped with {opt1}, {opt2} and factory navigation with the latest map update.',
	'Both {opt1} and {opt2} fitted from the factory. No warning lights, no leaks, no stories.',
	'{opt1} and {opt2} make daily driving effortless. Battery, brakes and suspension all checked this month.',
];

export const DESC_CLOSERS = [
	'Accident history report and inspection sheet attached. Test drives welcome in {city} any day of the week.',
	'Priced to sell. Trade-ins considered, financing available through our partner banks.',
	'Serious buyers only, please. Viewings by appointment in {city}.',
	'Registration transfer and delivery can be arranged nationwide.',
	'Ask for the full photo set and the maintenance log; happy to share everything.',
	'We stand behind this car with a 30-day warranty on engine and gearbox.',
	'Message me here or request a call; I usually reply within the hour.',
	'Export paperwork available for buyers shipping abroad.',
];

export const OWNERS = ['one owner', 'two owners', 'a single owner', 'the original owner', 'a non-smoking owner'];

export const OPTION_LABELS = {
	HEATED_SEATS: 'heated seats', VENTILATED_SEATS: 'ventilated seats', POWER_SEATS: 'power seats', LEATHER_SEATS: 'leather seats',
	HEATED_STEERING: 'a heated steering wheel', SMART_KEY: 'smart key entry', CRUISE_CONTROL: 'adaptive cruise control', NAVIGATION: 'built-in navigation',
	PARKING_SENSOR_REAR: 'rear parking sensors', PARKING_SENSOR_FRONT: 'front parking sensors', REAR_CAMERA: 'a rear camera', CAMERA_360: 'a 360-degree camera',
	SUNROOF: 'a panoramic sunroof', BLACK_BOX: 'a dashcam', LANE_KEEP_ASSIST: 'lane keeping assist', BLIND_SPOT_WARNING: 'blind-spot monitoring',
	AUTO_BRAKING: 'autonomous emergency braking', TWO_KEYS: 'two keys', NON_SMOKER: 'a non-smoker interior',
};

export const REVIEWS = {
	5: [
		'Exactly as described. {seller} sent me extra photos and the service book before I even asked. The {model} drives like new.',
		'Smooth deal from start to finish. Deposit, inspection, delivery, all done in four days. Highly recommend.',
		'Best used-car experience I have had in Korea. Honest description, fair price, and they even filled the tank.',
		'The {model} was cleaner than the photos suggested. Paperwork was ready when I arrived and the transfer took 20 minutes.',
		'Bought this for my wife and she loves it. Seller answered every question patiently, even the silly ones.',
		'I had the car checked at my own mechanic and he found nothing. That says everything about this seller.',
		'Delivered to Busan on time with a full inspection sheet. Zero surprises. Would buy again.',
		'{seller} is the real deal. No pressure, no upsell, just a good car at a good price.',
		'Five stars for the communication alone. Every message answered within minutes.',
		'Third car from this seller for our family. Consistent quality every time.',
		'정말 만족스러운 거래였어요. 설명이랑 실제 차량 상태가 똑같았고 서류도 미리 준비해 주셨어요.',
		'차량 상태 최고, 응대 최고. {model} 타고 다니는데 아무 문제 없습니다. 추천해요.',
		'Отличный продавец, машина в идеальном состоянии. Все документы были готовы заранее.',
		'Juda yaxshi sotuvchi. Mashina aytilgandek edi, hech qanday muammo yo\'q. Rahmat!',
		'Sotib olganimga bir oy bo\'ldi, {model} hech qanday muammosiz yurmoqda. Tavsiya qilaman.',
		'Купил {model} без единой проблемы. Продавец честный, цена справедливая.',
	],
	4: [
		'Good car, good price. Pickup took a bit longer than planned because the paperwork office was busy, but the seller stayed with me the whole time.',
		'Very happy with the {model}. Only reason for four stars is a small scratch on the bumper that was not in the photos.',
		'Solid dealer. The car needed new wipers and a wash but mechanically it is perfect.',
		'Fair and transparent. Delivery was a day late, everything else was spot on.',
		'The {model} runs great. Description was slightly optimistic about the tyres, otherwise accurate.',
		'Quick responses and a smooth handover. Would have liked a second key, but the price reflected it.',
		'Good experience overall. Financing took two extra days, not the seller\'s fault.',
		'Recommended. The inspection report matched what my mechanic found, minus one worn bushing.',
		'좋은 거래였습니다. 배송이 하루 늦어졌지만 차량 상태는 설명대로였어요.',
		'전반적으로 만족합니다. 타이어 마모가 조금 있었지만 가격에 반영되어 있었어요.',
		'Хорошая машина, небольшие царапины, о которых не было сказано. В остальном все честно.',
		'Yaxshi mashina, narxi ham o\'rtacha. Faqat yetkazib berish biroz kechikdi.',
	],
	3: [
		'The car is fine, but the listing said "no scratches" and there are several on the doors. Seller offered a small discount, so okay.',
		'Average experience. Communication was slow at the start, picked up after I paid the deposit.',
		'Runs well, interior less clean than expected. Not bad, not great.',
		'Took a week to get the transfer done. The car itself is decent for the money.',
		'Mixed feelings. Great price, but I had to chase the seller for the second key.',
		'보통이에요. 차는 괜찮은데 연락이 좀 느렸습니다.',
	],
	2: [
		'The mileage was correct but the service history was incomplete. I found out the timing belt was due. Seller did cover half the cost after I complained.',
		'Delivery was three days late and nobody told me. Car is okay, the process was not.',
		'Description mentioned "recently serviced" but the oil was black. Disappointing.',
		'Слишком долго ждал документы. Машина нормальная, сервис нет.',
	],
	1: [
		'Would not recommend. The car had a check-engine light two days after purchase and the seller stopped answering.',
		'Photos hid a dent in the rear quarter. I should have inspected in person. Lesson learned.',
		'Deposit was refunded in the end, but only after a week of messages. Avoid.',
	],
};

export const REVIEW_REPLIES_LIKED = [3, 1, 0, 0, 2, 5, 8, 1, 0, 2];

export const MESSAGES_BUYER = [
	'Hi, is this {model} still available?',
	'Hello! Could you send a photo of the tyres and the dashboard with the engine on?',
	'Is the price negotiable if I pay in full this week?',
	'Has the car ever been in an accident? Can you share the history report?',
	'Can I come and see it this Saturday afternoon?',
	'Does it come with winter tyres? I am in {city} too.',
	'Would you accept a trade-in? I have a 2018 Avante.',
	'How long is the remaining manufacturer warranty?',
	'Salom! Bu mashina hali sotuvdami? Narxini biroz tushirsa bo\'ladimi?',
	'안녕하세요, 이 차량 실물 보러 가도 될까요? 주말에 시간 되시나요?',
	'Здравствуйте, машина еще в продаже? Можно посмотреть в выходные?',
];

export const MESSAGES_SELLER = [
	'Yes, still available. Happy to show it any day after 10am.',
	'Sure, sending the photos now. The tyres are Hankook, about 70% tread left.',
	'The price has a little room if you can close this week. Let\'s talk.',
	'No accidents. The insurance history report is attached to the listing, I can email the PDF too.',
	'Saturday works. I will hold it for you until then.',
	'Summer tyres only, but I can include a winter set for a small extra.',
	'Trade-ins are fine, bring it along and we will value it on the spot.',
	'Roughly 18 months of factory warranty left, transferable to you.',
	'Ha, sotuvda. Kelib ko\'rishingiz mumkin, narx haqida gaplashamiz.',
	'네, 주말에 가능합니다. 오시기 전에 연락 한 번 주세요!',
	'Да, в продаже. В субботу с 10 до 18 можно посмотреть.',
];

export const MESSAGES_FOLLOWUP = [
	'Great, see you then. I will bring my mechanic friend if that is okay.',
	'Thanks for the quick reply!',
	'Perfect. I will put down the deposit through the site tonight.',
	'Could you also check whether the rear camera works? It looked off in one photo.',
	'Ok, let me think about it and get back to you tomorrow.',
	'Deal. Sending the deposit now.',
];

export const SERVICE_REQUESTS = [
	'My {model} has a vibration at highway speed. Can you take a look this week?',
	'Looking for a pre-purchase inspection on a {year} {model} in {city}. What do you charge?',
	'Need a full detail and ceramic coating before I list my car. Availability next week?',
	'Check-engine light on my {model}, code P0420. Rough estimate for a cat replacement?',
	'Rear bumper scuff on a {brand}. Do you do paintless repair or full respray?',
	'Time for a tyre change and alignment on a {model}. Do you have 225/45R18 in stock?',
	'EV question: my range dropped 15% over winter. Can you run a battery health report?',
	'Brake pads squeaking on a {year} {model}. Price for front and rear?',
];
