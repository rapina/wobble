import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Chaos Field effect type
 */
export interface ChaosFieldEffect extends SkillEffect {
    readonly type: 'chaos-field'
    fieldRadius: number
    chaosStrength: number
    durationBonus: number
}

/**
 * Chaos Field skill behavior
 * Physics: Entropy - ΔS > 0
 * Entropy randomizes enemy movement
 */
export class ChaosFieldBehavior extends BaseSkillBehavior<ChaosFieldEffect> {
    readonly skillId = 'chaos-field'
    readonly category: SkillCategory = 'aura'

    protected readonly levelEffects: ChaosFieldEffect[] = [
        { type: 'chaos-field', fieldRadius: 60, chaosStrength: 0.2, durationBonus: 1.0 },
        { type: 'chaos-field', fieldRadius: 80, chaosStrength: 0.35, durationBonus: 1.5 },
        { type: 'chaos-field', fieldRadius: 100, chaosStrength: 0.5, durationBonus: 2.0 },
        { type: 'chaos-field', fieldRadius: 120, chaosStrength: 0.65, durationBonus: 2.5 },
        { type: 'chaos-field', fieldRadius: 150, chaosStrength: 0.8, durationBonus: 3.0 },
    ]

    readonly definition: SkillDefinition<ChaosFieldEffect> = {
        id: 'chaos-field',
        name: { ko: '혼돈장', en: 'Chaos Field' },
        nameShort: { ko: '혼돈', en: 'Chaos' },
        description: {
            ko: '엔트로피 증가로 적 이동 경로 교란',
            en: 'Entropy randomizes enemy movement',
        },
        icon: '⌘',
        color: 0x8e44ad,
        maxLevel: 5,
        category: 'aura',
        activationType: 'aura',
        formulaId: 'entropy',
        physicsVisualType: 'entropy',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            chaosFieldRadius: effect.fieldRadius,
            chaosStrength: effect.chaosStrength,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.fieldRadius}, 교란 ${Math.round(effect.chaosStrength * 100)}%`
    }
}

// Create and register the singleton instance
export const chaosFieldBehavior = new ChaosFieldBehavior()
registerSkill(chaosFieldBehavior)
