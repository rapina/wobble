import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Escape Burst effect type
 */
export interface EscapeBurstEffect extends SkillEffect {
    readonly type: 'escape-burst'
    velocityThreshold: number
    escapeBonus: number
    burstRadius: number
}

/**
 * Escape Burst skill behavior
 * Physics: Escape Velocity - v = √(2GM/r)
 * Escape gravity with an explosive burst
 */
export class EscapeBurstBehavior extends BaseSkillBehavior<EscapeBurstEffect> {
    readonly skillId = 'escape-burst'
    readonly category: SkillCategory = 'trigger'

    protected readonly levelEffects: EscapeBurstEffect[] = [
        { type: 'escape-burst', velocityThreshold: 300, escapeBonus: 0.5, burstRadius: 50 },
        { type: 'escape-burst', velocityThreshold: 250, escapeBonus: 0.75, burstRadius: 65 },
        { type: 'escape-burst', velocityThreshold: 200, escapeBonus: 1.0, burstRadius: 80 },
        { type: 'escape-burst', velocityThreshold: 150, escapeBonus: 1.5, burstRadius: 100 },
        { type: 'escape-burst', velocityThreshold: 100, escapeBonus: 2.0, burstRadius: 120 },
    ]

    readonly definition: SkillDefinition<EscapeBurstEffect> = {
        id: 'escape-burst',
        name: { ko: '탈출 속도 폭발', en: 'Escape Burst' },
        description: {
            ko: '충분한 속도로 중력을 벗어나며 폭발',
            en: 'Escape gravity with an explosive burst',
        },
        icon: '↗',
        color: 0x2ecc71,
        maxLevel: 5,
        category: 'trigger',
        formulaId: 'escape-velocity',
        physicsVisualType: 'escape',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            velocityThreshold: effect.velocityThreshold,
            escapeBonus: effect.escapeBonus,
            escapeBurstRadius: effect.burstRadius,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `임계속도 ${effect.velocityThreshold}, 보너스 +${Math.round(effect.escapeBonus * 100)}%, 반경 ${effect.burstRadius}`
    }
}

// Create and register the singleton instance
export const escapeBurstBehavior = new EscapeBurstBehavior()
registerSkill(escapeBurstBehavior)
