import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Centripetal Pulse effect type
 */
export interface CentripetalPulseEffect extends SkillEffect {
    readonly type: 'centripetal-pulse'
    shockwaveInterval: number
    shockwaveRadius: number
    shockwaveKnockback: number
    shockwaveDamage: number
}

/**
 * Centripetal Pulse skill behavior
 * Physics: Centripetal Force - F = mv²/r
 * Rotating force pushes enemies away
 */
export class CentripetalPulseBehavior extends BaseSkillBehavior<CentripetalPulseEffect> {
    readonly skillId = 'centripetal-pulse'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: CentripetalPulseEffect[] = [
        {
            type: 'centripetal-pulse',
            shockwaveInterval: 5,
            shockwaveRadius: 80,
            shockwaveKnockback: 150,
            shockwaveDamage: 40, // High damage for slow cooldown
        },
        {
            type: 'centripetal-pulse',
            shockwaveInterval: 4,
            shockwaveRadius: 100,
            shockwaveKnockback: 200,
            shockwaveDamage: 55,
        },
        {
            type: 'centripetal-pulse',
            shockwaveInterval: 3,
            shockwaveRadius: 120,
            shockwaveKnockback: 250,
            shockwaveDamage: 75,
        },
        {
            type: 'centripetal-pulse',
            shockwaveInterval: 2.5,
            shockwaveRadius: 150,
            shockwaveKnockback: 300,
            shockwaveDamage: 95,
        },
        {
            type: 'centripetal-pulse',
            shockwaveInterval: 2,
            shockwaveRadius: 200,
            shockwaveKnockback: 400,
            shockwaveDamage: 120, // Massive damage at max level
        },
    ]

    readonly definition: SkillDefinition<CentripetalPulseEffect> = {
        id: 'centripetal-pulse',
        name: { ko: '원심력 펄스', en: 'Centripetal Pulse' },
        nameShort: { ko: '펄스', en: 'Pulse' },
        description: {
            ko: '회전하는 힘이 적을 밀어냅니다',
            en: 'Rotating force pushes enemies away',
        },
        icon: '◯',
        color: 0x2ecc71,
        maxLevel: 5,
        category: 'projectile',
        activationType: 'active',
        baseCooldown: 5, // Base 5 second cooldown, reduced by level
        formulaId: 'centripetal',
        physicsVisualType: 'centripetal',
        tags: ['orbital'], // Base skill - provides orbital/pulse capability
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            shockwaveInterval: effect.shockwaveInterval,
            shockwaveRadius: effect.shockwaveRadius,
            shockwaveKnockback: effect.shockwaveKnockback,
            shockwaveDamage: effect.shockwaveDamage,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `데미지 ${effect.shockwaveDamage}, 주기 ${effect.shockwaveInterval}초, 범위 ${effect.shockwaveRadius}`
    }
}

// Create and register the singleton instance
export const centripetalPulseBehavior = new CentripetalPulseBehavior()
registerSkill(centripetalPulseBehavior)
