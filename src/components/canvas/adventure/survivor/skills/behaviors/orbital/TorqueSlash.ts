import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Torque Slash effect type
 */
export interface TorqueSlashEffect extends SkillEffect {
    readonly type: 'torque-slash'
    slashRadius: number
    slashDamage: number
    slashSpeed: number
}

/**
 * Torque Slash skill behavior
 * Physics: Torque - τ = rF sin θ
 * Spinning blade damages nearby enemies
 */
export class TorqueSlashBehavior extends BaseSkillBehavior<TorqueSlashEffect> {
    readonly skillId = 'torque-slash'
    readonly category: SkillCategory = 'orbital'

    protected readonly levelEffects: TorqueSlashEffect[] = [
        { type: 'torque-slash', slashRadius: 60, slashDamage: 8, slashSpeed: 1.5 },
        { type: 'torque-slash', slashRadius: 75, slashDamage: 12, slashSpeed: 1.8 },
        { type: 'torque-slash', slashRadius: 90, slashDamage: 16, slashSpeed: 2.1 },
        { type: 'torque-slash', slashRadius: 110, slashDamage: 22, slashSpeed: 2.5 },
        { type: 'torque-slash', slashRadius: 130, slashDamage: 30, slashSpeed: 3.0 },
    ]

    readonly definition: SkillDefinition<TorqueSlashEffect> = {
        id: 'torque-slash',
        name: { ko: '토크 회전참', en: 'Torque Slash' },
        nameShort: { ko: '회전', en: 'Slash' },
        description: {
            ko: '회전하는 칼날이 주변 적을 벱니다',
            en: 'Spinning blade damages nearby enemies',
        },
        icon: '↻',
        color: 0xc0392b,
        maxLevel: 5,
        category: 'orbital',
        activationType: 'aura',
        formulaId: 'torque',
        physicsVisualType: 'torque',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            slashRadius: effect.slashRadius,
            slashDamage: effect.slashDamage,
            slashSpeed: effect.slashSpeed,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.slashRadius}, 데미지 ${effect.slashDamage}, 회전 ${effect.slashSpeed}회/초`
    }
}

// Create and register the singleton instance
export const torqueSlashBehavior = new TorqueSlashBehavior()
registerSkill(torqueSlashBehavior)
