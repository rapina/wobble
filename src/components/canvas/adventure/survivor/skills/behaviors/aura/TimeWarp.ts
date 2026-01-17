import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Time Warp effect type
 */
export interface TimeWarpEffect extends SkillEffect {
    readonly type: 'time-warp'
    warpRadius: number
    slowFactor: number
}

/**
 * Time Warp skill behavior
 * Physics: Time Dilation - t = t₀/√(1-v²/c²)
 * Slow down nearby enemies
 */
export class TimeWarpBehavior extends BaseSkillBehavior<TimeWarpEffect> {
    readonly skillId = 'time-warp'
    readonly category: SkillCategory = 'aura'

    protected readonly levelEffects: TimeWarpEffect[] = [
        { type: 'time-warp', warpRadius: 80, slowFactor: 0.2 },
        { type: 'time-warp', warpRadius: 100, slowFactor: 0.3 },
        { type: 'time-warp', warpRadius: 120, slowFactor: 0.4 },
        { type: 'time-warp', warpRadius: 150, slowFactor: 0.5 },
        { type: 'time-warp', warpRadius: 180, slowFactor: 0.6 },
    ]

    readonly definition: SkillDefinition<TimeWarpEffect> = {
        id: 'time-warp',
        name: { ko: '시간 왜곡', en: 'Time Warp' },
        description: {
            ko: '주변 적의 시간을 느리게 합니다',
            en: 'Slow down nearby enemies',
        },
        icon: '◐',
        color: 0x2c3e50,
        maxLevel: 5,
        category: 'aura',
        formulaId: 'time-dilation',
        physicsVisualType: 'time',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            warpRadius: effect.warpRadius,
            slowFactor: effect.slowFactor,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.warpRadius}, 감속 ${Math.round(effect.slowFactor * 100)}%`
    }
}

// Create and register the singleton instance
export const timeWarpBehavior = new TimeWarpBehavior()
registerSkill(timeWarpBehavior)
