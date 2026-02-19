import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Buoyant Bomb effect type
 */
export interface BuoyantBombEffect extends SkillEffect {
    readonly type: 'buoyant-bomb'
    floatDuration: number
    dropRadius: number
    dropDamage: number
}

/**
 * Buoyant Bomb skill behavior
 * Physics: Buoyancy - F = ρVg
 * Projectiles float up then drop explosively
 */
export class BuoyantBombBehavior extends BaseSkillBehavior<BuoyantBombEffect> {
    readonly skillId = 'buoyant-bomb'
    readonly category: SkillCategory = 'player'

    protected readonly levelEffects: BuoyantBombEffect[] = [
        { type: 'buoyant-bomb', floatDuration: 1.5, dropRadius: 60, dropDamage: 20 },
        { type: 'buoyant-bomb', floatDuration: 1.3, dropRadius: 80, dropDamage: 35 },
        { type: 'buoyant-bomb', floatDuration: 1.1, dropRadius: 100, dropDamage: 50 },
        { type: 'buoyant-bomb', floatDuration: 0.9, dropRadius: 130, dropDamage: 70 },
        { type: 'buoyant-bomb', floatDuration: 0.7, dropRadius: 160, dropDamage: 100 },
    ]

    readonly definition: SkillDefinition<BuoyantBombEffect> = {
        id: 'buoyant-bomb',
        name: { ko: '부력 폭탄', en: 'Buoyant Bomb' },
        nameShort: { ko: '부력', en: 'Float' },
        description: {
            ko: '발사체가 떠올랐다 떨어지며 폭발합니다',
            en: 'Projectiles float up then drop explosively',
        },
        icon: '◠',
        color: 0x1abc9c,
        maxLevel: 5,
        category: 'player',
        activationType: 'passive',
        formulaId: 'buoyancy',
        physicsVisualType: 'buoyancy',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            floatDuration: effect.floatDuration,
            dropRadius: effect.dropRadius,
            dropDamage: effect.dropDamage,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `체공 ${effect.floatDuration}초, 범위 ${effect.dropRadius}, 데미지 ${effect.dropDamage}`
    }
}

// Create and register the singleton instance
export const buoyantBombBehavior = new BuoyantBombBehavior()
registerSkill(buoyantBombBehavior)
