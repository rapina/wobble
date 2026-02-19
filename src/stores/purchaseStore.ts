import { create } from 'zustand'

const AD_FREE_KEY = 'wobble-ad-free'
const ALL_FORMULAS_KEY = 'wobble-all-formulas-unlocked'

interface PurchaseState {
    isAdFree: boolean
    isAllFormulasUnlocked: boolean
    isLoading: boolean
    setAdFree: (value: boolean) => void
    setAllFormulasUnlocked: (value: boolean) => void
    setLoading: (value: boolean) => void
    reset: () => void
}

const getInitialAdFreeState = (): boolean => {
    try {
        const saved = localStorage.getItem(AD_FREE_KEY)
        return saved === 'true'
    } catch {
        return false
    }
}

const getInitialAllFormulasState = (): boolean => {
    try {
        const saved = localStorage.getItem(ALL_FORMULAS_KEY)
        return saved === 'true'
    } catch {
        return false
    }
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
    isAdFree: getInitialAdFreeState(),
    isAllFormulasUnlocked: getInitialAllFormulasState(),
    isLoading: false,

    setAdFree: (value: boolean) => {
        try {
            localStorage.setItem(AD_FREE_KEY, String(value))
        } catch {
            // localStorage not available
        }
        set({ isAdFree: value })
    },

    setAllFormulasUnlocked: (value: boolean) => {
        try {
            localStorage.setItem(ALL_FORMULAS_KEY, String(value))
        } catch {
            // localStorage not available
        }
        set({ isAllFormulasUnlocked: value })
    },

    setLoading: (value: boolean) => {
        set({ isLoading: value })
    },

    reset: () => {
        try {
            localStorage.removeItem(AD_FREE_KEY)
            localStorage.removeItem(ALL_FORMULAS_KEY)
        } catch {
            // localStorage not available
        }
        set({ isAdFree: false, isAllFormulasUnlocked: false, isLoading: false })
    },
}))
