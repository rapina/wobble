import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Elastic Bounce effect type
 */
export interface ElasticBounceEffect extends SkillEffect {
    readonly type: 'elastic-bounce'
    bounceCount: number
}

/**
 * Elastic Bounce skill behavior
 * Physics: Elastic collision - momentum conservation
 * Formula: p₁ + p₂ = p₁' + p₂'
 */
export class ElasticBounceBehavior extends BaseSkillBehavior<ElasticBounceEffect> {
    readonly skillId = 'elastic-bounce'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: ElasticBounceEffect[] = [
        { type: 'elastic-bounce', bounceCount: 1 },
        { type: 'elastic-bounce', bounceCount: 2 },
        { type: 'elastic-bounce', bounceCount: 3 },
        { type: 'elastic-bounce', bounceCount: 4 },
        { type: 'elastic-bounce', bounceCount: 5 },
    ]

    readonly definition: SkillDefinition<ElasticBounceEffect> = {
        id: 'elastic-bounce',
        name: { ko: '탄성 충돌', en: 'Elastic Collision' },
        nameShort: { ko: '탄성', en: 'Bounce' },
        description: {
            ko: '운동량을 보존하며 튕겨갑니다',
            en: 'Projectiles conserve momentum when bouncing',
        },
        icon: '◎',
        color: 0x3498db,
        maxLevel: 5,
        category: 'projectile',
        activationType: 'passive',
        formulaId: 'elastic-collision',
        physicsVisualType: 'elastic',
        requires: ['projectile'], // Only appears when player has projectile skill
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            bounceCount: effect.bounceCount,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `튕김 ${effect.bounceCount}회`
    }
}

// Create and register the singleton instance
export const elasticBounceBehavior = new ElasticBounceBehavior()
registerSkill(elasticBounceBehavior)
