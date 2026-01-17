import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Elastic Return effect type
 */
export interface ElasticReturnEffect extends SkillEffect {
    readonly type: 'elastic-return'
    returnDistance: number
    returnDamageMultiplier: number
}

/**
 * Elastic Return skill behavior
 * Physics: Hooke's Law - F = -kx
 * Projectiles return like a spring
 */
export class ElasticReturnBehavior extends BaseSkillBehavior<ElasticReturnEffect> {
    readonly skillId = 'elastic-return'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: ElasticReturnEffect[] = [
        { type: 'elastic-return', returnDistance: 150, returnDamageMultiplier: 0.5 },
        { type: 'elastic-return', returnDistance: 180, returnDamageMultiplier: 0.6 },
        { type: 'elastic-return', returnDistance: 220, returnDamageMultiplier: 0.7 },
        { type: 'elastic-return', returnDistance: 260, returnDamageMultiplier: 0.8 },
        { type: 'elastic-return', returnDistance: 300, returnDamageMultiplier: 1.0 },
    ]

    readonly definition: SkillDefinition<ElasticReturnEffect> = {
        id: 'elastic-return',
        name: { ko: '탄성 회귀', en: 'Elastic Return' },
        description: {
            ko: '스프링처럼 발사체가 되돌아옵니다',
            en: 'Projectiles return like a spring',
        },
        icon: '⟳',
        color: 0x9b59b6,
        maxLevel: 5,
        category: 'projectile',
        formulaId: 'hooke',
        physicsVisualType: 'spring',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            returnDistance: effect.returnDistance,
            returnDamageMultiplier: effect.returnDamageMultiplier,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `거리 ${effect.returnDistance}, 복귀 데미지 ${Math.round(effect.returnDamageMultiplier * 100)}%`
    }
}

// Create and register the singleton instance
export const elasticReturnBehavior = new ElasticReturnBehavior()
registerSkill(elasticReturnBehavior)
