import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Magnetic Shield effect type
 */
export interface MagneticShieldEffect extends SkillEffect {
    readonly type: 'magnetic-shield'
    shieldRadius: number
    deflectionStrength: number
}

/**
 * Magnetic Shield skill behavior
 * Physics: Lorentz Force - F = qvB
 * Magnetic field deflects enemies
 */
export class MagneticShieldBehavior extends BaseSkillBehavior<MagneticShieldEffect> {
    readonly skillId = 'magnetic-shield'
    readonly category: SkillCategory = 'aura'

    protected readonly levelEffects: MagneticShieldEffect[] = [
        { type: 'magnetic-shield', shieldRadius: 60, deflectionStrength: 0.3 },
        { type: 'magnetic-shield', shieldRadius: 80, deflectionStrength: 0.5 },
        { type: 'magnetic-shield', shieldRadius: 100, deflectionStrength: 0.7 },
        { type: 'magnetic-shield', shieldRadius: 120, deflectionStrength: 0.85 },
        { type: 'magnetic-shield', shieldRadius: 150, deflectionStrength: 1.0 },
    ]

    readonly definition: SkillDefinition<MagneticShieldEffect> = {
        id: 'magnetic-shield',
        name: { ko: '자기장 방어', en: 'Magnetic Shield' },
        nameShort: { ko: '자기장', en: 'Shield' },
        description: {
            ko: '자기장이 적의 경로를 휘게 합니다',
            en: 'Magnetic field deflects enemies',
        },
        icon: '⊛',
        color: 0x3498db,
        maxLevel: 5,
        category: 'aura',
        activationType: 'aura',
        formulaId: 'lorentz',
        physicsVisualType: 'magnetic',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            shieldRadius: effect.shieldRadius,
            deflectionStrength: effect.deflectionStrength,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.shieldRadius}, 편향 ${Math.round(effect.deflectionStrength * 100)}%`
    }
}

// Create and register the singleton instance
export const magneticShieldBehavior = new MagneticShieldBehavior()
registerSkill(magneticShieldBehavior)
