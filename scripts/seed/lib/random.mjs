// Deterministic PRNG so re-runs regenerate the same catalog (idempotent seeding).
export function rng(seed = 20260915) {
	let a = seed >>> 0;
	const next = () => {
		a += 0x6d2b79f5;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
	const r = {
		next,
		int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
		pick: (arr) => arr[Math.floor(next() * arr.length)],
		chance: (p) => next() < p,
		shuffle: (arr) => {
			const out = arr.slice();
			for (let i = out.length - 1; i > 0; i--) {
				const j = Math.floor(next() * (i + 1));
				[out[i], out[j]] = [out[j], out[i]];
			}
			return out;
		},
		sample: (arr, n) => r.shuffle(arr).slice(0, n),
		weighted: (pairs) => {
			const total = pairs.reduce((s, [, w]) => s + w, 0);
			let x = next() * total;
			for (const [v, w] of pairs) {
				x -= w;
				if (x <= 0) return v;
			}
			return pairs[pairs.length - 1][0];
		},
	};
	return r;
}
