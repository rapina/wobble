import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Orbital Strike effect type
 */
export interface OrbitalStrikeEffect extends SkillEffect {
    readonly type: 'orbital-strike'
    orbitCount: number
    orbitRadius: number
    orbitDamage: number
}

/**
 * Orbital Strike skill behavior
 * Physics: Kepler's Third Law - T² ∝ a³
 * Orbiting projectiles damage nearby enemies
 */
export class OrbitalStrikeBehavior extends BaseSkillBehavior<OrbitalStrikeEffect> {
    readonly skillId = 'orbital-strike'
    readonly category: SkillCategory = 'orbital'

    protected readonly levelEffects: OrbitalStrikeEffect[] = [
        { type: 'orbital-strike', orbitCount: 1, orbitRadius: 60, orbitDamage: 10 },
        { type: 'orbital-strike', orbitCount: 2, orbitRadius: 70, orbitDamage: 12 },
        { type: 'orbital-strike', orbitCount: 3, orbitRadius: 80, orbitDamage: 15 },
        { type: 'orbital-strike', orbitCount: 4, orbitRadius: 90, orbitDamage: 18 },
        { type: 'orbital-strike', orbitCount: 5, orbitRadius: 100, orbitDamage: 22 },
    ]

    readonly definition: SkillDefinition<OrbitalStrikeEffect> = {
        id: 'orbital-strike',
        name: { ko: '궤도 폭격', en: 'Orbital Strike' },
        description: {
            ko: '플레이어 주변을 도는 위성 공격체',
            en: 'Orbiting projectiles damage nearby enemies',
        },
        icon: '◉',
        color: 0x8e44ad,
        maxLevel: 5,
        category: 'orbital',
        formulaId: 'kepler-third',
        physicsVisualType: 'orbital',
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            orbitCount: effect.orbitCount,
            orbitRadius: effect.orbitRadius,
            orbitDamage: effect.orbitDamage,
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `위성 ${effect.orbitCount}개, 반경 ${effect.orbitRadius}, 데미지 ${effect.orbitDamage}`
    }
}

// Create and register the singleton instance
export const orbitalStrikeBehavior = new OrbitalStrikeBehavior()
registerSkill(orbitalStrikeBehavior)
