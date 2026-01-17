import { EnemyTier } from './types'

/**
 * Enemy Variant System
 * Defines different enemy types with unique behaviors and visuals
 */

export type EnemyVariantId =
    | 'normal'      // 기본 적
    | 'speedy'      // 빠르지만 약함
    | 'tank'        // 느리지만 강함
    | 'charger'     // 돌진형
    | 'splitter'    // 죽으면 분열
    | 'explosive'   // 죽으면 폭발
    | 'ghost'       // 투명해지는 적
    | 'healer'      // 주변 적 회복
    | 'magnet'      // 플레이어 끌어당김
    | 'shooter'     // 원거리 공격 (미래)

/**
 * Behavior type determines how the enemy moves
 */
export type EnemyBehavior =
    | 'chase'       // 플레이어 추격 (기본)
    | 'charge'      // 돌진 후 휴식
    | 'orbit'       // 플레이어 주변 공전
    | 'zigzag'      // 지그재그 이동
    | 'teleport'    // 순간이동
    | 'flee'        // 도망치다가 공격

export interface EnemyVariantDef {
    id: EnemyVariantId
    name: string

    // Visual modifiers
    colorTint?: number          // 색상 틴트 (기본 색상에 곱함)
    glowColor?: number          // 글로우 효과 색상
    glowIntensity?: number      // 글로우 강도 (0-1)
    scaleModifier?: number      // 크기 배율
    trailEffect?: boolean       // 잔상 효과
    pulseEffect?: boolean       // 맥동 효과

    // Stat modifiers (기본값 1.0)
    speedMult: number           // 속도 배율
    healthMult: number          // 체력 배율
    damageMult: number          // 데미지 배율 (접촉 데미지)
    massMult: number            // 질량 배율 (넉백 영향)
    xpMult: number              // 경험치 배율

    // Behavior
    behavior: EnemyBehavior
    behaviorParams?: {
        chargeSpeed?: number    // 돌진 속도
        chargeCooldown?: number // 돌진 쿨다운
        orbitRadius?: number    // 공전 반경
        orbitSpeed?: number     // 공전 속도
        zigzagAmplitude?: number // 지그재그 진폭
        zigzagFrequency?: number // 지그재그 주파수
    }

    // Special abilities
    onDeath?: 'split' | 'explode' | 'heal_allies' | 'spawn_minions'
    onDeathParams?: {
        splitCount?: number     // 분열 수
        explosionRadius?: number // 폭발 반경
        healAmount?: number     // 회복량
        spawnCount?: number     // 소환 수
    }

    // Spawn conditions
    minGameTime?: number        // 최소 게임 시간 (초)
    maxGameTime?: number        // 최대 게임 시간 (없으면 무제한)
    minTier?: EnemyTier         // 최소 티어
    spawnWeight: number         // 스폰 가중치 (높을수록 자주 등장)
}

/**
 * Enemy variant definitions
 */
export const ENEMY_VARIANTS: Record<EnemyVariantId, EnemyVariantDef> = {
    normal: {
        id: 'normal',
        name: '일반',
        speedMult: 1.0,
        healthMult: 1.0,
        damageMult: 1.0,
        massMult: 1.0,
        xpMult: 1.0,
        behavior: 'chase',
        spawnWeight: 10,
    },

    speedy: {
        id: 'speedy',
        name: '스피더',
        colorTint: 0x44ffff,
        trailEffect: true,
        speedMult: 2.0,
        healthMult: 0.5,
        damageMult: 0.8,
        massMult: 0.5,
        xpMult: 1.2,
        behavior: 'zigzag',
        behaviorParams: {
            zigzagAmplitude: 30,
            zigzagFrequency: 3,
        },
        minGameTime: 30,
        spawnWeight: 6,
    },

    tank: {
        id: 'tank',
        name: '탱커',
        colorTint: 0x8844aa,
        scaleModifier: 1.3,
        glowColor: 0x6622aa,
        glowIntensity: 0.3,
        speedMult: 0.5,
        healthMult: 3.0,
        damageMult: 1.5,
        massMult: 2.5,
        xpMult: 2.0,
        behavior: 'chase',
        minGameTime: 60,
        minTier: 'medium',
        spawnWeight: 4,
    },

    charger: {
        id: 'charger',
        name: '돌진자',
        colorTint: 0xff4444,
        trailEffect: true,
        pulseEffect: true,
        speedMult: 1.2,
        healthMult: 1.2,
        damageMult: 2.0,
        massMult: 1.5,
        xpMult: 1.5,
        behavior: 'charge',
        behaviorParams: {
            chargeSpeed: 8,
            chargeCooldown: 2.5,
        },
        minGameTime: 90,
        spawnWeight: 5,
    },

    splitter: {
        id: 'splitter',
        name: '분열자',
        colorTint: 0x44ff44,
        pulseEffect: true,
        speedMult: 0.8,
        healthMult: 1.5,
        damageMult: 0.8,
        massMult: 1.0,
        xpMult: 0.5, // 분열체가 추가 경험치
        behavior: 'chase',
        onDeath: 'split',
        onDeathParams: {
            splitCount: 2,
        },
        minGameTime: 120,
        minTier: 'medium',
        spawnWeight: 3,
    },

    explosive: {
        id: 'explosive',
        name: '폭탄',
        colorTint: 0xff8800,
        glowColor: 0xff4400,
        glowIntensity: 0.5,
        pulseEffect: true,
        speedMult: 0.7,
        healthMult: 0.8,
        damageMult: 0.5,
        massMult: 1.0,
        xpMult: 1.5,
        behavior: 'chase',
        onDeath: 'explode',
        onDeathParams: {
            explosionRadius: 80,
        },
        minGameTime: 150,
        spawnWeight: 3,
    },

    ghost: {
        id: 'ghost',
        name: '유령',
        colorTint: 0xaaaaff,
        glowColor: 0x8888ff,
        glowIntensity: 0.4,
        speedMult: 1.3,
        healthMult: 0.7,
        damageMult: 1.2,
        massMult: 0.3,
        xpMult: 1.8,
        behavior: 'teleport',
        minGameTime: 180,
        spawnWeight: 2,
    },

    healer: {
        id: 'healer',
        name: '힐러',
        colorTint: 0x44ff88,
        glowColor: 0x22ff66,
        glowIntensity: 0.6,
        speedMult: 0.6,
        healthMult: 2.0,
        damageMult: 0.5,
        massMult: 1.0,
        xpMult: 2.5,
        behavior: 'orbit',
        behaviorParams: {
            orbitRadius: 100,
            orbitSpeed: 1.5,
        },
        onDeath: 'heal_allies',
        onDeathParams: {
            healAmount: 0.3, // 30% max health
        },
        minGameTime: 240,
        spawnWeight: 2,
    },

    magnet: {
        id: 'magnet',
        name: '자석',
        colorTint: 0xff44ff,
        glowColor: 0xaa22aa,
        glowIntensity: 0.5,
        pulseEffect: true,
        speedMult: 0.9,
        healthMult: 1.5,
        damageMult: 1.0,
        massMult: 2.0,
        xpMult: 2.0,
        behavior: 'chase',
        minGameTime: 300,
        minTier: 'medium',
        spawnWeight: 2,
    },

    shooter: {
        id: 'shooter',
        name: '슈터',
        colorTint: 0xffff44,
        speedMult: 0.6,
        healthMult: 1.0,
        damageMult: 1.5,
        massMult: 1.0,
        xpMult: 2.0,
        behavior: 'flee',
        minGameTime: 360,
        spawnWeight: 2,
    },
}

/**
 * Get available variants based on game time and tier
 */
export function getAvailableVariants(gameTime: number, tier: EnemyTier): EnemyVariantDef[] {
    const tierOrder: EnemyTier[] = ['small', 'medium', 'large', 'boss']
    const tierIndex = tierOrder.indexOf(tier)

    return Object.values(ENEMY_VARIANTS).filter(variant => {
        // Check min game time
        if (variant.minGameTime && gameTime < variant.minGameTime) {
            return false
        }

        // Check max game time
        if (variant.maxGameTime && gameTime > variant.maxGameTime) {
            return false
        }

        // Check min tier
        if (variant.minTier) {
            const minTierIndex = tierOrder.indexOf(variant.minTier)
            if (tierIndex < minTierIndex) {
                return false
            }
        }

        return true
    })
}

/**
 * Select a random variant based on weights
 */
export function selectRandomVariant(availableVariants: EnemyVariantDef[]): EnemyVariantDef {
    if (availableVariants.length === 0) {
        return ENEMY_VARIANTS.normal
    }

    const totalWeight = availableVariants.reduce((sum, v) => sum + v.spawnWeight, 0)
    let random = Math.random() * totalWeight

    for (const variant of availableVariants) {
        random -= variant.spawnWeight
        if (random <= 0) {
            return variant
        }
    }

    return availableVariants[availableVariants.length - 1]
}

/**
 * Get variant by ID
 */
export function getVariant(id: EnemyVariantId): EnemyVariantDef {
    return ENEMY_VARIANTS[id] ?? ENEMY_VARIANTS.normal
}
