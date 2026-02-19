import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * F=ma Impact effect type
 */
export interface FmaImpactEffect extends SkillEffect {
    readonly type: 'fma-impact'
    damageBonus: number
    knockbackBonus: number
}

/**
 * F=ma Impact skill behavior
 * Physics: Newton's Second Law - F = ma
 * Greater mass means greater force
 */
export class FmaImpactBehavior extends BaseSkillBehavior<FmaImpactEffect> {
    readonly skillId = 'fma-impact'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: FmaImpactEffect[] = [
        { type: 'fma-impact', damageBonus: 0.3, knockbackBonus: 0.5 },
        { type: 'fma-impact', damageBonus: 0.5, knockbackBonus: 0.75 },
        { type: 'fma-impact', damageBonus: 0.7, knockbackBonus: 1.0 },
        { type: 'fma-impact', damageBonus: 1.0, knockbackBonus: 1.25 },
        { type: 'fma-impact', damageBonus: 1.5, knockbackBonus: 1.5 },
    ]

    readonly definition: SkillDefinition<FmaImpactEffect> = {
        id: 'fma-impact',
        name: { ko: 'F=ma 충격', en: 'F=ma Impact' },
        nameShort: { ko: '충격', en: 'Impact' },
        description: {
            ko: '큰 질량이 큰 힘을 만듭니다',
            en: 'Greater mass means greater force',
        },
        icon: '⬤',
        color: 0x9b59b6,
        maxLevel: 5,
        category: 'projectile',
        activationType: 'passive',
        formulaId: 'newton-second',
        physicsVisualType: 'fma',
        requires: ['projectile'], // Only appears when player has projectile skill
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            damageMultiplier: 1 + effect.damageBonus,
            knockbackMultiplier: 1 + effect.knockbackBonus,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `데미지 +${Math.round(effect.damageBonus * 100)}%, 넉백 +${Math.round(effect.knockbackBonus * 100)}%`
    }
}

// Create and register the singleton instance
export const fmaImpactBehavior = new FmaImpactBehavior()
registerSkill(fmaImpactBehavior)
