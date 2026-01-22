/**
 * Lab Configuration
 *
 * Physics research lab configuration.
 * Each station researches a fundamental physics property with a mini simulation.
 */

import type {
    StationConfig,
    CharacterBonus,
    UpgradeConfig,
    PhysicsProperty,
    StationId,
} from '@/types/lab'

/**
 * Research Stations
 *
 * Each station has a mini physics simulation and produces research points.
 */
export const STATIONS: StationConfig[] = [
    {
        id: 'gravity-lab',
        nameKey: 'lab.stations.gravityLab',
        resource: 'gravity',
        productionTime: 3,
        productionAmount: 150,
        position: { x: 0.2, y: 0.3 },
        color: 0x9b59b6, // Purple - space/gravity theme
        simulation: 'orbital',
        formulaSymbol: 'G',
        unit: 'N·m²/kg²',
    },
    {
        id: 'accelerator',
        nameKey: 'lab.stations.accelerator',
        resource: 'momentum',
        productionTime: 2.5,
        productionAmount: 200,
        position: { x: 0.8, y: 0.3 },
        color: 0x3498db, // Blue - energy/speed theme
        simulation: 'particle-accelerator',
        formulaSymbol: 'p',
        unit: 'kg·m/s',
    },
    {
        id: 'collision-lab',
        nameKey: 'lab.stations.collisionLab',
        resource: 'elasticity',
        productionTime: 4,
        productionAmount: 100,
        position: { x: 0.2, y: 0.7 },
        color: 0xe74c3c, // Red - collision/impact theme
        simulation: 'collision',
        formulaSymbol: 'e',
        unit: '',
    },
    {
        id: 'thermodynamics-lab',
        nameKey: 'lab.stations.thermodynamicsLab',
        resource: 'thermodynamics',
        productionTime: 3.5,
        productionAmount: 120,
        position: { x: 0.8, y: 0.7 },
        color: 0xe67e22, // Orange - heat theme
        simulation: 'heat-transfer',
        formulaSymbol: 'Q',
        unit: 'J',
    },
]

/**
 * Character Specialization Bonuses
 *
 * Certain Wobble shapes have +100% bonus when researching specific physics.
 */
export const CHARACTER_BONUSES: CharacterBonus[] = [
    { shape: 'circle', resource: 'gravity', multiplier: 2.0 }, // Newton - gravity expert
    { shape: 'einstein', resource: 'momentum', multiplier: 2.0 }, // Einstein - relativity
    { shape: 'diamond', resource: 'thermodynamics', multiplier: 2.0 }, // Maxwell - thermodynamics
    { shape: 'triangle', resource: 'elasticity', multiplier: 2.0 }, // Spike - collision expert
]

/**
 * Upgrade Configuration
 *
 * Research levels increase the multiplier for each physics property.
 */
export const UPGRADES: Record<PhysicsProperty, UpgradeConfig> = {
    gravity: {
        resource: 'gravity',
        baseCost: 1000,
        costMultiplier: 1.35,
        effectPerLevel: 0.05, // +5% per level
        maxLevel: 100,
    },
    momentum: {
        resource: 'momentum',
        baseCost: 1000,
        costMultiplier: 1.35,
        effectPerLevel: 0.03, // +3% per level
        maxLevel: 100,
    },
    elasticity: {
        resource: 'elasticity',
        baseCost: 1000,
        costMultiplier: 1.35,
        effectPerLevel: 0.04, // +4% per level
        maxLevel: 100,
    },
    thermodynamics: {
        resource: 'thermodynamics',
        baseCost: 1000,
        costMultiplier: 1.35,
        effectPerLevel: 0.02, // +2% per level
        maxLevel: 100,
    },
}

/**
 * Get station by ID
 */
export function getStationById(id: StationId): StationConfig | undefined {
    return STATIONS.find((s) => s.id === id)
}

/**
 * Get station by resource type
 */
export function getStationByResource(resource: PhysicsProperty): StationConfig | undefined {
    return STATIONS.find((s) => s.resource === resource)
}

/**
 * Get character bonus multiplier for a shape and resource
 */
export function getCharacterBonus(shape: string, resource: PhysicsProperty): number {
    const bonus = CHARACTER_BONUSES.find((b) => b.shape === shape && b.resource === resource)
    return bonus?.multiplier ?? 1.0
}

/**
 * Calculate upgrade cost for a given level
 */
export function calculateUpgradeCost(resource: PhysicsProperty, currentLevel: number): number {
    const config = UPGRADES[resource]
    return Math.floor(config.baseCost * Math.pow(config.costMultiplier, currentLevel))
}

/**
 * Calculate total stat effect for a given level
 */
export function calculateStatEffect(resource: PhysicsProperty, level: number): number {
    const config = UPGRADES[resource]
    return level * config.effectPerLevel
}

/**
 * Lab visual theme colors
 */
export const LAB_COLORS = {
    background: 0x1a1a2e,
    floor: 0x2d2d44,
    wall: 0x3d3d5c,
    accent: 0xff8c42, // Orange factory theme
    glow: 0xffa500,
}

/**
 * Worker movement speed (pixels per second at default scale)
 */
export const WORKER_SPEED = 100

/**
 * Maximum workers allowed in the lab
 */
export const MAX_WORKERS = 8

/**
 * Starting workers (shapes unlocked by default)
 */
export const STARTING_WORKERS: string[] = ['circle', 'square']

/**
 * Worker AI Behavior Configuration
 */
export const WORKER_AI = {
    // Idle wandering
    idleWanderRadius: 0.15,
    idleWanderInterval: { min: 2, max: 5 },
    idlePauseChance: 0.3,

    // Working behavior
    workCyclesBeforeBreak: { min: 2, max: 5 },
    breakDuration: { min: 1.5, max: 3 },
    breakWanderRadius: 0.08,

    // Movement
    arrivalThreshold: 5,
}

/**
 * Production popup configuration
 */
export const POPUP_CONFIG = {
    duration: 1.2,
    riseDistance: 50,
    fontSize: 16,
}

/**
 * Station Affordances - Sims-like unique animations per building
 */
export type AffordanceType =
    | 'observe_orbit' // Watching orbital simulation
    | 'track_particles' // Following accelerator particles
    | 'test_collision' // Testing collision mechanics
    | 'measure_heat' // Measuring temperature

export interface StationAffordance {
    type: AffordanceType
    workerOffset: { x: number; y: number }
    animationSpeed: number
    particleEffect?: 'sparks' | 'glow' | 'cold' | 'energy'
}

export const STATION_AFFORDANCES: Record<StationId, StationAffordance> = {
    'gravity-lab': {
        type: 'observe_orbit',
        workerOffset: { x: 0, y: 30 },
        animationSpeed: 1.0,
        particleEffect: 'glow',
    },
    'accelerator': {
        type: 'track_particles',
        workerOffset: { x: -15, y: 25 },
        animationSpeed: 1.5,
        particleEffect: 'energy',
    },
    'collision-lab': {
        type: 'test_collision',
        workerOffset: { x: 10, y: 30 },
        animationSpeed: 0.8,
        particleEffect: 'sparks',
    },
    'thermodynamics-lab': {
        type: 'measure_heat',
        workerOffset: { x: -5, y: 28 },
        animationSpeed: 1.2,
        particleEffect: 'glow',
    },
}

/**
 * Mini Simulation Configuration (larger sizes for better visibility)
 */
export const SIMULATION_CONFIG = {
    // Orbital simulation (gravity)
    orbital: {
        planetCount: 2,
        orbitRadius: { min: 25, max: 45 },
        orbitSpeed: { min: 1.5, max: 2.5 },
        sunSize: 10,
        planetSize: 5,
    },
    // Particle accelerator (momentum)
    particleAccelerator: {
        particleCount: 8,
        ringRadius: 38,
        particleSpeed: 4,
        particleSize: 4,
        trailLength: 6,
    },
    // Collision simulation (elasticity)
    collision: {
        ballCount: 2,
        ballSize: 8,
        bounceArea: { width: 70, height: 45 },
        initialSpeed: 2.5,
    },
    // Heat transfer (thermodynamics)
    heatTransfer: {
        particleCount: 15,
        areaSize: 55,
        minSpeed: 0.5,
        maxSpeed: 3,
        particleSize: 4,
    },
}
