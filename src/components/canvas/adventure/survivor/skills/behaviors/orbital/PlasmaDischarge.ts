import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Plasma Discharge effect type
 */
export interface PlasmaDischargeEffect extends SkillEffect {
    readonly type: 'plasma-discharge'
    laserDamage: number
    laserChainCount: number
    laserRange: number
    laserChainRange: number
}

/**
 * Plasma Discharge skill behavior
 * Physics: Electric Discharge
 * Lightning laser chains between enemies (Raiden-style)
 */
export class PlasmaDischargeBehavior extends BaseSkillBehavior<PlasmaDischargeEffect> {
    readonly skillId = 'plasma-discharge'
    readonly category: SkillCategory = 'orbital'

    protected readonly levelEffects: PlasmaDischargeEffect[] = [
        {
            type: 'plasma-discharge',
            laserDamage: 15,
            laserChainCount: 2,
            laserRange: 200,
            laserChainRange: 100,
        },
        {
            type: 'plasma-discharge',
            laserDamage: 22,
            laserChainCount: 3,
            laserRange: 230,
            laserChainRange: 120,
        },
        {
            type: 'plasma-discharge',
            laserDamage: 30,
            laserChainCount: 4,
            laserRange: 260,
            laserChainRange: 140,
        },
        {
            type: 'plasma-discharge',
            laserDamage: 40,
            laserChainCount: 5,
            laserRange: 300,
            laserChainRange: 160,
        },
        {
            type: 'plasma-discharge',
            laserDamage: 55,
            laserChainCount: 7,
            laserRange: 350,
            laserChainRange: 180,
        },
    ]

    readonly definition: SkillDefinition<PlasmaDischargeEffect> = {
        id: 'plasma-discharge',
        name: { ko: '플라즈마 방전', en: 'Plasma Discharge' },
        nameShort: { ko: '방전', en: 'Plasma' },
        description: {
            ko: '번개처럼 적들을 연결하는 플라즈마 레이저',
            en: 'Lightning laser chains between enemies',
        },
        icon: '⚡',
        color: 0x00ffff,
        maxLevel: 5,
        category: 'orbital',
        activationType: 'active',
        baseCooldown: 3,
        formulaId: 'electric-discharge',
        physicsVisualType: 'plasma',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            laserDamage: effect.laserDamage,
            laserChainCount: effect.laserChainCount,
            laserRange: effect.laserRange,
            laserChainRange: effect.laserChainRange,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `데미지 ${effect.laserDamage}/초, 연쇄 ${effect.laserChainCount}명, 사거리 ${effect.laserRange}`
    }
}

// Create and register the singleton instance
export const plasmaDischargeBehavior = new PlasmaDischargeBehavior()
registerSkill(plasmaDischargeBehavior)
