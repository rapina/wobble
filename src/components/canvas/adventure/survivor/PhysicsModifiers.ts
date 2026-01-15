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
        icon: '~',
        physics: {
            gravity: 0,
            friction: 0.98,
            bounce: 0,
            knockbackMult: 1,
        },
        formula: 'newton-second',
        bgColor: 0x3d6b59, // Balatro felt green
        particleColor: 0xc9a227, // Balatro gold
        description: 'F = ma',
        trait: '표준 물리 법칙이 지배한다',
        tip: '3분간 생존하세요!',
    },
    {
        id: 'low-gravity',
        name: { ko: '끌어당기는 자', en: 'Gravity Wells' },
        icon: '◎',
        physics: {
            gravity: 0.15,
            friction: 0.995,
            bounce: 0,
            knockbackMult: 1.5,
        },
        formula: 'free-fall',
        bgColor: 0x1a1a2e, // Balatro deep dark
        particleColor: 0x4a9eff, // Balatro blue
        description: 'h = ½gt²',
        trait: '중력체가 모든 것을 끌어당긴다',
        tip: '중력체에 가까이 가면 끌려갑니다',
    },
    {
        id: 'elastic',
        name: { ko: '튕겨내는 자', en: 'Repulsion' },
        icon: '◇',
        physics: {
            gravity: 0,
            friction: 0.98,
            bounce: 0.85,
            knockbackMult: 1.8,
        },
        formula: 'hooke',
        bgColor: 0x4d3d5a, // Balatro purple-tinted felt
        particleColor: 0xff6b9d, // Balatro pink
        description: 'F = -kx',
        trait: '반발 장벽이 모든 것을 튕겨낸다',
        tip: '장벽에 부딪히면 튕겨납니다',
    },
    {
        id: 'momentum',
        name: { ko: '밀어붙이는 자', en: 'Crushers' },
        icon: '▣',
        physics: {
            gravity: 0,
            friction: 0.92,
            bounce: 0.3,
            knockbackMult: 0.4,
        },
        formula: 'momentum',
        bgColor: 0x374244, // Balatro dark panel
        particleColor: 0xc9a227, // Balatro gold
        description: 'p = mv',
        trait: '거대한 파괴자가 밀어붙인다',
        tip: '경고 표시가 보이면 피하세요!',
    },
    {
        id: 'vortex',
        name: { ko: '삼켜버리는 자', en: 'Devourer' },
        icon: '●',
        physics: {
            gravity: 0,
            friction: 0.98,
            bounce: 0,
            knockbackMult: 1,
            vortexCenter: { x: 0.5, y: 0.5 },
            vortexStrength: 0.25,
        },
        formula: 'centripetal',
        bgColor: 0x2d1a3e, // Balatro deep purple
        particleColor: 0xe85d4c, // Balatro red
        description: 'F = mv²/r',
        trait: '블랙홀이 모든 것을 삼킨다',
        tip: '블랙홀에 가까워지면 데미지!',
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
