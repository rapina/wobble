import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Frequency Shift effect type
 */
export interface FrequencyShiftEffect extends SkillEffect {
    readonly type: 'frequency-shift'
    approachBonus: number
    recedeReduction: number
    shiftRange: number
}

/**
 * Frequency Shift skill behavior
 * Physics: Doppler Effect - f' = f(v ± vr)/(v ∓ vs)
 * More damage to approaching enemies
 */
export class FrequencyShiftBehavior extends BaseSkillBehavior<FrequencyShiftEffect> {
    readonly skillId = 'frequency-shift'
    readonly category: SkillCategory = 'trigger'

    protected readonly levelEffects: FrequencyShiftEffect[] = [
        { type: 'frequency-shift', approachBonus: 0.2, recedeReduction: 0.1, shiftRange: 100 },
        { type: 'frequency-shift', approachBonus: 0.3, recedeReduction: 0.15, shiftRange: 120 },
        { type: 'frequency-shift', approachBonus: 0.4, recedeReduction: 0.2, shiftRange: 140 },
        { type: 'frequency-shift', approachBonus: 0.55, recedeReduction: 0.25, shiftRange: 170 },
        { type: 'frequency-shift', approachBonus: 0.7, recedeReduction: 0.3, shiftRange: 200 },
    ]

    readonly definition: SkillDefinition<FrequencyShiftEffect> = {
        id: 'frequency-shift',
        name: { ko: '주파수 편이', en: 'Frequency Shift' },
        nameShort: { ko: '편이', en: 'Shift' },
        description: {
            ko: '접근하는 적에게 더 강한 데미지',
            en: 'More damage to approaching enemies',
        },
        icon: '〉〈',
        color: 0x3498db,
        maxLevel: 5,
        category: 'trigger',
        activationType: 'passive',
        formulaId: 'doppler',
        physicsVisualType: 'doppler',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            approachBonus: effect.approachBonus,
            recedeReduction: effect.recedeReduction,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `접근 +${Math.round(effect.approachBonus * 100)}%, 후퇴 -${Math.round(effect.recedeReduction * 100)}%`
    }
}

// Create and register the singleton instance
export const frequencyShiftBehavior = new FrequencyShiftBehavior()
registerSkill(frequencyShiftBehavior)
