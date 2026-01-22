import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useLevelChallengeStore } from './levelChallengeStore'

export type ChallengeType = 'target' | 'range' | 'condition'

export interface Challenge {
    id: string
    type: ChallengeType
    formulaId: string
    mission: string
    missionEn: string
    condition: (variables: Record<string, number>) => boolean
    difficulty: 1 | 2 | 3
    targetVariables: string[]
}

interface ChallengeState {
    // Current challenge
    currentChallenge: Challenge | null

    // Score system
    score: number
    highScore: number

    // Combo system
    combo: number
    maxCombo: number

    // Session stats
    solved: number
    failed: number

    // Total solved (persistent)
    totalSolved: number

    // Last earned score (for toast display)
    lastEarnedScore: number

    // Actions
    setChallenge: (challenge: Challenge | null) => void
    solveChallenge: () => number // Returns earned score
    skipChallenge: () => void
    resetSession: () => void
}

// Score by difficulty
const BASE_SCORES: Record<1 | 2 | 3, number> = {
    1: 100, // target
    2: 150, // range
    3: 200, // condition
}

export const useChallengeStore = create<ChallengeState>()(
    persist(
        (set, get) => ({
            currentChallenge: null,
            score: 0,
            highScore: 0,
            combo: 0,
            maxCombo: 0,
            solved: 0,
            failed: 0,
            totalSolved: 0,
            lastEarnedScore: 0,

            setChallenge: (challenge) => set({ currentChallenge: challenge }),

            solveChallenge: () => {
                const { currentChallenge, score, highScore, combo, maxCombo, solved, totalSolved } =
                    get()
                if (!currentChallenge) return 0

                const baseScore = BASE_SCORES[currentChallenge.difficulty]
                const comboMultiplier = 1 + combo * 0.1
                const earnedScore = Math.round(baseScore * comboMultiplier)
                const newScore = score + earnedScore
                const newCombo = combo + 1
                const newTotalSolved = totalSolved + 1

                set({
                    score: newScore,
                    highScore: Math.max(highScore, newScore),
                    combo: newCombo,
                    maxCombo: Math.max(maxCombo, newCombo),
                    solved: solved + 1,
                    totalSolved: newTotalSolved,
                    currentChallenge: null,
                    lastEarnedScore: earnedScore,
                })

                // Check level challenge progress
                useLevelChallengeStore.getState().checkAndUpdateLevel('challenge-solver', newTotalSolved)

                return earnedScore
            },

            skipChallenge: () => {
                const { failed } = get()
                set({
                    combo: 0,
                    currentChallenge: null,
                    failed: failed + 1,
                })
            },

            resetSession: () =>
                set({
                    score: 0,
                    combo: 0,
                    solved: 0,
                    failed: 0,
                    currentChallenge: null,
                    lastEarnedScore: 0,
                }),
        }),
        {
            name: 'wobble-challenge-storage',
            partialize: (state) => ({
                highScore: state.highScore,
                maxCombo: state.maxCombo,
                totalSolved: state.totalSolved,
            }),
        }
    )
)
