/**
 * MiniGameTypes.ts - Type definitions for the minigame system
 */

export type DifficultyPhase = 'easy' | 'medium' | 'hard' | 'insane'

export interface DifficultyConfig {
    phase: DifficultyPhase
    timeRange: [number, number] // Start and end time in seconds
    targetSpeed: number // Movement speed multiplier
    targetSize: number // Size multiplier (1.0 = normal)
    hitZoneMultiplier: number // Hit zone tolerance (1.0 = normal)
    spawnInterval: number // Time between target spawns
    movingTargets: boolean // Whether targets move
    windEffect: boolean // Whether wind affects projectiles
}

export interface ScoreState {
    score: number
    combo: number
    maxCombo: number
    perfectHits: number
    totalShots: number
    hits: number
}

export interface LifeState {
    lives: number
    maxLives: number
}

export interface MiniGameState {
    gameTime: number
    phase: DifficultyPhase
    score: ScoreState
    lives: LifeState
    isGameOver: boolean
    isPaused: boolean
}

export interface HitResult {
    hit: boolean
    perfect: boolean
    distance: number // Distance from center of target
}

// Rank system for results
export type GameRank = 'S' | 'A' | 'B' | 'C' | 'D'

export interface RankConfig {
    rank: GameRank
    minScore: number
    color: number
    message: string
}

export const RANK_CONFIGS: RankConfig[] = [
    { rank: 'S', minScore: 5000, color: 0xffd700, message: 'PHYSICS MASTER!' },
    { rank: 'A', minScore: 3000, color: 0x4ecdc4, message: 'Excellent!' },
    { rank: 'B', minScore: 1500, color: 0x45b7d1, message: 'Good job!' },
    { rank: 'C', minScore: 500, color: 0xf5b041, message: 'Not bad!' },
    { rank: 'D', minScore: 0, color: 0x888888, message: 'Keep practicing!' },
]

export function getRankFromScore(score: number): RankConfig {
    for (const config of RANK_CONFIGS) {
        if (score >= config.minScore) {
            return config
        }
    }
    return RANK_CONFIGS[RANK_CONFIGS.length - 1]
}

// Difficulty phase configurations
export const DIFFICULTY_PHASES: DifficultyConfig[] = [
    {
        phase: 'easy',
        timeRange: [0, 30],
        targetSpeed: 0,
        targetSize: 1.2,
        hitZoneMultiplier: 1.3,
        spawnInterval: 3,
        movingTargets: false,
        windEffect: false,
    },
    {
        phase: 'medium',
        timeRange: [30, 60],
        targetSpeed: 0.5,
        targetSize: 1.0,
        hitZoneMultiplier: 1.1,
        spawnInterval: 2.5,
        movingTargets: true,
        windEffect: false,
    },
    {
        phase: 'hard',
        timeRange: [60, 90],
        targetSpeed: 1.0,
        targetSize: 0.8,
        hitZoneMultiplier: 1.0,
        spawnInterval: 2,
        movingTargets: true,
        windEffect: false,
    },
    {
        phase: 'insane',
        timeRange: [90, Infinity],
        targetSpeed: 1.5,
        targetSize: 0.7,
        hitZoneMultiplier: 0.9,
        spawnInterval: 1.5,
        movingTargets: true,
        windEffect: true,
    },
]

export function getDifficultyForTime(gameTime: number): DifficultyConfig {
    for (const config of DIFFICULTY_PHASES) {
        if (gameTime >= config.timeRange[0] && gameTime < config.timeRange[1]) {
            return config
        }
    }
    return DIFFICULTY_PHASES[DIFFICULTY_PHASES.length - 1]
}

// Score calculation constants
export const SCORE_CONFIG = {
    basePoints: 100,
    perfectMultiplier: 2.0,
    comboMultiplierBase: 0.1, // Each combo adds 10%
    maxComboMultiplier: 3.0, // Cap at 3x
    speedBonus: 50, // Bonus for quick shots
    speedBonusThreshold: 2, // Seconds to get speed bonus
}

// Life system constants
export const LIFE_CONFIG = {
    maxLives: 3,
    initialLives: 3,
}
