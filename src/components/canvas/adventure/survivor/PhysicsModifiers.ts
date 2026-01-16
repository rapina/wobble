/**
 * Physics Modifiers System
 * Each stage applies different physics rules to create unique gameplay
 */

import { LocalizedText } from '@/utils/localization'

export interface PhysicsModifiers {
    gravity: number // Downward force (0 = none, 0.5 = low, 1 = standard)
    friction: number // Velocity decay (0.98 = standard, 0.95 = icy)
    bounce: number // Elasticity coefficient (0 = no bounce, 0.95 = high bounce)
    knockbackMult: number // Knockback multiplier (1 = standard)
    vortexCenter?: { x: number; y: number } // Vortex center (0-1 ratio)
    vortexStrength?: number // Vortex pull strength
}

export interface StageConfig {
    id: string
    name: LocalizedText
    icon: string
    physics: PhysicsModifiers
    formula: string // Related physics formula ID (app connection)
    bgColor: number // Background color
    particleColor: number // Particle/effect color
    description: string // Physics formula
    trait: string // Gameplay characteristic description
    tip: string // Gameplay tip for this stage
}

export const DEFAULT_PHYSICS: PhysicsModifiers = {
    gravity: 0,
    friction: 0.98,
    bounce: 0,
    knockbackMult: 1,
}

export const STAGES: StageConfig[] = [
    {
        id: 'normal',
        name: { ko: '균형의 세계', en: 'Normal' },
        icon: '◈',
        physics: {
            gravity: 0,
            friction: 0.98,
            bounce: 0,
            knockbackMult: 1,
        },
        formula: 'newton-second',
        bgColor: 0x0a0a1a, // Deep space
        particleColor: 0xc9a227, // Balatro gold
        description: 'F = ma',
        trait: '표준 물리 법칙이 지배한다',
        tip: '3분간 생존하세요!',
    },
    // Additional stages will be added here after redesign
]

export function getStageById(id: string): StageConfig | undefined {
    return STAGES.find((s) => s.id === id)
}

export function getDefaultStage(): StageConfig {
    return STAGES[0]
}

/**
 * Apply physics modifiers to velocity
 */
export function applyGravity(
    vy: number,
    delta: number,
    gravity: number,
    scale: number = 1
): number {
    if (gravity > 0) {
        return vy + gravity * delta * 60 * scale
    }
    return vy
}

export function applyVortex(
    x: number,
    y: number,
    vx: number,
    vy: number,
    width: number,
    height: number,
    vortex: { center: { x: number; y: number }; strength: number },
    delta: number,
    minDist: number = 50
): { vx: number; vy: number } {
    const centerX = width * vortex.center.x
    const centerY = height * vortex.center.y
    const dx = centerX - x
    const dy = centerY - y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > minDist) {
        const force = (vortex.strength / (dist * 0.01)) * delta
        return {
            vx: vx + (dx / dist) * force,
            vy: vy + (dy / dist) * force,
        }
    }
    return { vx, vy }
}
