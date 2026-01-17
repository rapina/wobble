import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Frequency Burst effect type
 */
export interface FrequencyBurstEffect extends SkillEffect {
    readonly type: 'frequency-burst'
    fireRateBonus: number
}

/**
 * Frequency Burst skill behavior
 * Physics: Photoelectric effect - E = hf
 * Higher frequency means faster fire rate
 */
export class FrequencyBurstBehavior extends BaseSkillBehavior<FrequencyBurstEffect> {
    readonly skillId = 'frequency-burst'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: FrequencyBurstEffect[] = [
        { type: 'frequency-burst', fireRateBonus: 0.3 },
        { type: 'frequency-burst', fireRateBonus: 0.5 },
        { type: 'frequency-burst', fireRateBonus: 0.75 },
        { type: 'frequency-burst', fireRateBonus: 1.0 },
        { type: 'frequency-burst', fireRateBonus: 1.5 },
    ]

    readonly definition: SkillDefinition<FrequencyBurstEffect> = {
        id: 'frequency-burst',
        name: { ko: '진동수 증폭', en: 'Frequency Burst' },
        description: {
            ko: '높은 진동수로 빠르게 발사합니다',
            en: 'Higher frequency means faster fire rate',
        },
        icon: '⚡',
        color: 0xf1c40f,
        maxLevel: 5,
        category: 'projectile',
        formulaId: 'photoelectric',
        physicsVisualType: 'frequency',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        // Fire rate bonus is inverted: lower multiplier = faster fire
        return {
            fireRateMultiplier: 1 / (1 + effect.fireRateBonus),
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `속도 +${Math.round(effect.fireRateBonus * 100)}%`
    }
}

// Create and register the singleton instance
export const frequencyBurstBehavior = new FrequencyBurstBehavior()
registerSkill(frequencyBurstBehavior)
