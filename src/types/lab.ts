/**
 * Lab Feature Type Definitions
 *
 * Physics research lab where Wobbles study fundamental physics properties.
 * Each station researches a specific physics concept with a mini simulation.
 */

import { WobbleShape } from '@/components/canvas/Wobble'

/**
 * Physics properties researched in the lab
 * Each maps to a fundamental physics concept with real-world applications
 */
export type PhysicsProperty =
    | 'gravity' // Gravitational constant G - affects falling, orbits
    | 'momentum' // p=mv - affects movement inertia, collision knockback
    | 'elasticity' // Coefficient of restitution e - affects bouncing, collision damage
    | 'thermodynamics' // Heat capacity Q=mcΔT - affects cooldowns, resistance

// Alias for backwards compatibility
export type LabResource = PhysicsProperty

// Research station identifiers
export type StationId =
    | 'gravity-lab' // Orbital mechanics simulation
    | 'accelerator' // Particle momentum simulation
    | 'collision-lab' // Elastic collision simulation
    | 'thermodynamics-lab' // Heat transfer simulation

// Worker states for animation and AI behavior
export type WorkerState =
    | 'idle' // Not assigned, wandering around
    | 'walking' // Moving to a destination
    | 'working' // At station, producing resources
    | 'taking_break' // Brief rest near station

/**
 * Lab worker instance - a Wobble assigned to work in the lab
 */
export interface LabWorker {
    id: string
    shape: WobbleShape
    assignedStation: StationId | null
    state: WorkerState
    workProgress: number // 0-1, progress towards producing a resource
    position: { x: number; y: number }
}

/**
 * Mini simulation type for each station
 */
export type SimulationType =
    | 'orbital' // Planets orbiting - gravity
    | 'particle-accelerator' // Particles in a ring - momentum
    | 'collision' // Balls bouncing - elasticity
    | 'heat-transfer' // Particles with temperature - thermodynamics

/**
 * Research station configuration
 */
export interface StationConfig {
    id: StationId
    nameKey: string // i18n key
    resource: PhysicsProperty
    productionTime: number // seconds per production cycle
    productionAmount: number // amount produced per cycle
    position: { x: number; y: number } // relative position in scene (0-1)
    color: number // hex color for visual
    simulation: SimulationType // Type of physics simulation to display
    formulaSymbol: string // Physics symbol (G, p, e, Q)
    unit: string // Unit of measurement
}

/**
 * Character bonus configuration - certain shapes are better at specific research
 */
export interface CharacterBonus {
    shape: WobbleShape
    resource: PhysicsProperty
    multiplier: number // e.g., 2.0 for +100%
}

/**
 * Upgrade cost and effect configuration
 */
export interface UpgradeConfig {
    resource: PhysicsProperty
    baseCost: number
    costMultiplier: number // cost = baseCost * (costMultiplier ^ level)
    effectPerLevel: number // e.g., 0.05 for +5% per level
    maxLevel: number
}

/**
 * Physics research levels - stored in lab
 */
export interface PhysicsLevels {
    gravity: number // G research level
    momentum: number // p research level
    elasticity: number // e research level
    thermodynamics: number // Q research level
}

// Alias for backwards compatibility
export type WobbleLabStats = PhysicsLevels

/**
 * Applied physics stats - interpreted differently by each minigame
 * Each minigame decides how to use these physics properties
 */
export interface AppliedPhysicsStats {
    gravityMultiplier: number // How much G affects gameplay
    momentumMultiplier: number // How much p affects gameplay
    elasticityMultiplier: number // How much e affects gameplay
    thermodynamicsMultiplier: number // How much Q affects gameplay
}

// Alias for backwards compatibility
export type AppliedLabStats = AppliedPhysicsStats

/**
 * Resource collection for storage
 */
export interface LabResources {
    gravity: number
    momentum: number
    elasticity: number
    thermodynamics: number
}

/**
 * Lab store state
 */
export interface LabStoreState {
    // Accumulated research points
    resources: LabResources

    // Research levels
    stats: PhysicsLevels

    // Assigned workers
    workers: LabWorker[]

    // Last sync time for offline calculation
    lastSyncAt: number

    // Actions
    assignWorker: (workerId: string, stationId: StationId | null) => void
    addWorker: (shape: WobbleShape) => string // Returns new worker ID
    removeWorker: (workerId: string) => void
    collectResources: (resource: PhysicsProperty, amount: number) => void
    upgradeStat: (resource: PhysicsProperty) => boolean // Returns success
    getUpgradeCost: (resource: PhysicsProperty) => number

    // Offline production
    calculateOfflineProduction: () => LabResources
    syncOfflineProgress: () => void

    // Minigame stat application
    getAppliedStats: () => AppliedPhysicsStats

    // Reset (for testing/dev)
    resetLab: () => void
}
