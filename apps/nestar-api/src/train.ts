console.log('train.ts');

// -------------------------------TASK ZJ:--------------------------------

// Shunday function yozing, u berilgan array ichidagi
// raqamlarni qiymatini hisoblab qaytarsin.

// MASALAN: reduceNestedArray([1, [1, 2, [4]]]); return 8;

// Yuqoridagi misolda, array nested bo'lgan holdatda ham,
// bizning function ularning yig'indisini hisoblab qaytarmoqda.

/*
type NestedArray = (number | NestedArray)[];

const reduceNestedArray = (array: NestedArray): number => {
	//@ts-ignore
	return array.reduce((total: number, ele: number | NestedArray): number => {
		if (typeof ele === 'number') {
			return total + ele;
		} else {
			return total + reduceNestedArray(ele);
		}
	}, 0);
};

const result = reduceNestedArray([1, [1, 2, [4]]]);
console.log(result);
*/

// -------------------------------TASK ZK:--------------------------------

// Shunday function yozing, bu function har bir soniyada bir marotaba
// console'ga 1'dan 5'gacha bo'lgan raqamlarni chop etsin va
// 5 soniyadan so'ng function o'z ishini to'xtatsin

// MASALAN: printNumbers();

/*
const printNumbers = (a: number = 0) => {
	const result = setInterval(() => {
		a++;
		if (a === 5) clearInterval(result);
		console.log(a);
	}, 1000);
	return result;
};
printNumbers();
*/

// -------------------------------TASK ZL:--------------------------------

// Shunday function yozing, u parametrda berilgan stringni kebab casega otkazib qaytarsin.
// Bosh harflarni kichik harflarga ham otkazsin.
// MASALAN: stringToKebab(“I love Kebab”) return “i-love-kebab”

/*
const stringToKebab = (input: string): string => {
	return input.toLowerCase().split(' ').join('-');
};
const result = stringToKebab('I love Kebab');
console.log(result);
*/

// -------------------------------TASK ZM:--------------------------------

// Shunday function yozing, va bu function parametr
// sifatida raqamlarni qabul qilsin. Bu function qabul qilingan
// raqamlarni orqasiga o'girib qaytarsin

// MASALAN: reverseInteger(123456789); return 987654321;

/*
const reverseInteger = (input: number) => {
	return Number(input.toString().split('').reverse().join(''));
};
const result = reverseInteger(123456789);
console.log(result);
*/

// -------------------------------TASK ZN:--------------------------------

// Shunday function yozing, uni array va number parametri bo'lsin.
// Function'ning vazifasi ikkinchi parametr'da berilgan raqam, birinchi
// array parametr'ning indeksi bo'yicha hisoblanib, shu indeksgacha bo'lgan
// raqamlarni indeksdan tashqarida bo'lgan raqamlar bilan o'rnini
// almashtirib qaytarsin.

// MASALAN: rotateArray([1, 2, 3, 4, 5, 6], 3); return [5, 6, 1, 2, 3, 4];

/*
const rotateArray = (arr: number[], num: number): number[] => {
	return arr.slice(num + 1).concat(arr.slice(0, num + 1));
};

const result = rotateArray([1, 2, 3, 4, 5, 6], 3);
console.log(result);
*/

// -------------------------------TASK ZO:--------------------------------

// Shunday function yozing, u parametrdagi string ichidagi qavslar miqdori balansda
// ekanligini aniqlasin. Ya'ni ochish("(") va yopish(")") qavslar soni bir xil bolishi kerak.
// MASALAN: areParenthesesBalanced("string()ichida(qavslar)soni()balansda") return true

/*
const areParenthesesBalanced = (input: string): boolean => {
	const result = input.split('').reduce((count: number, ele: string): number => {
		if (ele === '(') count++;
		else if (ele === ')') count--;
		return count;
	}, 0);
	return result === 0;
};

const result = areParenthesesBalanced('string()ichida(qavslar)soni()balansda');
console.log(result);
*/

// -------------------------------TASK ZP:--------------------------------
// Shunday function yozing, u 2 ta array parametr qabul qilsin.
// Siz bu ikki arrayning qiymatlari o'xshash bo'lishini
// (ya'ni, ularning barcha elementlari bir xil bo'lishini) tekshirishingiz kerak.

// MASALAN:
// areArraysEqual([1, 2, 3], [3, 1, 2]) // true
// areArraysEqual([1, 2, 3], [3, 1, 2, 1]) // true
// areArraysEqual([1, 2, 3], [4, 1, 2]) // false

/*
function noDuplicates(input: number[]): number[] {
	return input.reduce((accumulator: number[], item: number) => {
		if (!accumulator.includes(item)) accumulator.push(item);
		return accumulator;
	}, []);
}
function sortArray(array: number[]): string {
	return array.toSorted((a, b) => a - b).join();
}

const areArraysEqual = (input1: number[], input2: number[]): boolean => {
	return sortArray(noDuplicates(input1)) === sortArray(noDuplicates(input2));
};

const result = areArraysEqual([1, 2, 3], [3, 1, 2, 1]);
console.log(result);
*/

// -------------------------------TASK ZQ:--------------------------------

// Shunday function yozing, bu function berilgan array parametr
// ichida ikki marotaba yoki undan ko'p takrorlangan sonlarni alohida
// array'da yagonadan qaytarsin qaytarsin.

// MASALAN: findDuplicates([1,2,3,4,5,4,3,4]); return [3, 4];

/*
function findDuplicates(array: number[]): number[] {
	array.sort((a, b) => a - b);

	return array.reduce((acc: number[], number: number, index) => {
		if (number === array[index + 1] && !acc.includes(number)) {
			acc.push(number);
		}
		return acc;
	}, []);
}
const result = findDuplicates([1, 2, 3, 4, 5, 4, 3, 4]);
console.log(result);
*/

// -------------------------------TASK ZR:--------------------------------

// Shunday function yozing, bu function,
// berilgan parametr string tarkibidagi raqam va sonlarni
// sanab object sifatida qaytarsin.

// MASALAN: countNumberAndLetters(“string152%\¥”); return {number: 3, letter: 6};

/*
interface CountObject {
	number: number;
	letter: number;
}

function countNumberAndLetters(input: string): CountObject {
	return input.split('').reduce(
		(acc: CountObject, ele: string) => {
			if (/[a-zA-Z]/.test(ele)) acc.letter++;
			else if (/[0-9]/.test(ele)) acc.number++;
			return acc;
		},
		{ number: 0, letter: 0 },
	);
}

const result = countNumberAndLetters('string152%\¥');
console.log(result);
*/

// -------------------------------TASK ZS:--------------------------------

// Shunday function yozing, bu function parametrdagi array ichida
// bir marotaba takrorlangan element'ni qaytarsin

// MASALAN: singleNumber([4, 2, 1, 2, 1]); return 4;

/*
function singleNumber(input: number[]): number[] | number {
	const result = input.sort((a, b) => a - b).filter((num, i, arr) => arr[i - 1] !== num && num != arr[i + 1]);
	return result.length === 1 ? result[0] : result;
}

const result = singleNumber([4, 2, 1, 2, 1]);
console.log(result);
*/

// -------------------------------TASK ZT:--------------------------------

// Shunday function yozing, bu function parametrdagi string ichida
// bir marotabadan ortiq qaytarilmagan birinchi harf indeksini qaytarsin

// MASALAN: firstUniqueCharIndex(“stamp”); return 0;

// Yuqoridagi misolda, 'stamp' so'zi tarkibida barcha harflar bir marotabadan
// ortiq takrorlanmagan, lekin shartga muvofiq, birinchi topilgan harf indeksi qaytarilmoqda.

/*
function firstUniqueCharIndex(input: string) {
	const result = input.split('').reduce((acc: number[], ele: string, i: number, arr: string[]) => {
		if (arr.indexOf(ele) === arr.lastIndexOf(ele)) acc.push(i);
		return acc;
	}, []);
	return result[0];
}

const result = firstUniqueCharIndex('oooowwwwieuuuuiiiim');
console.log(result);
*/

// -------------------------------TASK ZU:--------------------------------

// Shunday function yozing, va bu function parametr sifatida
// raqamlardan iborat array'ni qabul qilsin. Function'ning vazifasi,
// berilgan parametr array tarkibida takrorlanmagan raqamlarni topib
// ularni yig'indisini qaytarsin.

// MASALAN: sumOfUnique([1,2,3,2]); return 4;

function sumOfUnique(input: number[]): number {
	return input.reduce((total: number, num: number) => {
		if (input.indexOf(num) === input.lastIndexOf(num)) total += num;
		return total;
	}, 0);
}

const result = sumOfUnique([1, 2, 3, 2]);
console.log(result);
