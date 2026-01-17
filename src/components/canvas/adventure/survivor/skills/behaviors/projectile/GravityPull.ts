import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Gravity Pull effect type
 */
export interface GravityPullEffect extends SkillEffect {
    readonly type: 'gravity-pull'
    homingTurnRate: number
}

/**
 * Gravity Pull skill behavior
 * Physics: Universal Gravitation - F = GMm/r²
 * Projectiles curve toward enemies
 */
export class GravityPullBehavior extends BaseSkillBehavior<GravityPullEffect> {
    readonly skillId = 'gravity-pull'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: GravityPullEffect[] = [
        { type: 'gravity-pull', homingTurnRate: 0.5 },
        { type: 'gravity-pull', homingTurnRate: 1.0 },
        { type: 'gravity-pull', homingTurnRate: 1.5 },
        { type: 'gravity-pull', homingTurnRate: 2.0 },
        { type: 'gravity-pull', homingTurnRate: 3.0 },
    ]

    readonly definition: SkillDefinition<GravityPullEffect> = {
        id: 'gravity-pull',
        name: { ko: '중력 유도', en: 'Gravity Pull' },
        description: {
            ko: '중력으로 적을 향해 휘어집니다',
            en: 'Projectiles curve toward enemies',
        },
        icon: '◇',
        color: 0x1abc9c,
        maxLevel: 5,
        category: 'projectile',
        formulaId: 'gravity',
        physicsVisualType: 'gravity',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            homingTurnRate: effect.homingTurnRate,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `추적력 ${effect.homingTurnRate}`
    }
}

// Create and register the singleton instance
export const gravityPullBehavior = new GravityPullBehavior()
registerSkill(gravityPullBehavior)
