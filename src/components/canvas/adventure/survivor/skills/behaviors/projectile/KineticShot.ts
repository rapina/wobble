import type { RuntimeSkillStats, SkillEffect, SkillDefinition, SkillCategory } from '../../types'
import { BaseSkillBehavior } from '../../base/BaseSkillBehavior'
import { registerSkill } from '../../registry'

/**
 * Kinetic Shot effect type
 */
export interface KineticShotEffect extends SkillEffect {
    readonly type: 'kinetic-shot'
    damage: number
    fireRate: number // shots per second
    projectileSpeed: number
}

/**
 * Kinetic Shot skill behavior
 * Physics: Kinetic Energy - KE = ½mv²
 * Base projectile skill that fires energy projectiles
 */
export class KineticShotBehavior extends BaseSkillBehavior<KineticShotEffect> {
    readonly skillId = 'kinetic-shot'
    readonly category: SkillCategory = 'projectile'

    protected readonly levelEffects: KineticShotEffect[] = [
        { type: 'kinetic-shot', damage: 10, fireRate: 2, projectileSpeed: 300 },
        { type: 'kinetic-shot', damage: 12, fireRate: 2.5, projectileSpeed: 320 },
        { type: 'kinetic-shot', damage: 15, fireRate: 3, projectileSpeed: 350 },
        { type: 'kinetic-shot', damage: 18, fireRate: 3.5, projectileSpeed: 380 },
        { type: 'kinetic-shot', damage: 22, fireRate: 4, projectileSpeed: 420 },
    ]

    readonly definition: SkillDefinition<KineticShotEffect> = {
        id: 'kinetic-shot',
        name: { ko: '운동 탄환', en: 'Kinetic Shot' },
        nameShort: { ko: '탄환', en: 'Shot' },
        description: {
            ko: '운동에너지를 담은 탄환을 발사합니다',
            en: 'Fires projectiles with kinetic energy',
        },
        icon: '●',
        color: 0x3498db,
        maxLevel: 5,
        category: 'projectile',
        activationType: 'active',
        baseCooldown: 0.5, // Base cooldown, modified by fireRate
        formulaId: 'kinetic-energy',
        physicsVisualType: 'kinetic',
        tags: ['projectile'], // This skill provides projectile capability
        getLevelEffect: (level: number) => this.getEffect(level),
    }

    getStats(level: number): Partial<RuntimeSkillStats> {
        const effect = this.getEffect(level)
        return {
            // Fire rate multiplier: higher fireRate = lower cooldown
            fireRateMultiplier: 1 / effect.fireRate,
            damageMultiplier: effect.damage / 10, // Normalize to base damage
        }
    }

    getLevelDescription(level: number): string {
        const effect = this.getEffect(level)
        return `데미지 ${effect.damage}, 발사 ${effect.fireRate}회/초`
    }
}

// Create and register the singleton instance
export const kineticShotBehavior = new KineticShotBehavior()
registerSkill(kineticShotBehavior)
