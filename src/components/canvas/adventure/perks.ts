// Perk system - each perk is tied to a physics formula
// Names are derived from the physics laws/concepts

import { LocalizedText } from '@/utils/localization'

// Physics themes - like Balatro decks
export type PhysicsTheme = 'mechanics' | 'thermodynamics' | 'waves' | 'gravity'

export interface ThemeDefinition {
    id: PhysicsTheme
    name: LocalizedText
    description: LocalizedText
    color: number
    icon: string // Icon identifier for UI
}

export const PHYSICS_THEMES: ThemeDefinition[] = [
    {
        id: 'mechanics',
        name: { ko: '역학', en: 'Mechanics' },
        description: { ko: '힘과 운동의 법칙', en: 'Laws of force and motion' },
        color: 0xe74c3c,
        icon: 'force',
    },
    {
        id: 'thermodynamics',
        name: { ko: '열역학', en: 'Thermodynamics' },
        description: { ko: '열과 에너지의 흐름', en: 'Heat and energy flow' },
        color: 0xe67e22,
        icon: 'heat',
    },
    {
        id: 'waves',
        name: { ko: '파동', en: 'Waves' },
        description: { ko: '진동과 빛의 성질', en: 'Vibration and light properties' },
        color: 0x3498db,
        icon: 'wave',
    },
    {
        id: 'gravity',
        name: { ko: '중력', en: 'Gravity' },
        description: { ko: '만유인력과 낙하운동', en: 'Gravitation and falling motion' },
        color: 0x9b59b6,
        icon: 'gravity',
    },
]

export interface PerkDefinition {
    id: string
    formulaId: string // Required formula to unlock this perk
    theme: PhysicsTheme // Physics theme this perk belongs to
    name: LocalizedText
    description: LocalizedText
    color: number
    // Stat modifications (min-max range for random generation)
    effects: PerkEffect[]
}

export interface PerkEffect {
    stat: PerkStat
    min: number
    max: number
    isPercent?: boolean // true = percentage, false = flat value
}

export type PerkStat =
    | 'damage' // 탄환 데미지
    | 'fireRate' // 발사 속도 (낮을수록 빠름)
    | 'projectileSpeed' // 탄환 속도
    | 'projectileSize' // 탄환 크기
    | 'knockback' // 넉백 강도
    | 'bounce' // 튕김 횟수
    | 'piercing' // 관통 횟수
    | 'explosionRadius' // 폭발 범위
    | 'moveSpeed' // 이동 속도

// Generated perk instance with rolled stats
export interface Perk {
    definition: PerkDefinition
    rolledEffects: { stat: PerkStat; value: number; isPercent?: boolean }[]
}

// All perk definitions - one per formula, physics-based names
export const perkDefinitions: PerkDefinition[] = [
    // ==========================================
    // MECHANICS (역학) - Force & Motion
    // ==========================================

    // === Newton's Second Law (F=ma) ===
    {
        id: 'newton-second-perk',
        formulaId: 'newton-second',
        theme: 'mechanics',
        name: { ko: 'F = ma', en: "Newton's 2nd Law" },
        description: {
            ko: '질량이 클수록 가속도는 작아진다',
            en: 'Greater mass means less acceleration',
        },
        color: 0xe74c3c,
        effects: [
            { stat: 'damage', min: 20, max: 40, isPercent: true },
            { stat: 'projectileSpeed', min: -15, max: -5, isPercent: true },
        ],
    },

    // === Momentum (p=mv) ===
    {
        id: 'momentum-perk',
        formulaId: 'momentum',
        theme: 'mechanics',
        name: { ko: 'p = mv', en: 'Momentum' },
        description: {
            ko: '운동량은 질량과 속도의 곱이다',
            en: 'Momentum equals mass times velocity',
        },
        color: 0xe74c3c,
        effects: [{ stat: 'knockback', min: 40, max: 80, isPercent: true }],
    },

    // === Kinetic Energy (KE = ½mv²) ===
    {
        id: 'kinetic-energy-perk',
        formulaId: 'kinetic-energy',
        theme: 'mechanics',
        name: { ko: 'KE = ½mv²', en: 'Kinetic Energy' },
        description: {
            ko: '속도의 제곱에 비례하는 에너지',
            en: 'Energy proportional to velocity squared',
        },
        color: 0xe74c3c,
        effects: [
            { stat: 'projectileSpeed', min: 25, max: 50, isPercent: true },
            { stat: 'damage', min: 15, max: 30, isPercent: true },
        ],
    },

    // === Centripetal Force (F = mv²/r) ===
    {
        id: 'centripetal-perk',
        formulaId: 'centripetal',
        theme: 'mechanics',
        name: { ko: '구심력', en: 'Centripetal Force' },
        description: { ko: '원운동을 유지하는 힘', en: 'Force maintaining circular motion' },
        color: 0xe74c3c,
        effects: [
            { stat: 'projectileSize', min: 20, max: 40, isPercent: true },
            { stat: 'damage', min: 10, max: 20, isPercent: true },
        ],
    },

    // ==========================================
    // THERMODYNAMICS (열역학) - Heat & Energy
    // ==========================================

    // === Pressure (P = F/A) ===
    {
        id: 'pressure-perk',
        formulaId: 'pressure',
        theme: 'thermodynamics',
        name: { ko: '압력', en: 'Pressure' },
        description: { ko: '단위 면적당 작용하는 힘', en: 'Force per unit area' },
        color: 0xe67e22,
        effects: [
            { stat: 'explosionRadius', min: 25, max: 50, isPercent: false },
            { stat: 'knockback', min: 20, max: 40, isPercent: true },
        ],
    },

    // === Heat (Q = mcΔT) ===
    {
        id: 'heat-perk',
        formulaId: 'heat',
        theme: 'thermodynamics',
        name: { ko: '열에너지', en: 'Heat Energy' },
        description: {
            ko: '온도 변화에 필요한 에너지',
            en: 'Energy needed for temperature change',
        },
        color: 0xe67e22,
        effects: [{ stat: 'damage', min: 30, max: 50, isPercent: true }],
    },

    // === Ideal Gas (PV = nRT) ===
    {
        id: 'ideal-gas-perk',
        formulaId: 'ideal-gas',
        theme: 'thermodynamics',
        name: { ko: '이상기체', en: 'Ideal Gas Law' },
        description: { ko: '압력과 부피의 관계', en: 'Relationship of pressure and volume' },
        color: 0xe67e22,
        effects: [{ stat: 'projectileSize', min: 30, max: 50, isPercent: true }],
    },

    // === Electric Power (P = IV) ===
    {
        id: 'electric-power-perk',
        formulaId: 'electric-power',
        theme: 'thermodynamics',
        name: { ko: '전력', en: 'Electric Power' },
        description: { ko: '전류와 전압의 곱', en: 'Product of current and voltage' },
        color: 0xe67e22,
        effects: [{ stat: 'fireRate', min: -30, max: -15, isPercent: true }],
    },

    // ==========================================
    // WAVES (파동) - Vibration & Light
    // ==========================================

    // === Elastic Collision ===
    {
        id: 'elastic-collision-perk',
        formulaId: 'elastic-collision',
        theme: 'waves',
        name: { ko: '탄성 충돌', en: 'Elastic Collision' },
        description: {
            ko: '에너지가 보존되어 튕겨나간다',
            en: 'Energy is conserved through bouncing',
        },
        color: 0x3498db,
        effects: [{ stat: 'bounce', min: 2, max: 4, isPercent: false }],
    },

    // === Hooke's Law (F = -kx) ===
    {
        id: 'hooke-perk',
        formulaId: 'hooke',
        theme: 'waves',
        name: { ko: '훅의 법칙', en: "Hooke's Law" },
        description: {
            ko: '탄성력은 변형에 비례한다',
            en: 'Elastic force proportional to displacement',
        },
        color: 0x3498db,
        effects: [
            { stat: 'bounce', min: 1, max: 2, isPercent: false },
            { stat: 'damage', min: 15, max: 30, isPercent: true },
        ],
    },

    // === Wave (v = fλ) ===
    {
        id: 'wave-perk',
        formulaId: 'wave',
        theme: 'waves',
        name: { ko: '파동', en: 'Wave Motion' },
        description: {
            ko: '속도는 진동수와 파장의 곱',
            en: 'Velocity equals frequency times wavelength',
        },
        color: 0x3498db,
        effects: [
            { stat: 'piercing', min: 1, max: 2, isPercent: false },
            { stat: 'fireRate', min: -20, max: -10, isPercent: true },
        ],
    },

    // === Snell's Law (n₁sinθ₁ = n₂sinθ₂) ===
    {
        id: 'snell-perk',
        formulaId: 'snell',
        theme: 'waves',
        name: { ko: '굴절의 법칙', en: "Snell's Law" },
        description: { ko: '빛이 굴절되는 원리', en: 'Principle of light refraction' },
        color: 0x3498db,
        effects: [
            { stat: 'bounce', min: 1, max: 3, isPercent: false },
            { stat: 'projectileSpeed', min: 15, max: 30, isPercent: true },
        ],
    },

    // ==========================================
    // GRAVITY (중력) - Gravitation & Falling
    // ==========================================

    // === Gravity (F = Gm₁m₂/r²) ===
    {
        id: 'gravity-perk',
        formulaId: 'gravity',
        theme: 'gravity',
        name: { ko: '만유인력', en: 'Gravitation' },
        description: { ko: '모든 물체는 서로 끌어당긴다', en: 'All objects attract each other' },
        color: 0x9b59b6,
        effects: [
            { stat: 'damage', min: 10, max: 25, isPercent: true },
            { stat: 'knockback', min: -40, max: -20, isPercent: true }, // Negative = pull
        ],
    },

    // === Projectile Motion ===
    {
        id: 'projectile-perk',
        formulaId: 'projectile',
        theme: 'gravity',
        name: { ko: '포물선 운동', en: 'Projectile Motion' },
        description: { ko: '중력에 의한 곡선 궤도', en: 'Curved path due to gravity' },
        color: 0x9b59b6,
        effects: [{ stat: 'explosionRadius', min: 30, max: 60, isPercent: false }],
    },

    // === Free Fall (h = ½gt²) ===
    {
        id: 'free-fall-perk',
        formulaId: 'free-fall',
        theme: 'gravity',
        name: { ko: '자유 낙하', en: 'Free Fall' },
        description: {
            ko: '중력 가속도에 의한 운동',
            en: 'Motion under gravitational acceleration',
        },
        color: 0x9b59b6,
        effects: [
            { stat: 'damage', min: 20, max: 35, isPercent: true },
            { stat: 'projectileSpeed', min: 10, max: 25, isPercent: true },
        ],
    },

    // === Buoyancy (F = ρVg) ===
    {
        id: 'buoyancy-perk',
        formulaId: 'buoyancy',
        theme: 'gravity',
        name: { ko: '부력', en: 'Buoyancy' },
        description: { ko: '유체에서 위로 작용하는 힘', en: 'Upward force in fluid' },
        color: 0x9b59b6,
        effects: [{ stat: 'moveSpeed', min: 20, max: 40, isPercent: true }],
    },
]

// Get available perks based on studied formulas and selected theme
export function getAvailablePerks(
    studiedFormulas: Set<string>,
    theme?: PhysicsTheme
): PerkDefinition[] {
    return perkDefinitions.filter((perk) => {
        const hasFormula = studiedFormulas.has(perk.formulaId)
        const matchesTheme = theme ? perk.theme === theme : true
        return hasFormula && matchesTheme
    })
}

// Get perks by theme (regardless of studied formulas - for preview)
export function getPerksByTheme(theme: PhysicsTheme): PerkDefinition[] {
    return perkDefinitions.filter((perk) => perk.theme === theme)
}

// Roll random stats for a perk
export function rollPerk(definition: PerkDefinition): Perk {
    const rolledEffects = definition.effects.map((effect) => ({
        stat: effect.stat,
        value: Math.round(effect.min + Math.random() * (effect.max - effect.min)),
        isPercent: effect.isPercent,
    }))

    return {
        definition,
        rolledEffects,
    }
}

// Get N random perks from available pool
// Always returns exactly 'count' perks - same definition can be rolled multiple times with different stats
export function getRandomPerks(
    studiedFormulas: Set<string>,
    count: number = 3,
    theme?: PhysicsTheme
): Perk[] {
    let available = getAvailablePerks(studiedFormulas, theme)

    // Fallback: if no perks with theme, try theme-only (ignoring studied formulas)
    if (available.length === 0 && theme) {
        available = getPerksByTheme(theme)
    }

    // Fallback: always have at least the basic newton-second perks
    if (available.length === 0) {
        available = perkDefinitions.filter((p) => p.formulaId === 'newton-second')
    }

    // If still no perks available, use first perk definition as ultimate fallback
    if (available.length === 0) {
        available = [perkDefinitions[0]]
    }

    // Always generate exactly 'count' perks
    // Same definition can be rolled multiple times with different random stats
    const result: Perk[] = []
    for (let i = 0; i < count; i++) {
        const definition = available[i % available.length]
        result.push(rollPerk(definition))
    }

    // Shuffle the result so same perks aren't always adjacent
    return result.sort(() => Math.random() - 0.5)
}

// Format perk effect for display
export function formatPerkEffect(
    effect: { stat: PerkStat; value: number; isPercent?: boolean },
    lang: string
): string {
    const statNames: Record<PerkStat, { ko: string; en: string; ja: string }> = {
        damage: { ko: '데미지', en: 'Damage', ja: 'ダメージ' },
        fireRate: { ko: '발사 속도', en: 'Fire Rate', ja: '発射速度' },
        projectileSpeed: { ko: '탄속', en: 'Projectile Speed', ja: '弾速' },
        projectileSize: { ko: '탄환 크기', en: 'Projectile Size', ja: '弾サイズ' },
        knockback: { ko: '넉백', en: 'Knockback', ja: 'ノックバック' },
        bounce: { ko: '튕김', en: 'Bounce', ja: 'バウンス' },
        piercing: { ko: '관통', en: 'Pierce', ja: '貫通' },
        explosionRadius: { ko: '폭발 범위', en: 'Explosion', ja: '爆発範囲' },
        moveSpeed: { ko: '이동 속도', en: 'Move Speed', ja: '移動速度' },
    }

    const stat = statNames[effect.stat]
    const name = lang === 'ko' ? stat.ko : lang === 'ja' ? stat.ja : stat.en
    const sign = effect.value >= 0 ? '+' : ''
    const suffix = effect.isPercent ? '%' : ''

    // For fireRate, negative is good (faster)
    if (effect.stat === 'fireRate') {
        const displayValue = -effect.value // Flip for display
        const displaySign = displayValue >= 0 ? '+' : ''
        return `${name} ${displaySign}${displayValue}${suffix}`
    }

    return `${name} ${sign}${effect.value}${suffix}`
}
