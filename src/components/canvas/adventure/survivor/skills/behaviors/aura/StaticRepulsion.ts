import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Static Repulsion effect type
 */
export interface StaticRepulsionEffect extends SkillEffect {
    readonly type: 'static-repulsion'
    repulsionRadius: number
    repulsionForce: number
}

/**
 * Static Repulsion skill behavior
 * Physics: Coulomb's Law - F = kq₁q₂/r²
 * Electric charge pushes enemies away
 */
export class StaticRepulsionBehavior extends BaseSkillBehavior<StaticRepulsionEffect> {
    readonly skillId = 'static-repulsion'
    readonly category: SkillCategory = 'aura'

    protected readonly levelEffects: StaticRepulsionEffect[] = [
        { type: 'static-repulsion', repulsionRadius: 80, repulsionForce: 50 },
        { type: 'static-repulsion', repulsionRadius: 100, repulsionForce: 80 },
        { type: 'static-repulsion', repulsionRadius: 120, repulsionForce: 120 },
        { type: 'static-repulsion', repulsionRadius: 150, repulsionForce: 160 },
        { type: 'static-repulsion', repulsionRadius: 180, repulsionForce: 200 },
    ]

    readonly definition: SkillDefinition<StaticRepulsionEffect> = {
        id: 'static-repulsion',
        name: { ko: '정전기 반발', en: 'Static Repulsion' },
        description: {
            ko: '전하가 적을 지속적으로 밀어냅니다',
            en: 'Electric charge pushes enemies away',
        },
        icon: '⊕',
        color: 0xf1c40f,
        maxLevel: 5,
        category: 'aura',
        formulaId: 'coulomb',
        physicsVisualType: 'electric',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            repulsionRadius: effect.repulsionRadius,
            repulsionForce: effect.repulsionForce,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `반경 ${effect.repulsionRadius}, 밀어냄 ${effect.repulsionForce}`
    }
}

// Create and register the singleton instance
export const staticRepulsionBehavior = new StaticRepulsionBehavior()
registerSkill(staticRepulsionBehavior)
