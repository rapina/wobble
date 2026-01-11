import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { ACHIEVEMENTS, getAchievement, meetsRankRequirement } from '@/data/achievements'
import { useProgressStore } from './progressStore'
import { useCollectionStore } from './collectionStore'

export interface AchievementProgress {
    current: number
    target: number
    percentage: number
}

// Event emitter for achievement unlocks (for toast notifications)
type AchievementUnlockListener = (achievementId: string) => void
const listeners: AchievementUnlockListener[] = []

export function onAchievementUnlock(listener: AchievementUnlockListener): () => void {
    listeners.push(listener)
    return () => {
        const index = listeners.indexOf(listener)
        if (index > -1) listeners.splice(index, 1)
    }
}

function notifyUnlock(achievementId: string) {
    listeners.forEach((listener) => listener(achievementId))
}

interface AchievementState {
    // Persisted state
    unlockedIds: Set<string>
    unlockedAt: Record<string, number> // timestamp when unlocked

    // Actions
    unlock: (id: string) => boolean // Returns true if newly unlocked
    isUnlocked: (id: string) => boolean
    getProgress: () => { unlocked: number; total: number }
    getUnlockedIds: () => string[]
    reset: () => void

    // Check functions - called by other stores
    checkLearningAchievements: (formulaCount: number) => void
    checkCombatAchievements: (totalKills: number, bestTime: number, bestRank: string) => void
    checkCollectionAchievements: (wobbleCount: number) => void

    // Progress tracking
    getAchievementProgress: (id: string) => AchievementProgress | null
}

export const useAchievementStore = create<AchievementState>()(
    persist(
        (set, get) => ({
            unlockedIds: new Set<string>(),
            unlockedAt: {},

            unlock: (id: string) => {
                const state = get()
                if (state.unlockedIds.has(id)) return false

                // Verify achievement exists
                const achievement = getAchievement(id)
                if (!achievement) return false

                const newSet = new Set(state.unlockedIds)
                newSet.add(id)

                set({
                    unlockedIds: newSet,
                    unlockedAt: {
                        ...state.unlockedAt,
                        [id]: Date.now(),
                    },
                })

                // Notify listeners (for toast)
                notifyUnlock(id)
                return true
            },

            isUnlocked: (id: string) => {
                return get().unlockedIds.has(id)
            },

            getProgress: () => {
                return {
                    unlocked: get().unlockedIds.size,
                    total: ACHIEVEMENTS.length,
                }
            },

            getUnlockedIds: () => {
                return Array.from(get().unlockedIds)
            },

            reset: () => {
                set({
                    unlockedIds: new Set<string>(),
                    unlockedAt: {},
                })
            },

            // Check learning achievements based on formula count
            checkLearningAchievements: (formulaCount: number) => {
                const { unlock } = get()

                if (formulaCount >= 1) unlock('first-formula')
                if (formulaCount >= 5) unlock('curious-mind')
                if (formulaCount >= 15) unlock('scholar')
                if (formulaCount >= 35) unlock('physicist')
            },

            // Check combat achievements based on game stats
            checkCombatAchievements: (totalKills: number, bestTime: number, bestRank: string) => {
                const { unlock } = get()

                // Kill-based achievements
                if (totalKills >= 1) unlock('first-blood')
                if (totalKills >= 100) unlock('hunter')
                if (totalKills >= 500) unlock('exterminator')

                // Survival time achievement (180 seconds = 3 minutes)
                if (bestTime >= 180) unlock('survivor')

                // Rank achievements
                if (meetsRankRequirement(bestRank, 'C')) unlock('rank-c')
                if (meetsRankRequirement(bestRank, 'B')) unlock('rank-b')
                if (meetsRankRequirement(bestRank, 'A')) unlock('rank-a')
                if (meetsRankRequirement(bestRank, 'S')) unlock('rank-s')
            },

            // Check collection achievements based on wobble count
            checkCollectionAchievements: (wobbleCount: number) => {
                const { unlock } = get()

                if (wobbleCount >= 1) unlock('first-friend')
                if (wobbleCount >= 7) unlock('curator')
            },

            // Get progress for a specific achievement
            getAchievementProgress: (id: string): AchievementProgress | null => {
                const achievement = getAchievement(id)
                if (!achievement) return null

                // Rank achievements don't have numeric progress
                if (achievement.condition.type === 'rank') return null

                const target = achievement.condition.value as number
                let current = 0

                switch (achievement.condition.type) {
                    case 'formulas': {
                        const { studiedFormulas } = useProgressStore.getState()
                        current = studiedFormulas.size
                        break
                    }
                    case 'kills': {
                        const { gameStats } = useProgressStore.getState()
                        current = gameStats.totalKills
                        break
                    }
                    case 'survivalTime': {
                        const { gameStats } = useProgressStore.getState()
                        current = gameStats.bestTime
                        break
                    }
                    case 'wobbles': {
                        const { unlockedWobbles } = useCollectionStore.getState()
                        current = unlockedWobbles.length
                        break
                    }
                }

                return {
                    current: Math.min(current, target),
                    target,
                    percentage: Math.min((current / target) * 100, 100),
                }
            },
        }),
        {
            name: 'wobble-achievements',
            // Custom serialization for Set
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name)
                    if (!str) return null
                    try {
                        const data = JSON.parse(str)
                        return {
                            ...data,
                            state: {
                                ...data.state,
                                unlockedIds: new Set(data.state.unlockedIds || []),
                                unlockedAt: data.state.unlockedAt || {},
                            },
                        }
                    } catch {
                        return null
                    }
                },
                setItem: (name, value) => {
                    const data = {
                        ...value,
                        state: {
                            ...value.state,
                            unlockedIds: Array.from(value.state.unlockedIds || []),
                            unlockedAt: value.state.unlockedAt || {},
                        },
                    }
                    localStorage.setItem(name, JSON.stringify(data))
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
)
