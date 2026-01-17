import type { SkillDefinition, ISkillBehavior, SkillEffect, SkillCategory } from './types'

/**
 * Skill Registry - Central storage for all skill behaviors and definitions
 * Follows the same pattern as formulas/registry.ts
 */

// Storage maps
const skillBehaviors: Map<string, ISkillBehavior> = new Map()
const skillDefinitions: Map<string, SkillDefinition> = new Map()

/**
 * Register a skill behavior and its definition
 */
export function registerSkill<T extends SkillEffect>(behavior: ISkillBehavior<T>): void {
    skillBehaviors.set(behavior.skillId, behavior)
    skillDefinitions.set(behavior.definition.id, behavior.definition)
}

/**
 * Get a skill behavior by ID
 */
export function getSkillBehavior(skillId: string): ISkillBehavior | undefined {
    return skillBehaviors.get(skillId)
}

/**
 * Get a skill definition by ID
 */
export function getSkillDefinition(skillId: string): SkillDefinition | undefined {
    return skillDefinitions.get(skillId)
}

/**
 * Get all registered skill definitions
 */
export function getAllSkillDefinitions(): SkillDefinition[] {
    return Array.from(skillDefinitions.values())
}

/**
 * Get all registered skill behaviors
 */
export function getAllSkillBehaviors(): ISkillBehavior[] {
    return Array.from(skillBehaviors.values())
}

/**
 * Get skills by category
 */
export function getSkillsByCategory(category: SkillCategory): SkillDefinition[] {
    return Array.from(skillDefinitions.values()).filter((def) => def.category === category)
}

/**
 * Check if a skill is registered
 */
export function isSkillRegistered(skillId: string): boolean {
    return skillBehaviors.has(skillId)
}

/**
 * Get skill count
 */
export function getSkillCount(): number {
    return skillBehaviors.size
}

/**
 * Clear all registered skills (for testing)
 */
export function clearRegistry(): void {
    skillBehaviors.clear()
    skillDefinitions.clear()
}
