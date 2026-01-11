import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useAchievementStore } from './achievementStore'

// Game statistics for survivor mode
export interface GameStats {
    totalGames: number
    totalPlayTime: number // seconds
    totalKills: number
    bestTime: number // seconds
    bestLevel: number
    bestRank: string // 'S' | 'A' | 'B' | 'C' | 'D'
    lastPlayedAt: number | null // timestamp
}

const DEFAULT_GAME_STATS: GameStats = {
    totalGames: 0,
    totalPlayTime: 0,
    totalKills: 0,
    bestTime: 0,
    bestLevel: 0,
    bestRank: 'D',
    lastPlayedAt: null,
}

interface ProgressState {
    // Formulas the user has studied (viewed in simulation)
    studiedFormulas: Set<string>

    // Game statistics
    gameStats: GameStats

    // Mark a formula as studied
    studyFormula: (formulaId: string) => void

    // Check if a formula has been studied
    hasStudied: (formulaId: string) => boolean

    // Get all studied formulas
    getStudiedFormulas: () => string[]

    // Record a game result
    recordGameResult: (time: number, level: number, kills: number, rank: string) => void

    // Get game stats
    getGameStats: () => GameStats

    // Reset progress (for testing)
    resetProgress: () => void
}

// Rank priority for comparison
const RANK_PRIORITY: Record<string, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 }

export const useProgressStore = create<ProgressState>()(
    persist(
        (set, get) => ({
            studiedFormulas: new Set<string>(),
            gameStats: { ...DEFAULT_GAME_STATS },

            studyFormula: (formulaId: string) => {
                set((state) => {
                    const newSet = new Set(state.studiedFormulas)
                    newSet.add(formulaId)
                    return { studiedFormulas: newSet }
                })

                // Check learning achievements
                const count = get().studiedFormulas.size
                useAchievementStore.getState().checkLearningAchievements(count)
            },

            hasStudied: (formulaId: string) => {
                return get().studiedFormulas.has(formulaId)
            },

            getStudiedFormulas: () => {
                return Array.from(get().studiedFormulas)
            },

            recordGameResult: (time: number, level: number, kills: number, rank: string) => {
                set((state) => {
                    const stats = state.gameStats
                    const newBestRank =
                        RANK_PRIORITY[rank] > RANK_PRIORITY[stats.bestRank] ? rank : stats.bestRank

                    return {
                        gameStats: {
                            totalGames: stats.totalGames + 1,
                            totalPlayTime: stats.totalPlayTime + time,
                            totalKills: stats.totalKills + kills,
                            bestTime: Math.max(stats.bestTime, time),
                            bestLevel: Math.max(stats.bestLevel, level),
                            bestRank: newBestRank,
                            lastPlayedAt: Date.now(),
                        },
                    }
                })

                // Check combat and mastery achievements
                const { totalKills, bestTime, bestRank } = get().gameStats
                useAchievementStore
                    .getState()
                    .checkCombatAchievements(totalKills, bestTime, bestRank)
            },

            getGameStats: () => {
                return get().gameStats
            },

            resetProgress: () => {
                set({
                    studiedFormulas: new Set<string>(),
                    gameStats: { ...DEFAULT_GAME_STATS },
                })
            },
        }),
        {
            name: 'wobble-progress',
            // Custom serialization for Set
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name)
                    if (!str) return null
                    const data = JSON.parse(str)
                    return {
                        ...data,
                        state: {
                            ...data.state,
                            studiedFormulas: new Set(data.state.studiedFormulas || []),
                            gameStats: data.state.gameStats || { ...DEFAULT_GAME_STATS },
                        },
                    }
                },
                setItem: (name, value) => {
                    const data = {
                        ...value,
                        state: {
                            ...value.state,
                            studiedFormulas: Array.from(value.state.studiedFormulas || []),
                            gameStats: value.state.gameStats || { ...DEFAULT_GAME_STATS },
                        },
                    }
                    localStorage.setItem(name, JSON.stringify(data))
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
)

// Physics law to formula mapping
export const lawToFormulaMap: Record<string, string[]> = {
    inertia: [], // Always available
    fma: ['newton-second'],
    momentum: ['momentum'],
    elastic: ['elastic-collision'],
    reaction: ['newton-second'], // Newton's 3rd law
    gravity: ['projectile', 'free-fall', 'gravity'],
    chain: ['elastic-collision'],
}

// Check if a physics law is unlocked based on studied formulas
export function isLawUnlocked(law: string, studiedFormulas: Set<string>): boolean {
    const requiredFormulas = lawToFormulaMap[law]

    // Inertia is always available
    if (!requiredFormulas || requiredFormulas.length === 0) {
        return true
    }

    // Check if any of the required formulas have been studied
    return requiredFormulas.some((formulaId) => studiedFormulas.has(formulaId))
}

// Get all available laws based on studied formulas
export function getAvailableLaws(studiedFormulas: Set<string>): string[] {
    return Object.keys(lawToFormulaMap).filter((law) => isLawUnlocked(law, studiedFormulas))
}
