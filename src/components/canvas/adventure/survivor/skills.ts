import { WobbleShape } from '../../Wobble'
import { LocalizedText } from '@/utils/localization'

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

    // Shockwave (원심력 펄스)
    shockwaveInterval?: number // Seconds between pulses
    shockwaveRadius?: number
    shockwaveKnockback?: number

    // === NEW SKILL EFFECTS ===

    // Elastic Return (탄성 회귀) - hooke
    returnDistance?: number // Max distance before returning
    returnDamageMultiplier?: number // Damage on return pass

    // Magnetic Shield (자기장 방어) - lorentz
    shieldRadius?: number
    deflectionStrength?: number // 0-1, how much enemies curve away

    // Static Repulsion (정전기 반발) - coulomb
    repulsionRadius?: number
    repulsionForce?: number

    // Buoyant Bomb (부력 폭탄) - buoyancy
    floatDuration?: number // Seconds before dropping
    dropRadius?: number
    dropDamage?: number

    // Quantum Tunnel (양자 터널링) - tunneling
    tunnelChance?: number // 0-1, probability
    tunnelDamageBonus?: number // Extra damage on tunnel

    // Pendulum Rhythm (진자 리듬) - pendulum
    rhythmPeriod?: number // Seconds per cycle
    peakDamageBonus?: number // Max bonus at peak

    // Torque Slash (토크 회전참) - torque
    slashRadius?: number
    slashDamage?: number
    slashSpeed?: number // Rotations per second

    // Time Warp (시간 왜곡) - time-dilation
    warpRadius?: number
    slowFactor?: number // 0-1, how much enemies slow
}

export interface SkillDefinition {
    id: string
    name: LocalizedText
    description: LocalizedText
    icon: string
    color: number
    maxLevel: number
    levelEffects: SkillLevelEffect[] // Array of 5 effects (index 0 = level 1)
    formulaId?: string // Connected physics formula for unlock system
    physicsVisualType?: string // Type of physics visual effect
}

export interface PlayerSkill {
    skillId: string
    level: number // 1-5
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

// ============================================
// SKILL DEFINITIONS (8 skills)
// ============================================

export const SKILL_DEFINITIONS: Record<string, SkillDefinition> = {
    // 탄성 충돌 (Elastic Collision) - 운동량 보존 법칙
    'elastic-bounce': {
        id: 'elastic-bounce',
        name: { ko: '탄성 충돌', en: 'Elastic Collision' },
        description: { ko: '운동량을 보존하며 튕겨갑니다', en: 'Projectiles conserve momentum when bouncing' },
        icon: '◎',
        color: 0x3498db,
        maxLevel: 5,
        formulaId: 'elastic-collision',
        physicsVisualType: 'elastic',
        levelEffects: [
            { bounceCount: 1 },
            { bounceCount: 2 },
            { bounceCount: 3 },
            { bounceCount: 4 },
            { bounceCount: 5 },
        ],
    },

    // 운동량 관통 (Momentum Pierce) - p = mv
    'momentum-pierce': {
        id: 'momentum-pierce',
        name: { ko: '운동량 관통', en: 'Momentum Pierce' },
        description: { ko: '무거운 탄환이 적을 밀고 지나갑니다', en: 'Heavy projectiles push through enemies' },
        icon: '➤',
        color: 0xe74c3c,
        maxLevel: 5,
        formulaId: 'momentum',
        physicsVisualType: 'momentum',
        levelEffects: [
            { pierceCount: 2, pierceDamageDecay: 0.1 },
            { pierceCount: 3, pierceDamageDecay: 0.08 },
            { pierceCount: 5, pierceDamageDecay: 0.05 },
            { pierceCount: 7, pierceDamageDecay: 0.02 },
            { pierceCount: 10, pierceDamageDecay: 0 },
        ],
    },

    // 압력파 (Pressure Wave) - PV = nRT
    'pressure-wave': {
        id: 'pressure-wave',
        name: { ko: '압력파', en: 'Pressure Wave' },
        description: { ko: '기체 팽창으로 폭발적 압력을 만듭니다', en: 'Gas expansion creates explosive pressure' },
        icon: '✸',
        color: 0xf39c12,
        maxLevel: 5,
        formulaId: 'ideal-gas',
        physicsVisualType: 'pressure',
        levelEffects: [
            { explosionRadius: 50 },
            { explosionRadius: 70 },
            { explosionRadius: 100 },
            { explosionRadius: 130 },
            { explosionRadius: 180 },
        ],
    },

    // 진동수 증폭 (Frequency Burst) - E = hf
    'frequency-burst': {
        id: 'frequency-burst',
        name: { ko: '진동수 증폭', en: 'Frequency Burst' },
        description: { ko: '높은 진동수로 빠르게 발사합니다', en: 'Higher frequency means faster fire rate' },
        icon: '⚡',
        color: 0xf1c40f,
        maxLevel: 5,
        formulaId: 'photoelectric',
        physicsVisualType: 'frequency',
        levelEffects: [
            { fireRateBonus: 0.3 },
            { fireRateBonus: 0.5 },
            { fireRateBonus: 0.75 },
            { fireRateBonus: 1.0 },
            { fireRateBonus: 1.5 },
        ],
    },

    // F=ma 충격 (F=ma Impact) - 뉴턴 제2법칙
    'fma-impact': {
        id: 'fma-impact',
        name: { ko: 'F=ma 충격', en: 'F=ma Impact' },
        description: { ko: '큰 질량이 큰 힘을 만듭니다', en: 'Greater mass means greater force' },
        icon: '⬤',
        color: 0x9b59b6,
        maxLevel: 5,
        formulaId: 'newton-second',
        physicsVisualType: 'fma',
        levelEffects: [
            { damageBonus: 0.3, knockbackBonus: 0.5 },
            { damageBonus: 0.5, knockbackBonus: 0.75 },
            { damageBonus: 0.7, knockbackBonus: 1.0 },
            { damageBonus: 1.0, knockbackBonus: 1.25 },
            { damageBonus: 1.5, knockbackBonus: 1.5 },
        ],
    },

    // 중력 유도 (Gravity Pull) - F = GMm/r²
    'gravity-pull': {
        id: 'gravity-pull',
        name: { ko: '중력 유도', en: 'Gravity Pull' },
        description: { ko: '중력으로 적을 향해 휘어집니다', en: 'Projectiles curve toward enemies' },
        icon: '◇',
        color: 0x1abc9c,
        maxLevel: 5,
        formulaId: 'gravity',
        physicsVisualType: 'gravity',
        levelEffects: [
            { homingTurnRate: 0.5 },
            { homingTurnRate: 1.0 },
            { homingTurnRate: 1.5 },
            { homingTurnRate: 2.0 },
            { homingTurnRate: 3.0 },
        ],
    },

    // 굴절 분산 (Refraction Spread) - 스넬의 법칙
    'refraction-spread': {
        id: 'refraction-spread',
        name: { ko: '굴절 분산', en: 'Refraction Spread' },
        description: { ko: '빛이 여러 각도로 굴절됩니다', en: 'Light refracts into multiple beams' },
        icon: '⁂',
        color: 0xe67e22,
        maxLevel: 5,
        formulaId: 'snell',
        physicsVisualType: 'refraction',
        levelEffects: [
            { spreadCount: 3, spreadAngle: 20 },
            { spreadCount: 4, spreadAngle: 30 },
            { spreadCount: 6, spreadAngle: 40 },
            { spreadCount: 8, spreadAngle: 50 },
            { spreadCount: 12, spreadAngle: 60 },
        ],
    },

    // 원심력 펄스 (Centripetal Pulse) - F = mv²/r
    'centripetal-pulse': {
        id: 'centripetal-pulse',
        name: { ko: '원심력 펄스', en: 'Centripetal Pulse' },
        description: { ko: '회전하는 힘이 적을 밀어냅니다', en: 'Rotating force pushes enemies away' },
        icon: '◯',
        color: 0x2ecc71,
        maxLevel: 5,
        formulaId: 'centripetal',
        physicsVisualType: 'centripetal',
        levelEffects: [
            { shockwaveInterval: 5, shockwaveRadius: 80, shockwaveKnockback: 100 },
            { shockwaveInterval: 4, shockwaveRadius: 100, shockwaveKnockback: 150 },
            { shockwaveInterval: 3, shockwaveRadius: 120, shockwaveKnockback: 200 },
            { shockwaveInterval: 2.5, shockwaveRadius: 150, shockwaveKnockback: 250 },
            { shockwaveInterval: 2, shockwaveRadius: 200, shockwaveKnockback: 300 },
        ],
    },

    // ============================================
    // NEW SKILLS (8 additional skills)
    // ============================================

    // 탄성 회귀 (Elastic Return) - F = -kx (훅의 법칙)
    'elastic-return': {
        id: 'elastic-return',
        name: { ko: '탄성 회귀', en: 'Elastic Return' },
        description: { ko: '스프링처럼 발사체가 되돌아옵니다', en: 'Projectiles return like a spring' },
        icon: '⟳',
        color: 0x9b59b6,
        maxLevel: 5,
        formulaId: 'hooke',
        physicsVisualType: 'spring',
        levelEffects: [
            { returnDistance: 150, returnDamageMultiplier: 0.5 },
            { returnDistance: 180, returnDamageMultiplier: 0.6 },
            { returnDistance: 220, returnDamageMultiplier: 0.7 },
            { returnDistance: 260, returnDamageMultiplier: 0.8 },
            { returnDistance: 300, returnDamageMultiplier: 1.0 },
        ],
    },

    // 자기장 방어 (Magnetic Shield) - F = qvB (로렌츠 힘)
    'magnetic-shield': {
        id: 'magnetic-shield',
        name: { ko: '자기장 방어', en: 'Magnetic Shield' },
        description: { ko: '자기장이 적의 경로를 휘게 합니다', en: 'Magnetic field deflects enemies' },
        icon: '⊛',
        color: 0x3498db,
        maxLevel: 5,
        formulaId: 'lorentz',
        physicsVisualType: 'magnetic',
        levelEffects: [
            { shieldRadius: 60, deflectionStrength: 0.3 },
            { shieldRadius: 80, deflectionStrength: 0.5 },
            { shieldRadius: 100, deflectionStrength: 0.7 },
            { shieldRadius: 120, deflectionStrength: 0.85 },
            { shieldRadius: 150, deflectionStrength: 1.0 },
        ],
    },

    // 정전기 반발 (Static Repulsion) - F = kq₁q₂/r² (쿨롱의 법칙)
    'static-repulsion': {
        id: 'static-repulsion',
        name: { ko: '정전기 반발', en: 'Static Repulsion' },
        description: { ko: '전하가 적을 지속적으로 밀어냅니다', en: 'Electric charge pushes enemies away' },
        icon: '⊕',
        color: 0xf1c40f,
        maxLevel: 5,
        formulaId: 'coulomb',
        physicsVisualType: 'electric',
        levelEffects: [
            { repulsionRadius: 80, repulsionForce: 50 },
            { repulsionRadius: 100, repulsionForce: 80 },
            { repulsionRadius: 120, repulsionForce: 120 },
            { repulsionRadius: 150, repulsionForce: 160 },
            { repulsionRadius: 180, repulsionForce: 200 },
        ],
    },

    // 부력 폭탄 (Buoyant Bomb) - F = ρVg (부력)
    'buoyant-bomb': {
        id: 'buoyant-bomb',
        name: { ko: '부력 폭탄', en: 'Buoyant Bomb' },
        description: { ko: '발사체가 떠올랐다 떨어지며 폭발합니다', en: 'Projectiles float up then drop explosively' },
        icon: '◠',
        color: 0x1abc9c,
        maxLevel: 5,
        formulaId: 'buoyancy',
        physicsVisualType: 'buoyancy',
        levelEffects: [
            { floatDuration: 1.5, dropRadius: 60, dropDamage: 20 },
            { floatDuration: 1.3, dropRadius: 80, dropDamage: 35 },
            { floatDuration: 1.1, dropRadius: 100, dropDamage: 50 },
            { floatDuration: 0.9, dropRadius: 130, dropDamage: 70 },
            { floatDuration: 0.7, dropRadius: 160, dropDamage: 100 },
        ],
    },

    // 양자 터널링 (Quantum Tunnel) - T ≈ e^(-2κL) (터널링 확률)
    'quantum-tunnel': {
        id: 'quantum-tunnel',
        name: { ko: '양자 터널링', en: 'Quantum Tunnel' },
        description: { ko: '확률적으로 적을 투과하며 추가 데미지', en: 'Projectiles may phase through enemies' },
        icon: '⫘',
        color: 0x8e44ad,
        maxLevel: 5,
        formulaId: 'tunneling',
        physicsVisualType: 'quantum',
        levelEffects: [
            { tunnelChance: 0.1, tunnelDamageBonus: 0.5 },
            { tunnelChance: 0.15, tunnelDamageBonus: 0.75 },
            { tunnelChance: 0.2, tunnelDamageBonus: 1.0 },
            { tunnelChance: 0.25, tunnelDamageBonus: 1.25 },
            { tunnelChance: 0.3, tunnelDamageBonus: 1.5 },
        ],
    },

    // 진자 리듬 (Pendulum Rhythm) - T = 2π√(L/g) (진자 주기)
    'pendulum-rhythm': {
        id: 'pendulum-rhythm',
        name: { ko: '진자 리듬', en: 'Pendulum Rhythm' },
        description: { ko: '주기적으로 공격력이 최대가 됩니다', en: 'Damage oscillates with timing' },
        icon: '◷',
        color: 0xe67e22,
        maxLevel: 5,
        formulaId: 'pendulum',
        physicsVisualType: 'pendulum',
        levelEffects: [
            { rhythmPeriod: 4.0, peakDamageBonus: 0.5 },
            { rhythmPeriod: 3.5, peakDamageBonus: 0.75 },
            { rhythmPeriod: 3.0, peakDamageBonus: 1.0 },
            { rhythmPeriod: 2.5, peakDamageBonus: 1.5 },
            { rhythmPeriod: 2.0, peakDamageBonus: 2.0 },
        ],
    },

    // 토크 회전참 (Torque Slash) - τ = rF sin θ (토크)
    'torque-slash': {
        id: 'torque-slash',
        name: { ko: '토크 회전참', en: 'Torque Slash' },
        description: { ko: '회전하는 칼날이 주변 적을 벱니다', en: 'Spinning blade damages nearby enemies' },
        icon: '↻',
        color: 0xc0392b,
        maxLevel: 5,
        formulaId: 'torque',
        physicsVisualType: 'torque',
        levelEffects: [
            { slashRadius: 60, slashDamage: 8, slashSpeed: 1.5 },
            { slashRadius: 75, slashDamage: 12, slashSpeed: 1.8 },
            { slashRadius: 90, slashDamage: 16, slashSpeed: 2.1 },
            { slashRadius: 110, slashDamage: 22, slashSpeed: 2.5 },
            { slashRadius: 130, slashDamage: 30, slashSpeed: 3.0 },
        ],
    },

    // 시간 왜곡 (Time Warp) - t = t₀/√(1-v²/c²) (시간 지연)
    'time-warp': {
        id: 'time-warp',
        name: { ko: '시간 왜곡', en: 'Time Warp' },
        description: { ko: '주변 적의 시간을 느리게 합니다', en: 'Slow down nearby enemies' },
        icon: '◐',
        color: 0x2c3e50,
        maxLevel: 5,
        formulaId: 'time-dilation',
        physicsVisualType: 'time',
        levelEffects: [
            { warpRadius: 80, slowFactor: 0.2 },
            { warpRadius: 100, slowFactor: 0.3 },
            { warpRadius: 120, slowFactor: 0.4 },
            { warpRadius: 150, slowFactor: 0.5 },
            { warpRadius: 180, slowFactor: 0.6 },
        ],
    },
}

// ============================================
// PASSIVE DEFINITIONS (6 passives)
// ============================================

export const PASSIVE_DEFINITIONS: Record<string, PassiveDefinition> = {
    momentum: {
        id: 'momentum',
        name: { ko: '모멘텀', en: 'Momentum' },
        description: { ko: '이동 시 속도 +5%/초 (최대 +30%), 속도에 비례해 데미지 증가', en: 'Speed up while moving (+5%/sec, max +30%). Damage scales with speed.' },
        icon: '→',
        color: 0xf5b041,
    },

    fortitude: {
        id: 'fortitude',
        name: { ko: '불굴', en: 'Fortitude' },
        description: { ko: '받는 피해 -15%, 레벨당 +2% 방어력', en: 'Take 15% less damage. +2% damage reduction per level.' },
        icon: '■',
        color: 0x5dade2,
    },

    'critical-edge': {
        id: 'critical-edge',
        name: { ko: '날카로운 일격', en: 'Critical Edge' },
        description: { ko: '치명타 확률 +15%, 치명타 2.5배 데미지', en: '+15% crit chance. Crits deal 2.5x damage.' },
        icon: '▲',
        color: 0xe74c3c,
    },

    'lucky-star': {
        id: 'lucky-star',
        name: { ko: '행운의 별', en: 'Lucky Star' },
        description: { ko: 'XP +20%, 10% 확률로 2배 XP', en: '+20% XP gain. 10% chance for double XP orbs.' },
        icon: '★',
        color: 0xffd700,
    },

    precision: {
        id: 'precision',
        name: { ko: '정밀', en: 'Precision' },
        description: { ko: '연속 명중 시 데미지 +10% 누적 (빗나가면 초기화)', en: '+10% damage per consecutive hit (resets on miss).' },
        icon: '◆',
        color: 0xbb8fce,
    },

    'guardian-aura': {
        id: 'guardian-aura',
        name: { ko: '수호 오라', en: 'Guardian Aura' },
        description: { ko: '근접 적의 공격력 -20%', en: 'Nearby enemies deal 20% less damage.' },
        icon: '⬠',
        color: 0x82e0aa,
    },
}

// ============================================
// CHARACTER PASSIVE CONFIGURATION
// Characters now only provide stats + passive
// Skills are selected by the player from their unlocked skills
// ============================================

export const CHARACTER_SKILLS: Record<WobbleShape, CharacterSkillConfig> = {
    circle: {
        startingSkills: [], // Skills are now player-selected
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

    // Original skills
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

    // New skills
    if (effect.returnDistance !== undefined) parts.push(`거리 ${effect.returnDistance}`)
    if (effect.returnDamageMultiplier !== undefined)
        parts.push(`복귀 데미지 ${Math.round(effect.returnDamageMultiplier * 100)}%`)
    if (effect.shieldRadius !== undefined) parts.push(`반경 ${effect.shieldRadius}`)
    if (effect.deflectionStrength !== undefined)
        parts.push(`편향 ${Math.round(effect.deflectionStrength * 100)}%`)
    if (effect.repulsionRadius !== undefined) parts.push(`반경 ${effect.repulsionRadius}`)
    if (effect.repulsionForce !== undefined) parts.push(`밀어냄 ${effect.repulsionForce}`)
    if (effect.floatDuration !== undefined) parts.push(`체공 ${effect.floatDuration}초`)
    if (effect.dropRadius !== undefined) parts.push(`낙하 범위 ${effect.dropRadius}`)
    if (effect.dropDamage !== undefined) parts.push(`낙하 데미지 ${effect.dropDamage}`)
    if (effect.tunnelChance !== undefined)
        parts.push(`터널 ${Math.round(effect.tunnelChance * 100)}%`)
    if (effect.tunnelDamageBonus !== undefined)
        parts.push(`보너스 +${Math.round(effect.tunnelDamageBonus * 100)}%`)
    if (effect.rhythmPeriod !== undefined) parts.push(`주기 ${effect.rhythmPeriod}초`)
    if (effect.peakDamageBonus !== undefined)
        parts.push(`최대 +${Math.round(effect.peakDamageBonus * 100)}%`)
    if (effect.slashRadius !== undefined) parts.push(`반경 ${effect.slashRadius}`)
    if (effect.slashDamage !== undefined) parts.push(`데미지 ${effect.slashDamage}`)
    if (effect.slashSpeed !== undefined) parts.push(`회전 ${effect.slashSpeed}회/초`)
    if (effect.warpRadius !== undefined) parts.push(`반경 ${effect.warpRadius}`)
    if (effect.slowFactor !== undefined)
        parts.push(`감속 ${Math.round(effect.slowFactor * 100)}%`)

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

    // Original skills
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

    // New skills
    if (effect.returnDistance !== undefined) parts.push(`거리 ${effect.returnDistance}`)
    if (effect.shieldRadius !== undefined) parts.push(`반경 ${effect.shieldRadius}`)
    if (effect.repulsionRadius !== undefined) parts.push(`반경 ${effect.repulsionRadius}`)
    if (effect.floatDuration !== undefined) parts.push(`체공 ${effect.floatDuration}초`)
    if (effect.tunnelChance !== undefined)
        parts.push(`터널 ${Math.round(effect.tunnelChance * 100)}%`)
    if (effect.rhythmPeriod !== undefined) parts.push(`주기 ${effect.rhythmPeriod}초`)
    if (effect.slashRadius !== undefined) parts.push(`반경 ${effect.slashRadius}`)
    if (effect.warpRadius !== undefined) parts.push(`반경 ${effect.warpRadius}`)

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

    // Additive - Original skills
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

    // Additive - New skills
    returnDistance: number // Elastic Return
    returnDamageMultiplier: number
    shieldRadius: number // Magnetic Shield
    deflectionStrength: number
    repulsionRadius: number // Static Repulsion
    repulsionForce: number
    floatDuration: number // Buoyant Bomb
    dropRadius: number
    dropDamage: number
    tunnelChance: number // Quantum Tunnel
    tunnelDamageBonus: number
    rhythmPeriod: number // Pendulum Rhythm
    peakDamageBonus: number
    slashRadius: number // Torque Slash
    slashDamage: number
    slashSpeed: number
    warpRadius: number // Time Warp
    slowFactor: number
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
        // New skill defaults
        returnDistance: 0,
        returnDamageMultiplier: 0,
        shieldRadius: 0,
        deflectionStrength: 0,
        repulsionRadius: 0,
        repulsionForce: 0,
        floatDuration: 0,
        dropRadius: 0,
        dropDamage: 0,
        tunnelChance: 0,
        tunnelDamageBonus: 0,
        rhythmPeriod: 0,
        peakDamageBonus: 0,
        slashRadius: 0,
        slashDamage: 0,
        slashSpeed: 0,
        warpRadius: 0,
        slowFactor: 0,
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

        // === NEW SKILLS ===

        // Elastic Return (use highest values)
        if (effect.returnDistance !== undefined) {
            result.returnDistance = Math.max(result.returnDistance, effect.returnDistance)
            result.returnDamageMultiplier = Math.max(
                result.returnDamageMultiplier,
                effect.returnDamageMultiplier || 0
            )
        }

        // Magnetic Shield (use highest values)
        if (effect.shieldRadius !== undefined) {
            result.shieldRadius = Math.max(result.shieldRadius, effect.shieldRadius)
            result.deflectionStrength = Math.max(
                result.deflectionStrength,
                effect.deflectionStrength || 0
            )
        }

        // Static Repulsion (use highest values)
        if (effect.repulsionRadius !== undefined) {
            result.repulsionRadius = Math.max(result.repulsionRadius, effect.repulsionRadius)
            result.repulsionForce = Math.max(result.repulsionForce, effect.repulsionForce || 0)
        }

        // Buoyant Bomb (use highest values)
        if (effect.floatDuration !== undefined) {
            result.floatDuration = effect.floatDuration // Lower is better, use latest
            result.dropRadius = Math.max(result.dropRadius, effect.dropRadius || 0)
            result.dropDamage = Math.max(result.dropDamage, effect.dropDamage || 0)
        }

        // Quantum Tunnel (use highest values)
        if (effect.tunnelChance !== undefined) {
            result.tunnelChance = Math.max(result.tunnelChance, effect.tunnelChance)
            result.tunnelDamageBonus = Math.max(
                result.tunnelDamageBonus,
                effect.tunnelDamageBonus || 0
            )
        }

        // Pendulum Rhythm (use lowest period for fastest cycle, highest bonus)
        if (effect.rhythmPeriod !== undefined) {
            if (result.rhythmPeriod === 0) {
                result.rhythmPeriod = effect.rhythmPeriod
            } else {
                result.rhythmPeriod = Math.min(result.rhythmPeriod, effect.rhythmPeriod)
            }
            result.peakDamageBonus = Math.max(result.peakDamageBonus, effect.peakDamageBonus || 0)
        }

        // Torque Slash (use highest values)
        if (effect.slashRadius !== undefined) {
            result.slashRadius = Math.max(result.slashRadius, effect.slashRadius)
            result.slashDamage = Math.max(result.slashDamage, effect.slashDamage || 0)
            result.slashSpeed = Math.max(result.slashSpeed, effect.slashSpeed || 0)
        }

        // Time Warp (use highest values)
        if (effect.warpRadius !== undefined) {
            result.warpRadius = Math.max(result.warpRadius, effect.warpRadius)
            result.slowFactor = Math.max(result.slowFactor, effect.slowFactor || 0)
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
