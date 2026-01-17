import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Pressure Wave effect type
 */
export interface PressureWaveEffect extends SkillEffect {
    readonly type: 'pressure-wave'
    explosionRadius: number
}

/**
 * Pressure Wave skill behavior
 * Physics: Ideal Gas Law - PV = nRT
 * Gas expansion creates explosive pressure
 */
export class PressureWaveBehavior extends BaseSkillBehavior<PressureWaveEffect> {
    readonly skillId = 'pressure-wave'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: PressureWaveEffect[] = [
        { type: 'pressure-wave', explosionRadius: 50 },
        { type: 'pressure-wave', explosionRadius: 70 },
        { type: 'pressure-wave', explosionRadius: 100 },
        { type: 'pressure-wave', explosionRadius: 130 },
        { type: 'pressure-wave', explosionRadius: 180 },
    ]

    readonly definition: SkillDefinition<PressureWaveEffect> = {
        id: 'pressure-wave',
        name: { ko: '압력파', en: 'Pressure Wave' },
        nameShort: { ko: '압력', en: 'Blast' },
        description: {
            ko: '기체 팽창으로 폭발적 압력을 만듭니다',
            en: 'Gas expansion creates explosive pressure',
        },
        icon: '✸',
        color: 0xf39c12,
        maxLevel: 5,
        category: 'projectile',
        activationType: 'passive',
        formulaId: 'ideal-gas',
        physicsVisualType: 'pressure',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            explosionRadius: effect.explosionRadius,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.explosionRadius}`
    }
}

// Create and register the singleton instance
export const pressureWaveBehavior = new PressureWaveBehavior()
registerSkill(pressureWaveBehavior)
