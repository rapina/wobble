/**
 * StageConfig.ts - Stage configuration interfaces for Wobblediver
 *
 * Defines the structure for stage generation including anchor personalities,
 * abyss tentacles, portals, and difficulty scaling parameters.
 */

import { BlobExpression } from '@/components/canvas/Blob'

/**
 * Anchor wobble personality types
 * Each personality has distinct behavioral characteristics
 */
export type AnchorPersonality = 'steady' | 'eager' | 'lazy' | 'rhythmic' | 'chaotic'

/**
 * Configuration for an anchor wobble personality
 */
export interface AnchorPersonalityConfig {
    /** Personality type identifier */
    type: AnchorPersonality

    /** Cooldown between presses (seconds) */
    cooldownMin: number
    cooldownMax: number

    /** Energy multiplier when pressing (affects pendulum swing) */
    energyMultiplier: number

    /** Probability of double-press (0-1) */
    doublePressChance: number

    /** Delay between double presses (seconds) */
    doublePressDelay: number

    /** Blob color (hex) */
    color: number

    /** Default expression when idle */
    idleExpression: BlobExpression

    /** Expression during press action */
    pressExpression: BlobExpression

    /** Expression when preparing to press */
    prepareExpression: BlobExpression
}

/**
 * Predefined personality configurations
 */
export const ANCHOR_PERSONALITIES: Record<AnchorPersonality, AnchorPersonalityConfig> = {
    /** Steady: Consistent, predictable timing. Good for learning. */
    steady: {
        type: 'steady',
        cooldownMin: 5.0,
        cooldownMax: 5.0,
        energyMultiplier: 1.0,
        doublePressChance: 0,
        doublePressDelay: 0,
        color: 0x9b59b6, // Purple
        idleExpression: 'happy',
        pressExpression: 'effort',
        prepareExpression: 'excited',
    },

    /** Eager: Fast, frequent presses with lower energy */
    eager: {
        type: 'eager',
        cooldownMin: 2.0,
        cooldownMax: 3.0,
        energyMultiplier: 0.7,
        doublePressChance: 0.3,
        doublePressDelay: 0.3,
        color: 0xe74c3c, // Red
        idleExpression: 'excited',
        pressExpression: 'angry',
        prepareExpression: 'angry',
    },

    /** Lazy: Slow, infrequent but powerful presses */
    lazy: {
        type: 'lazy',
        cooldownMin: 7.0,
        cooldownMax: 9.0,
        energyMultiplier: 1.5,
        doublePressChance: 0,
        doublePressDelay: 0,
        color: 0x3498db, // Blue
        idleExpression: 'sleepy',
        pressExpression: 'effort',
        prepareExpression: 'happy',
    },

    /** Rhythmic: Regular pattern with double-taps */
    rhythmic: {
        type: 'rhythmic',
        cooldownMin: 4.0,
        cooldownMax: 4.0,
        energyMultiplier: 0.9,
        doublePressChance: 0.8,
        doublePressDelay: 0.2,
        color: 0x2ecc71, // Green
        idleExpression: 'happy',
        pressExpression: 'excited',
        prepareExpression: 'happy',
    },

    /** Chaotic: Unpredictable timing and energy */
    chaotic: {
        type: 'chaotic',
        cooldownMin: 2.0,
        cooldownMax: 8.0,
        energyMultiplier: 1.2,
        doublePressChance: 0.4,
        doublePressDelay: 0.4,
        color: 0xf39c12, // Orange
        idleExpression: 'dizzy',
        pressExpression: 'angry',
        prepareExpression: 'excited',
    },
}

/**
 * Portal orientation types
 */
export type PortalOrientation = 'horizontal' | 'vertical'

/**
 * Configuration for a single portal in a pair
 */
export interface PortalConfig {
    x: number
    y: number
    radius: number
    orientation: PortalOrientation
}

/**
 * Configuration for a portal pair (entrance + exit)
 */
export interface PortalPairStageConfig {
    entrance: PortalConfig
    exit: PortalConfig
    color: 'purple' | 'teal' | 'red' | 'gold'
}

/**
 * Configuration for an abyss tentacle
 */
export interface AbyssTentacleConfig {
    /** X position of tentacle base (on abyss surface) */
    baseX: number

    /** Maximum length the tentacle can extend */
    maxLength: number

    /** Pulling force applied to wormhole */
    pullStrength: number

    /** Time between direction changes (seconds) */
    directionChangeInterval: number

    /** Maximum horizontal displacement of wormhole */
    maxDisplacement: number

    /** Tentacle color */
    color: number

    /** Number of segments in the tentacle */
    segments: number
}

/**
 * Configuration for wall-mounted obstacle tentacles
 */
export interface WallTentacleConfig {
    /** Which wall the tentacle is attached to */
    side: 'left' | 'right'

    /** Y position on the wall */
    y: number

    /** Tentacle length */
    length: number

    /** Attack range (how far it can reach to grab) */
    attackRange: number

    /** Movement pattern */
    movement: 'static' | 'sway' | 'vertical'

    /** Movement speed */
    speed: number

    /** Movement range */
    range: number
}

/**
 * Wormhole (goal) configuration
 */
export interface WormholeConfig {
    x: number
    y: number
    radius: number
    widthScale: number
    orientation: PortalOrientation
}

/**
 * Complete stage configuration
 */
export interface StageConfig {
    /** Stage depth (1-based) */
    depth: number

    /** Seed used for this stage */
    seed: number

    /** Wormhole (goal) settings */
    wormhole: WormholeConfig

    /** Anchor wobble personality */
    anchorPersonality: AnchorPersonalityConfig

    /** Pendulum rope length range */
    ropeLength: {
        min: number
        max: number
    }

    /** Starting angle range (radians) */
    startAngle: {
        min: number
        max: number
    }

    /** Wall-mounted tentacle obstacles */
    wallTentacles: WallTentacleConfig[]

    /** Portal pairs for teleportation */
    portalPairs: PortalPairStageConfig[]

    /** Abyss tentacles (pull wormhole) */
    abyssTentacles: AbyssTentacleConfig[]

    /**
     * Water level rise amount (0 = base level, 1 = max rise)
     * Higher water level = tentacles have more reach and strength
     */
    waterLevelRise: number

    /**
     * Wormhole shrink rate (widthScale reduction per second)
     * 0 = no shrinking, higher = faster shrinking
     * Wormhole starts at widthScale 2.5 and shrinks toward minWidthScale
     */
    wormholeShrinkRate: number

    /**
     * Minimum wormhole width scale (shrinking stops here)
     */
    wormholeMinWidthScale: number

    /** Trajectory visibility mode */
    trajectoryMode: 'always' | 'timed' | 'flicker' | 'hidden'

    /** Trajectory visibility duration (for 'timed' mode) */
    trajectoryDuration: number

    /** Flicker interval (for 'flicker' mode) */
    trajectoryFlickerInterval: number

    /** Flicker on ratio (for 'flicker' mode) */
    trajectoryFlickerOnRatio: number

    /** Which difficulty factors were activated by dice rolls */
    activatedFactors: ActivatedFactors
}

/**
 * Probability curve for a difficulty factor
 * Probability = min(maxProb, baseProb + (depth - unlockDepth) * growthPerDepth)
 */
export interface DifficultyFactorCurve {
    /** Depth at which this factor can first appear */
    unlockDepth: number

    /** Base probability at unlock depth (0-1) */
    baseProb: number

    /** Probability increase per depth after unlock (0-1) */
    growthPerDepth: number

    /** Maximum probability cap (0-1) */
    maxProb: number
}

/**
 * All difficulty factor probability curves
 */
export interface DifficultyFactorCurves {
    /** Abyss tentacles (pull wormhole) */
    abyssTentacle: DifficultyFactorCurve

    /** Extra abyss tentacles (2nd, 3rd...) */
    extraAbyssTentacle: DifficultyFactorCurve

    /** Portal pair (teleportation) */
    portalPair: DifficultyFactorCurve

    /** Extra portal pair */
    extraPortalPair: DifficultyFactorCurve

    /** Wall tentacle (obstacle) */
    wallTentacle: DifficultyFactorCurve

    /** Extra wall tentacles */
    extraWallTentacle: DifficultyFactorCurve

    /** Trajectory becomes timed (not always visible) */
    trajectoryTimed: DifficultyFactorCurve

    /** Trajectory flickers */
    trajectoryFlicker: DifficultyFactorCurve

    /** Water level rises (makes tentacles more aggressive) */
    waterLevelRise: DifficultyFactorCurve

    /** Extra water level rise */
    extraWaterRise: DifficultyFactorCurve

    /** Wormhole shrinks */
    wormholeShrink: DifficultyFactorCurve
}

/**
 * Default difficulty factor curves
 * Each factor has its own unlock timing and growth rate
 */
export const DIFFICULTY_CURVES: DifficultyFactorCurves = {
    // Abyss tentacle: unlocks at depth 4, starts low, grows steadily
    abyssTentacle: {
        unlockDepth: 4,
        baseProb: 0.15,
        growthPerDepth: 0.12,
        maxProb: 0.85,
    },

    // Extra tentacles: harder to get, unlocks later
    extraAbyssTentacle: {
        unlockDepth: 7,
        baseProb: 0.1,
        growthPerDepth: 0.08,
        maxProb: 0.6,
    },

    // Portal: unlocks at depth 5
    portalPair: {
        unlockDepth: 5,
        baseProb: 0.2,
        growthPerDepth: 0.1,
        maxProb: 0.75,
    },

    // Extra portal: rare, late game
    extraPortalPair: {
        unlockDepth: 10,
        baseProb: 0.1,
        growthPerDepth: 0.06,
        maxProb: 0.5,
    },

    // Wall tentacle: early obstacle
    wallTentacle: {
        unlockDepth: 3,
        baseProb: 0.25,
        growthPerDepth: 0.15,
        maxProb: 0.9,
    },

    // Extra wall tentacles
    extraWallTentacle: {
        unlockDepth: 5,
        baseProb: 0.15,
        growthPerDepth: 0.1,
        maxProb: 0.7,
    },

    // Trajectory becomes timed
    trajectoryTimed: {
        unlockDepth: 3,
        baseProb: 0.3,
        growthPerDepth: 0.15,
        maxProb: 0.95,
    },

    // Trajectory flickers (harder)
    trajectoryFlicker: {
        unlockDepth: 7,
        baseProb: 0.15,
        growthPerDepth: 0.1,
        maxProb: 0.7,
    },

    // Water rises (tied to abyss tentacles being more threatening)
    waterLevelRise: {
        unlockDepth: 4,
        baseProb: 0.2,
        growthPerDepth: 0.12,
        maxProb: 0.8,
    },

    // Extra water rise
    extraWaterRise: {
        unlockDepth: 8,
        baseProb: 0.1,
        growthPerDepth: 0.08,
        maxProb: 0.6,
    },

    // Wormhole shrinks
    wormholeShrink: {
        unlockDepth: 2,
        baseProb: 0.4,
        growthPerDepth: 0.1,
        maxProb: 0.95,
    },
}

/**
 * Tracks which difficulty factors were activated for this stage
 * Used for displaying hints and understanding what changed
 */
export interface ActivatedFactors {
    /** Number of abyss tentacles activated (0 = none) */
    abyssTentacleCount: number

    /** First time abyss tentacle appeared this game? */
    abyssTentacleFirstTime: boolean

    /** Number of portal pairs activated */
    portalPairCount: number

    /** First time portal appeared this game? */
    portalFirstTime: boolean

    /** Number of wall tentacles activated */
    wallTentacleCount: number

    /** First time wall tentacle appeared this game? */
    wallTentacleFirstTime: boolean

    /** Trajectory mode changed to timed? */
    trajectoryTimedActivated: boolean

    /** First time trajectory became timed? */
    trajectoryTimedFirstTime: boolean

    /** Trajectory mode changed to flicker? */
    trajectoryFlickerActivated: boolean

    /** First time trajectory flickered? */
    trajectoryFlickerFirstTime: boolean

    /** Water level rise amount (0-1) */
    waterLevelRiseAmount: number

    /** First time water rose? */
    waterRiseFirstTime: boolean

    /** Wormhole shrinks during the stage? */
    wormholeShrinkActivated: boolean

    /** First time wormhole shrinking? */
    wormholeShrinkFirstTime: boolean

    /** Shrink rate (widthScale reduction per second, 0 = no shrinking) */
    wormholeShrinkRate: number

    /** Minimum widthScale after shrinking */
    wormholeMinWidthScale: number
}

/**
 * Calculate probability for a factor at given depth
 */
export function getFactorProbability(curve: DifficultyFactorCurve, depth: number): number {
    if (depth < curve.unlockDepth) return 0
    const depthSinceUnlock = depth - curve.unlockDepth
    const prob = curve.baseProb + depthSinceUnlock * curve.growthPerDepth
    return Math.min(curve.maxProb, prob)
}

/**
 * Personality weights that evolve with depth
 * Early: mostly steady, Late: more chaotic variety
 */
export function getPersonalityWeights(depth: number): Record<AnchorPersonality, number> {
    // Transition from tutorial (steady-heavy) to chaotic variety
    const t = Math.min(1, (depth - 1) / 12) // 0 at depth 1, 1 at depth 13+

    return {
        steady: Math.round(80 - t * 70), // 80 → 10
        eager: Math.round(10 + t * 15), // 10 → 25
        lazy: Math.round(5 + t * 10), // 5 → 15
        rhythmic: Math.round(5 + t * 15), // 5 → 20
        chaotic: Math.round(0 + t * 30), // 0 → 30
    }
}
