import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Momentum Pierce effect type
 */
export interface MomentumPierceEffect extends SkillEffect {
    readonly type: 'momentum-pierce'
    pierceCount: number
    pierceDamageDecay: number
}

/**
 * Momentum Pierce skill behavior
 * Physics: Momentum - p = mv
 * Heavy projectiles push through enemies
 */
export class MomentumPierceBehavior extends BaseSkillBehavior<MomentumPierceEffect> {
    readonly skillId = 'momentum-pierce'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: MomentumPierceEffect[] = [
        { type: 'momentum-pierce', pierceCount: 2, pierceDamageDecay: 0.1 },
        { type: 'momentum-pierce', pierceCount: 3, pierceDamageDecay: 0.08 },
        { type: 'momentum-pierce', pierceCount: 5, pierceDamageDecay: 0.05 },
        { type: 'momentum-pierce', pierceCount: 7, pierceDamageDecay: 0.02 },
        { type: 'momentum-pierce', pierceCount: 10, pierceDamageDecay: 0 },
    ]

    readonly definition: SkillDefinition<MomentumPierceEffect> = {
        id: 'momentum-pierce',
        name: { ko: '운동량 관통', en: 'Momentum Pierce' },
        description: {
            ko: '무거운 탄환이 적을 밀고 지나갑니다',
            en: 'Heavy projectiles push through enemies',
        },
        icon: '➤',
        color: 0xe74c3c,
        maxLevel: 5,
        category: 'projectile',
        formulaId: 'momentum',
        physicsVisualType: 'momentum',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            pierceCount: effect.pierceCount,
            pierceDamageDecay: effect.pierceDamageDecay,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        const decay = Math.round(effect.pierceDamageDecay * 100)
        return `관통 ${effect.pierceCount}회` + (decay > 0 ? `, 감쇠 ${decay}%` : '')
    }
}

// Create and register the singleton instance
export const momentumPierceBehavior = new MomentumPierceBehavior()
registerSkill(momentumPierceBehavior)
