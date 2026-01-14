import { create } from 'zustand'

const STORAGE_KEY = 'wobble-unlocked-formulas'
const DISCOVERY_KEY = 'wobble-completed-discoveries'

// 잠금 해제 조건 타입
export type UnlockCondition =
    | { type: 'free' } // 처음부터 해금
    | { type: 'prerequisite'; formulaId: string } // 선행 공식 디스커버리 완료 필요
    | { type: 'ad' } // 광고 시청 필요

// 각 공식의 잠금 해제 조건
export const UNLOCK_CONDITIONS: Record<string, UnlockCondition> = {
    // Mechanics - 모두 무료
    'newton-second': { type: 'free' },
    'kinetic-energy': { type: 'free' },
    'momentum': { type: 'free' },
    'hooke': { type: 'free' },
    'centripetal': { type: 'free' },
    'elastic-collision': { type: 'free' },
    'pressure': { type: 'free' },
    'torque': { type: 'free' },

    // Gravity - 첫번째는 선행 조건, 나머지는 광고
    'gravity': { type: 'prerequisite', formulaId: 'newton-second' },
    'pendulum': { type: 'ad' },
    'free-fall': { type: 'ad' },
    'projectile': { type: 'ad' },
    'escape-velocity': { type: 'ad' },
    'kepler-third': { type: 'ad' },

    // Wave - 첫번째는 선행 조건, 나머지는 광고
    'wave': { type: 'prerequisite', formulaId: 'hooke' },
    'reflection': { type: 'ad' },
    'snell': { type: 'ad' },
    'lens': { type: 'ad' },
    'standing-wave': { type: 'ad' },

    // Thermodynamics - 첫번째는 선행 조건, 나머지는 광고
    'ideal-gas': { type: 'prerequisite', formulaId: 'pressure' },
    'heat': { type: 'ad' },
    'first-law': { type: 'ad' },
    'entropy': { type: 'ad' },
    'thermal-conduction': { type: 'ad' },
    'stefan-boltzmann': { type: 'ad' },
    'wien': { type: 'ad' },

    // Electricity - 첫번째는 선행 조건, 나머지는 광고
    'ohm': { type: 'prerequisite', formulaId: 'kinetic-energy' },
    'coulomb': { type: 'ad' },
    'electric-power': { type: 'ad' },
    'lorentz': { type: 'ad' },
    'capacitor': { type: 'ad' },

    // Special - 첫번째는 선행 조건, 나머지는 광고
    'buoyancy': { type: 'prerequisite', formulaId: 'pressure' },
    'photoelectric': { type: 'ad' },
    'debroglie': { type: 'ad' },
    'time-dilation': { type: 'ad' },

    // Quantum - 첫번째는 선행 조건, 나머지는 광고
    'uncertainty': { type: 'prerequisite', formulaId: 'momentum' },
    'infinite-well': { type: 'ad' },
    'tunneling': { type: 'ad' },
    'bohr': { type: 'ad' },
    'radioactive-decay': { type: 'ad' },

    // Chemistry
    'ph': { type: 'ad' },
    'dilution': { type: 'ad' },
    'reaction-rate': { type: 'ad' },

    // New Physics - 역학
    'angular-momentum': { type: 'ad' },
    'bernoulli': { type: 'ad' },
    'rotational-energy': { type: 'ad' },

    // New Physics - 파동
    'doppler': { type: 'ad' },
    'inverse-square': { type: 'ad' },
    'beat-frequency': { type: 'ad' },

    // New Physics - 전자기
    'faraday': { type: 'ad' },
    'magnetic-field': { type: 'ad' },
}

// 무료 공식 목록 (역학 카테고리)
export const FREE_FORMULAS = [
    'newton-second',
    'kinetic-energy',
    'momentum',
    'hooke',
    'centripetal',
    'elastic-collision',
    'pressure',
    'torque',
]

interface FormulaUnlockState {
    unlockedFormulas: Set<string>
    completedDiscoveries: Set<string> // 디스커버리 완료한 공식들

    // Actions
    isUnlocked: (formulaId: string) => boolean
    getUnlockCondition: (formulaId: string) => UnlockCondition
    canUnlockByPrerequisite: (formulaId: string) => boolean
    unlockFormula: (formulaId: string) => void
    unlockFormulas: (formulaIds: string[]) => void
    completeDiscovery: (formulaId: string) => string[] // 디스커버리 완료, 새로 해금된 공식 반환
    unlockAll: () => void
    reset: () => void
}

const getInitialUnlockedFormulas = (): Set<string> => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            return new Set(JSON.parse(saved))
        }
    } catch {
        // localStorage not available
    }
    // 무료 공식은 항상 해금 상태
    return new Set(FREE_FORMULAS)
}

const getCompletedDiscoveries = (): Set<string> => {
    try {
        const saved = localStorage.getItem(DISCOVERY_KEY)
        if (saved) {
            return new Set(JSON.parse(saved))
        }
    } catch {
        // localStorage not available
    }
    return new Set()
}

const saveUnlockedFormulas = (formulas: Set<string>) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...formulas]))
    } catch {
        // localStorage not available
    }
}

const saveCompletedDiscoveries = (discoveries: Set<string>) => {
    try {
        localStorage.setItem(DISCOVERY_KEY, JSON.stringify([...discoveries]))
    } catch {
        // localStorage not available
    }
}

export const useFormulaUnlockStore = create<FormulaUnlockState>((set, get) => ({
    unlockedFormulas: getInitialUnlockedFormulas(),
    completedDiscoveries: getCompletedDiscoveries(),

    isUnlocked: (formulaId: string) => {
        const condition = UNLOCK_CONDITIONS[formulaId]
        // 무료 공식은 항상 해금
        if (condition?.type === 'free') return true
        return get().unlockedFormulas.has(formulaId)
    },

    getUnlockCondition: (formulaId: string) => {
        return UNLOCK_CONDITIONS[formulaId] || { type: 'ad' }
    },

    canUnlockByPrerequisite: (formulaId: string) => {
        const condition = UNLOCK_CONDITIONS[formulaId]
        if (condition?.type !== 'prerequisite') return false
        return get().completedDiscoveries.has(condition.formulaId)
    },

    unlockFormula: (formulaId: string) => {
        const { unlockedFormulas } = get()
        const newSet = new Set(unlockedFormulas)
        newSet.add(formulaId)
        saveUnlockedFormulas(newSet)
        set({ unlockedFormulas: newSet })
    },

    unlockFormulas: (formulaIds: string[]) => {
        const { unlockedFormulas } = get()
        const newSet = new Set(unlockedFormulas)
        formulaIds.forEach(id => newSet.add(id))
        saveUnlockedFormulas(newSet)
        set({ unlockedFormulas: newSet })
    },

    // 디스커버리 완료 시 호출 - 새로 해금된 공식 ID 목록 반환
    completeDiscovery: (formulaId: string) => {
        const { completedDiscoveries, unlockedFormulas, isUnlocked } = get()

        // 이미 완료된 디스커버리면 무시
        if (completedDiscoveries.has(formulaId)) {
            return []
        }

        // 디스커버리 완료 기록
        const newDiscoveries = new Set(completedDiscoveries)
        newDiscoveries.add(formulaId)
        saveCompletedDiscoveries(newDiscoveries)

        // 이 디스커버리 완료로 해금 가능해진 공식 찾기
        const newlyUnlocked: string[] = []
        const newUnlockedSet = new Set(unlockedFormulas)

        Object.entries(UNLOCK_CONDITIONS).forEach(([id, condition]) => {
            if (condition.type === 'prerequisite' && condition.formulaId === formulaId) {
                // 아직 해금되지 않았다면 해금
                if (!isUnlocked(id)) {
                    newUnlockedSet.add(id)
                    newlyUnlocked.push(id)
                }
            }
        })

        if (newlyUnlocked.length > 0) {
            saveUnlockedFormulas(newUnlockedSet)
        }

        set({
            completedDiscoveries: newDiscoveries,
            unlockedFormulas: newUnlockedSet
        })

        return newlyUnlocked
    },

    unlockAll: () => {
        // 모든 공식 해금
        const allFormulas = new Set(Object.keys(UNLOCK_CONDITIONS))
        saveUnlockedFormulas(allFormulas)
        set({ unlockedFormulas: allFormulas })
    },

    reset: () => {
        try {
            localStorage.removeItem(STORAGE_KEY)
            localStorage.removeItem(DISCOVERY_KEY)
        } catch {
            // localStorage not available
        }
        set({
            unlockedFormulas: new Set(FREE_FORMULAS),
            completedDiscoveries: new Set()
        })
    },
}))

// 선행 조건 공식의 이름 가져오기 (i18n 키)
export function getPrerequisiteFormulaName(formulaId: string): string | null {
    const condition = UNLOCK_CONDITIONS[formulaId]
    if (condition?.type !== 'prerequisite') return null
    return condition.formulaId
}
