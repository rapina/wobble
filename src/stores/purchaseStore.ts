import { create } from 'zustand'

const STORAGE_KEY = 'wobble-ad-free'

interface PurchaseState {
    isAdFree: boolean
    isLoading: boolean
    setAdFree: (value: boolean) => void
    setLoading: (value: boolean) => void
    reset: () => void
}

const getInitialAdFreeState = (): boolean => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        return saved === 'true'
    } catch {
        return false
    }
}

export const usePurchaseStore = create<PurchaseState>((set) => ({
    isAdFree: getInitialAdFreeState(),
    isLoading: false,

    setAdFree: (value: boolean) => {
        try {
            localStorage.setItem(STORAGE_KEY, String(value))
        } catch {
            // localStorage not available
        }
        set({ isAdFree: value })
    },

    setLoading: (value: boolean) => {
        set({ isLoading: value })
    },

    reset: () => {
        try {
            localStorage.removeItem(STORAGE_KEY)
        } catch {
            // localStorage not available
        }
        set({ isAdFree: false, isLoading: false })
    },
}))
