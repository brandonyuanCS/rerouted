/**
 * Seeded Random Number Generator
 * 
 * PURPOSE:
 * Provides deterministic random number generation for reproducible data generation.
 * Using the same seed will always produce the same sequence of "random" numbers.
 * 
 * ALGORITHM:
 * Uses a simple Linear Congruential Generator (LCG) - the same algorithm used by
 * many standard library random functions. Good enough for simulation, not for crypto.
 * 
 * USAGE:
 * const random = createSeededRandom(42);
 * random();      // Returns 0.0 to 1.0
 * random();      // Next value in sequence
 */

/**
 * Create a seeded random number generator
 * @param seed - Integer seed for reproducibility
 * @returns Function that returns random numbers between 0 and 1
 */
export function createSeededRandom(seed: number): () => number {
  // LCG parameters (same as glibc)
  const a = 1103515245;
  const c = 12345;
  const m = 2 ** 31;

  let state = seed;

  return function (): number {
    state = (a * state + c) % m;
    return state / m;
  };
}

/**
 * Pick a random element from an array using the provided random function
 */
export function randomChoice<T>(array: T[], random: () => number): T {
  return array[Math.floor(random() * array.length)];
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generate a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min: number, max: number, random: () => number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Generate a random number with normal distribution using Box-Muller transform
 * Useful for realistic delay distributions
 */
export function randomNormal(mean: number, stdDev: number, random: () => number): number {
  const u1 = random();
  const u2 = random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z0 * stdDev + mean;
}
