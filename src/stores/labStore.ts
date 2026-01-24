/**
 * Lab Store
 *
 * State management for the physics research lab feature.
 * Handles workers, physics research points, upgrades, and offline production.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
    LabStoreState,
    LabWorker,
    LabResources,
    PhysicsLevels,
    AppliedPhysicsStats,
    PhysicsProperty,
    StationId,
} from '@/types/lab'
import type { WobbleShape } from '@/components/canvas/Wobble'
import {
    STATIONS,
    UPGRADES,
    getCharacterBonus,
    calculateUpgradeCost,
    calculateStatEffect,
    STARTING_WORKERS,
    MAX_WORKERS,
} from '@/config/labConfig'

// Generate unique worker ID
function generateWorkerId(): string {
    return `worker-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
}

// Default empty resources (physics research points)
const DEFAULT_RESOURCES: LabResources = {
    gravity: 0,
    momentum: 0,
    elasticity: 0,
    thermodynamics: 0,
}

// Default stats (all level 0)
const DEFAULT_STATS: PhysicsLevels = {
    gravity: 0,
    momentum: 0,
    elasticity: 0,
    thermodynamics: 0,
}

// Create initial workers from starting shapes
function createInitialWorkers(): LabWorker[] {
    return STARTING_WORKERS.map((shape) => ({
        id: generateWorkerId(),
        shape: shape as WobbleShape,
        assignedStation: null,
        state: 'idle' as const,
        workProgress: 0,
        position: { x: 0.5, y: 0.5 },
    }))
}

export const useLabStore = create<LabStoreState>()(
    persist(
        (set, get) => ({
            resources: { ...DEFAULT_RESOURCES },
            stats: { ...DEFAULT_STATS },
            workers: createInitialWorkers(),
            lastSyncAt: Date.now(),

            assignWorker: (workerId: string, stationId: StationId | null) => {
                set((state) => ({
                    workers: state.workers.map((w) =>
                        w.id === workerId
                            ? {
                                  ...w,
                                  assignedStation: stationId,
                                  state: stationId ? 'walking' : 'idle',
                                  workProgress: 0,
                              }
                            : w
                    ),
                }))
            },

            addWorker: (shape: WobbleShape) => {
                const state = get()
                if (state.workers.length >= MAX_WORKERS) {
                    return '' // Cannot add more workers
                }

                const newWorker: LabWorker = {
                    id: generateWorkerId(),
                    shape,
                    assignedStation: null,
                    state: 'idle',
                    workProgress: 0,
                    position: { x: 0.5, y: 0.5 },
                }

                set((state) => ({
                    workers: [...state.workers, newWorker],
                }))

                return newWorker.id
            },

            removeWorker: (workerId: string) => {
                set((state) => ({
                    workers: state.workers.filter((w) => w.id !== workerId),
                }))
            },

            collectResources: (resource: PhysicsProperty, amount: number) => {
                set((state) => ({
                    resources: {
                        ...state.resources,
                        [resource]: state.resources[resource] + amount,
                    },
                }))
            },

            upgradeStat: (resource: PhysicsProperty) => {
                const state = get()
                const currentLevel = state.stats[resource]
                const config = UPGRADES[resource]

                // Check max level
                if (currentLevel >= config.maxLevel) {
                    return false
                }

                // Check cost
                const cost = calculateUpgradeCost(resource, currentLevel)
                if (state.resources[resource] < cost) {
                    return false
                }

                // Perform upgrade
                set((state) => ({
                    resources: {
                        ...state.resources,
                        [resource]: state.resources[resource] - cost,
                    },
                    stats: {
                        ...state.stats,
                        [resource]: state.stats[resource] + 1,
                    },
                }))

                return true
            },

            getUpgradeCost: (resource: PhysicsProperty) => {
                const state = get()
                const currentLevel = state.stats[resource]
                return calculateUpgradeCost(resource, currentLevel)
            },

            calculateOfflineProduction: () => {
                const state = get()
                const now = Date.now()
                const elapsedSeconds = (now - state.lastSyncAt) / 1000

                // Cap offline time to 24 hours
                const cappedSeconds = Math.min(elapsedSeconds, 24 * 60 * 60)

                const production: LabResources = { ...DEFAULT_RESOURCES }

                // Calculate production for each assigned worker
                state.workers.forEach((worker) => {
                    if (!worker.assignedStation) return

                    const station = STATIONS.find((s) => s.id === worker.assignedStation)
                    if (!station) return

                    // Calculate production rate with character bonus
                    const bonus = getCharacterBonus(worker.shape, station.resource)
                    const cycles = cappedSeconds / station.productionTime
                    const resourcesProduced = cycles * station.productionAmount * bonus

                    production[station.resource] += Math.floor(resourcesProduced)
                })

                return production
            },

            syncOfflineProgress: () => {
                const state = get()
                const now = Date.now()
                const elapsedSeconds = (now - state.lastSyncAt) / 1000
                const offlineProduction = state.calculateOfflineProduction()

                set((state) => ({
                    resources: {
                        gravity: state.resources.gravity + offlineProduction.gravity,
                        momentum: state.resources.momentum + offlineProduction.momentum,
                        elasticity: state.resources.elasticity + offlineProduction.elasticity,
                        thermodynamics:
                            state.resources.thermodynamics + offlineProduction.thermodynamics,
                    },
                    lastSyncAt: Date.now(),
                }))

                // Return offline info for UI display
                return {
                    production: offlineProduction,
                    elapsedSeconds: Math.min(elapsedSeconds, 24 * 60 * 60),
                }
            },

            getAppliedStats: (): AppliedPhysicsStats => {
                const state = get()

                return {
                    gravityMultiplier: 1 + calculateStatEffect('gravity', state.stats.gravity),
                    momentumMultiplier: 1 + calculateStatEffect('momentum', state.stats.momentum),
                    elasticityMultiplier:
                        1 + calculateStatEffect('elasticity', state.stats.elasticity),
                    thermodynamicsMultiplier:
                        1 + calculateStatEffect('thermodynamics', state.stats.thermodynamics),
                }
            },

            resetLab: () => {
                set({
                    resources: { ...DEFAULT_RESOURCES },
                    stats: { ...DEFAULT_STATS },
                    workers: createInitialWorkers(),
                    lastSyncAt: Date.now(),
                })
            },
        }),
        {
            name: 'wobble-lab',
            storage: {
                getItem: (name) => {
                    const str = localStorage.getItem(name)
                    if (!str) return null
                    const data = JSON.parse(str)

                    // Migration from old format to new physics-based format
                    const oldResources = data.state.resources || {}
                    const oldStats = data.state.stats || {}

                    return {
                        ...data,
                        state: {
                            ...data.state,
                            resources: {
                                gravity: oldResources.gravity ?? oldResources.mass ?? 0,
                                momentum: oldResources.momentum ?? oldResources.velocity ?? 0,
                                elasticity: oldResources.elasticity ?? oldResources.force ?? 0,
                                thermodynamics:
                                    oldResources.thermodynamics ?? oldResources.resistance ?? 0,
                            },
                            stats: {
                                gravity: oldStats.gravity ?? oldStats.massLevel ?? 0,
                                momentum: oldStats.momentum ?? oldStats.velocityLevel ?? 0,
                                elasticity: oldStats.elasticity ?? oldStats.forceLevel ?? 0,
                                thermodynamics:
                                    oldStats.thermodynamics ?? oldStats.resistanceLevel ?? 0,
                            },
                            workers: data.state.workers || createInitialWorkers(),
                            lastSyncAt: data.state.lastSyncAt || Date.now(),
                        },
                    }
                },
                setItem: (name, value) => {
                    localStorage.setItem(name, JSON.stringify(value))
                },
                removeItem: (name) => localStorage.removeItem(name),
            },
        }
    )
)

// Helper function to sync offline progress on mount
// Returns offline production info if there was significant earnings
export function syncLabOnMount(): { production: LabResources; elapsedSeconds: number } | null {
    const result = useLabStore.getState().syncOfflineProgress()

    // Check if there was significant production (at least 100 total resources)
    const totalProduction =
        result.production.gravity +
        result.production.momentum +
        result.production.elasticity +
        result.production.thermodynamics

    // Only return if significant and was offline for at least 30 seconds
    if (totalProduction >= 100 && result.elapsedSeconds >= 30) {
        return result
    }
    return null
}
