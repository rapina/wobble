/**
 * PerkConfig.ts - Perk definitions for Wobblediver Run mode
 *
 * Roguelike-style perks that players can choose after completing each stage.
 * Perks provide various bonuses and special abilities.
 */

/**
 * Perk categories for organization and potential filtering
 */
export type PerkCategory = 'survival' | 'physics' | 'targeting' | 'special'

/**
 * Perk rarity affects selection probability
 */
export type PerkRarity = 'common' | 'rare' | 'legendary'

/**
 * Effect values that perks can modify
 */
export interface PerkEffect {
    // === Survival ===
    /** Extra lives (+1, +2, etc.) */
    extraLives?: number
    /** Damage reduction multiplier (0.8 = 20% less damage) */
    damageReduction?: number
    /** Max HP increase (flat amount) */
    maxHPBonus?: number
    /** HP heal on stage clear (flat amount) */
    healOnClear?: number
    /** Shield amount (absorbs damage, refills each stage) */
    shieldAmount?: number

    // === Physics ===
    /** Gravity multiplier (0.75 = 25% less gravity, 1.4 = 40% more) */
    gravityMultiplier?: number
    /** Swing speed multiplier */
    swingSpeedMultiplier?: number

    // === Targeting ===
    /** Wormhole size multiplier (1.25 = 25% bigger) */
    wormholeSizeMultiplier?: number
    /** Magnet pull strength (0 = none, 1 = strong) */
    magnetStrength?: number

    // === Special Abilities ===
    /** Always show trajectory line */
    trajectoryAlwaysVisible?: boolean
    /** Enable air control after release */
    hasAirControl?: boolean
    /** Bounce off walls instead of taking damage */
    hasBounce?: boolean
    /** Can double jump in air */
    hasDoubleJump?: boolean
    /** Slow motion on release (duration in seconds) */
    slowMoDuration?: number
    /** Rewind on death (number of uses) */
    rewindUses?: number
    /** Phase through obstacles (number of uses per stage) */
    phaseUses?: number

    // === Score ===
    /** Score multiplier */
    scoreMultiplier?: number
    /** Bonus score for fast clear (per second saved) */
    speedBonusPerSecond?: number
    /** Perfect hit bonus multiplier */
    perfectBonusMultiplier?: number
}

/**
 * Complete perk definition
 */
export interface PerkDefinition {
    id: string
    name: string
    description: string
    icon: string // Emoji or symbol
    category: PerkCategory
    rarity: PerkRarity
    /** How many times this perk can stack (1 = no stacking) */
    maxStacks: number
    /** The effects this perk provides */
    effect: PerkEffect
}

/**
 * Instance of a perk that a player has acquired
 */
export interface PerkInstance {
    perkId: string
    stacks: number
    acquiredAtDepth: number
}

/**
 * All available perks in the game
 */
export const PERK_DEFINITIONS: PerkDefinition[] = [
    // === SURVIVAL (Common) ===
    {
        id: 'extra_heart',
        name: 'Extra Heart',
        description: '+1 Life',
        icon: '❤️',
        category: 'survival',
        rarity: 'common',
        maxStacks: 3,
        effect: {
            extraLives: 1,
        },
    },
    {
        id: 'thick_skin',
        name: 'Thick Skin',
        description: '-20% Damage taken',
        icon: '🛡️',
        category: 'survival',
        rarity: 'common',
        maxStacks: 3,
        effect: {
            damageReduction: 0.8,
        },
    },
    {
        id: 'vital_boost',
        name: 'Vital Boost',
        description: '+25 Max HP',
        icon: '💪',
        category: 'survival',
        rarity: 'common',
        maxStacks: 5,
        effect: {
            maxHPBonus: 25,
        },
    },
    {
        id: 'regeneration',
        name: 'Regeneration',
        description: 'Heal 10 HP on stage clear',
        icon: '✨',
        category: 'survival',
        rarity: 'common',
        maxStacks: 3,
        effect: {
            healOnClear: 10,
        },
    },
    {
        id: 'barrier',
        name: 'Barrier',
        description: '+15 Shield (refills each stage)',
        icon: '🔮',
        category: 'survival',
        rarity: 'rare',
        maxStacks: 3,
        effect: {
            shieldAmount: 15,
        },
    },

    // === PHYSICS (Common) ===
    {
        id: 'featherfall',
        name: 'Featherfall',
        description: '-25% Gravity',
        icon: '🪶',
        category: 'physics',
        rarity: 'common',
        maxStacks: 2,
        effect: {
            gravityMultiplier: 0.75,
        },
    },
    {
        id: 'momentum',
        name: 'Momentum',
        description: '+15% Swing Speed',
        icon: '💨',
        category: 'physics',
        rarity: 'common',
        maxStacks: 3,
        effect: {
            swingSpeedMultiplier: 1.15,
        },
    },

    // === TARGETING (Common/Rare) ===
    {
        id: 'big_target',
        name: 'Big Target',
        description: '+25% Wormhole Size',
        icon: '🎯',
        category: 'targeting',
        rarity: 'common',
        maxStacks: 3,
        effect: {
            wormholeSizeMultiplier: 1.25,
        },
    },
    {
        id: 'eagle_eye',
        name: 'Eagle Eye',
        description: 'Always show trajectory',
        icon: '👁️',
        category: 'targeting',
        rarity: 'rare',
        maxStacks: 1,
        effect: {
            trajectoryAlwaysVisible: true,
        },
    },

    // === SPECIAL (Rare) ===
    {
        id: 'bounce_back',
        name: 'Bounce Back',
        description: 'Bounce off walls',
        icon: '🔄',
        category: 'special',
        rarity: 'rare',
        maxStacks: 1,
        effect: {
            hasBounce: true,
        },
    },

    // === SPECIAL (Legendary) ===
    {
        id: 'double_jump',
        name: 'Double Jump',
        description: 'Jump once in mid-air',
        icon: '🦘',
        category: 'special',
        rarity: 'legendary',
        maxStacks: 2,
        effect: {
            hasDoubleJump: true,
        },
    },
    {
        id: 'slow_motion',
        name: 'Slow Motion',
        description: '0.5s slow-mo on release',
        icon: '⏱️',
        category: 'special',
        rarity: 'legendary',
        maxStacks: 2,
        effect: {
            slowMoDuration: 0.5,
        },
    },
    {
        id: 'rewind',
        name: 'Rewind',
        description: 'Undo death once per run',
        icon: '⏪',
        category: 'special',
        rarity: 'legendary',
        maxStacks: 2,
        effect: {
            rewindUses: 1,
        },
    },

]

/**
 * Get perk definition by ID
 */
export function getPerkById(id: string): PerkDefinition | undefined {
    return PERK_DEFINITIONS.find((p) => p.id === id)
}

/**
 * Get all perks of a specific rarity
 */
export function getPerksByRarity(rarity: PerkRarity): PerkDefinition[] {
    return PERK_DEFINITIONS.filter((p) => p.rarity === rarity)
}

/**
 * Rarity weights for selection (higher = more likely)
 */
export const RARITY_WEIGHTS: Record<PerkRarity, number> = {
    common: 60,
    rare: 30,
    legendary: 10,
}

/**
 * Get combined effect from multiple perk instances
 * Handles stacking logic for each effect type
 */
export function getCombinedPerkEffects(perks: PerkInstance[]): PerkEffect {
    const combined: PerkEffect = {}

    for (const instance of perks) {
        const def = getPerkById(instance.perkId)
        if (!def) continue

        const stacks = instance.stacks
        const effect = def.effect

        // Additive effects (multiply by stacks)
        if (effect.extraLives) {
            combined.extraLives = (combined.extraLives || 0) + effect.extraLives * stacks
        }
        if (effect.maxHPBonus) {
            combined.maxHPBonus = (combined.maxHPBonus || 0) + effect.maxHPBonus * stacks
        }
        if (effect.healOnClear) {
            combined.healOnClear = (combined.healOnClear || 0) + effect.healOnClear * stacks
        }
        if (effect.shieldAmount) {
            combined.shieldAmount = (combined.shieldAmount || 0) + effect.shieldAmount * stacks
        }
        if (effect.rewindUses) {
            combined.rewindUses = (combined.rewindUses || 0) + effect.rewindUses * stacks
        }
        if (effect.phaseUses) {
            combined.phaseUses = (combined.phaseUses || 0) + effect.phaseUses * stacks
        }
        if (effect.speedBonusPerSecond) {
            combined.speedBonusPerSecond =
                (combined.speedBonusPerSecond || 0) + effect.speedBonusPerSecond * stacks
        }
        if (effect.slowMoDuration) {
            combined.slowMoDuration =
                (combined.slowMoDuration || 0) + effect.slowMoDuration * stacks
        }
        if (effect.magnetStrength) {
            combined.magnetStrength =
                (combined.magnetStrength || 0) + effect.magnetStrength * stacks
        }

        // Multiplicative effects (compound by stacks)
        if (effect.damageReduction) {
            const current = combined.damageReduction || 1
            combined.damageReduction = current * Math.pow(effect.damageReduction, stacks)
        }
        if (effect.gravityMultiplier) {
            const current = combined.gravityMultiplier || 1
            combined.gravityMultiplier = current * Math.pow(effect.gravityMultiplier, stacks)
        }
        if (effect.swingSpeedMultiplier) {
            const current = combined.swingSpeedMultiplier || 1
            combined.swingSpeedMultiplier = current * Math.pow(effect.swingSpeedMultiplier, stacks)
        }
        if (effect.wormholeSizeMultiplier) {
            const current = combined.wormholeSizeMultiplier || 1
            combined.wormholeSizeMultiplier =
                current * Math.pow(effect.wormholeSizeMultiplier, stacks)
        }
        if (effect.scoreMultiplier) {
            const current = combined.scoreMultiplier || 1
            combined.scoreMultiplier = current * Math.pow(effect.scoreMultiplier, stacks)
        }
        if (effect.perfectBonusMultiplier) {
            const current = combined.perfectBonusMultiplier || 1
            combined.perfectBonusMultiplier =
                current * Math.pow(effect.perfectBonusMultiplier, stacks)
        }

        // Boolean effects (true if any stack has it)
        if (effect.trajectoryAlwaysVisible) {
            combined.trajectoryAlwaysVisible = true
        }
        if (effect.hasAirControl) {
            combined.hasAirControl = true
        }
        if (effect.hasBounce) {
            combined.hasBounce = true
        }
        if (effect.hasDoubleJump) {
            combined.hasDoubleJump = true
        }
    }

    return combined
}

/**
 * Select random perks for player choice
 * Returns 3 perks weighted by rarity, avoiding duplicates that are at max stacks
 */
export function selectRandomPerks(
    currentPerks: PerkInstance[],
    seed: number,
    count: number = 3
): PerkDefinition[] {
    // Simple seeded random
    const random = () => {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff
        return seed / 0x7fffffff
    }

    // Build pool of available perks
    const availablePerks = PERK_DEFINITIONS.filter((def) => {
        const existing = currentPerks.find((p) => p.perkId === def.id)
        if (!existing) return true
        return existing.stacks < def.maxStacks
    })

    if (availablePerks.length === 0) {
        return []
    }

    // Build weighted pool (each perk appears multiple times based on weight)
    const weightedPool: PerkDefinition[] = []
    for (const perk of availablePerks) {
        const weight = RARITY_WEIGHTS[perk.rarity]
        // Add perk multiple times based on weight (scaled down for efficiency)
        const copies = Math.ceil(weight / 10)
        for (let i = 0; i < copies; i++) {
            weightedPool.push(perk)
        }
    }

    // Shuffle the weighted pool using Fisher-Yates
    for (let i = weightedPool.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1))
        ;[weightedPool[i], weightedPool[j]] = [weightedPool[j], weightedPool[i]]
    }

    // Pick unique perks from the shuffled pool
    const selected: PerkDefinition[] = []
    const usedIds = new Set<string>()

    for (const perk of weightedPool) {
        if (usedIds.has(perk.id)) continue
        selected.push(perk)
        usedIds.add(perk.id)
        if (selected.length >= count) break
    }

    return selected
}
