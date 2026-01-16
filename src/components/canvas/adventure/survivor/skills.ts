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

    // === PHASE 2 SKILL EFFECTS (35 new skills) ===

    // Kinetic Charge (운동 에너지 충전) - kinetic-energy
    chargePerDistance?: number // Charge gained per pixel moved
    maxCharge?: number // Maximum charge stored
    damagePerCharge?: number // Damage bonus per charge unit

    // Pressure Point (압력점) - pressure
    areaReduction?: number // How small the impact area is
    penetrationBonus?: number // Extra armor penetration

    // Inverse Blast (역제곱 폭발) - inverse-square
    peakDamage?: number // Damage at point-blank
    falloffRate?: number // How fast damage decreases with distance

    // Free Fall Strike (자유 낙하 타격) - free-fall
    fallHeight?: number // Height of the drop
    impactRadius?: number // Radius of impact damage
    gravityMultiplier?: number // Gravity acceleration factor

    // Arc Shot (포물선 사격) - projectile
    launchAngle?: number // Degrees from horizontal
    range?: number // Max range of projectile
    splashRadius?: number // Splash damage radius

    // Escape Burst (탈출 속도 폭발) - escape-velocity
    velocityThreshold?: number // Speed needed to trigger
    escapeBonus?: number // Damage bonus on escape
    burstRadius?: number // Explosion radius

    // Orbital Strike (궤도 폭격) - kepler-third
    orbitCount?: number // Number of orbiting projectiles
    orbitRadius?: number // Distance from player
    orbitDamage?: number // Damage per hit

    // Wave Pulse (파동 펄스) - wave
    wavelength?: number // Distance between peaks
    amplitude?: number // Wave height (damage range)
    waveSpeed?: number // Propagation speed

    // Mirror Shot (반사 사격) - reflection
    reflectCount?: number // Number of reflections
    reflectDamageBonus?: number // Damage bonus per reflection

    // Focus Beam (초점 광선) - lens
    focalLength?: number // Distance to focus point
    focusDamageMultiplier?: number // Damage at focus
    beamWidth?: number // Width of the beam

    // Resonance Zone (공명 지대) - standing-wave
    nodeCount?: number // Number of damage nodes
    nodeRadius?: number // Size of each node
    nodeDamage?: number // Damage per node

    // Heat Transfer (열 전달) - heat
    heatPerHit?: number // Heat added per hit
    maxHeat?: number // Maximum heat buildup
    burnDamage?: number // Damage over time from heat

    // Energy Convert (에너지 변환) - first-law
    conversionRate?: number // Damage to energy ratio
    maxStored?: number // Max stored energy
    releaseMultiplier?: number // Damage multiplier on release

    // Chaos Field (혼돈장) - entropy
    fieldRadius?: number // Field size
    chaosStrength?: number // Path randomization strength
    durationBonus?: number // Duration increase per level

    // Heat Chain (열 전도 체인) - thermal-conduction
    conductRange?: number // Range to chain
    conductRatio?: number // Damage transfer ratio
    maxChain?: number // Max chain targets

    // Radiant Aura (복사 오라) - stefan-boltzmann
    auraRadius?: number // Aura size
    baseTemp?: number // Base temperature level
    radiationDamage?: number // Damage per tick

    // Peak Wavelength (피크 파장) - wien
    optimalRange?: number // Best distance for damage
    peakBonus?: number // Bonus at optimal range

    // Resistance Drain (저항 흡수) - ohm
    resistanceReduction?: number // Defense reduction amount
    duration?: number // Effect duration
    stackable?: boolean // Can stack multiple times

    // Power Surge (전력 서지) - electric-power
    voltage?: number // Voltage level
    current?: number // Current level
    surgeDamage?: number // Burst damage (V × I)

    // Charge Release (충전 방출) - capacitor
    chargeRate?: number // Charge speed
    dischargeDamage?: number // Damage on release

    // Matter Wave (물질파) - debroglie
    waveSpread?: number // Wave interference spread
    interferenceBonus?: number // Bonus from constructive interference
    pathCount?: number // Number of wave paths

    // Uncertainty Strike (불확정성 타격) - uncertainty
    positionSpread?: number // Position uncertainty range
    momentumVariance?: number // Damage variance

    // Quantum Leap (양자 도약) - bohr
    energyLevels?: number[] // Discrete damage levels
    transitionBonus?: number // Bonus on level transition

    // Bound State (속박 상태) - infinite-well
    wellWidth?: number // Containment zone width
    boundBonus?: number // Damage bonus to trapped enemies
    escapePenalty?: number // Penalty when enemy escapes

    // Acid Base (산-염기) - ph
    acidDamage?: number // Damage in acidic state
    baseHeal?: number // Heal in basic state
    neutralBonus?: number // Bonus at neutral pH

    // Concentration (농도 집중) - dilution
    concentrationRate?: number // Build-up rate
    maxConcentration?: number // Maximum concentration
    dilutionDecay?: number // Decay rate over time

    // Catalyst (촉매 효과) - reaction-rate
    activationCondition?: string // Condition to trigger
    rateMultiplier?: number // Attack speed multiplier

    // Decay Chain (붕괴 연쇄) - radioactive-decay
    decayChance?: number // Probability of chain reaction
    halfLife?: number // Decay timing
    chainRadius?: number // Chain reaction radius

    // Spin Conserve (각운동량 보존) - angular-momentum
    spinSpeed?: number // Base rotation speed
    momentumRetention?: number // How much spin is kept
    spinDamageBonus?: number // Damage from spin

    // Flow Stream (유체 흐름) - bernoulli
    flowSpeed?: number // Flow velocity
    suctionForce?: number // Pull force on enemies
    streamWidth?: number // Width of flow

    // Frequency Shift (주파수 편이) - doppler
    approachBonus?: number // Bonus vs approaching enemies
    recedeReduction?: number // Reduction vs retreating
    shiftRange?: number // Detection range

    // Induction Field (유도장) - faraday
    inductionRate?: number // Energy generation rate
    chainDamage?: number // Damage to chained enemies

    // Magnetic Pull (자기 흡인) - magnetic-field
    pullRadius?: number // Pull effect radius
    pullStrength?: number // Force of pull
    metalBonus?: number // Bonus vs "metal" enemies

    // Spin Up (회전 가속) - rotational-energy
    momentOfInertia?: number // Rotational mass
    angularVelocity?: number // Spin speed
    maxSpin?: number // Maximum rotation damage

    // Beat Pulse (맥놀이 펄스) - beat-frequency
    freq1?: number // First frequency
    freq2?: number // Second frequency
    beatAmplitude?: number // Combined amplitude
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
        description: {
            ko: '운동량을 보존하며 튕겨갑니다',
            en: 'Projectiles conserve momentum when bouncing',
        },
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
        description: {
            ko: '무거운 탄환이 적을 밀고 지나갑니다',
            en: 'Heavy projectiles push through enemies',
        },
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
        description: {
            ko: '기체 팽창으로 폭발적 압력을 만듭니다',
            en: 'Gas expansion creates explosive pressure',
        },
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
        description: {
            ko: '높은 진동수로 빠르게 발사합니다',
            en: 'Higher frequency means faster fire rate',
        },
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
        description: {
            ko: '중력으로 적을 향해 휘어집니다',
            en: 'Projectiles curve toward enemies',
        },
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
        description: {
            ko: '빛이 여러 각도로 굴절됩니다',
            en: 'Light refracts into multiple beams',
        },
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
        description: {
            ko: '회전하는 힘이 적을 밀어냅니다',
            en: 'Rotating force pushes enemies away',
        },
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
        description: {
            ko: '스프링처럼 발사체가 되돌아옵니다',
            en: 'Projectiles return like a spring',
        },
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
        description: {
            ko: '자기장이 적의 경로를 휘게 합니다',
            en: 'Magnetic field deflects enemies',
        },
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
        description: {
            ko: '전하가 적을 지속적으로 밀어냅니다',
            en: 'Electric charge pushes enemies away',
        },
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
        description: {
            ko: '발사체가 떠올랐다 떨어지며 폭발합니다',
            en: 'Projectiles float up then drop explosively',
        },
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
        description: {
            ko: '확률적으로 적을 투과하며 추가 데미지',
            en: 'Projectiles may phase through enemies',
        },
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
        description: {
            ko: '주기적으로 공격력이 최대가 됩니다',
            en: 'Damage oscillates with timing',
        },
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
        description: {
            ko: '회전하는 칼날이 주변 적을 벱니다',
            en: 'Spinning blade damages nearby enemies',
        },
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

    // ============================================
    // PHASE 2 SKILLS (35 new skills - skeleton)
    // ============================================

    // === 역학 (Mechanics) ===

    // 운동 에너지 충전 (Kinetic Charge) - KE = ½mv²
    'kinetic-charge': {
        id: 'kinetic-charge',
        name: { ko: '운동 에너지 충전', en: 'Kinetic Charge' },
        description: {
            ko: '이동하면 에너지가 충전되어 다음 공격이 강해집니다',
            en: 'Moving charges energy for stronger attacks',
        },
        icon: '⚡',
        color: 0x3498db,
        maxLevel: 5,
        formulaId: 'kinetic-energy',
        physicsVisualType: 'kinetic',
        levelEffects: [
            { chargePerDistance: 0.01, maxCharge: 50, damagePerCharge: 0.02 },
            { chargePerDistance: 0.015, maxCharge: 75, damagePerCharge: 0.025 },
            { chargePerDistance: 0.02, maxCharge: 100, damagePerCharge: 0.03 },
            { chargePerDistance: 0.025, maxCharge: 150, damagePerCharge: 0.035 },
            { chargePerDistance: 0.03, maxCharge: 200, damagePerCharge: 0.04 },
        ],
    },

    // 압력점 공격 (Pressure Point) - P = F/A
    'pressure-point': {
        id: 'pressure-point',
        name: { ko: '압력점 공격', en: 'Pressure Point' },
        description: {
            ko: '작은 면적에 집중된 힘으로 관통력이 높아집니다',
            en: 'Concentrated force increases penetration',
        },
        icon: '◆',
        color: 0xe74c3c,
        maxLevel: 5,
        formulaId: 'pressure',
        physicsVisualType: 'pressure',
        levelEffects: [
            { areaReduction: 0.8, penetrationBonus: 0.2 },
            { areaReduction: 0.6, penetrationBonus: 0.4 },
            { areaReduction: 0.5, penetrationBonus: 0.6 },
            { areaReduction: 0.4, penetrationBonus: 0.8 },
            { areaReduction: 0.3, penetrationBonus: 1.0 },
        ],
    },

    // 역제곱 폭발 (Inverse Blast) - 1/r²
    'inverse-blast': {
        id: 'inverse-blast',
        name: { ko: '역제곱 폭발', en: 'Inverse Blast' },
        description: {
            ko: '근접할수록 강력한 폭발 데미지',
            en: 'Explosion damage increases dramatically at close range',
        },
        icon: '✷',
        color: 0xf39c12,
        maxLevel: 5,
        formulaId: 'inverse-square',
        physicsVisualType: 'inverse',
        levelEffects: [
            { peakDamage: 50, falloffRate: 2.0, explosionRadius: 60 },
            { peakDamage: 75, falloffRate: 1.8, explosionRadius: 80 },
            { peakDamage: 100, falloffRate: 1.5, explosionRadius: 100 },
            { peakDamage: 150, falloffRate: 1.2, explosionRadius: 120 },
            { peakDamage: 200, falloffRate: 1.0, explosionRadius: 150 },
        ],
    },

    // === 중력 & 진동 (Gravity & Oscillation) ===

    // 자유 낙하 타격 (Free Fall Strike) - h = ½gt²
    'free-fall-strike': {
        id: 'free-fall-strike',
        name: { ko: '자유 낙하 타격', en: 'Free Fall Strike' },
        description: {
            ko: '위에서 떨어지는 공격, 높이에 비례한 데미지',
            en: 'Attacks drop from above, damage scales with height',
        },
        icon: '▼',
        color: 0x9b59b6,
        maxLevel: 5,
        formulaId: 'free-fall',
        physicsVisualType: 'freefall',
        levelEffects: [
            { fallHeight: 100, impactRadius: 40, gravityMultiplier: 1.0 },
            { fallHeight: 150, impactRadius: 50, gravityMultiplier: 1.2 },
            { fallHeight: 200, impactRadius: 60, gravityMultiplier: 1.5 },
            { fallHeight: 250, impactRadius: 75, gravityMultiplier: 1.8 },
            { fallHeight: 300, impactRadius: 90, gravityMultiplier: 2.0 },
        ],
    },

    // 포물선 사격 (Arc Shot) - y = x·tanθ - gx²/2v²cos²θ
    'arc-shot': {
        id: 'arc-shot',
        name: { ko: '포물선 사격', en: 'Arc Shot' },
        description: {
            ko: '장애물을 넘어 포물선으로 공격합니다',
            en: 'Projectiles arc over obstacles',
        },
        icon: '⌒',
        color: 0x1abc9c,
        maxLevel: 5,
        formulaId: 'projectile',
        physicsVisualType: 'projectile',
        levelEffects: [
            { launchAngle: 45, range: 200, splashRadius: 30 },
            { launchAngle: 50, range: 250, splashRadius: 40 },
            { launchAngle: 55, range: 300, splashRadius: 50 },
            { launchAngle: 60, range: 350, splashRadius: 65 },
            { launchAngle: 65, range: 400, splashRadius: 80 },
        ],
    },

    // 탈출 속도 폭발 (Escape Burst) - v = √(2GM/r)
    'escape-burst': {
        id: 'escape-burst',
        name: { ko: '탈출 속도 폭발', en: 'Escape Burst' },
        description: {
            ko: '충분한 속도로 중력을 벗어나며 폭발',
            en: 'Escape gravity with an explosive burst',
        },
        icon: '↗',
        color: 0x2ecc71,
        maxLevel: 5,
        formulaId: 'escape-velocity',
        physicsVisualType: 'escape',
        levelEffects: [
            { velocityThreshold: 300, escapeBonus: 0.5, burstRadius: 50 },
            { velocityThreshold: 250, escapeBonus: 0.75, burstRadius: 65 },
            { velocityThreshold: 200, escapeBonus: 1.0, burstRadius: 80 },
            { velocityThreshold: 150, escapeBonus: 1.5, burstRadius: 100 },
            { velocityThreshold: 100, escapeBonus: 2.0, burstRadius: 120 },
        ],
    },

    // 궤도 폭격 (Orbital Strike) - T² ∝ a³
    'orbital-strike': {
        id: 'orbital-strike',
        name: { ko: '궤도 폭격', en: 'Orbital Strike' },
        description: {
            ko: '플레이어 주변을 도는 위성 공격체',
            en: 'Orbiting projectiles damage nearby enemies',
        },
        icon: '◉',
        color: 0x8e44ad,
        maxLevel: 5,
        formulaId: 'kepler-third',
        physicsVisualType: 'orbital',
        levelEffects: [
            { orbitCount: 1, orbitRadius: 60, orbitDamage: 10 },
            { orbitCount: 2, orbitRadius: 70, orbitDamage: 12 },
            { orbitCount: 3, orbitRadius: 80, orbitDamage: 15 },
            { orbitCount: 4, orbitRadius: 90, orbitDamage: 18 },
            { orbitCount: 5, orbitRadius: 100, orbitDamage: 22 },
        ],
    },

    // === 파동 & 광학 (Wave & Optics) ===

    // 파동 펄스 (Wave Pulse) - v = fλ
    'wave-pulse': {
        id: 'wave-pulse',
        name: { ko: '파동 펄스', en: 'Wave Pulse' },
        description: {
            ko: '사인파처럼 퍼지는 데미지 파동',
            en: 'Damage spreads in sine wave patterns',
        },
        icon: '∿',
        color: 0x3498db,
        maxLevel: 5,
        formulaId: 'wave',
        physicsVisualType: 'wave',
        levelEffects: [
            { wavelength: 50, amplitude: 20, waveSpeed: 100 },
            { wavelength: 60, amplitude: 30, waveSpeed: 120 },
            { wavelength: 70, amplitude: 40, waveSpeed: 140 },
            { wavelength: 80, amplitude: 50, waveSpeed: 160 },
            { wavelength: 100, amplitude: 60, waveSpeed: 200 },
        ],
    },

    // 반사 사격 (Mirror Shot) - θi = θr
    'mirror-shot': {
        id: 'mirror-shot',
        name: { ko: '반사 사격', en: 'Mirror Shot' },
        description: {
            ko: '완벽한 반사각으로 벽에서 튕깁니다',
            en: 'Perfect reflection angle off walls',
        },
        icon: '⟨⟩',
        color: 0xecf0f1,
        maxLevel: 5,
        formulaId: 'reflection',
        physicsVisualType: 'reflection',
        levelEffects: [
            { reflectCount: 2, reflectDamageBonus: 0.1 },
            { reflectCount: 3, reflectDamageBonus: 0.15 },
            { reflectCount: 4, reflectDamageBonus: 0.2 },
            { reflectCount: 5, reflectDamageBonus: 0.25 },
            { reflectCount: 7, reflectDamageBonus: 0.3 },
        ],
    },

    // 초점 광선 (Focus Beam) - 1/f = 1/do + 1/di
    'focus-beam': {
        id: 'focus-beam',
        name: { ko: '초점 광선', en: 'Focus Beam' },
        description: {
            ko: '특정 거리에서 수렴하여 최대 데미지',
            en: 'Maximum damage at focal point',
        },
        icon: '⊙',
        color: 0xf1c40f,
        maxLevel: 5,
        formulaId: 'lens',
        physicsVisualType: 'lens',
        levelEffects: [
            { focalLength: 100, focusDamageMultiplier: 1.5, beamWidth: 20 },
            { focalLength: 120, focusDamageMultiplier: 1.75, beamWidth: 25 },
            { focalLength: 150, focusDamageMultiplier: 2.0, beamWidth: 30 },
            { focalLength: 180, focusDamageMultiplier: 2.5, beamWidth: 35 },
            { focalLength: 200, focusDamageMultiplier: 3.0, beamWidth: 40 },
        ],
    },

    // 공명 지대 (Resonance Zone) - 정상파
    'resonance-zone': {
        id: 'resonance-zone',
        name: { ko: '공명 지대', en: 'Resonance Zone' },
        description: {
            ko: '정상파처럼 특정 위치에 데미지 노드 생성',
            en: 'Standing wave creates damage nodes',
        },
        icon: '≋',
        color: 0x9b59b6,
        maxLevel: 5,
        formulaId: 'standing-wave',
        physicsVisualType: 'standing',
        levelEffects: [
            { nodeCount: 2, nodeRadius: 25, nodeDamage: 15 },
            { nodeCount: 3, nodeRadius: 30, nodeDamage: 18 },
            { nodeCount: 4, nodeRadius: 35, nodeDamage: 22 },
            { nodeCount: 5, nodeRadius: 40, nodeDamage: 27 },
            { nodeCount: 6, nodeRadius: 45, nodeDamage: 35 },
        ],
    },

    // === 열역학 (Thermodynamics) ===

    // 열 전달 (Heat Transfer) - Q = mcΔT
    'heat-transfer': {
        id: 'heat-transfer',
        name: { ko: '열 전달', en: 'Heat Transfer' },
        description: {
            ko: '공격할수록 열이 쌓여 지속 데미지',
            en: 'Hits accumulate heat for burn damage',
        },
        icon: '♨',
        color: 0xe74c3c,
        maxLevel: 5,
        formulaId: 'heat',
        physicsVisualType: 'heat',
        levelEffects: [
            { heatPerHit: 10, maxHeat: 50, burnDamage: 2 },
            { heatPerHit: 12, maxHeat: 70, burnDamage: 3 },
            { heatPerHit: 15, maxHeat: 100, burnDamage: 5 },
            { heatPerHit: 18, maxHeat: 130, burnDamage: 7 },
            { heatPerHit: 22, maxHeat: 160, burnDamage: 10 },
        ],
    },

    // 에너지 변환 (Energy Convert) - ΔU = Q - W
    'energy-convert': {
        id: 'energy-convert',
        name: { ko: '에너지 변환', en: 'Energy Convert' },
        description: {
            ko: '받은 데미지를 공격력으로 변환',
            en: 'Convert damage taken to attack power',
        },
        icon: '⇌',
        color: 0xf39c12,
        maxLevel: 5,
        formulaId: 'first-law',
        physicsVisualType: 'convert',
        levelEffects: [
            { conversionRate: 0.1, maxStored: 30, releaseMultiplier: 1.5 },
            { conversionRate: 0.15, maxStored: 50, releaseMultiplier: 1.75 },
            { conversionRate: 0.2, maxStored: 75, releaseMultiplier: 2.0 },
            { conversionRate: 0.25, maxStored: 100, releaseMultiplier: 2.5 },
            { conversionRate: 0.3, maxStored: 150, releaseMultiplier: 3.0 },
        ],
    },

    // 혼돈장 (Chaos Field) - ΔS > 0
    'chaos-field': {
        id: 'chaos-field',
        name: { ko: '혼돈장', en: 'Chaos Field' },
        description: {
            ko: '엔트로피 증가로 적 이동 경로 교란',
            en: 'Entropy randomizes enemy movement',
        },
        icon: '⌘',
        color: 0x8e44ad,
        maxLevel: 5,
        formulaId: 'entropy',
        physicsVisualType: 'entropy',
        levelEffects: [
            { fieldRadius: 60, chaosStrength: 0.2, durationBonus: 1.0 },
            { fieldRadius: 80, chaosStrength: 0.35, durationBonus: 1.5 },
            { fieldRadius: 100, chaosStrength: 0.5, durationBonus: 2.0 },
            { fieldRadius: 120, chaosStrength: 0.65, durationBonus: 2.5 },
            { fieldRadius: 150, chaosStrength: 0.8, durationBonus: 3.0 },
        ],
    },

    // 열 전도 체인 (Heat Chain) - Q/t = kA(ΔT/Δx)
    'heat-chain': {
        id: 'heat-chain',
        name: { ko: '열 전도 체인', en: 'Heat Chain' },
        description: {
            ko: '데미지가 인접한 적에게 전도됨',
            en: 'Damage conducts to nearby enemies',
        },
        icon: '⫘',
        color: 0xe67e22,
        maxLevel: 5,
        formulaId: 'thermal-conduction',
        physicsVisualType: 'conduction',
        levelEffects: [
            { conductRange: 50, conductRatio: 0.3, maxChain: 2 },
            { conductRange: 60, conductRatio: 0.4, maxChain: 3 },
            { conductRange: 70, conductRatio: 0.5, maxChain: 4 },
            { conductRange: 80, conductRatio: 0.6, maxChain: 5 },
            { conductRange: 100, conductRatio: 0.7, maxChain: 7 },
        ],
    },

    // 복사 오라 (Radiant Aura) - P = σAT⁴
    'radiant-aura': {
        id: 'radiant-aura',
        name: { ko: '복사 오라', en: 'Radiant Aura' },
        description: {
            ko: '온도의 4제곱에 비례한 지속 데미지 오라',
            en: 'Aura damage scales with T⁴',
        },
        icon: '☀',
        color: 0xf1c40f,
        maxLevel: 5,
        formulaId: 'stefan-boltzmann',
        physicsVisualType: 'radiant',
        levelEffects: [
            { auraRadius: 50, baseTemp: 1.0, radiationDamage: 3 },
            { auraRadius: 60, baseTemp: 1.2, radiationDamage: 5 },
            { auraRadius: 70, baseTemp: 1.4, radiationDamage: 8 },
            { auraRadius: 85, baseTemp: 1.6, radiationDamage: 12 },
            { auraRadius: 100, baseTemp: 2.0, radiationDamage: 18 },
        ],
    },

    // 피크 파장 (Peak Wavelength) - λmax = b/T
    'peak-wavelength': {
        id: 'peak-wavelength',
        name: { ko: '피크 파장', en: 'Peak Wavelength' },
        description: {
            ko: '최적 거리에서 최대 효율 공격',
            en: 'Maximum efficiency at optimal range',
        },
        icon: '〰',
        color: 0x3498db,
        maxLevel: 5,
        formulaId: 'wien',
        physicsVisualType: 'wien',
        levelEffects: [
            { optimalRange: 80, peakBonus: 0.3, falloffRate: 0.02 },
            { optimalRange: 100, peakBonus: 0.5, falloffRate: 0.015 },
            { optimalRange: 120, peakBonus: 0.75, falloffRate: 0.01 },
            { optimalRange: 140, peakBonus: 1.0, falloffRate: 0.008 },
            { optimalRange: 160, peakBonus: 1.5, falloffRate: 0.005 },
        ],
    },

    // === 전기 (Electricity) ===

    // 저항 흡수 (Resistance Drain) - V = IR
    'resistance-drain': {
        id: 'resistance-drain',
        name: { ko: '저항 흡수', en: 'Resistance Drain' },
        description: {
            ko: '적의 방어력을 낮춥니다',
            en: 'Reduces enemy defense',
        },
        icon: 'Ω',
        color: 0x2ecc71,
        maxLevel: 5,
        formulaId: 'ohm',
        physicsVisualType: 'ohm',
        levelEffects: [
            { resistanceReduction: 0.1, duration: 2.0, stackable: false },
            { resistanceReduction: 0.15, duration: 2.5, stackable: false },
            { resistanceReduction: 0.2, duration: 3.0, stackable: true },
            { resistanceReduction: 0.25, duration: 3.5, stackable: true },
            { resistanceReduction: 0.3, duration: 4.0, stackable: true },
        ],
    },

    // 전력 서지 (Power Surge) - P = VI
    'power-surge': {
        id: 'power-surge',
        name: { ko: '전력 서지', en: 'Power Surge' },
        description: {
            ko: '전압×전류 = 순간 폭딜',
            en: 'Voltage × Current = Burst damage',
        },
        icon: '⚡',
        color: 0xf1c40f,
        maxLevel: 5,
        formulaId: 'electric-power',
        physicsVisualType: 'power',
        levelEffects: [
            { voltage: 10, current: 5, surgeDamage: 50 },
            { voltage: 15, current: 7, surgeDamage: 105 },
            { voltage: 20, current: 10, surgeDamage: 200 },
            { voltage: 25, current: 12, surgeDamage: 300 },
            { voltage: 30, current: 15, surgeDamage: 450 },
        ],
    },

    // 충전 방출 (Charge Release) - Q = CV
    'charge-release': {
        id: 'charge-release',
        name: { ko: '충전 방출', en: 'Charge Release' },
        description: {
            ko: '에너지를 축적 후 한번에 방출',
            en: 'Store energy then release all at once',
        },
        icon: '⊜',
        color: 0x9b59b6,
        maxLevel: 5,
        formulaId: 'capacitor',
        physicsVisualType: 'capacitor',
        levelEffects: [
            { maxCharge: 50, chargeRate: 5, dischargeDamage: 40 },
            { maxCharge: 75, chargeRate: 7, dischargeDamage: 60 },
            { maxCharge: 100, chargeRate: 10, dischargeDamage: 90 },
            { maxCharge: 150, chargeRate: 12, dischargeDamage: 130 },
            { maxCharge: 200, chargeRate: 15, dischargeDamage: 180 },
        ],
    },

    // === 현대 물리 (Modern Physics) ===

    // 물질파 (Matter Wave) - λ = h/p
    'matter-wave': {
        id: 'matter-wave',
        name: { ko: '물질파', en: 'Matter Wave' },
        description: {
            ko: '투사체가 파동처럼 여러 경로로 간섭',
            en: 'Projectiles interfere like waves',
        },
        icon: '≈',
        color: 0x1abc9c,
        maxLevel: 5,
        formulaId: 'debroglie',
        physicsVisualType: 'debroglie',
        levelEffects: [
            { waveSpread: 20, interferenceBonus: 0.2, pathCount: 2 },
            { waveSpread: 25, interferenceBonus: 0.3, pathCount: 3 },
            { waveSpread: 30, interferenceBonus: 0.4, pathCount: 4 },
            { waveSpread: 35, interferenceBonus: 0.5, pathCount: 5 },
            { waveSpread: 40, interferenceBonus: 0.6, pathCount: 6 },
        ],
    },

    // 불확정성 타격 (Uncertainty Strike) - ΔxΔp ≥ ℏ/2
    'uncertainty-strike': {
        id: 'uncertainty-strike',
        name: { ko: '불확정성 타격', en: 'Uncertainty Strike' },
        description: {
            ko: '위치 불확정으로 회피 불가, 데미지 변동',
            en: 'Uncertain position = unavoidable, variable damage',
        },
        icon: '?',
        color: 0x8e44ad,
        maxLevel: 5,
        formulaId: 'uncertainty',
        physicsVisualType: 'uncertainty',
        levelEffects: [
            { positionSpread: 30, momentumVariance: 0.3 },
            { positionSpread: 40, momentumVariance: 0.4 },
            { positionSpread: 50, momentumVariance: 0.5 },
            { positionSpread: 60, momentumVariance: 0.6 },
            { positionSpread: 80, momentumVariance: 0.8 },
        ],
    },

    // 양자 도약 (Quantum Leap) - En = -13.6/n² eV
    'quantum-leap': {
        id: 'quantum-leap',
        name: { ko: '양자 도약', en: 'Quantum Leap' },
        description: {
            ko: '불연속적 에너지 준위로 공격',
            en: 'Attack at discrete energy levels',
        },
        icon: '⎔',
        color: 0x2c3e50,
        maxLevel: 5,
        formulaId: 'bohr',
        physicsVisualType: 'bohr',
        levelEffects: [
            { energyLevels: [10, 20], transitionBonus: 0.2 },
            { energyLevels: [10, 20, 35], transitionBonus: 0.3 },
            { energyLevels: [10, 20, 35, 55], transitionBonus: 0.4 },
            { energyLevels: [10, 20, 35, 55, 80], transitionBonus: 0.5 },
            { energyLevels: [10, 20, 35, 55, 80, 110], transitionBonus: 0.6 },
        ],
    },

    // === 양자역학 (Quantum) ===

    // 속박 상태 (Bound State) - 무한 우물
    'bound-state': {
        id: 'bound-state',
        name: { ko: '속박 상태', en: 'Bound State' },
        description: {
            ko: '영역 내 갇힌 적에게 증폭 데미지',
            en: 'Amplified damage to trapped enemies',
        },
        icon: '⊞',
        color: 0xe74c3c,
        maxLevel: 5,
        formulaId: 'infinite-well',
        physicsVisualType: 'well',
        levelEffects: [
            { wellWidth: 80, boundBonus: 0.3, escapePenalty: 0.1 },
            { wellWidth: 100, boundBonus: 0.5, escapePenalty: 0.15 },
            { wellWidth: 120, boundBonus: 0.7, escapePenalty: 0.2 },
            { wellWidth: 140, boundBonus: 1.0, escapePenalty: 0.25 },
            { wellWidth: 160, boundBonus: 1.5, escapePenalty: 0.3 },
        ],
    },

    // === 화학 (Chemistry) ===

    // 산-염기 (Acid Base) - pH = -log[H⁺]
    'acid-base': {
        id: 'acid-base',
        name: { ko: '산-염기', en: 'Acid Base' },
        description: {
            ko: 'pH에 따른 부식 또는 회복 효과',
            en: 'Corrosion or healing based on pH',
        },
        icon: '⚗',
        color: 0x2ecc71,
        maxLevel: 5,
        formulaId: 'ph',
        physicsVisualType: 'ph',
        levelEffects: [
            { acidDamage: 5, baseHeal: 3, neutralBonus: 0.1 },
            { acidDamage: 8, baseHeal: 5, neutralBonus: 0.15 },
            { acidDamage: 12, baseHeal: 7, neutralBonus: 0.2 },
            { acidDamage: 16, baseHeal: 10, neutralBonus: 0.25 },
            { acidDamage: 22, baseHeal: 14, neutralBonus: 0.3 },
        ],
    },

    // 농도 집중 (Concentration) - C₁V₁ = C₂V₂
    'concentration': {
        id: 'concentration',
        name: { ko: '농도 집중', en: 'Concentration' },
        description: {
            ko: '공격을 모을수록 농도가 올라 데미지 증가',
            en: 'Concentrate attacks for more damage',
        },
        icon: '◎',
        color: 0x3498db,
        maxLevel: 5,
        formulaId: 'dilution',
        physicsVisualType: 'dilution',
        levelEffects: [
            { concentrationRate: 0.1, maxConcentration: 2.0, dilutionDecay: 0.05 },
            { concentrationRate: 0.12, maxConcentration: 2.5, dilutionDecay: 0.04 },
            { concentrationRate: 0.15, maxConcentration: 3.0, dilutionDecay: 0.03 },
            { concentrationRate: 0.18, maxConcentration: 3.5, dilutionDecay: 0.02 },
            { concentrationRate: 0.2, maxConcentration: 4.0, dilutionDecay: 0.01 },
        ],
    },

    // 촉매 효과 (Catalyst) - k = Ae^(-Ea/RT)
    'catalyst': {
        id: 'catalyst',
        name: { ko: '촉매 효과', en: 'Catalyst' },
        description: {
            ko: '조건 충족 시 공격 속도 급증',
            en: 'Attack speed surge when conditions met',
        },
        icon: '⚙',
        color: 0xf39c12,
        maxLevel: 5,
        formulaId: 'reaction-rate',
        physicsVisualType: 'catalyst',
        levelEffects: [
            { activationCondition: 'lowHealth', rateMultiplier: 1.3, duration: 3 },
            { activationCondition: 'lowHealth', rateMultiplier: 1.5, duration: 4 },
            { activationCondition: 'lowHealth', rateMultiplier: 1.75, duration: 5 },
            { activationCondition: 'lowHealth', rateMultiplier: 2.0, duration: 6 },
            { activationCondition: 'lowHealth', rateMultiplier: 2.5, duration: 8 },
        ],
    },

    // === 추가 물리 (Additional Physics) ===

    // 붕괴 연쇄 (Decay Chain) - N = N₀e^(-λt)
    'decay-chain': {
        id: 'decay-chain',
        name: { ko: '붕괴 연쇄', en: 'Decay Chain' },
        description: {
            ko: '적 처치 시 확률적 연쇄 폭발',
            en: 'Chain explosions on enemy death',
        },
        icon: '☢',
        color: 0x2ecc71,
        maxLevel: 5,
        formulaId: 'radioactive-decay',
        physicsVisualType: 'decay',
        levelEffects: [
            { decayChance: 0.15, halfLife: 1.5, chainRadius: 60 },
            { decayChance: 0.2, halfLife: 1.3, chainRadius: 75 },
            { decayChance: 0.25, halfLife: 1.1, chainRadius: 90 },
            { decayChance: 0.3, halfLife: 0.9, chainRadius: 110 },
            { decayChance: 0.4, halfLife: 0.7, chainRadius: 130 },
        ],
    },

    // 각운동량 보존 (Spin Conserve) - L = Iω
    'spin-conserve': {
        id: 'spin-conserve',
        name: { ko: '각운동량 보존', en: 'Spin Conserve' },
        description: {
            ko: '회전 공격 시 속도 유지, 점점 강해짐',
            en: 'Spinning attacks maintain and build momentum',
        },
        icon: '◎',
        color: 0x9b59b6,
        maxLevel: 5,
        formulaId: 'angular-momentum',
        physicsVisualType: 'angular',
        levelEffects: [
            { spinSpeed: 1.0, momentumRetention: 0.8, spinDamageBonus: 0.1 },
            { spinSpeed: 1.2, momentumRetention: 0.85, spinDamageBonus: 0.15 },
            { spinSpeed: 1.5, momentumRetention: 0.9, spinDamageBonus: 0.2 },
            { spinSpeed: 1.8, momentumRetention: 0.93, spinDamageBonus: 0.25 },
            { spinSpeed: 2.0, momentumRetention: 0.95, spinDamageBonus: 0.3 },
        ],
    },

    // 유체 흐름 (Flow Stream) - P + ½ρv² + ρgh = const
    'flow-stream': {
        id: 'flow-stream',
        name: { ko: '유체 흐름', en: 'Flow Stream' },
        description: {
            ko: '빠른 흐름이 적을 끌어당김',
            en: 'Fast flow pulls enemies in',
        },
        icon: '≋',
        color: 0x1abc9c,
        maxLevel: 5,
        formulaId: 'bernoulli',
        physicsVisualType: 'bernoulli',
        levelEffects: [
            { flowSpeed: 100, suctionForce: 30, streamWidth: 40 },
            { flowSpeed: 130, suctionForce: 50, streamWidth: 50 },
            { flowSpeed: 160, suctionForce: 75, streamWidth: 60 },
            { flowSpeed: 200, suctionForce: 100, streamWidth: 75 },
            { flowSpeed: 250, suctionForce: 150, streamWidth: 90 },
        ],
    },

    // 주파수 편이 (Frequency Shift) - f' = f(v ± vr)/(v ∓ vs)
    'frequency-shift': {
        id: 'frequency-shift',
        name: { ko: '주파수 편이', en: 'Frequency Shift' },
        description: {
            ko: '접근하는 적에게 더 강한 데미지',
            en: 'More damage to approaching enemies',
        },
        icon: '〉〈',
        color: 0x3498db,
        maxLevel: 5,
        formulaId: 'doppler',
        physicsVisualType: 'doppler',
        levelEffects: [
            { approachBonus: 0.2, recedeReduction: 0.1, shiftRange: 100 },
            { approachBonus: 0.3, recedeReduction: 0.15, shiftRange: 120 },
            { approachBonus: 0.4, recedeReduction: 0.2, shiftRange: 140 },
            { approachBonus: 0.55, recedeReduction: 0.25, shiftRange: 170 },
            { approachBonus: 0.7, recedeReduction: 0.3, shiftRange: 200 },
        ],
    },

    // 유도장 (Induction Field) - ε = -dΦ/dt
    'induction-field': {
        id: 'induction-field',
        name: { ko: '유도장', en: 'Induction Field' },
        description: {
            ko: '자기장 변화로 연쇄 데미지',
            en: 'Magnetic flux changes deal chain damage',
        },
        icon: '⊗',
        color: 0xe67e22,
        maxLevel: 5,
        formulaId: 'faraday',
        physicsVisualType: 'faraday',
        levelEffects: [
            { fieldRadius: 60, inductionRate: 0.1, chainDamage: 8 },
            { fieldRadius: 75, inductionRate: 0.15, chainDamage: 12 },
            { fieldRadius: 90, inductionRate: 0.2, chainDamage: 18 },
            { fieldRadius: 110, inductionRate: 0.25, chainDamage: 25 },
            { fieldRadius: 130, inductionRate: 0.3, chainDamage: 35 },
        ],
    },

    // 자기 흡인 (Magnetic Pull) - B = μ₀I/2πr
    'magnetic-pull': {
        id: 'magnetic-pull',
        name: { ko: '자기 흡인', en: 'Magnetic Pull' },
        description: {
            ko: '자성을 가진 것들을 끌어당김',
            en: 'Pull magnetic objects toward you',
        },
        icon: '⊕',
        color: 0x34495e,
        maxLevel: 5,
        formulaId: 'magnetic-field',
        physicsVisualType: 'magnet',
        levelEffects: [
            { pullRadius: 80, pullStrength: 30, metalBonus: 0.2 },
            { pullRadius: 100, pullStrength: 50, metalBonus: 0.3 },
            { pullRadius: 120, pullStrength: 75, metalBonus: 0.4 },
            { pullRadius: 140, pullStrength: 100, metalBonus: 0.5 },
            { pullRadius: 170, pullStrength: 140, metalBonus: 0.6 },
        ],
    },

    // 회전 가속 (Spin Up) - KE_rot = ½Iω²
    'spin-up': {
        id: 'spin-up',
        name: { ko: '회전 가속', en: 'Spin Up' },
        description: {
            ko: '회전 속도에 비례한 데미지',
            en: 'Damage scales with rotation speed',
        },
        icon: '◎',
        color: 0x8e44ad,
        maxLevel: 5,
        formulaId: 'rotational-energy',
        physicsVisualType: 'rotational',
        levelEffects: [
            { momentOfInertia: 1.0, angularVelocity: 2.0, maxSpin: 50 },
            { momentOfInertia: 1.2, angularVelocity: 2.5, maxSpin: 75 },
            { momentOfInertia: 1.5, angularVelocity: 3.0, maxSpin: 100 },
            { momentOfInertia: 1.8, angularVelocity: 3.5, maxSpin: 140 },
            { momentOfInertia: 2.0, angularVelocity: 4.0, maxSpin: 200 },
        ],
    },

    // 맥놀이 펄스 (Beat Pulse) - f_beat = |f₁ - f₂|
    'beat-pulse': {
        id: 'beat-pulse',
        name: { ko: '맥놀이 펄스', en: 'Beat Pulse' },
        description: {
            ko: '두 주파수 간섭으로 주기적 강화',
            en: 'Interference pattern creates periodic power spikes',
        },
        icon: '∿',
        color: 0x2ecc71,
        maxLevel: 5,
        formulaId: 'beat-frequency',
        physicsVisualType: 'beat',
        levelEffects: [
            { freq1: 5, freq2: 6, beatAmplitude: 0.2 },
            { freq1: 5, freq2: 6.5, beatAmplitude: 0.3 },
            { freq1: 5, freq2: 7, beatAmplitude: 0.4 },
            { freq1: 5, freq2: 7.5, beatAmplitude: 0.55 },
            { freq1: 5, freq2: 8, beatAmplitude: 0.7 },
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
    if (effect.slowFactor !== undefined) parts.push(`감속 ${Math.round(effect.slowFactor * 100)}%`)

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
