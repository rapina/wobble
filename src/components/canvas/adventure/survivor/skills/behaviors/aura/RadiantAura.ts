import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Radiant Aura effect type
 */
export interface RadiantAuraEffect extends SkillEffect {
    readonly type: 'radiant-aura'
    auraRadius: number
    baseTemp: number
    radiationDamage: number
}

/**
 * Radiant Aura skill behavior
 * Physics: Stefan-Boltzmann Law - P = σAT⁴
 * Aura damage scales with T⁴
 */
export class RadiantAuraBehavior extends BaseSkillBehavior<RadiantAuraEffect> {
    readonly skillId = 'radiant-aura'
    readonly category: SkillCategory = 'aura'

    protected readonly levelEffects: RadiantAuraEffect[] = [
        { type: 'radiant-aura', auraRadius: 50, baseTemp: 1.0, radiationDamage: 3 },
        { type: 'radiant-aura', auraRadius: 60, baseTemp: 1.2, radiationDamage: 5 },
        { type: 'radiant-aura', auraRadius: 70, baseTemp: 1.4, radiationDamage: 8 },
        { type: 'radiant-aura', auraRadius: 85, baseTemp: 1.6, radiationDamage: 12 },
        { type: 'radiant-aura', auraRadius: 100, baseTemp: 2.0, radiationDamage: 18 },
    ]

    readonly definition: SkillDefinition<RadiantAuraEffect> = {
        id: 'radiant-aura',
        name: { ko: '복사 오라', en: 'Radiant Aura' },
        nameShort: { ko: '복사', en: 'Radian' },
        description: {
            ko: '온도의 4제곱에 비례한 지속 데미지 오라',
            en: 'Aura damage scales with T⁴',
        },
        icon: '☀',
        color: 0xf1c40f,
        maxLevel: 5,
        category: 'aura',
        activationType: 'aura',
        formulaId: 'stefan-boltzmann',
        physicsVisualType: 'radiant',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            auraRadius: effect.auraRadius,
            radiationDamage: effect.radiationDamage,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.auraRadius}, 데미지 ${effect.radiationDamage}/초`
    }
}

// Create and register the singleton instance
export const radiantAuraBehavior = new RadiantAuraBehavior()
registerSkill(radiantAuraBehavior)
