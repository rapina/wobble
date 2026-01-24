/**
 * runStore.ts - Zustand store for Wobblediver roguelike run state
 *
 * Manages the state of roguelike "runs" including:
 * - Active run tracking (map, current node, HP, score)
 * - Run progression (unlocking longer runs)
 * - Node selection and completion
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    ActiveRun,
    MapNode,
    RunLength,
    RunRank,
    RunMap,
    DEFAULT_RUN_HP,
    REST_NODE_CONFIG,
    RestChoice,
    parseNodeId,
    PerkInstance,
} from '@/components/canvas/minigame/games/Wobblediver/run/RunMapTypes'
import {
    PerkDefinition,
    PerkEffect,
    getPerkById,
    getCombinedPerkEffects,
    selectRandomPerks,
} from '@/components/canvas/minigame/games/Wobblediver/run/PerkConfig'
import { RunMapGenerator } from '@/components/canvas/minigame/games/Wobblediver/run/RunMapGenerator'
import { SeededRandom } from '@/utils/SeededRandom'
import { useLabStore } from '@/stores/labStore'

interface RunState {
    /** Longest run length unlocked (starts at 10) */
    maxUnlockedRunLength: RunLength

    /** Total completed runs */
    completedRuns: number

    /** Current active run (null if no run in progress) */
    activeRun: ActiveRun | null

    // === Actions ===

    /** Start a new run with optional length (defaults to maxUnlockedRunLength) */
    startNewRun: (length?: RunLength) => void

    /** Select a node to move to (validates connectivity) */
    selectNode: (nodeId: string) => boolean

    /** Complete the current node with results */
    completeNode: (rank: RunRank, stageScore: number, hpLost: number) => void

    /** Apply rest node choice */
    applyRestChoice: (choice: RestChoice) => void

    /** Apply event effects (handled by event system) */
    applyEventEffects: (effects: {
        hpChangePercent?: number
        scoreChange?: number
        scoreMultiplier?: number
        scoreMultiplierDuration?: number
        revealMap?: boolean
        skipStage?: boolean
    }) => void

    /** Heal HP (used by events) */
    healHP: (amount: number) => void

    /** Damage HP (used by events) */
    damageHP: (amount: number) => void

    /** Abandon the current run */
    abandonRun: () => void

    /** Get nodes available for selection */
    getAvailableNodes: () => MapNode[]

    /** Check if run is complete (boss defeated or player dead) */
    isRunComplete: () => boolean

    /** Check if player is still alive */
    isPlayerAlive: () => boolean

    /** Get current node (if any) */
    getCurrentNode: () => MapNode | null

    /** Check if a specific run length is unlocked */
    isRunLengthUnlocked: (length: RunLength) => boolean

    /** Reset all run progress (for testing) */
    resetProgress: () => void

    // === Perk Actions ===

    /** Get random perk options for selection */
    getPerkOptions: () => PerkDefinition[]

    /** Select and apply a perk */
    selectPerk: (perkId: string) => boolean

    /** Get combined effects of all perks */
    getPerkEffects: () => PerkEffect

    /** Use a rewind (from Rewind perk) - returns true if successful */
    useRewind: () => boolean

    /** Get current perks */
    getPerks: () => PerkInstance[]
}

export const useRunStore = create<RunState>()(
    persist(
        (set, get) => ({
            maxUnlockedRunLength: 10,
            completedRuns: 0,
            activeRun: null,

            startNewRun: (length?: RunLength) => {
                const state = get()
                const runLength = length || state.maxUnlockedRunLength

                // Validate run length is unlocked
                if (!state.isRunLengthUnlocked(runLength)) {
                    console.warn(`Run length ${runLength} not unlocked yet`)
                    return
                }

                // Generate new seed
                const runSeed = SeededRandom.generateSeed()

                // Generate linear map using legacy format for compatibility
                const { nodes, startNodeIds } = RunMapGenerator.generateLegacy(runSeed, runLength)
                const map: RunMap = {
                    runSeed,
                    maxDepth: runLength,
                    nodes,
                    startNodeIds,
                }

                // Apply lab physics multiplier (gravity affects HP/mass)
                const labStats = useLabStore.getState().getAppliedStats()
                const startingHP = Math.round(
                    DEFAULT_RUN_HP.startingHP * labStats.gravityMultiplier
                )
                const maxHP = Math.round(DEFAULT_RUN_HP.maxHP * labStats.gravityMultiplier)

                // Create new active run (using legacy structure)
                const newRun: ActiveRun = {
                    runSeed,
                    map,
                    currentNodeId: null,
                    completedNodeIds: [],
                    currentHP: startingHP,
                    maxHP: maxHP,
                    score: 0,
                    startedAt: Date.now(),
                    scoreMultiplier: 1,
                    scoreMultiplierDuration: 0,
                    elitesDefeated: 0,
                    eventsTriggered: 0,
                    // Perk system
                    perks: [],
                    rewindUsesRemaining: 0,
                    extraLives: 0,
                }

                set({ activeRun: newRun })
            },

            selectNode: (nodeId: string) => {
                const state = get()
                if (!state.activeRun) return false

                const { map, currentNodeId, completedNodeIds } = state.activeRun
                const targetNode = map.nodes[nodeId]

                if (!targetNode) {
                    console.warn(`Node ${nodeId} not found`)
                    return false
                }

                // If no current node, must be a start node
                if (currentNodeId === null) {
                    if (!map.startNodeIds.includes(nodeId)) {
                        console.warn(`Node ${nodeId} is not a valid start node`)
                        return false
                    }
                } else {
                    // Must be connected from current node
                    const currentNode = map.nodes[currentNodeId]
                    if (!currentNode.connections.includes(nodeId)) {
                        console.warn(`Node ${nodeId} is not connected from ${currentNodeId}`)
                        return false
                    }
                }

                // Can't revisit completed nodes
                if (completedNodeIds.includes(nodeId)) {
                    console.warn(`Node ${nodeId} already completed`)
                    return false
                }

                // Valid selection - update state
                set((state) => ({
                    activeRun: state.activeRun
                        ? {
                              ...state.activeRun,
                              currentNodeId: nodeId,
                          }
                        : null,
                }))

                return true
            },

            completeNode: (rank: RunRank, stageScore: number, hpLost: number) => {
                const state = get()
                if (!state.activeRun || !state.activeRun.currentNodeId) return

                const { currentNodeId, scoreMultiplier, scoreMultiplierDuration } = state.activeRun

                // Apply score multiplier
                const multipliedScore = Math.floor(stageScore * scoreMultiplier)

                set((state) => {
                    if (!state.activeRun) return state

                    // Update node as visited with rank
                    const updatedNodes = { ...state.activeRun.map.nodes }
                    updatedNodes[currentNodeId] = {
                        ...updatedNodes[currentNodeId],
                        visited: true,
                        rank,
                    }

                    // Decrement multiplier duration if active
                    let newMultiplier = state.activeRun.scoreMultiplier
                    let newDuration = state.activeRun.scoreMultiplierDuration
                    if (newDuration > 0) {
                        newDuration--
                        if (newDuration === 0) {
                            newMultiplier = 1 // Reset to default
                        }
                    }

                    return {
                        activeRun: {
                            ...state.activeRun,
                            map: {
                                ...state.activeRun.map,
                                nodes: updatedNodes,
                            },
                            completedNodeIds: [...state.activeRun.completedNodeIds, currentNodeId],
                            currentHP: Math.max(0, state.activeRun.currentHP - hpLost),
                            score: state.activeRun.score + multipliedScore,
                            elitesDefeated: state.activeRun.elitesDefeated,
                            scoreMultiplier: newMultiplier,
                            scoreMultiplierDuration: newDuration,
                        },
                    }
                })

                // Check for run completion
                const updatedState = get()
                if (updatedState.isRunComplete()) {
                    // Check if we should unlock longer runs
                    if (updatedState.activeRun && updatedState.isPlayerAlive()) {
                        const currentLength = updatedState.activeRun.map.maxDepth
                        const nextLength = getNextRunLength(currentLength)

                        if (nextLength && nextLength > updatedState.maxUnlockedRunLength) {
                            set({ maxUnlockedRunLength: nextLength })
                        }

                        set((state) => ({
                            completedRuns: state.completedRuns + 1,
                        }))
                    }
                }
            },

            applyRestChoice: (choice: RestChoice) => {
                const state = get()
                if (!state.activeRun) return

                const config = REST_NODE_CONFIG

                switch (choice) {
                    case 'heal': {
                        const healAmount = Math.floor(state.activeRun.maxHP * config.healPercent)
                        set((state) => ({
                            activeRun: state.activeRun
                                ? {
                                      ...state.activeRun,
                                      currentHP: Math.min(
                                          state.activeRun.maxHP,
                                          state.activeRun.currentHP + healAmount
                                      ),
                                  }
                                : null,
                        }))
                        break
                    }
                    case 'strengthen': {
                        const hpIncrease = Math.floor(
                            state.activeRun.maxHP * config.strengthenPercent
                        )
                        set((state) => ({
                            activeRun: state.activeRun
                                ? {
                                      ...state.activeRun,
                                      maxHP: state.activeRun.maxHP + hpIncrease,
                                  }
                                : null,
                        }))
                        break
                    }
                    case 'focus': {
                        set((state) => ({
                            activeRun: state.activeRun
                                ? {
                                      ...state.activeRun,
                                      scoreMultiplier: config.focusMultiplier,
                                      scoreMultiplierDuration: config.focusDuration,
                                  }
                                : null,
                        }))
                        break
                    }
                }
            },

            applyEventEffects: (effects) => {
                const state = get()
                if (!state.activeRun) return

                set((state) => {
                    if (!state.activeRun) return state

                    let newHP = state.activeRun.currentHP
                    let newScore = state.activeRun.score
                    let newMultiplier = state.activeRun.scoreMultiplier
                    let newMultiplierDuration = state.activeRun.scoreMultiplierDuration
                    let newEventsTriggered = state.activeRun.eventsTriggered + 1
                    const updatedNodes = { ...state.activeRun.map.nodes }

                    // HP change
                    if (effects.hpChangePercent !== undefined) {
                        const change = Math.floor(state.activeRun.maxHP * effects.hpChangePercent)
                        newHP = Math.max(0, Math.min(state.activeRun.maxHP, newHP + change))
                    }

                    // Score change
                    if (effects.scoreChange !== undefined) {
                        newScore = Math.max(0, newScore + effects.scoreChange)
                    }

                    // Score multiplier
                    if (effects.scoreMultiplier !== undefined) {
                        newMultiplier = effects.scoreMultiplier
                        newMultiplierDuration = effects.scoreMultiplierDuration || 0
                    }

                    // Reveal map (mark all node types as known)
                    if (effects.revealMap) {
                        // Nodes already have their types - this could be used for UI display
                        // The actual reveal is handled by the map display component
                    }

                    return {
                        activeRun: {
                            ...state.activeRun,
                            currentHP: newHP,
                            score: newScore,
                            scoreMultiplier: newMultiplier,
                            scoreMultiplierDuration: newMultiplierDuration,
                            eventsTriggered: newEventsTriggered,
                            map: {
                                ...state.activeRun.map,
                                nodes: updatedNodes,
                            },
                        },
                    }
                })
            },

            healHP: (amount: number) => {
                set((state) => ({
                    activeRun: state.activeRun
                        ? {
                              ...state.activeRun,
                              currentHP: Math.min(
                                  state.activeRun.maxHP,
                                  state.activeRun.currentHP + amount
                              ),
                          }
                        : null,
                }))
            },

            damageHP: (amount: number) => {
                set((state) => ({
                    activeRun: state.activeRun
                        ? {
                              ...state.activeRun,
                              currentHP: Math.max(0, state.activeRun.currentHP - amount),
                          }
                        : null,
                }))
            },

            abandonRun: () => {
                set({ activeRun: null })
            },

            getAvailableNodes: () => {
                const state = get()
                if (!state.activeRun) return []

                const { map, currentNodeId, completedNodeIds } = state.activeRun

                // If no current node, return start nodes
                if (currentNodeId === null) {
                    return map.startNodeIds
                        .map((id) => map.nodes[id])
                        .filter((node) => !completedNodeIds.includes(node.id))
                }

                // Return connected nodes that haven't been completed
                const currentNode = map.nodes[currentNodeId]
                return currentNode.connections
                    .map((id) => map.nodes[id])
                    .filter((node) => !completedNodeIds.includes(node.id))
            },

            isRunComplete: () => {
                const state = get()
                if (!state.activeRun) return false

                // Run complete if player is dead
                if (state.activeRun.currentHP <= 0) return true

                // Run complete if boss (final node) is defeated
                const { map, completedNodeIds } = state.activeRun
                const maxDepth = map.maxDepth

                // Check if any completed node is at max depth (boss)
                for (const nodeId of completedNodeIds) {
                    const { depth } = parseNodeId(nodeId)
                    if (depth === maxDepth) return true
                }

                return false
            },

            isPlayerAlive: () => {
                const state = get()
                return state.activeRun ? state.activeRun.currentHP > 0 : false
            },

            getCurrentNode: () => {
                const state = get()
                if (!state.activeRun || !state.activeRun.currentNodeId) return null
                return state.activeRun.map.nodes[state.activeRun.currentNodeId]
            },

            isRunLengthUnlocked: (length: RunLength) => {
                const state = get()
                return length <= state.maxUnlockedRunLength
            },

            resetProgress: () => {
                set({
                    maxUnlockedRunLength: 10,
                    completedRuns: 0,
                    activeRun: null,
                })
            },

            // === Perk Actions ===

            getPerkOptions: () => {
                const state = get()
                if (!state.activeRun) return []

                // Use a seed based on run seed + completed nodes for deterministic options
                const perkSeed =
                    state.activeRun.runSeed + state.activeRun.completedNodeIds.length * 1000

                return selectRandomPerks(state.activeRun.perks, perkSeed, 3)
            },

            selectPerk: (perkId: string) => {
                const state = get()
                if (!state.activeRun) return false

                const perkDef = getPerkById(perkId)
                if (!perkDef) {
                    console.warn(`Perk ${perkId} not found`)
                    return false
                }

                // Check if already at max stacks
                const existing = state.activeRun.perks.find((p) => p.perkId === perkId)
                if (existing && existing.stacks >= perkDef.maxStacks) {
                    console.warn(`Perk ${perkId} already at max stacks`)
                    return false
                }

                // Get current depth for tracking
                const currentDepth = state.activeRun.completedNodeIds.length

                set((state) => {
                    if (!state.activeRun) return state

                    let updatedPerks: PerkInstance[]
                    const existingIndex = state.activeRun.perks.findIndex(
                        (p) => p.perkId === perkId
                    )

                    if (existingIndex >= 0) {
                        // Increment stacks
                        updatedPerks = [...state.activeRun.perks]
                        updatedPerks[existingIndex] = {
                            ...updatedPerks[existingIndex],
                            stacks: updatedPerks[existingIndex].stacks + 1,
                        }
                    } else {
                        // Add new perk
                        updatedPerks = [
                            ...state.activeRun.perks,
                            {
                                perkId,
                                stacks: 1,
                                acquiredAtDepth: currentDepth,
                            },
                        ]
                    }

                    // Calculate updated perk effects
                    const effects = getCombinedPerkEffects(updatedPerks)

                    // Apply immediate effects
                    let newMaxHP = state.activeRun.maxHP
                    let newCurrentHP = state.activeRun.currentHP
                    let newExtraLives = state.activeRun.extraLives
                    let newRewindUses = state.activeRun.rewindUsesRemaining

                    // Extra lives from this perk
                    if (perkDef.effect.extraLives) {
                        newExtraLives += perkDef.effect.extraLives
                    }

                    // Max HP bonus from this perk
                    if (perkDef.effect.maxHPBonus) {
                        newMaxHP += perkDef.effect.maxHPBonus
                        // Also heal by the bonus amount
                        newCurrentHP = Math.min(newMaxHP, newCurrentHP + perkDef.effect.maxHPBonus)
                    }

                    // Rewind uses from this perk
                    if (perkDef.effect.rewindUses) {
                        newRewindUses += perkDef.effect.rewindUses
                    }

                    return {
                        activeRun: {
                            ...state.activeRun,
                            perks: updatedPerks,
                            maxHP: newMaxHP,
                            currentHP: newCurrentHP,
                            extraLives: newExtraLives,
                            rewindUsesRemaining: newRewindUses,
                        },
                    }
                })

                return true
            },

            getPerkEffects: () => {
                const state = get()
                if (!state.activeRun) return {}
                return getCombinedPerkEffects(state.activeRun.perks)
            },

            useRewind: () => {
                const state = get()
                if (!state.activeRun || state.activeRun.rewindUsesRemaining <= 0) {
                    return false
                }

                set((state) => {
                    if (!state.activeRun) return state

                    return {
                        activeRun: {
                            ...state.activeRun,
                            rewindUsesRemaining: state.activeRun.rewindUsesRemaining - 1,
                        },
                    }
                })

                return true
            },

            getPerks: () => {
                const state = get()
                return state.activeRun?.perks || []
            },
        }),
        {
            name: 'wobble-run-state',
            // Custom serialization to handle the state properly
            partialize: (state) => ({
                maxUnlockedRunLength: state.maxUnlockedRunLength,
                completedRuns: state.completedRuns,
                activeRun: state.activeRun,
            }),
        }
    )
)

/**
 * Get the next run length after the current one
 */
function getNextRunLength(current: RunLength): RunLength | null {
    const lengths: RunLength[] = [10, 20, 30, 40, 50]
    const currentIndex = lengths.indexOf(current)
    if (currentIndex === -1 || currentIndex === lengths.length - 1) return null
    return lengths[currentIndex + 1]
}
