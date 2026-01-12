/**
 * Physics Modifiers System
 * Each stage applies different physics rules to create unique gameplay
 */

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
    name: string
    nameKo: string
    icon: string
    physics: PhysicsModifiers
    formula: string // Related physics formula ID (app connection)
    bgColor: number // Background color
    particleColor: number // Particle/effect color
    description: string // Physics formula
    trait: string // Gameplay characteristic description
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
        name: 'Normal',
        nameKo: '균형의 세계',
        icon: '~',
        physics: {
            gravity: 0,
            friction: 0.98,
            bounce: 0,
            knockbackMult: 1,
        },
        formula: 'newton-second',
        bgColor: 0x87ceeb,
        particleColor: 0xffffff,
        description: 'F = ma',
        trait: '표준 물리 법칙이 지배한다',
    },
    {
        id: 'low-gravity',
        name: 'Low Gravity',
        nameKo: '인력의 세계',
        icon: '!',
        physics: {
            gravity: 0.15,
            friction: 0.995,
            bounce: 0,
            knockbackMult: 1.5,
        },
        formula: 'free-fall',
        bgColor: 0x1a1a2e,
        particleColor: 0xaaaaff,
        description: 'h = 1/2 gt^2',
        trait: '탄환이 적의 중력에 이끌린다',
    },
    {
        id: 'elastic',
        name: 'Elastic',
        nameKo: '반발의 세계',
        icon: '%',
        physics: {
            gravity: 0,
            friction: 0.98,
            bounce: 0.85,
            knockbackMult: 1.8,
        },
        formula: 'hooke',
        bgColor: 0xff69b4,
        particleColor: 0xffaacc,
        description: 'F = -kx',
        trait: '모든 것이 튕겨나간다',
    },
    {
        id: 'momentum',
        name: 'Momentum',
        nameKo: '질량의 세계',
        icon: '@',
        physics: {
            gravity: 0,
            friction: 0.92,
            bounce: 0.3,
            knockbackMult: 0.4,
        },
        formula: 'momentum',
        bgColor: 0x4a4a4a,
        particleColor: 0xffaa00,
        description: 'p = mv',
        trait: '무거운 자가 승리한다',
    },
    {
        id: 'vortex',
        name: 'Vortex',
        nameKo: '심연의 세계',
        icon: '#',
        physics: {
            gravity: 0,
            friction: 0.98,
            bounce: 0,
            knockbackMult: 1,
            vortexCenter: { x: 0.5, y: 0.5 },
            vortexStrength: 0.25,
        },
        formula: 'centripetal',
        bgColor: 0x2d1b4e,
        particleColor: 0xaa44ff,
        description: 'F = mv^2/r',
        trait: '중심이 모든 것을 삼킨다',
    },
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
