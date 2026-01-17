/**
 * Skills Module - Backward Compatibility Layer
 *
 * This file provides backward compatibility with the old skills API.
 * New code should import from './skills/index.ts' directly.
 *
 * Migration guide:
 * - Use `import { getSkillBehavior, getAllSkillDefinitions } from './skills'`
 *   instead of the old flat SKILL_DEFINITIONS object
 * - Use `SkillCombiner.combine()` instead of `calculateCombinedSkillStats()`
 * - Use typed skill effects (e.g., ElasticBounceEffect) instead of SkillLevelEffect
 */

// Re-export new types and utilities
export {
    // New types
    type SkillCategory,
    type SkillEffect,
    type SkillDefinition,
    type SkillContext,
    type SkillState,
    type RuntimeSkillStats,
    DEFAULT_RUNTIME_STATS,
    type ISkillBehavior,

    // Registry functions
    registerSkill,
    getSkillBehavior,
    getSkillDefinition as getNewSkillDefinition,
    getAllSkillDefinitions as getNewSkillDefinitions,
    getAllSkillBehaviors,
    getSkillsByCategory,
    isSkillRegistered,
    getSkillCount,

    // Base class
    BaseSkillBehavior,

    // Skill combiner
    SkillCombiner,
    calculateCombinedSkillStats as calculateNewCombinedSkillStats,
} from './skills/index'

// Re-export legacy adapter for backward compatibility
export {
    // Legacy types
    type SkillLevelEffect,
    type LegacySkillDefinition,
    type PassiveDefinition,
    type CharacterSkillConfig,
    type PlayerSkill,
    type CombinedSkillStats,

    // Legacy data
    SKILL_DEFINITIONS,
    PASSIVE_DEFINITIONS,
    CHARACTER_SKILLS,

    // Legacy functions
    getSkillEffectAtLevel,
    getNextLevelDescription,
    getCurrentLevelDescription,
    calculateCombinedSkillStats,
    getAllSkillDefinitions,
    getSkillDefinition,
    getPassiveDefinition,
    getCharacterSkillConfig,
} from './skills/adapter'
