import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Minigame Record Store
 *
 * A flexible system for tracking game records across different minigames.
 * Each minigame can have its own set of tracked metrics.
 */

// Base record interface for all games
interface BaseGameRecord {
    totalGames: number
    lastPlayedAt: number | null
}

// Wobblediver-specific records
export interface WobblediverRecord extends BaseGameRecord {
    bestDepth: number // Highest depth (round) reached
    highScore: number // Best total score
    totalDepth: number // Sum of all depths reached (for stats)
    totalScore: number // Sum of all scores (for stats)
    perfectEscapes: number // Number of perfect (S-rank) escapes
    bestRank: string // Best rank achieved ('S' | 'A' | 'B' | 'C' | 'D')
}

// Collision scene records (physics simulation)
export interface CollisionRecord extends BaseGameRecord {
    totalSimulations: number // How many times the simulation was run
}

// Generic record type for future games
export interface GenericGameRecord extends BaseGameRecord {
    highScore: number
    bestLevel: number
    [key: string]: number | string | null // Allow additional custom fields
}

// Union type for all game records
export type MinigameRecord = WobblediverRecord | CollisionRecord | GenericGameRecord

// Game IDs enum for type safety
export type MinigameId = 'wobblediver' | 'collision' | string

// Default records
const DEFAULT_WOBBLEDIVER_RECORD: WobblediverRecord = {
    totalGames: 0,
    lastPlayedAt: null,
    bestDepth: 0,
    highScore: 0,
    totalDepth: 0,
    totalScore: 0,
    perfectEscapes: 0,
    bestRank: 'D',
}

const DEFAULT_COLLISION_RECORD: CollisionRecord = {
    totalGames: 0,
    lastPlayedAt: null,
    totalSimulations: 0,
}

// Rank priority for comparison
const RANK_PRIORITY: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 }

// Store state interface
interface MinigameRecordState {
    records: Record<MinigameId, MinigameRecord>

    // Record a Wobblediver game result
    recordWobblediverGame: (result: {
        depth: number
        score: number
        rank: string
        isPerfect?: boolean
    }) => void

    // Record a Collision simulation
    recordCollisionSimulation: () => void

    // Generic game record function (for future games)
    recordGenericGame: (
        gameId: MinigameId,
        result: {
            score?: number
            level?: number
            customFields?: Record<string, number | string>
        }
    ) => void

    // Get records for a specific game
    getRecord: <T extends MinigameRecord>(gameId: MinigameId) => T | null

    // Get Wobblediver records (type-safe helper)
    getWobblediverRecord: () => WobblediverRecord

    // Get Collision records (type-safe helper)
    getCollisionRecord: () => CollisionRecord

    // Check if this is a new high score / best record
    isNewBest: (gameId: MinigameId, field: string, value: number) => boolean

    // Reset records for a specific game
    resetGameRecord: (gameId: MinigameId) => void

    // Reset all records
    resetAllRecords: () => void
}

export const useMinigameRecordStore = create<MinigameRecordState>()(
    persist(
        (set, get) => ({
            records: {
                wobblediver: { ...DEFAULT_WOBBLEDIVER_RECORD },
                collision: { ...DEFAULT_COLLISION_RECORD },
            },

            recordWobblediverGame: (result) => {
                set((state) => {
                    const current = (state.records.wobblediver as WobblediverRecord) || {
                        ...DEFAULT_WOBBLEDIVER_RECORD,
                    }

                    // Determine best rank
                    const newBestRank =
                        RANK_PRIORITY[result.rank] > RANK_PRIORITY[current.bestRank]
                            ? result.rank
                            : current.bestRank

                    const newRecord: WobblediverRecord = {
                        totalGames: current.totalGames + 1,
                        lastPlayedAt: Date.now(),
                        bestDepth: Math.max(current.bestDepth, result.depth),
                        highScore: Math.max(current.highScore, result.score),
                        totalDepth: current.totalDepth + result.depth,
                        totalScore: current.totalScore + result.score,
                        perfectEscapes: current.perfectEscapes + (result.isPerfect ? 1 : 0),
                        bestRank: newBestRank,
                    }

                    return {
                        records: {
                            ...state.records,
                            wobblediver: newRecord,
                        },
                    }
                })
            },

            recordCollisionSimulation: () => {
                set((state) => {
                    const current = (state.records.collision as CollisionRecord) || {
                        ...DEFAULT_COLLISION_RECORD,
                    }

                    return {
                        records: {
                            ...state.records,
                            collision: {
                                ...current,
                                totalGames: current.totalGames + 1,
                                totalSimulations: current.totalSimulations + 1,
                                lastPlayedAt: Date.now(),
                            },
                        },
                    }
                })
            },

            recordGenericGame: (gameId, result) => {
                set((state) => {
                    const current = (state.records[gameId] as GenericGameRecord) || {
                        totalGames: 0,
                        lastPlayedAt: null,
                        highScore: 0,
                        bestLevel: 0,
                    }

                    const newRecord: GenericGameRecord = {
                        ...current,
                        totalGames: current.totalGames + 1,
                        lastPlayedAt: Date.now(),
                        highScore:
                            result.score !== undefined
                                ? Math.max(current.highScore || 0, result.score)
                                : current.highScore || 0,
                        bestLevel:
                            result.level !== undefined
                                ? Math.max(current.bestLevel || 0, result.level)
                                : current.bestLevel || 0,
                        ...result.customFields,
                    }

                    return {
                        records: {
                            ...state.records,
                            [gameId]: newRecord,
                        },
                    }
                })
            },

            getRecord: <T extends MinigameRecord>(gameId: MinigameId): T | null => {
                return (get().records[gameId] as T) || null
            },

            getWobblediverRecord: () => {
                return (
                    (get().records.wobblediver as WobblediverRecord) || {
                        ...DEFAULT_WOBBLEDIVER_RECORD,
                    }
                )
            },

            getCollisionRecord: () => {
                return (
                    (get().records.collision as CollisionRecord) || { ...DEFAULT_COLLISION_RECORD }
                )
            },

            isNewBest: (gameId, field, value) => {
                const record = get().records[gameId]
                if (!record) return true

                const currentValue = (record as Record<string, unknown>)[field]
                if (typeof currentValue !== 'number') return true

                return value > currentValue
            },

            resetGameRecord: (gameId) => {
                set((state) => {
                    const defaultRecord =
                        gameId === 'wobblediver'
                            ? { ...DEFAULT_WOBBLEDIVER_RECORD }
                            : gameId === 'collision'
                              ? { ...DEFAULT_COLLISION_RECORD }
                              : { totalGames: 0, lastPlayedAt: null, highScore: 0, bestLevel: 0 }

                    return {
                        records: {
                            ...state.records,
                            [gameId]: defaultRecord,
                        },
                    }
                })
            },

            resetAllRecords: () => {
                set({
                    records: {
                        wobblediver: { ...DEFAULT_WOBBLEDIVER_RECORD },
                        collision: { ...DEFAULT_COLLISION_RECORD },
                    },
                })
            },
        }),
        {
            name: 'wobble-minigame-records',
            // Storage handles serialization automatically for simple objects
        }
    )
)

// Helper function to format play time
export function formatPlayTime(lastPlayedAt: number | null): string {
    if (!lastPlayedAt) return 'Never'

    const now = Date.now()
    const diff = now - lastPlayedAt

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
}

// Helper function to get average score
export function getAverageScore(record: WobblediverRecord): number {
    if (record.totalGames === 0) return 0
    return Math.round(record.totalScore / record.totalGames)
}

// Helper function to get average depth
export function getAverageDepth(record: WobblediverRecord): number {
    if (record.totalGames === 0) return 0
    return Math.round((record.totalDepth / record.totalGames) * 10) / 10
}
