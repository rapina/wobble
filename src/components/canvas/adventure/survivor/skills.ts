import { WobbleShape } from '../../Wobble'

// Skill effect types for each level
export interface SkillLevelEffect {
    // Bounce shot
    bounceCount?: number

    // Piercing shot
    pierceCount?: number
    pierceDamageDecay?: number // 0-1, damage lost per pierce

    // Explosion shot
    explosionRadius?: number

    // Rapid fire
    fireRateBonus?: number // Multiplier (e.g., 0.2 = +20%)

    // Heavy shot
    damageBonus?: number // Multiplier
    knockbackBonus?: number // Multiplier

    // Homing
    homingTurnRate?: number // Radians per second

    // Spread shot
    spreadCount?: number // Number of projectiles
    spreadAngle?: number // Degrees

    // Shockwave
    shockwaveInterval?: number // Seconds between pulses
    shockwaveRadius?: number
    shockwaveKnockback?: number
}

export interface SkillDefinition {
    id: string
    nameEn: string
    nameKo: string
    descriptionEn: string
    descriptionKo: string
    icon: string
    color: number
    maxLevel: number
    levelEffects: SkillLevelEffect[] // Array of 5 effects (index 0 = level 1)
}

export interface PlayerSkill {
    skillId: string
    level: number // 1-5
}

export interface PassiveDefinition {
    id: string
    nameEn: string
    nameKo: string
    descriptionEn: string
    descriptionKo: string
    icon: string
    color: number
}

export interface CharacterSkillConfig {
    startingSkills: string[]
    passive: string
}

// ============================================
// SKILL DEFINITIONS (8 skills)
// ============================================

export const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
    'bounce-shot': {
        id: 'bounce-shot',
        nameEn: 'Bounce Shot',
        nameKo: '바운스 샷',
        descriptionEn: 'Projectiles bounce to nearby enemies',
        descriptionKo: '탄환이 근처 적에게 튕겨갑니다',
        icon: '◎',
        color: 0x3498db,
        maxLevel: 5,
        levelEffects: [
            { bounceCount: 1 },
            { bounceCount: 2 },
            { bounceCount: 3 },
            { bounceCount: 4 },
            { bounceCount: 5 },
        ],
    },

    'piercing-shot': {
        id: 'piercing-shot',
        nameEn: 'Piercing Shot',
        nameKo: '관통 샷',
        descriptionEn: 'Projectiles pass through enemies',
        descriptionKo: '탄환이 적을 관통합니다',
        icon: '➤',
        color: 0xe74c3c,
        maxLevel: 5,
        // Buffed: More pierces, less decay for power fantasy
        levelEffects: [
            { pierceCount: 2, pierceDamageDecay: 0.1 },
            { pierceCount: 3, pierceDamageDecay: 0.08 },
            { pierceCount: 5, pierceDamageDecay: 0.05 },
            { pierceCount: 7, pierceDamageDecay: 0.02 },
            { pierceCount: 10, pierceDamageDecay: 0 },
        ],
    },

    'explosion-shot': {
        id: 'explosion-shot',
        nameEn: 'Explosion Shot',
        nameKo: '폭발 샷',
        descriptionEn: 'Projectiles explode on impact',
        descriptionKo: '탄환이 폭발합니다',
        icon: '✸',
        color: 0xf39c12,
        maxLevel: 5,
        // Buffed: Bigger explosions for power fantasy
        levelEffects: [
            { explosionRadius: 50 },
            { explosionRadius: 70 },
            { explosionRadius: 100 },
            { explosionRadius: 130 },
            { explosionRadius: 180 },
        ],
    },

    'rapid-fire': {
        id: 'rapid-fire',
        nameEn: 'Rapid Fire',
        nameKo: '속사',
        descriptionEn: 'Increased fire rate',
        descriptionKo: '발사 속도가 증가합니다',
        icon: '⚡',
        color: 0xf1c40f,
        maxLevel: 5,
        // Buffed: Even faster fire rate for power fantasy
        levelEffects: [
            { fireRateBonus: 0.3 },
            { fireRateBonus: 0.5 },
            { fireRateBonus: 0.75 },
            { fireRateBonus: 1.0 },
            { fireRateBonus: 1.5 },
        ],
    },

    'heavy-shot': {
        id: 'heavy-shot',
        nameEn: 'Heavy Shot',
        nameKo: '강타',
        descriptionEn: 'Increased damage and knockback',
        descriptionKo: '데미지와 넉백이 증가합니다',
        icon: '⬤',
        color: 0x9b59b6,
        maxLevel: 5,
        levelEffects: [
            { damageBonus: 0.3, knockbackBonus: 0.5 },
            { damageBonus: 0.5, knockbackBonus: 0.75 },
            { damageBonus: 0.7, knockbackBonus: 1.0 },
            { damageBonus: 1.0, knockbackBonus: 1.25 },
            { damageBonus: 1.5, knockbackBonus: 1.5 },
        ],
    },

    homing: {
        id: 'homing',
        nameEn: 'Homing',
        nameKo: '유도',
        descriptionEn: 'Projectiles track enemies',
        descriptionKo: '탄환이 적을 추적합니다',
        icon: '◇',
        color: 0x1abc9c,
        maxLevel: 5,
        levelEffects: [
            { homingTurnRate: 0.5 },
            { homingTurnRate: 1.0 },
            { homingTurnRate: 1.5 },
            { homingTurnRate: 2.0 },
            { homingTurnRate: 3.0 },
        ],
    },

    'spread-shot': {
        id: 'spread-shot',
        nameEn: 'Spread Shot',
        nameKo: '산탄',
        descriptionEn: 'Fire multiple projectiles',
        descriptionKo: '여러 탄환을 발사합니다',
        icon: '⁂',
        color: 0xe67e22,
        maxLevel: 5,
        // Buffed: More projectiles for screen-filling power fantasy
        levelEffects: [
            { spreadCount: 3, spreadAngle: 20 },
            { spreadCount: 4, spreadAngle: 30 },
            { spreadCount: 6, spreadAngle: 40 },
            { spreadCount: 8, spreadAngle: 50 },
            { spreadCount: 12, spreadAngle: 60 },
        ],
    },

    shockwave: {
        id: 'shockwave',
        nameEn: 'Shockwave',
        nameKo: '충격파',
        descriptionEn: 'Periodic knockback pulse',
        descriptionKo: '주기적으로 충격파를 발생시킵니다',
        icon: '◯',
        color: 0x2ecc71,
        maxLevel: 5,
        levelEffects: [
            { shockwaveInterval: 5, shockwaveRadius: 80, shockwaveKnockback: 100 },
            { shockwaveInterval: 4, shockwaveRadius: 100, shockwaveKnockback: 150 },
            { shockwaveInterval: 3, shockwaveRadius: 120, shockwaveKnockback: 200 },
            { shockwaveInterval: 2.5, shockwaveRadius: 150, shockwaveKnockback: 250 },
            { shockwaveInterval: 2, shockwaveRadius: 200, shockwaveKnockback: 300 },
        ],
    },
}

// ============================================
// PASSIVE DEFINITIONS (6 passives)
// ============================================

export const PASSIVE_DEFINITIONS: Record<string, PassiveDefinition> = {
    momentum: {
        id: 'momentum',
        nameEn: 'Momentum',
        nameKo: '모멘텀',
        descriptionEn: 'Speed up while moving (+5%/sec, max +30%). Damage scales with speed.',
        descriptionKo: '이동 시 속도 +5%/초 (최대 +30%), 속도에 비례해 데미지 증가',
        icon: '→',
        color: 0xf5b041,
    },

    fortitude: {
        id: 'fortitude',
        nameEn: 'Fortitude',
        nameKo: '불굴',
        descriptionEn: 'Take 15% less damage. +2% damage reduction per level.',
        descriptionKo: '받는 피해 -15%, 레벨당 +2% 방어력',
        icon: '■',
        color: 0x5dade2,
    },

    'critical-edge': {
        id: 'critical-edge',
        nameEn: 'Critical Edge',
        nameKo: '날카로운 일격',
        descriptionEn: '+15% crit chance. Crits deal 2.5x damage.',
        descriptionKo: '치명타 확률 +15%, 치명타 2.5배 데미지',
        icon: '▲',
        color: 0xe74c3c,
    },

    'lucky-star': {
        id: 'lucky-star',
        nameEn: 'Lucky Star',
        nameKo: '행운의 별',
        descriptionEn: '+20% XP gain. 10% chance for double XP orbs.',
        descriptionKo: 'XP +20%, 10% 확률로 2배 XP',
        icon: '★',
        color: 0xffd700,
    },

    precision: {
        id: 'precision',
        nameEn: 'Precision',
        nameKo: '정밀',
        descriptionEn: '+10% damage per consecutive hit (resets on miss).',
        descriptionKo: '연속 명중 시 데미지 +10% 누적 (빗나가면 초기화)',
        icon: '◆',
        color: 0xbb8fce,
    },

    'guardian-aura': {
        id: 'guardian-aura',
        nameEn: 'Guardian Aura',
        nameKo: '수호 오라',
        descriptionEn: 'Nearby enemies deal 20% less damage.',
        descriptionKo: '근접 적의 공격력 -20%',
        icon: '⬠',
        color: 0x82e0aa,
    },
}

// ============================================
// CHARACTER SKILL CONFIGURATION
// ============================================

export const CHARACTER_SKILLS: Record<WobbleShape, CharacterSkillConfig> = {
    circle: {
        startingSkills: ['rapid-fire'],
        passive: 'momentum',
    },
    square: {
        startingSkills: ['heavy-shot'],
        passive: 'fortitude',
    },
    triangle: {
        startingSkills: ['piercing-shot', 'rapid-fire'],
        passive: 'critical-edge',
    },
    star: {
        startingSkills: ['spread-shot'],
        passive: 'lucky-star',
    },
    diamond: {
        startingSkills: ['homing'],
        passive: 'precision',
    },
    pentagon: {
        startingSkills: ['shockwave', 'bounce-shot'],
        passive: 'guardian-aura',
    },
    shadow: {
        startingSkills: [],
        passive: '',
    },
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get skill effect at a specific level
 */
export function getSkillEffectAtLevel(skillId: string, level: number): SkillLevelEffect {
    const skill = SKILL_DEFINITIONS[skillId]
    if (!skill) return {}
    const idx = Math.min(level - 1, skill.levelEffects.length - 1)
    return skill.levelEffects[Math.max(0, idx)] || {}
}

/**
 * Get description for next level upgrade
 */
export function getNextLevelDescription(skillId: string, currentLevel: number): string {
    const skill = SKILL_DEFINITIONS[skillId]
    if (!skill || currentLevel >= skill.maxLevel) return 'MAX'

    const effect = skill.levelEffects[currentLevel] // next level (0-indexed)
    if (!effect) return ''

    const parts: string[] = []

    if (effect.bounceCount !== undefined) parts.push(`튕김 ${effect.bounceCount}회`)
    if (effect.pierceCount !== undefined) parts.push(`관통 ${effect.pierceCount}회`)
    if (effect.pierceDamageDecay !== undefined)
        parts.push(`감쇠 ${Math.round(effect.pierceDamageDecay * 100)}%`)
    if (effect.explosionRadius !== undefined) parts.push(`반경 ${effect.explosionRadius}`)
    if (effect.fireRateBonus !== undefined)
        parts.push(`속도 +${Math.round(effect.fireRateBonus * 100)}%`)
    if (effect.damageBonus !== undefined)
        parts.push(`데미지 +${Math.round(effect.damageBonus * 100)}%`)
    if (effect.knockbackBonus !== undefined)
        parts.push(`넉백 +${Math.round(effect.knockbackBonus * 100)}%`)
    if (effect.homingTurnRate !== undefined) parts.push(`추적력 ${effect.homingTurnRate}`)
    if (effect.spreadCount !== undefined) parts.push(`탄환 ${effect.spreadCount}발`)
    if (effect.spreadAngle !== undefined) parts.push(`각도 ${effect.spreadAngle}°`)
    if (effect.shockwaveInterval !== undefined) parts.push(`주기 ${effect.shockwaveInterval}초`)
    if (effect.shockwaveRadius !== undefined) parts.push(`범위 ${effect.shockwaveRadius}`)

    return parts.join(', ')
}

/**
 * Get current level description
 */
export function getCurrentLevelDescription(skillId: string, level: number): string {
    if (level <= 0) return ''
    const skill = SKILL_DEFINITIONS[skillId]
    if (!skill) return ''

    const effect = skill.levelEffects[level - 1]
    if (!effect) return ''

    const parts: string[] = []

    if (effect.bounceCount !== undefined) parts.push(`튕김 ${effect.bounceCount}회`)
    if (effect.pierceCount !== undefined) parts.push(`관통 ${effect.pierceCount}회`)
    if (effect.explosionRadius !== undefined) parts.push(`반경 ${effect.explosionRadius}`)
    if (effect.fireRateBonus !== undefined)
        parts.push(`속도 +${Math.round(effect.fireRateBonus * 100)}%`)
    if (effect.damageBonus !== undefined)
        parts.push(`데미지 +${Math.round(effect.damageBonus * 100)}%`)
    if (effect.homingTurnRate !== undefined) parts.push(`추적력 ${effect.homingTurnRate}`)
    if (effect.spreadCount !== undefined) parts.push(`탄환 ${effect.spreadCount}발`)
    if (effect.shockwaveInterval !== undefined) parts.push(`주기 ${effect.shockwaveInterval}초`)

    return parts.join(', ')
}

/**
 * Calculate combined stats from all skills
 */
export interface CombinedSkillStats {
    // Multiplicative
    fireRateMultiplier: number
    damageMultiplier: number
    knockbackMultiplier: number

    // Additive
    bounceCount: number
    pierceCount: number
    pierceDamageDecay: number
    explosionRadius: number
    homingTurnRate: number
    spreadCount: number
    spreadAngle: number
    shockwaveInterval: number
    shockwaveRadius: number
    shockwaveKnockback: number
}

export function calculateCombinedSkillStats(skills: PlayerSkill[]): CombinedSkillStats {
    const result: CombinedSkillStats = {
        fireRateMultiplier: 1,
        damageMultiplier: 1,
        knockbackMultiplier: 1,
        bounceCount: 0,
        pierceCount: 0,
        pierceDamageDecay: 0,
        explosionRadius: 0,
        homingTurnRate: 0,
        spreadCount: 1, // Default 1 projectile
        spreadAngle: 0,
        shockwaveInterval: 0,
        shockwaveRadius: 0,
        shockwaveKnockback: 0,
    }

    for (const skill of skills) {
        const effect = getSkillEffectAtLevel(skill.skillId, skill.level)

        // Bounce
        if (effect.bounceCount !== undefined) {
            result.bounceCount += effect.bounceCount
        }

        // Pierce
        if (effect.pierceCount !== undefined) {
            result.pierceCount += effect.pierceCount
            result.pierceDamageDecay = effect.pierceDamageDecay || 0
        }

        // Explosion
        if (effect.explosionRadius !== undefined) {
            result.explosionRadius = Math.max(result.explosionRadius, effect.explosionRadius)
        }

        // Rapid fire (multiplicative)
        if (effect.fireRateBonus !== undefined) {
            result.fireRateMultiplier *= 1 / (1 + effect.fireRateBonus) // Lower = faster
        }

        // Heavy shot (multiplicative)
        if (effect.damageBonus !== undefined) {
            result.damageMultiplier *= 1 + effect.damageBonus
        }
        if (effect.knockbackBonus !== undefined) {
            result.knockbackMultiplier *= 1 + effect.knockbackBonus
        }

        // Homing
        if (effect.homingTurnRate !== undefined) {
            result.homingTurnRate = Math.max(result.homingTurnRate, effect.homingTurnRate)
        }

        // Spread shot (use max values)
        if (effect.spreadCount !== undefined && effect.spreadCount > result.spreadCount) {
            result.spreadCount = effect.spreadCount
            result.spreadAngle = effect.spreadAngle || 0
        }

        // Shockwave (use most recent/strongest)
        if (effect.shockwaveInterval !== undefined) {
            result.shockwaveInterval = effect.shockwaveInterval
            result.shockwaveRadius = effect.shockwaveRadius || 0
            result.shockwaveKnockback = effect.shockwaveKnockback || 0
        }
    }

    return result
}

/**
 * Get list of all skill definitions
 */
export function getAllSkillDefinitions(): SkillDefinition[] {
    return Object.values(SKILL_DEFINITIONS)
}

/**
 * Get skill definition by ID
 */
export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
    return SKILL_DEFINITIONS[skillId]
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
