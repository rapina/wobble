import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Refraction Spread effect type
 */
export interface RefractionSpreadEffect extends SkillEffect {
    readonly type: 'refraction-spread'
    spreadCount: number
    spreadAngle: number
}

/**
 * Refraction Spread skill behavior
 * Physics: Snell's Law - n₁sinθ₁ = n₂sinθ₂
 * Light refracts into multiple beams
 */
export class RefractionSpreadBehavior extends BaseSkillBehavior<RefractionSpreadEffect> {
    readonly skillId = 'refraction-spread'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: RefractionSpreadEffect[] = [
        { type: 'refraction-spread', spreadCount: 3, spreadAngle: 20 },
        { type: 'refraction-spread', spreadCount: 4, spreadAngle: 30 },
        { type: 'refraction-spread', spreadCount: 6, spreadAngle: 40 },
        { type: 'refraction-spread', spreadCount: 8, spreadAngle: 50 },
        { type: 'refraction-spread', spreadCount: 12, spreadAngle: 60 },
    ]

    readonly definition: SkillDefinition<RefractionSpreadEffect> = {
        id: 'refraction-spread',
        name: { ko: '굴절 분산', en: 'Refraction Spread' },
        nameShort: { ko: '분산', en: 'Spread' },
        description: {
            ko: '빛이 여러 각도로 굴절됩니다',
            en: 'Light refracts into multiple beams',
        },
        icon: '⁂',
        color: 0xe67e22,
        maxLevel: 5,
        category: 'projectile',
        activationType: 'passive',
        formulaId: 'snell',
        physicsVisualType: 'refraction',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            spreadCount: effect.spreadCount,
            spreadAngle: effect.spreadAngle,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `탄환 ${effect.spreadCount}발, 각도 ${effect.spreadAngle}°`
    }
}

// Create and register the singleton instance
export const refractionSpreadBehavior = new RefractionSpreadBehavior()
registerSkill(refractionSpreadBehavior)
