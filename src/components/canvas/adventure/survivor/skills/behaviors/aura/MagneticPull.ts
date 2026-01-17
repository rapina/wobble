import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Magnetic Pull effect type
 */
export interface MagneticPullEffect extends SkillEffect {
    readonly type: 'magnetic-pull'
    pullRadius: number
    pullStrength: number
    metalBonus: number
}

/**
 * Magnetic Pull skill behavior
 * Physics: Magnetic Field - B = μ₀I/2πr
 * Pull magnetic objects toward you
 */
export class MagneticPullBehavior extends BaseSkillBehavior<MagneticPullEffect> {
    readonly skillId = 'magnetic-pull'
    readonly category: SkillCategory = 'aura'

    protected readonly levelEffects: MagneticPullEffect[] = [
        { type: 'magnetic-pull', pullRadius: 80, pullStrength: 30, metalBonus: 0.2 },
        { type: 'magnetic-pull', pullRadius: 100, pullStrength: 50, metalBonus: 0.3 },
        { type: 'magnetic-pull', pullRadius: 120, pullStrength: 75, metalBonus: 0.4 },
        { type: 'magnetic-pull', pullRadius: 140, pullStrength: 100, metalBonus: 0.5 },
        { type: 'magnetic-pull', pullRadius: 170, pullStrength: 140, metalBonus: 0.6 },
    ]

    readonly definition: SkillDefinition<MagneticPullEffect> = {
        id: 'magnetic-pull',
        name: { ko: '자기 흡인', en: 'Magnetic Pull' },
        description: {
            ko: '자성을 가진 것들을 끌어당김',
            en: 'Pull magnetic objects toward you',
        },
        icon: '⊕',
        color: 0x34495e,
        maxLevel: 5,
        category: 'aura',
        formulaId: 'magnetic-field',
        physicsVisualType: 'magnet',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            magneticPullRadius: effect.pullRadius,
            magneticPullStrength: effect.pullStrength,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.pullRadius}, 흡인력 ${effect.pullStrength}`
    }
}

// Create and register the singleton instance
export const magneticPullBehavior = new MagneticPullBehavior()
registerSkill(magneticPullBehavior)
