import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    LevelChallengeId,
    LEVEL_CHALLENGES,
    getLevelChallenge,
    calculateLevel,
} from '@/data/levelChallenges'

// Event emitter for level up notifications
type LevelUpListener = (challengeId: LevelChallengeId, newLevel: number) => void
const levelUpListeners: LevelUpListener[] = []

export function onLevelUp(listener: LevelUpListener): () => void {
    levelUpListeners.push(listener)
    return () => {
        const index = levelUpListeners.indexOf(listener)
        if (index > -1) levelUpListeners.splice(index, 1)
    }
}

function notifyLevelUp(challengeId: LevelChallengeId, newLevel: number) {
    levelUpListeners.forEach((listener) => listener(challengeId, newLevel))
}

interface LevelChallengeState {
    // Track highest achieved level for each challenge (to detect level ups)
    achievedLevels: Record<LevelChallengeId, number>

    // Actions
    checkAndUpdateLevel: (challengeId: LevelChallengeId, currentValue: number) => void
    getAchievedLevel: (challengeId: LevelChallengeId) => number
    reset: () => void
}

export const useLevelChallengeStore = create<LevelChallengeState>()(
    persist(
        (set, get) => ({
            achievedLevels: {
                'formula-discovery': 0,
                'challenge-solver': 0,
            },

            checkAndUpdateLevel: (challengeId: LevelChallengeId, currentValue: number) => {
                const challenge = getLevelChallenge(challengeId)
                if (!challenge) return

                const { level } = calculateLevel(challenge, currentValue)
                const currentAchievedLevel = get().achievedLevels[challengeId] || 0

                if (level > currentAchievedLevel) {
                    // Level up!
                    set((state) => ({
                        achievedLevels: {
                            ...state.achievedLevels,
                            [challengeId]: level,
                        },
                    }))
                    notifyLevelUp(challengeId, level)
                }
            },

            getAchievedLevel: (challengeId: LevelChallengeId) => {
                return get().achievedLevels[challengeId] || 0
            },

            reset: () => {
                set({
                    achievedLevels: {
                        'formula-discovery': 0,
                        'challenge-solver': 0,
                    },
                })
            },
        }),
        {
            name: 'wobble-level-challenges',
        }
    )
)

// Helper hook to get level challenge progress
export function getLevelChallengeProgress(challengeId: LevelChallengeId, currentValue: number) {
    const challenge = getLevelChallenge(challengeId)
    if (!challenge) return null

    return {
        challenge,
        ...calculateLevel(challenge, currentValue),
        currentValue,
    }
}
