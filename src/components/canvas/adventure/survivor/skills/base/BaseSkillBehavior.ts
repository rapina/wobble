import { Graphics } from 'pixi.js'
import type { Projectile } from '../../types'
import type {
    SkillEffect,
    SkillDefinition,
    SkillCategory,
    SkillContext,
    RuntimeSkillStats,
    ISkillBehavior,
} from '../types'

/**
 * Abstract base class for skill behaviors
 * Provides common functionality and enforces the ISkillBehavior interface
 */
export abstract class BaseSkillBehavior<T extends SkillEffect> implements ISkillBehavior<T> {
    abstract readonly skillId: string
    abstract readonly category: SkillCategory
    abstract readonly definition: SkillDefinition<T>

    /**
     * Level effects cache - subclasses define the actual effects
     */
    protected abstract readonly levelEffects: T[]

    /**
     * Get the effect for a specific level (1-indexed)
     */
    getEffect(level: number): T {
        const idx = Math.max(0, Math.min(level - 1, this.levelEffects.length - 1))
        return this.levelEffects[idx]
    }

    /**
     * Called when skill is added or upgraded
     * Override in subclasses if needed
     */
    onActivate?(level: number, context: SkillContext): void

    /**
     * Called when skill is removed
     * Override in subclasses if needed
     */
    onDeactivate?(context: SkillContext): void

    /**
     * Called each frame - for skills that need continuous updates
     * Override in subclasses if needed
     */
    update?(deltaTime: number, level: number, context: SkillContext): void

    /**
     * Called to apply effect to projectiles - for projectile-modifying skills
     * Override in subclasses if needed
     */
    modifyProjectile?(projectile: Projectile, level: number): void

    /**
     * Called to render visual effects
     * Override in subclasses if needed
     */
    render?(graphics: Graphics, level: number, context: SkillContext): void

    /**
     * Get aggregated stats contribution from this skill at given level
     * Must be implemented by subclasses
     */
    abstract getStats(level: number): Partial<RuntimeSkillStats>

    /**
     * Get description for UI at given level
     * Must be implemented by subclasses
     */
    abstract getLevelDescription(level: number): string

    /**
     * Get next level upgrade description
     */
    getNextLevelDescription(currentLevel: number): string {
        if (currentLevel >= this.definition.maxLevel) {
            return 'MAX'
        }
        return this.getLevelDescription(currentLevel + 1)
    }

    /**
     * Helper to format percentage values
     */
    protected formatPercent(value: number): string {
        return `${Math.round(value * 100)}%`
    }

    /**
     * Helper to format integer values with unit
     */
    protected formatValue(value: number, unit: string = ''): string {
        return `${Math.round(value)}${unit}`
    }
}
