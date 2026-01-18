import type {
    SkillDefinition,
    ISkillBehavior,
    SkillEffect,
    SkillCategory,
    SkillTag,
    PlayerSkill,
} from './types'

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

/**
 * Get all tags provided by the player's current skills
 */
export function getPlayerTags(skills: PlayerSkill[]): Set<SkillTag> {
    const tags = new Set<SkillTag>()
    for (const skill of skills) {
        const def = skillDefinitions.get(skill.skillId)
        if (def?.tags) {
            for (const tag of def.tags) {
                tags.add(tag)
            }
        }
    }
    return tags
}

/**
 * Check if a skill's prerequisites are met
 */
export function arePrerequisitesMet(skillId: string, playerTags: Set<SkillTag>): boolean {
    const def = skillDefinitions.get(skillId)
    if (!def) return false

    // If no requirements, always available
    if (!def.requires || def.requires.length === 0) return true

    // Check if player has all required tags
    return def.requires.every((tag) => playerTags.has(tag))
}

/**
 * Get skills that can be offered to the player (prerequisites met)
 */
export function getAvailableSkills(playerSkills: PlayerSkill[]): SkillDefinition[] {
    const playerTags = getPlayerTags(playerSkills)
    return Array.from(skillDefinitions.values()).filter((def) =>
        arePrerequisitesMet(def.id, playerTags)
    )
}
