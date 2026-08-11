// Deterministic seeded RNG so mock data is stable across repeated runs
// (same district + same period always produces the same mock values).

function hashString(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandom(seedKey: string): () => number {
  return mulberry32(hashString(seedKey));
}

/** Random float in [min, max), deterministic for a given rng. */
export function randRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}
