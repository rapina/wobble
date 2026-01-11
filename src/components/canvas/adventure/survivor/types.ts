import { Container, Graphics, Text } from 'pixi.js'
import { Wobble, WobbleShape } from '../../Wobble'

// Game state type
export type GameState =
    | 'character-select'
    | 'opening'
    | 'playing'
    | 'skill-selection'
    | 'game-over'
    | 'result'

// Wobble character stats (Brotato-style)
export interface WobbleStats {
    healthMultiplier: number
    damageMultiplier: number
    fireRateMultiplier: number
    moveSpeedMultiplier: number
}

export const WOBBLE_STATS: Record<WobbleShape, WobbleStats> = {
    circle: {
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        moveSpeedMultiplier: 1.0,
    },
    square: {
        healthMultiplier: 1.3,
        damageMultiplier: 0.8,
        fireRateMultiplier: 0.9,
        moveSpeedMultiplier: 0.9,
    },
    triangle: {
        healthMultiplier: 0.8,
        damageMultiplier: 1.3,
        fireRateMultiplier: 1.1,
        moveSpeedMultiplier: 1.1,
    },
    star: {
        healthMultiplier: 0.9,
        damageMultiplier: 0.9,
        fireRateMultiplier: 0.9,
        moveSpeedMultiplier: 1.2,
    },
    diamond: {
        healthMultiplier: 1.0,
        damageMultiplier: 1.1,
        fireRateMultiplier: 1.1,
        moveSpeedMultiplier: 0.8,
    },
    pentagon: {
        healthMultiplier: 1.2,
        damageMultiplier: 0.9,
        fireRateMultiplier: 0.8,
        moveSpeedMultiplier: 1.0,
    },
    shadow: {
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        moveSpeedMultiplier: 1.0,
    },
}

// Playable characters (exclude shadow - it's for enemies)
export const PLAYABLE_CHARACTERS: WobbleShape[] = [
    'circle',
    'square',
    'triangle',
    'star',
    'diamond',
    'pentagon',
]

// Rank system for result screen
export type SurvivorRank = 'S' | 'A' | 'B' | 'C' | 'D'

export interface RankConfig {
    minTime: number // seconds
    color: number
    message: string
}

export const RANK_CONFIGS: Record<SurvivorRank, RankConfig> = {
    S: { minTime: 300, color: 0xffd700, message: '물리학의 신!' },
    A: { minTime: 180, color: 0x9b59b6, message: '훌륭해요!' },
    B: { minTime: 120, color: 0x3498db, message: '잘했어요!' },
    C: { minTime: 60, color: 0x2ecc71, message: '좋은 시작!' },
    D: { minTime: 0, color: 0x95a5a6, message: '다시 도전!' },
}

export function getRankFromTime(time: number): SurvivorRank {
    if (time >= 300) return 'S'
    if (time >= 180) return 'A'
    if (time >= 120) return 'B'
    if (time >= 60) return 'C'
    return 'D'
}

// Enemy tier system for merging
export type EnemyTier = 'small' | 'medium' | 'large' | 'boss'

export interface TierConfig {
    size: number
    healthMultiplier: number
    speedMultiplier: number
    color: number
    canMerge: boolean
}

export const TIER_CONFIGS: Record<EnemyTier, TierConfig> = {
    small: {
        size: 25,
        healthMultiplier: 1,
        speedMultiplier: 1,
        color: 0x1a1a1a,
        canMerge: true,
    },
    medium: {
        size: 40,
        healthMultiplier: 2.5,
        speedMultiplier: 0.85,
        color: 0x2d1a3d,
        canMerge: true,
    },
    large: {
        size: 60,
        healthMultiplier: 5,
        speedMultiplier: 0.7,
        color: 0x4a1a5d,
        canMerge: true,
    },
    boss: {
        size: 100,
        healthMultiplier: 12,
        speedMultiplier: 0.5,
        color: 0x6a1a7d,
        canMerge: false,
    },
}

export interface Projectile {
    graphics: Graphics
    x: number
    y: number
    vx: number
    vy: number
    mass: number
    damage: number
    bounces: number
    maxBounces: number
    pierces: number // 현재까지 관통한 적 수
    maxPierces: number // 최대 관통 가능 횟수
    hitEnemyIds: Set<number> // 이미 맞춘 적 ID (중복 히트 방지)
    scale: number // 현재 크기 배율 (튕길수록 감소)
}

export interface Enemy {
    graphics: Container
    wobble?: Wobble
    x: number
    y: number
    vx: number
    vy: number
    health: number
    maxHealth: number
    speed: number
    mass: number
    size: number
    // Merge system fields
    tier: EnemyTier
    id: number
    merging: boolean
    mergeTarget?: Enemy
}

export interface TextEffect {
    timer: number
    text: Text
}

export interface HitEffect {
    x: number
    y: number
    timer: number
    graphics: Graphics
}

export interface PlayerStats {
    // Base multipliers (from character + skills)
    damageMultiplier: number
    fireRateMultiplier: number
    projectileSpeedMultiplier: number
    projectileSizeMultiplier: number
    knockbackMultiplier: number
    moveSpeedMultiplier: number

    // Skill-derived additive stats
    bounceCount: number
    piercingCount: number
    pierceDamageDecay: number // 0-1, damage lost per pierce
    explosionRadius: number

    // Homing skill
    homingTurnRate: number // Radians per second, 0 = no homing

    // Spread shot skill
    spreadCount: number // Number of projectiles (1 = single shot)
    spreadAngle: number // Degrees spread

    // Shockwave skill
    shockwaveInterval: number // Seconds between pulses, 0 = disabled
    shockwaveRadius: number
    shockwaveKnockback: number

    // Passive-derived stats
    damageReduction: number // 0-1, damage reduction percentage
    critChance: number // 0-1, chance to crit
    critMultiplier: number // Crit damage multiplier (e.g., 2.5)
    xpMultiplier: number // XP gain multiplier
    consecutiveHitBonus: number // Current consecutive hit damage bonus
    guardianAuraRadius: number // Guardian aura effect radius
}

export const DEFAULT_PLAYER_STATS: PlayerStats = {
    damageMultiplier: 1,
    fireRateMultiplier: 1,
    projectileSpeedMultiplier: 1,
    projectileSizeMultiplier: 1,
    knockbackMultiplier: 1,
    moveSpeedMultiplier: 1,

    bounceCount: 0,
    piercingCount: 0,
    pierceDamageDecay: 0,
    explosionRadius: 0,

    homingTurnRate: 0,

    spreadCount: 1,
    spreadAngle: 0,

    shockwaveInterval: 0,
    shockwaveRadius: 0,
    shockwaveKnockback: 0,

    damageReduction: 0,
    critChance: 0,
    critMultiplier: 1.5,
    xpMultiplier: 1,
    consecutiveHitBonus: 0,
    guardianAuraRadius: 0,
}

// Experience and Level System
export interface LevelConfig {
    level: number
    xpRequired: number // Total XP needed to reach this level
}

// XP curve - each level requires more XP
export function getXpForLevel(level: number): number {
    // Base 10 XP, increasing by 5 per level
    // Level 1: 0, Level 2: 10, Level 3: 25, Level 4: 45, etc.
    if (level <= 1) return 0
    return Math.floor(10 * (level - 1) + 5 * Math.pow(level - 1, 1.5))
}

export function getLevelFromXp(xp: number): number {
    let level = 1
    while (getXpForLevel(level + 1) <= xp) {
        level++
    }
    return level
}

export interface PlayerProgress {
    xp: number
    level: number
    pendingLevelUps: number // Number of level ups waiting to be processed
}
