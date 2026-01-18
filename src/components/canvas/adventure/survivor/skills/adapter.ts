/**
 * Adapter module for backward compatibility
 * Maps the new skill behavior system to the old flat interface
 *
 * This file maintains compatibility with existing code while the migration
 * to the new behavior-based system is completed.
 */

import { LocalizedText } from '@/utils/localization'
import { WobbleShape } from '../../../Wobble'
import {
    getAllSkillDefinitions as getNewSkillDefinitions,
    getSkillDefinition as getNewSkillDefinition,
    getSkillBehavior,
    type SkillDefinition as NewSkillDefinition,
    type RuntimeSkillStats,
    DEFAULT_RUNTIME_STATS,
} from './index'

// ============================================
// LEGACY INTERFACES (for backward compatibility)
// ============================================

/**
 * @deprecated Use the typed SkillEffect from individual skill behaviors instead
 */
export interface SkillLevelEffect {
    // Bounce shot
    bounceCount?: number

    // Piercing shot
    pierceCount?: number
    pierceDamageDecay?: number

    // Explosion shot
    explosionRadius?: number

    // Rapid fire
    fireRateBonus?: number

    // Heavy shot
    damageBonus?: number
    knockbackBonus?: number

    // Homing
    homingTurnRate?: number

    // Spread shot
    spreadCount?: number
    spreadAngle?: number

    // Shockwave
    shockwaveInterval?: number
    shockwaveRadius?: number
    shockwaveKnockback?: number

    // Elastic Return
    returnDistance?: number
    returnDamageMultiplier?: number

    // Magnetic Shield
    shieldRadius?: number
    deflectionStrength?: number

    // Static Repulsion
    repulsionRadius?: number
    repulsionForce?: number

    // Buoyant Bomb
    floatDuration?: number
    dropRadius?: number
    dropDamage?: number

    // Quantum Tunnel
    ghostCooldown?: number
    ghostDuration?: number
    ghostDamage?: number
    ghostTrailCount?: number

    // Pendulum Rhythm
    rhythmPeriod?: number
    peakDamageBonus?: number

    // Torque Slash
    slashRadius?: number
    slashDamage?: number
    slashSpeed?: number

    // Time Warp
    warpRadius?: number
    slowFactor?: number

    // Orbital Strike
    orbitCount?: number
    orbitRadius?: number
    orbitDamage?: number

    // Wave Pulse
    wavelength?: number
    amplitude?: number
    waveSpeed?: number

    // Radiant Aura
    auraRadius?: number
    baseTemp?: number
    radiationDamage?: number

    // Chaos Field
    fieldRadius?: number
    chaosStrength?: number
    durationBonus?: number

    // Heat Chain
    conductRange?: number
    conductRatio?: number
    maxChain?: number

    // Decay Chain
    decayChance?: number
    halfLife?: number
    chainRadius?: number

    // Flow Stream
    flowSpeed?: number
    suctionForce?: number
    streamWidth?: number

    // Frequency Shift
    approachBonus?: number
    recedeReduction?: number
    shiftRange?: number

    // Magnetic Pull
    pullRadius?: number
    pullStrength?: number
    metalBonus?: number

    // Beat Pulse
    freq1?: number
    freq2?: number
    beatAmplitude?: number

    // Escape Burst
    velocityThreshold?: number
    escapeBonus?: number
    burstRadius?: number

    // Plasma Discharge
    laserDamage?: number
    laserChainCount?: number
    laserRange?: number
    laserChainRange?: number
}

/**
 * @deprecated Use SkillDefinition from skills/types.ts instead
 */
export interface LegacySkillDefinition {
    id: string
    name: LocalizedText
    description: LocalizedText
    icon: string
    color: number
    maxLevel: number
    levelEffects: SkillLevelEffect[]
    formulaId?: string
    physicsVisualType?: string
    tags?: string[] // Tags this skill provides (for base skills)
    requires?: string[] // Tags required for this skill (for modifier skills)
}

export interface PassiveDefinition {
    id: string
    name: LocalizedText
    description: LocalizedText
    icon: string
    color: number
}

export interface CharacterSkillConfig {
    startingSkills: string[]
    passive: string
}

export interface PlayerSkill {
    skillId: string
    level: number
}

// ============================================
// PASSIVE DEFINITIONS (unchanged)
// ============================================

export const PASSIVE_DEFINITIONS: Record<string, PassiveDefinition> = {
    momentum: {
        id: 'momentum',
        name: { ko: '모멘텀', en: 'Momentum' },
        description: {
            ko: '이동 시 속도 +5%/초 (최대 +30%), 속도에 비례해 데미지 증가',
            en: 'Speed up while moving (+5%/sec, max +30%). Damage scales with speed.',
        },
        icon: '→',
        color: 0xf5b041,
    },

    fortitude: {
        id: 'fortitude',
        name: { ko: '불굴', en: 'Fortitude' },
        description: {
            ko: '받는 피해 -15%, 레벨당 +2% 방어력',
            en: 'Take 15% less damage. +2% damage reduction per level.',
        },
        icon: '■',
        color: 0x5dade2,
    },

    'critical-edge': {
        id: 'critical-edge',
        name: { ko: '날카로운 일격', en: 'Critical Edge' },
        description: {
            ko: '치명타 확률 +15%, 치명타 2.5배 데미지',
            en: '+15% crit chance. Crits deal 2.5x damage.',
        },
        icon: '▲',
        color: 0xe74c3c,
    },

    'lucky-star': {
        id: 'lucky-star',
        name: { ko: '행운의 별', en: 'Lucky Star' },
        description: {
            ko: 'XP +20%, 10% 확률로 2배 XP',
            en: '+20% XP gain. 10% chance for double XP orbs.',
        },
        icon: '★',
        color: 0xffd700,
    },

    precision: {
        id: 'precision',
        name: { ko: '정밀', en: 'Precision' },
        description: {
            ko: '연속 명중 시 데미지 +10% 누적 (빗나가면 초기화)',
            en: '+10% damage per consecutive hit (resets on miss).',
        },
        icon: '◆',
        color: 0xbb8fce,
    },

    'guardian-aura': {
        id: 'guardian-aura',
        name: { ko: '수호 오라', en: 'Guardian Aura' },
        description: {
            ko: '근접 적의 공격력 -20%',
            en: 'Nearby enemies deal 20% less damage.',
        },
        icon: '⬠',
        color: 0x82e0aa,
    },
}

// ============================================
// CHARACTER SKILLS CONFIG (unchanged)
// ============================================

export const CHARACTER_SKILLS: Record<WobbleShape, CharacterSkillConfig> = {
    circle: {
        startingSkills: [],
        passive: 'momentum',
    },
    square: {
        startingSkills: [],
        passive: 'fortitude',
    },
    triangle: {
        startingSkills: [],
        passive: 'critical-edge',
    },
    star: {
        startingSkills: [],
        passive: 'lucky-star',
    },
    diamond: {
        startingSkills: [],
        passive: 'precision',
    },
    pentagon: {
        startingSkills: [],
        passive: 'guardian-aura',
    },
    shadow: {
        startingSkills: [],
        passive: '',
    },
}

// ============================================
// ADAPTER FUNCTIONS
// ============================================

/**
 * Convert new skill definition to legacy format
 */
function convertToLegacyDefinition(newDef: NewSkillDefinition): LegacySkillDefinition {
    const behavior = getSkillBehavior(newDef.id)
    const levelEffects: SkillLevelEffect[] = []

    // Generate level effects from behavior
    for (let level = 1; level <= newDef.maxLevel; level++) {
        if (behavior) {
            const stats = behavior.getStats(level)
            levelEffects.push(convertStatsToLegacyEffect(stats))
        } else {
            levelEffects.push({})
        }
    }

    return {
        id: newDef.id,
        name: newDef.name,
        description: newDef.description,
        icon: newDef.icon,
        color: newDef.color,
        maxLevel: newDef.maxLevel,
        levelEffects,
        formulaId: newDef.formulaId,
        physicsVisualType: newDef.physicsVisualType,
        tags: newDef.tags,
        requires: newDef.requires,
    }
}

/**
 * Convert runtime stats to legacy effect format
 */
function convertStatsToLegacyEffect(stats: Partial<RuntimeSkillStats>): SkillLevelEffect {
    const effect: SkillLevelEffect = {}

    if (stats.bounceCount) effect.bounceCount = stats.bounceCount
    if (stats.pierceCount) effect.pierceCount = stats.pierceCount
    if (stats.pierceDamageDecay) effect.pierceDamageDecay = stats.pierceDamageDecay
    if (stats.explosionRadius) effect.explosionRadius = stats.explosionRadius
    if (stats.fireRateMultiplier && stats.fireRateMultiplier !== 1) {
        effect.fireRateBonus = 1 / stats.fireRateMultiplier - 1
    }
    if (stats.damageMultiplier && stats.damageMultiplier !== 1) {
        effect.damageBonus = stats.damageMultiplier - 1
    }
    if (stats.knockbackMultiplier && stats.knockbackMultiplier !== 1) {
        effect.knockbackBonus = stats.knockbackMultiplier - 1
    }
    if (stats.homingTurnRate) effect.homingTurnRate = stats.homingTurnRate
    if (stats.spreadCount && stats.spreadCount > 1) effect.spreadCount = stats.spreadCount
    if (stats.spreadAngle) effect.spreadAngle = stats.spreadAngle
    if (stats.shockwaveInterval) effect.shockwaveInterval = stats.shockwaveInterval
    if (stats.shockwaveRadius) effect.shockwaveRadius = stats.shockwaveRadius
    if (stats.shockwaveKnockback) effect.shockwaveKnockback = stats.shockwaveKnockback
    if (stats.returnDistance) effect.returnDistance = stats.returnDistance
    if (stats.returnDamageMultiplier) effect.returnDamageMultiplier = stats.returnDamageMultiplier
    if (stats.shieldRadius) effect.shieldRadius = stats.shieldRadius
    if (stats.deflectionStrength) effect.deflectionStrength = stats.deflectionStrength
    if (stats.repulsionRadius) effect.repulsionRadius = stats.repulsionRadius
    if (stats.repulsionForce) effect.repulsionForce = stats.repulsionForce
    if (stats.floatDuration) effect.floatDuration = stats.floatDuration
    if (stats.dropRadius) effect.dropRadius = stats.dropRadius
    if (stats.dropDamage) effect.dropDamage = stats.dropDamage
    if (stats.ghostCooldown) effect.ghostCooldown = stats.ghostCooldown
    if (stats.ghostDuration) effect.ghostDuration = stats.ghostDuration
    if (stats.ghostDamage) effect.ghostDamage = stats.ghostDamage
    if (stats.ghostTrailCount) effect.ghostTrailCount = stats.ghostTrailCount
    if (stats.rhythmPeriod) effect.rhythmPeriod = stats.rhythmPeriod
    if (stats.peakDamageBonus) effect.peakDamageBonus = stats.peakDamageBonus
    if (stats.slashRadius) effect.slashRadius = stats.slashRadius
    if (stats.slashDamage) effect.slashDamage = stats.slashDamage
    if (stats.slashSpeed) effect.slashSpeed = stats.slashSpeed
    if (stats.warpRadius) effect.warpRadius = stats.warpRadius
    if (stats.slowFactor) effect.slowFactor = stats.slowFactor
    if (stats.orbitCount) effect.orbitCount = stats.orbitCount
    if (stats.orbitRadius) effect.orbitRadius = stats.orbitRadius
    if (stats.orbitDamage) effect.orbitDamage = stats.orbitDamage
    if (stats.wavelength) effect.wavelength = stats.wavelength
    if (stats.waveAmplitude) effect.amplitude = stats.waveAmplitude
    if (stats.waveSpeed) effect.waveSpeed = stats.waveSpeed
    if (stats.auraRadius) effect.auraRadius = stats.auraRadius
    if (stats.radiationDamage) effect.radiationDamage = stats.radiationDamage
    if (stats.chaosFieldRadius) effect.fieldRadius = stats.chaosFieldRadius
    if (stats.chaosStrength) effect.chaosStrength = stats.chaosStrength
    if (stats.conductRange) effect.conductRange = stats.conductRange
    if (stats.conductRatio) effect.conductRatio = stats.conductRatio
    if (stats.maxChain) effect.maxChain = stats.maxChain
    if (stats.decayChance) effect.decayChance = stats.decayChance
    if (stats.chainRadius) effect.chainRadius = stats.chainRadius
    if (stats.flowSpeed) effect.flowSpeed = stats.flowSpeed
    if (stats.suctionForce) effect.suctionForce = stats.suctionForce
    if (stats.streamWidth) effect.streamWidth = stats.streamWidth
    if (stats.approachBonus) effect.approachBonus = stats.approachBonus
    if (stats.recedeReduction) effect.recedeReduction = stats.recedeReduction
    if (stats.magneticPullRadius) effect.pullRadius = stats.magneticPullRadius
    if (stats.magneticPullStrength) effect.pullStrength = stats.magneticPullStrength
    if (stats.beatFreq1) effect.freq1 = stats.beatFreq1
    if (stats.beatFreq2) effect.freq2 = stats.beatFreq2
    if (stats.beatAmplitude) effect.beatAmplitude = stats.beatAmplitude
    if (stats.velocityThreshold) effect.velocityThreshold = stats.velocityThreshold
    if (stats.escapeBonus) effect.escapeBonus = stats.escapeBonus
    if (stats.escapeBurstRadius) effect.burstRadius = stats.escapeBurstRadius
    if (stats.laserDamage) effect.laserDamage = stats.laserDamage
    if (stats.laserChainCount) effect.laserChainCount = stats.laserChainCount
    if (stats.laserRange) effect.laserRange = stats.laserRange
    if (stats.laserChainRange) effect.laserChainRange = stats.laserChainRange

    return effect
}

// Build legacy SKILL_DEFINITIONS from new system
let _cachedSkillDefinitions: Record<string, LegacySkillDefinition> | null = null

function buildSkillDefinitions(): Record<string, LegacySkillDefinition> {
    if (_cachedSkillDefinitions) return _cachedSkillDefinitions

    const definitions: Record<string, LegacySkillDefinition> = {}
    const newDefinitions = getNewSkillDefinitions()

    for (const newDef of newDefinitions) {
        definitions[newDef.id] = convertToLegacyDefinition(newDef)
    }

    _cachedSkillDefinitions = definitions
    return definitions
}

/**
 * @deprecated Use getAllSkillDefinitions from skills/registry.ts instead
 */
export function getSkillDefinitions(): Record<string, LegacySkillDefinition> {
    return buildSkillDefinitions()
}

/**
 * Alias for backward compatibility
 */
export const SKILL_DEFINITIONS = new Proxy(
    {},
    {
        get: (_, prop: string) => {
            return buildSkillDefinitions()[prop]
        },
        ownKeys: () => {
            return Object.keys(buildSkillDefinitions())
        },
        getOwnPropertyDescriptor: (_, prop: string) => {
            const defs = buildSkillDefinitions()
            if (prop in defs) {
                return {
                    enumerable: true,
                    configurable: true,
                    value: defs[prop],
                }
            }
            return undefined
        },
    }
) as Record<string, LegacySkillDefinition>

// ============================================
// LEGACY HELPER FUNCTIONS
// ============================================

/**
 * Get skill effect at a specific level
 */
export function getSkillEffectAtLevel(skillId: string, level: number): SkillLevelEffect {
    const behavior = getSkillBehavior(skillId)
    if (!behavior) return {}
    return convertStatsToLegacyEffect(behavior.getStats(level))
}

/**
 * Get description for next level upgrade
 */
export function getNextLevelDescription(skillId: string, currentLevel: number): string {
    const behavior = getSkillBehavior(skillId)
    if (!behavior) return ''
    return behavior.getNextLevelDescription(currentLevel)
}

/**
 * Get current level description
 */
export function getCurrentLevelDescription(skillId: string, level: number): string {
    if (level <= 0) return ''
    const behavior = getSkillBehavior(skillId)
    if (!behavior) return ''
    return behavior.getLevelDescription(level)
}

/**
 * @deprecated Use RuntimeSkillStats from skills/types.ts instead
 */
export interface CombinedSkillStats extends RuntimeSkillStats {
    // Extended for backward compatibility
    chargePerDistance: number
    maxCharge: number
    damagePerCharge: number
}

/**
 * Calculate combined stats from all skills
 * @deprecated Use SkillCombiner.combine() instead
 */
export function calculateCombinedSkillStats(skills: PlayerSkill[]): CombinedSkillStats {
    const result: CombinedSkillStats = {
        ...DEFAULT_RUNTIME_STATS,
        activeSkillStates: new Map(),
        chargePerDistance: 0,
        maxCharge: 0,
        damagePerCharge: 0,
    }

    for (const skill of skills) {
        const behavior = getSkillBehavior(skill.skillId)
        if (!behavior) continue

        const stats = behavior.getStats(skill.level)
        mergeStats(result, stats)
    }

    return result
}

function mergeStats(result: CombinedSkillStats, stats: Partial<RuntimeSkillStats>): void {
    for (const [key, value] of Object.entries(stats)) {
        if (value === undefined || key === 'activeSkillStates') continue

        const k = key as keyof CombinedSkillStats
        const current = result[k] as number

        // Multiplicative stats
        if (
            [
                'fireRateMultiplier',
                'damageMultiplier',
                'knockbackMultiplier',
                'moveSpeedMultiplier',
            ].includes(key)
        ) {
            ;(result[k] as number) = current * (value as number)
        }
        // Min-based (use lowest non-zero)
        else if (
            [
                'ghostCooldown',
                'rhythmPeriod',
                'floatDuration',
                'wavePulseInterval',
                'shockwaveInterval',
            ].includes(key)
        ) {
            if (current === 0) {
                ;(result[k] as number) = value as number
            } else if ((value as number) > 0) {
                ;(result[k] as number) = Math.min(current, value as number)
            }
        }
        // Max-based or additive
        else {
            ;(result[k] as number) = Math.max(current, value as number)
        }
    }
}

/**
 * Get list of all skill definitions
 */
export function getAllSkillDefinitions(): LegacySkillDefinition[] {
    return Object.values(buildSkillDefinitions())
}

/**
 * Get skill definition by ID
 */
export function getSkillDefinition(skillId: string): LegacySkillDefinition | undefined {
    return buildSkillDefinitions()[skillId]
}

/**
 * Get passive definition by ID
 */
export function getPassiveDefinition(passiveId: string): PassiveDefinition | undefined {
    return PASSIVE_DEFINITIONS[passiveId]
}

/**
 * Get character's starting skills and passive
 */
export function getCharacterSkillConfig(shape: WobbleShape): CharacterSkillConfig {
    return (
        CHARACTER_SKILLS[shape] || {
            startingSkills: [],
            passive: '',
        }
    )
}
