/**
 * SeededRandom.ts - Mulberry32 algorithm-based seeded random number generator
 *
 * Provides deterministic random number generation for consistent stage generation
 * across game sessions with the same seed.
 */

/**
 * Seeded random number generator using Mulberry32 algorithm
 * Produces deterministic sequences given the same seed
 */
export class SeededRandom {
    private state: number

    constructor(seed: number) {
        // Ensure seed is a 32-bit integer
        this.state = seed >>> 0
    }

    /**
     * Get the next random float in range [0, 1)
     * Mulberry32 algorithm implementation
     */
    next(): number {
        let t = (this.state += 0x6d2b79f5)
        t = Math.imul(t ^ (t >>> 15), t | 1)
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }

    /**
     * Get a random integer in range [min, max] (inclusive)
     */
    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min
    }

    /**
     * Get a random float in range [min, max)
     */
    nextFloat(min: number, max: number): number {
        return this.next() * (max - min) + min
    }

    /**
     * Pick a random element from an array
     */
    pick<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error('Cannot pick from empty array')
        }
        return array[Math.floor(this.next() * array.length)]
    }

    /**
     * Pick a random element with weighted probabilities
     * @param items Array of items with their weights
     * @returns The selected item
     */
    pickWeighted<T>(items: { item: T; weight: number }[]): T {
        if (items.length === 0) {
            throw new Error('Cannot pick from empty array')
        }

        const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0)
        let random = this.next() * totalWeight

        for (const { item, weight } of items) {
            random -= weight
            if (random <= 0) {
                return item
            }
        }

        // Fallback (should not reach here)
        return items[items.length - 1].item
    }

    /**
     * Shuffle an array in place using Fisher-Yates algorithm
     */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1))
            ;[array[i], array[j]] = [array[j], array[i]]
        }
        return array
    }

    /**
     * Get a boolean with given probability of being true
     */
    chance(probability: number): boolean {
        return this.next() < probability
    }

    /**
     * Create a new SeededRandom for a specific stage
     * Combines game seed with stage depth for deterministic stage generation
     */
    static createStageSeed(gameSeed: number, depth: number): number {
        // Mix the game seed with depth using a simple hash
        let hash = gameSeed
        hash = Math.imul(hash ^ depth, 0x9e3779b9)
        hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b)
        hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35)
        return (hash ^ (hash >>> 16)) >>> 0
    }

    /**
     * Generate a random seed (for new games)
     */
    static generateSeed(): number {
        return Math.floor(Math.random() * 0xffffffff)
    }
}
