/**
 * RunMapTypes.ts - Type definitions for Wobblediver linear run system
 *
 * Simple linear progression where each stage has pre-generated gimmicks.
 * Visual representation shows descent into the abyss.
 */

/**
 * Rank grades for stage completion
 */
export type RunRank = 'S' | 'A' | 'B' | 'C' | 'D'

/**
 * Valid run lengths (unlockable progressively)
 */
export type RunLength = 10 | 20 | 30 | 40 | 50

/**
 * A single stage in the linear run
 */
export interface RunStage {
    /** Stage number (1-based, 1 = surface, higher = deeper) */
    depth: number

    /** Whether player has completed this stage */
    completed: boolean

    /** Grade received if completed */
    rank?: RunRank

    /** Deterministic seed for this stage's generation */
    stageSeed: number
}

/**
 * Complete map for a single run (linear progression)
 */
export interface RunMap {
    /** Seed used to generate this run */
    runSeed: number

    /** Total number of stages */
    maxDepth: RunLength

    /** All stages in order (new format) */
    stages?: RunStage[]

    /** Legacy: All nodes indexed by ID */
    nodes: Record<string, MapNode>

    /** Legacy: Entry point node IDs */
    startNodeIds: string[]
}

/**
 * State of an active (in-progress) run
 */
export interface ActiveRun {
    /** Seed for this run (determines all stage gimmicks) */
    runSeed: number

    /** The generated map */
    map: RunMap

    /** Legacy: Currently selected node ID */
    currentNodeId: string | null

    /** Legacy: Completed node IDs */
    completedNodeIds: string[]

    /** Current HP remaining */
    currentHP: number

    /** Maximum HP */
    maxHP: number

    /** Total score accumulated this run */
    score: number

    /** Timestamp when run started */
    startedAt: number

    /** Score multiplier */
    scoreMultiplier: number

    /** Multiplier duration */
    scoreMultiplierDuration: number

    /** Legacy tracking */
    elitesDefeated: number
    eventsTriggered: number
}

/**
 * Default starting HP values
 */
export const DEFAULT_RUN_HP = {
    startingHP: 100,
    maxHP: 100,
}

// Legacy exports for compatibility during migration
export type RunNodeType = 'normal'
export interface MapNode {
    id: string
    depth: number
    column: number
    type: RunNodeType
    connections: string[]
    visited: boolean
    rank?: RunRank
    stageSeed: number
}

export function createNodeId(depth: number, _column: number = 0): string {
    return `${depth}-0`
}

export function parseNodeId(id: string): { depth: number; column: number } {
    const [depth] = id.split('-').map(Number)
    return { depth, column: 0 }
}

// Legacy - kept for compatibility
export type RestChoice = 'heal' | 'strengthen' | 'focus'
export const REST_NODE_CONFIG = {
    healPercent: 0.3,
    strengthenPercent: 0.1,
    focusMultiplier: 1.5,
    focusDuration: 1,
}
