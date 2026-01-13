import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Discovery } from '@/formulas/types'

// Event emitter for discovery unlocks (for toast notifications)
type DiscoveryUnlockListener = (formulaId: string, discovery: Discovery) => void
const listeners: DiscoveryUnlockListener[] = []

export function onDiscoveryUnlock(listener: DiscoveryUnlockListener): () => void {
    listeners.push(listener)
    return () => {
        const index = listeners.indexOf(listener)
        if (index > -1) listeners.splice(index, 1)
    }
}

function notifyUnlock(formulaId: string, discovery: Discovery) {
    listeners.forEach((listener) => listener(formulaId, discovery))
}

interface DiscoveryState {
    // Persisted state - stores "formulaId:discoveryId" format
    discoveredIds: Set<string>
    discoveredAt: Record<string, number> // timestamp when discovered

    // Actions
    discover: (formulaId: string, discovery: Discovery) => boolean // Returns true if newly discovered
    isDiscovered: (formulaId: string, discoveryId: string) => boolean
    getDiscoveredIds: () => string[]
    getFormulaProgress: (
        formulaId: string,
        totalDiscoveries: number
    ) => { discovered: number; total: number }
    reset: () => void
}

export const useDiscoveryStore = create<DiscoveryState>()(
    persist(
        (set, get) => ({
            discoveredIds: new Set<string>(),
            discoveredAt: {},

            discover: (formulaId: string, discovery: Discovery) => {
                const fullId = `${formulaId}:${discovery.id}`
                const state = get()
                if (state.discoveredIds.has(fullId)) return false

                const newSet = new Set(state.discoveredIds)
                newSet.add(fullId)

                set({
                    discoveredIds: newSet,
                    discoveredAt: {
                        ...state.discoveredAt,
                        [fullId]: Date.now(),
                    },
                })

                // Notify listeners (for toast)
                notifyUnlock(formulaId, discovery)
                return true
            },

            isDiscovered: (formulaId: string, discoveryId: string) => {
                const fullId = `${formulaId}:${discoveryId}`
                return get().discoveredIds.has(fullId)
            },

            getDiscoveredIds: () => {
                return Array.from(get().discoveredIds)
            },

            getFormulaProgress: (formulaId: string, totalDiscoveries: number) => {
                const discovered = Array.from(get().discoveredIds).filter((id) =>
                    id.startsWith(`${formulaId}:`)
                ).length
                return { discovered, total: totalDiscoveries }
            },

            reset: () => {
                set({
                    discoveredIds: new Set<string>(),
                    discoveredAt: {},
                })
            },
        }),
        {
            name: 'wobble-discoveries',
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
                                discoveredIds: new Set(data.state.discoveredIds || []),
                                discoveredAt: data.state.discoveredAt || {},
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
                            discoveredIds: Array.from(value.state.discoveredIds || []),
                            discoveredAt: value.state.discoveredAt || {},
                        },
                    }
                    localStorage.setItem(name, JSON.stringify(data))
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
)
