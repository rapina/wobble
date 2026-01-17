import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Pendulum Rhythm effect type
 */
export interface PendulumRhythmEffect extends SkillEffect {
    readonly type: 'pendulum-rhythm'
    rhythmPeriod: number
    peakDamageBonus: number
}

/**
 * Pendulum Rhythm skill behavior
 * Physics: Pendulum Period - T = 2π√(L/g)
 * Damage oscillates with timing
 */
export class PendulumRhythmBehavior extends BaseSkillBehavior<PendulumRhythmEffect> {
    readonly skillId = 'pendulum-rhythm'
    readonly category: SkillCategory = 'player'

    protected readonly levelEffects: PendulumRhythmEffect[] = [
        { type: 'pendulum-rhythm', rhythmPeriod: 4.0, peakDamageBonus: 0.5 },
        { type: 'pendulum-rhythm', rhythmPeriod: 3.5, peakDamageBonus: 0.75 },
        { type: 'pendulum-rhythm', rhythmPeriod: 3.0, peakDamageBonus: 1.0 },
        { type: 'pendulum-rhythm', rhythmPeriod: 2.5, peakDamageBonus: 1.5 },
        { type: 'pendulum-rhythm', rhythmPeriod: 2.0, peakDamageBonus: 2.0 },
    ]

    readonly definition: SkillDefinition<PendulumRhythmEffect> = {
        id: 'pendulum-rhythm',
        name: { ko: '진자 리듬', en: 'Pendulum Rhythm' },
        description: {
            ko: '주기적으로 공격력이 최대가 됩니다',
            en: 'Damage oscillates with timing',
        },
        icon: '◷',
        color: 0xe67e22,
        maxLevel: 5,
        category: 'player',
        formulaId: 'pendulum',
        physicsVisualType: 'pendulum',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            rhythmPeriod: effect.rhythmPeriod,
            peakDamageBonus: effect.peakDamageBonus,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `주기 ${effect.rhythmPeriod}초, 최대 +${Math.round(effect.peakDamageBonus * 100)}%`
    }
}

// Create and register the singleton instance
export const pendulumRhythmBehavior = new PendulumRhythmBehavior()
registerSkill(pendulumRhythmBehavior)
