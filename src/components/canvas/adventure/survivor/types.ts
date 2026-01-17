import { Container, Graphics, Text } from 'pixi.js'
import { Wobble, WobbleShape } from '../../Wobble'
import type { EnemyVariantId, EnemyBehavior } from './EnemyVariants'
import type { FormationId } from './FormationSystem'

// Game state type
export type GameState =
    | 'character-select'
    | 'stage-select'
    | 'loading'
    | 'opening'
    | 'playing'
    | 'paused'
    | 'skill-selection'
    | 'game-over'
    | 'victory'
    | 'result'

// Game duration constants (10-minute power fantasy session)
export const GAME_DURATION_SECONDS = 600 // 10 minutes to win
export const BOSS_SPAWN_TIME = 540 // Boss spawns at 9:00

// Skill system limits
export const MAX_SKILLS = 10 // Maximum number of different skills player can have

// ==================== DIFFICULTY CONFIG ====================
// All difficulty-related parameters in one place for easy tuning

export interface DifficultyConfig {
    // Enemy spawning
    maxEnemies: number // Maximum enemies on screen
    spawnInterval: {
        start: number // Seconds between spawns at game start
        end: number // Seconds between spawns at max difficulty
        rampTime: number // Seconds to reach max spawn rate
    }
    spawnCount: {
        start: number // Enemies per spawn at game start
        end: number // Enemies per spawn at max difficulty
        rampTime: number // Seconds to reach max spawn count
    }

    // Enemy strength
    healthMultiplier: {
        start: number // Health multiplier at game start
        end: number // Health multiplier at game end
        curve: number // Exponent for scaling curve (1 = linear, >1 = late game harder)
    }

    // Enemy tier distribution (changes over time)
    tierWeights: {
        early: { small: number; medium: number; large: number } // 0-3 min
        mid: { small: number; medium: number; large: number } // 3-6 min
        late: { small: number; medium: number; large: number } // 6-10 min
    }
}

export const DEFAULT_DIFFICULTY: DifficultyConfig = {
    maxEnemies: 120,

    spawnInterval: {
        start: 1.0, // 1 spawn event per second initially
        end: 0.3, // 3+ spawn events per second late game
        rampTime: 300, // Reach max at 5 minutes
    },

    spawnCount: {
        start: 2, // 2 enemies per spawn initially
        end: 5, // 5 enemies per spawn late game
        rampTime: 400, // Reach max at ~6.5 minutes
    },

    healthMultiplier: {
        start: 1.0,
        end: 4.0,
        curve: 1.5, // Exponential curve - late game gets hard fast
    },

    tierWeights: {
        early: { small: 0.8, medium: 0.18, large: 0.02 },
        mid: { small: 0.5, medium: 0.35, large: 0.15 },
        late: { small: 0.3, medium: 0.4, large: 0.3 },
    },
}

// Helper function to get difficulty value at a given time
export function getDifficultyValue(
    gameTime: number,
    start: number,
    end: number,
    rampTime: number,
    curve: number = 1
): number {
    const progress = Math.min(1, gameTime / rampTime)
    const curvedProgress = Math.pow(progress, curve)
    return start + (end - start) * curvedProgress
}

// Helper to get tier weights based on game time
export function getTierWeights(
    gameTime: number,
    config: DifficultyConfig
): { small: number; medium: number; large: number } {
    if (gameTime < 180) return config.tierWeights.early // 0-3 min
    if (gameTime < 360) return config.tierWeights.mid // 3-6 min
    return config.tierWeights.late // 6-10 min
}

// Wobble character stats (Brotato-style)
export interface WobbleStats {
    healthMultiplier: number
    damageMultiplier: number
    fireRateMultiplier: number
    moveSpeedMultiplier: number
    knockbackMultiplier: number
}

export const WOBBLE_STATS: Record<WobbleShape, WobbleStats> = {
    circle: {
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        moveSpeedMultiplier: 1.0,
        knockbackMultiplier: 1.0,
    },
    square: {
        healthMultiplier: 1.3,
        damageMultiplier: 0.8,
        fireRateMultiplier: 0.9,
        moveSpeedMultiplier: 0.9,
        knockbackMultiplier: 1.3,
    },
    triangle: {
        healthMultiplier: 0.8,
        damageMultiplier: 1.3,
        fireRateMultiplier: 1.1,
        moveSpeedMultiplier: 1.1,
        knockbackMultiplier: 0.8,
    },
    star: {
        healthMultiplier: 0.9,
        damageMultiplier: 0.9,
        fireRateMultiplier: 0.9,
        moveSpeedMultiplier: 1.2,
        knockbackMultiplier: 1.1,
    },
    diamond: {
        healthMultiplier: 1.0,
        damageMultiplier: 1.1,
        fireRateMultiplier: 1.1,
        moveSpeedMultiplier: 0.8,
        knockbackMultiplier: 1.2,
    },
    pentagon: {
        healthMultiplier: 1.2,
        damageMultiplier: 0.9,
        fireRateMultiplier: 0.8,
        moveSpeedMultiplier: 1.0,
        knockbackMultiplier: 1.0,
    },
    shadow: {
        healthMultiplier: 1.0,
        damageMultiplier: 1.0,
        fireRateMultiplier: 1.0,
        moveSpeedMultiplier: 1.0,
        knockbackMultiplier: 1.0,
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
        size: 18, // Reduced from 25 for zoom-out view
        healthMultiplier: 1,
        speedMultiplier: 1,
        color: 0x1a1a1a,
        canMerge: true,
    },
    medium: {
        size: 28, // Reduced from 40 for zoom-out view
        healthMultiplier: 2, // Was 2.5 - easier to kill
        speedMultiplier: 0.9, // Was 0.85 - slightly faster
        color: 0x2d1a3d,
        canMerge: true,
    },
    large: {
        size: 42, // Reduced from 60 for zoom-out view
        healthMultiplier: 4, // Was 5 - easier to kill
        speedMultiplier: 0.8, // Was 0.7 - slightly faster
        color: 0x4a1a5d,
        canMerge: true,
    },
    boss: {
        size: 70, // Reduced from 100 for zoom-out view
        healthMultiplier: 10, // Was 12 - more manageable
        speedMultiplier: 0.6, // Was 0.5 - slightly faster
        color: 0x6a1a7d,
        canMerge: false,
    },
}

export interface Projectile {
    graphics: Graphics
    energyAura?: Graphics // Kinetic energy visualization (KE = ½mv² glow)
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
    homingTurnRate?: number // 유도 회전율 (라디안/초)
    // Elastic return properties
    originX?: number // Origin point for return calculation
    originY?: number
    returning?: boolean // Is projectile returning to origin
    returnDamageMultiplier?: number // Damage multiplier when returning
}

export interface Enemy {
    graphics: Container
    wobble?: Wobble
    massRing?: Graphics // Visual ring showing mass (physics visualization)
    glowEffect?: Graphics // 변종별 글로우 효과
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    knockbackTrail?: any // Active knockback trail (managed by EffectsManager)
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

    // Variant system fields
    variant: EnemyVariantId
    behavior: EnemyBehavior
    behaviorState?: {
        // Charger behavior
        charging?: boolean
        chargeCooldown?: number
        chargeDirection?: { x: number; y: number }
        // Orbit behavior
        orbitAngle?: number
        // Zigzag behavior
        zigzagPhase?: number
        // Ghost behavior
        fadeAlpha?: number
        teleportCooldown?: number
    }

    // Formation fields
    formationId?: FormationId
    formationIndex?: number
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

    // === NEW SKILLS ===

    // Elastic Return - projectiles return like spring
    returnDistance: number // Max distance before return, 0 = disabled
    returnDamageMultiplier: number

    // Magnetic Shield - deflects enemy movement
    shieldRadius: number // 0 = disabled
    deflectionStrength: number

    // Static Repulsion - constant push aura
    repulsionRadius: number // 0 = disabled
    repulsionForce: number

    // Buoyant Bomb - float then drop
    floatDuration: number // 0 = disabled
    dropRadius: number
    dropDamage: number

    // Quantum Tunnel - ghost mode (phase through enemies)
    ghostCooldown: number // 0 = disabled
    ghostDuration: number
    ghostDamage: number
    ghostTrailCount: number

    // Pendulum Rhythm - oscillating damage
    rhythmPeriod: number // 0 = disabled
    peakDamageBonus: number

    // Torque Slash - spinning blade aura
    slashRadius: number // 0 = disabled
    slashDamage: number
    slashSpeed: number

    // Time Warp - slow nearby enemies
    warpRadius: number // 0 = disabled
    slowFactor: number

    // === PHASE 3: COOLDOWN-BASED SKILLS ===

    // Wave Pulse - periodic expanding damage wave
    wavePulseInterval: number // 0 = disabled
    wavelength: number
    waveAmplitude: number
    waveSpeed: number

    // Radiant Aura - continuous radiation damage
    auraRadius: number // 0 = disabled
    radiationDamage: number

    // Beat Pulse - beat frequency damage
    beatFreq1: number // 0 = disabled
    beatFreq2: number
    beatAmplitude: number

    // === PHASE 4: AREA EFFECT SKILLS ===

    // Chaos Field - randomize enemy paths
    chaosFieldRadius: number // 0 = disabled
    chaosStrength: number

    // Flow Stream - pull enemies toward player
    flowSpeed: number // 0 = disabled
    suctionForce: number
    streamWidth: number

    // Magnetic Pull - attract enemies
    magneticPullRadius: number // 0 = disabled
    magneticPullStrength: number

    // === PHASE 5: CONDITIONAL TRIGGER SKILLS ===

    // Decay Chain - chain reaction on enemy death
    decayChance: number // 0 = disabled (0-1 probability)
    chainRadius: number

    // Heat Chain - damage transfers to nearby enemies
    conductRange: number // 0 = disabled
    conductRatio: number // damage transfer ratio (0-1)
    maxChain: number // max chain targets

    // Escape Burst - high-speed triggers explosion
    velocityThreshold: number // 0 = disabled
    escapeBonus: number // damage bonus
    escapeBurstRadius: number

    // Doppler Shift - bonus vs approaching/receding enemies
    approachBonus: number // 0 = disabled
    recedeReduction: number

    // === PHASE 6: ORBITAL/ROTATING WEAPON SKILLS ===

    // Orbital Strike - orbiting projectiles
    orbitCount: number // 0 = disabled (number of orbiting projectiles)
    orbitRadius: number // distance from player
    orbitDamage: number // damage per hit

    // Plasma Discharge - Raiden-style lightning laser
    laserDamage: number // 0 = disabled, DPS to connected enemies
    laserChainCount: number // Number of enemies to chain to
    laserRange: number // Max range to first target
    laserChainRange: number // Max range between chain targets

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

    // New skills defaults
    returnDistance: 0,
    returnDamageMultiplier: 0,
    shieldRadius: 0,
    deflectionStrength: 0,
    repulsionRadius: 0,
    repulsionForce: 0,
    floatDuration: 0,
    dropRadius: 0,
    dropDamage: 0,
    ghostCooldown: 0,
    ghostDuration: 0,
    ghostDamage: 0,
    ghostTrailCount: 0,
    rhythmPeriod: 0,
    peakDamageBonus: 0,
    slashRadius: 0,
    slashDamage: 0,
    slashSpeed: 0,
    warpRadius: 0,
    slowFactor: 0,

    // Phase 3 cooldown skills defaults
    wavePulseInterval: 0,
    wavelength: 0,
    waveAmplitude: 0,
    waveSpeed: 0,
    auraRadius: 0,
    radiationDamage: 0,
    beatFreq1: 0,
    beatFreq2: 0,
    beatAmplitude: 0,

    // Phase 4 area effect skills defaults
    chaosFieldRadius: 0,
    chaosStrength: 0,
    flowSpeed: 0,
    suctionForce: 0,
    streamWidth: 0,
    magneticPullRadius: 0,
    magneticPullStrength: 0,

    // Phase 5 conditional trigger skills defaults
    decayChance: 0,
    chainRadius: 0,
    conductRange: 0,
    conductRatio: 0,
    maxChain: 0,
    velocityThreshold: 0,
    escapeBonus: 0,
    escapeBurstRadius: 0,
    approachBonus: 0,
    recedeReduction: 0,

    // Phase 6 orbital skills defaults
    orbitCount: 0,
    orbitRadius: 0,
    orbitDamage: 0,

    // Plasma Discharge defaults
    laserDamage: 0,
    laserChainCount: 0,
    laserRange: 0,
    laserChainRange: 0,

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
