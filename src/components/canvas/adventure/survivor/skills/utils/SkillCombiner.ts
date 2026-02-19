import type { PlayerSkill, RuntimeSkillStats } from '../types'
import { DEFAULT_RUNTIME_STATS } from '../types'
import { getSkillBehavior } from '../registry'

/**
 * SkillCombiner - Combines active skills into runtime stats
 * Replaces the old calculateCombinedSkillStats function
 */
export class SkillCombiner {
    /**
     * Calculate combined stats from all active skills
     */
    static combine(skills: PlayerSkill[]): RuntimeSkillStats {
        // Start with defaults
        const result: RuntimeSkillStats = {
            ...DEFAULT_RUNTIME_STATS,
            activeSkillStates: new Map(),
        }

        for (const skill of skills) {
            const behavior = getSkillBehavior(skill.skillId)
            if (!behavior) {
                console.warn(`SkillCombiner: Unknown skill ${skill.skillId}`)
                continue
            }

            const stats = behavior.getStats(skill.level)
            this.mergeStats(result, stats)
        }

        return result
    }

    /**
     * Merge partial stats into the result
     * Uses appropriate combination strategy per stat type
     */
    private static mergeStats(
        result: RuntimeSkillStats,
        partial: Partial<RuntimeSkillStats>
    ): void {
        for (const [key, value] of Object.entries(partial)) {
            if (value === undefined) continue

            const statKey = key as keyof RuntimeSkillStats
            const currentValue = result[statKey]

            // Skip Map type
            if (statKey === 'activeSkillStates') continue

            // Multiplicative stats (combine by multiplication)
            if (this.isMultiplicativeStat(statKey)) {
                ;(result[statKey] as number) = (currentValue as number) * (value as number)
            }
            // Max-based stats (take highest value)
            else if (this.isMaxBasedStat(statKey)) {
                ;(result[statKey] as number) = Math.max(currentValue as number, value as number)
            }
            // Min-based stats (take lowest non-zero value)
            else if (this.isMinBasedStat(statKey)) {
                const current = currentValue as number
                const incoming = value as number
                if (current === 0) {
                    ;(result[statKey] as number) = incoming
                } else if (incoming > 0) {
                    ;(result[statKey] as number) = Math.min(current, incoming)
                }
            }
            // Additive stats (sum values)
            else {
                ;(result[statKey] as number) = (currentValue as number) + (value as number)
            }
        }
    }

    /**
     * Check if a stat should be combined multiplicatively
     */
    private static isMultiplicativeStat(key: keyof RuntimeSkillStats): boolean {
        return [
            'fireRateMultiplier',
            'damageMultiplier',
            'knockbackMultiplier',
            'moveSpeedMultiplier',
        ].includes(key)
    }

    /**
     * Check if a stat should take the maximum value
     */
    private static isMaxBasedStat(key: keyof RuntimeSkillStats): boolean {
        return [
            'homingTurnRate',
            'explosionRadius',
            'returnDistance',
            'returnDamageMultiplier',
            'shieldRadius',
            'deflectionStrength',
            'repulsionRadius',
            'repulsionForce',
            'warpRadius',
            'slowFactor',
            'auraRadius',
            'radiationDamage',
            'chaosFieldRadius',
            'chaosStrength',
            'orbitCount',
            'orbitRadius',
            'orbitDamage',
            'slashRadius',
            'slashDamage',
            'slashSpeed',
            'ghostDuration',
            'ghostDamage',
            'ghostTrailCount',
            'peakDamageBonus',
            'dropRadius',
            'dropDamage',
            'waveAmplitude',
            'waveSpeed',
            'beatAmplitude',
            'chainRadius',
            'conductRatio',
            'escapeBonus',
            'escapeBurstRadius',
            'approachBonus',
            'flowSpeed',
            'suctionForce',
            'streamWidth',
            'magneticPullRadius',
            'magneticPullStrength',
            'laserDamage',
            'laserChainCount',
            'laserRange',
            'laserChainRange',
            'maxCharge',
            'damagePerCharge',
            'shockwaveRadius',
            'shockwaveKnockback',
        ].includes(key)
    }

    /**
     * Check if a stat should take the minimum non-zero value
     */
    private static isMinBasedStat(key: keyof RuntimeSkillStats): boolean {
        return [
            'ghostCooldown',
            'rhythmPeriod',
            'floatDuration',
            'wavePulseInterval',
            'shockwaveInterval',
        ].includes(key)
    }

    /**
     * Get the description for a specific skill at a level
     */
    static getSkillDescription(skillId: string, level: number): string {
        const behavior = getSkillBehavior(skillId)
        if (!behavior) return ''
        return behavior.getLevelDescription(level)
    }

    /**
     * Get the next level description for a specific skill
     */
    static getNextLevelDescription(skillId: string, currentLevel: number): string {
        const behavior = getSkillBehavior(skillId)
        if (!behavior) return ''
        return behavior.getNextLevelDescription(currentLevel)
    }
}

/**
 * Convenience function for combining skills
 * Maintains backward compatibility with the old API
 */
export function calculateCombinedSkillStats(skills: PlayerSkill[]): RuntimeSkillStats {
    return SkillCombiner.combine(skills)
}
