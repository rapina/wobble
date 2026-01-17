import { Graphics } from 'pixi.js'
import { LocalizedText } from '@/utils/localization'
import type { Projectile, Enemy, PlayerStats } from '../types'

// ============================================
// SKILL CATEGORY TYPES
// ============================================

/**
 * Skill categories for organization and behavior grouping
 */
export type SkillCategory =
    | 'projectile' // Modifies projectiles (bounce, pierce, explosion, spread)
    | 'aura' // Passive aura effects (radiant, chaos field, repulsion)
    | 'orbital' // Orbiting objects (orbital strike, torque slash)
    | 'player' // Player state modifiers (ghost mode, rhythm, time warp)
    | 'trigger' // Event-triggered (decay chain, catalyst, heat chain)

// ============================================
// SKILL EFFECT BASE TYPE
// ============================================

/**
 * Base skill effect interface - each skill defines its own effect type
 * The type field acts as a discriminator for type-safe handling
 */
export interface SkillEffect {
    readonly type: string
}

// ============================================
// SKILL DEFINITION
// ============================================

/**
 * Skill definition with typed effect
 * This replaces the old flat SkillDefinition interface
 */
export interface SkillDefinition<T extends SkillEffect = SkillEffect> {
    readonly id: string
    readonly name: LocalizedText
    readonly description: LocalizedText
    readonly icon: string
    readonly color: number
    readonly maxLevel: number
    readonly category: SkillCategory
    readonly formulaId?: string
    readonly physicsVisualType?: string
    getLevelEffect(level: number): T
}

// ============================================
// SKILL CONTEXT
// ============================================

/**
 * Context passed to skill behaviors during update
 */
export interface SkillContext {
    // Player state
    playerX: number
    playerY: number
    playerVx: number
    playerVy: number
    playerHealth: number
    maxPlayerHealth: number
    isMoving: boolean

    // Game state
    gameTime: number
    deltaTime: number

    // Entity references
    enemies: Enemy[]
    projectiles: Projectile[]

    // Graphics layers
    effectContainer: Graphics | null
    skillGraphics: Graphics | null

    // Player stats (for modifications)
    stats: PlayerStats

    // Callbacks for skill effects
    damageEnemy: (enemy: Enemy, damage: number, source?: string) => void
    spawnEffect: (x: number, y: number, type: string, params?: Record<string, unknown>) => void
}

// ============================================
// SKILL STATE
// ============================================

/**
 * Persistent state for a skill instance
 */
export interface SkillState {
    skillId: string
    level: number
    cooldownTimer: number
    activeTimer: number
    customState: Record<string, unknown>
}

// ============================================
// RUNTIME SKILL STATS
// ============================================

/**
 * Runtime stats - only common stats used by game systems
 * This is a simplified version that skills contribute to
 */
export interface RuntimeSkillStats {
    // Projectile modifiers
    fireRateMultiplier: number
    damageMultiplier: number
    knockbackMultiplier: number
    bounceCount: number
    pierceCount: number
    pierceDamageDecay: number
    spreadCount: number
    spreadAngle: number
    homingTurnRate: number
    explosionRadius: number

    // Elastic return
    returnDistance: number
    returnDamageMultiplier: number

    // Player modifiers
    moveSpeedMultiplier: number

    // Shockwave (centripetal pulse)
    shockwaveInterval: number
    shockwaveRadius: number
    shockwaveKnockback: number

    // Aura effects
    shieldRadius: number
    deflectionStrength: number
    repulsionRadius: number
    repulsionForce: number
    warpRadius: number
    slowFactor: number
    auraRadius: number
    radiationDamage: number
    chaosFieldRadius: number
    chaosStrength: number

    // Orbital effects
    orbitCount: number
    orbitRadius: number
    orbitDamage: number
    slashRadius: number
    slashDamage: number
    slashSpeed: number

    // Player state effects
    ghostCooldown: number
    ghostDuration: number
    ghostDamage: number
    ghostTrailCount: number
    rhythmPeriod: number
    peakDamageBonus: number
    floatDuration: number
    dropRadius: number
    dropDamage: number

    // Wave/pulse effects
    wavePulseInterval: number
    wavelength: number
    waveAmplitude: number
    waveSpeed: number
    beatFreq1: number
    beatFreq2: number
    beatAmplitude: number

    // Trigger effects
    decayChance: number
    chainRadius: number
    conductRange: number
    conductRatio: number
    maxChain: number
    velocityThreshold: number
    escapeBonus: number
    escapeBurstRadius: number
    approachBonus: number
    recedeReduction: number

    // Flow/magnetic effects
    flowSpeed: number
    suctionForce: number
    streamWidth: number
    magneticPullRadius: number
    magneticPullStrength: number

    // Plasma discharge (laser)
    laserDamage: number
    laserChainCount: number
    laserRange: number
    laserChainRange: number

    // Kinetic charge
    chargePerDistance: number
    maxCharge: number
    damagePerCharge: number

    // Active skill states (for complex skill behaviors)
    activeSkillStates: Map<string, SkillState>
}

/**
 * Default runtime skill stats
 */
export const DEFAULT_RUNTIME_STATS: RuntimeSkillStats = {
    fireRateMultiplier: 1,
    damageMultiplier: 1,
    knockbackMultiplier: 1,
    bounceCount: 0,
    pierceCount: 0,
    pierceDamageDecay: 0,
    spreadCount: 1,
    spreadAngle: 0,
    homingTurnRate: 0,
    explosionRadius: 0,

    returnDistance: 0,
    returnDamageMultiplier: 0,

    moveSpeedMultiplier: 1,

    shockwaveInterval: 0,
    shockwaveRadius: 0,
    shockwaveKnockback: 0,

    shieldRadius: 0,
    deflectionStrength: 0,
    repulsionRadius: 0,
    repulsionForce: 0,
    warpRadius: 0,
    slowFactor: 0,
    auraRadius: 0,
    radiationDamage: 0,
    chaosFieldRadius: 0,
    chaosStrength: 0,

    orbitCount: 0,
    orbitRadius: 0,
    orbitDamage: 0,
    slashRadius: 0,
    slashDamage: 0,
    slashSpeed: 0,

    ghostCooldown: 0,
    ghostDuration: 0,
    ghostDamage: 0,
    ghostTrailCount: 0,
    rhythmPeriod: 0,
    peakDamageBonus: 0,
    floatDuration: 0,
    dropRadius: 0,
    dropDamage: 0,

    wavePulseInterval: 0,
    wavelength: 0,
    waveAmplitude: 0,
    waveSpeed: 0,
    beatFreq1: 0,
    beatFreq2: 0,
    beatAmplitude: 0,

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

    flowSpeed: 0,
    suctionForce: 0,
    streamWidth: 0,
    magneticPullRadius: 0,
    magneticPullStrength: 0,

    laserDamage: 0,
    laserChainCount: 0,
    laserRange: 0,
    laserChainRange: 0,

    chargePerDistance: 0,
    maxCharge: 0,
    damagePerCharge: 0,

    activeSkillStates: new Map(),
}

// ============================================
// SKILL BEHAVIOR INTERFACE
// ============================================

/**
 * Skill behavior interface - handles runtime logic
 * Each skill implements this interface to define its behavior
 */
export interface ISkillBehavior<T extends SkillEffect = SkillEffect> {
    readonly skillId: string
    readonly category: SkillCategory
    readonly definition: SkillDefinition<T>

    /**
     * Get the effect for a specific level
     */
    getEffect(level: number): T

    /**
     * Called when skill is added or upgraded
     */
    onActivate?(level: number, context: SkillContext): void

    /**
     * Called when skill is removed
     */
    onDeactivate?(context: SkillContext): void

    /**
     * Called each frame - for skills that need continuous updates
     */
    update?(deltaTime: number, level: number, context: SkillContext): void

    /**
     * Called to apply effect to projectiles - for projectile-modifying skills
     */
    modifyProjectile?(projectile: Projectile, level: number): void

    /**
     * Called to render visual effects
     */
    render?(graphics: Graphics, level: number, context: SkillContext): void

    /**
     * Get aggregated stats contribution from this skill at given level
     */
    getStats(level: number): Partial<RuntimeSkillStats>

    /**
     * Get description for UI at given level
     */
    getLevelDescription(level: number): string

    /**
     * Get next level upgrade description
     */
    getNextLevelDescription(currentLevel: number): string
}

// ============================================
// PLAYER SKILL INSTANCE
// ============================================

/**
 * Player skill instance - tracks an active skill and its level
 */
export interface PlayerSkill {
    skillId: string
    level: number
}
