import { Container, Graphics } from 'pixi.js'
import { EnemyTier } from './types'

export interface ExperienceOrb {
    graphics: Graphics
    x: number
    y: number
    vx: number
    vy: number
    xpValue: number
    life: number
    maxLife: number
    collected: boolean
    collectSpeed: number
}

interface ExperienceOrbSystemContext {
    container: Container
    width: number
    height: number
}

// XP values by enemy tier
const TIER_XP_VALUES: Record<EnemyTier, number> = {
    small: 1,
    medium: 3,
    large: 8,
    boss: 25,
}

// Orb colors by XP value
function getOrbColor(xpValue: number): number {
    if (xpValue >= 25) return 0xffd700 // Gold for boss
    if (xpValue >= 8) return 0x9b59b6 // Purple for large
    if (xpValue >= 3) return 0x3498db // Blue for medium
    return 0x2ecc71 // Green for small
}

function getOrbSize(xpValue: number): number {
    if (xpValue >= 25) return 12
    if (xpValue >= 8) return 10
    if (xpValue >= 3) return 8
    return 6
}

export interface ExperienceOrbSystemOptions {
    poolSize?: number
    magnetRadius?: number
    collectRadius?: number
}

const DEFAULT_OPTIONS: Required<ExperienceOrbSystemOptions> = {
    poolSize: 100,
    magnetRadius: 100, // Start attracting at this distance
    collectRadius: 20, // Collect when this close
}

export class ExperienceOrbSystem {
    private context: ExperienceOrbSystemContext
    private pool: Graphics[] = []
    private orbs: ExperienceOrb[] = []
    private poolSize: number
    private magnetRadius: number
    private collectRadius: number

    // Callback when XP is collected
    onXpCollected?: (xp: number, totalXp: number) => void

    private totalXpCollected = 0

    constructor(context: ExperienceOrbSystemContext, options?: ExperienceOrbSystemOptions) {
        this.context = context
        this.poolSize = options?.poolSize ?? DEFAULT_OPTIONS.poolSize
        this.magnetRadius = options?.magnetRadius ?? DEFAULT_OPTIONS.magnetRadius
        this.collectRadius = options?.collectRadius ?? DEFAULT_OPTIONS.collectRadius

        this.initializePool()
    }

    private initializePool(): void {
        for (let i = 0; i < this.poolSize; i++) {
            const orb = this.createOrbGraphic()
            orb.visible = false
            this.context.container.addChild(orb)
            this.pool.push(orb)
        }
    }

    private createOrbGraphic(): Graphics {
        const g = new Graphics()
        // Diamond shape for XP orbs
        g.moveTo(0, -6)
        g.lineTo(4, 0)
        g.lineTo(0, 6)
        g.lineTo(-4, 0)
        g.closePath()
        g.fill(0x2ecc71)
        return g
    }

    private acquireOrb(): Graphics | null {
        if (this.pool.length > 0) {
            return this.pool.pop()!
        }
        // Pool exhausted - recycle oldest
        if (this.orbs.length > 0) {
            const oldest = this.orbs.shift()!
            oldest.graphics.visible = false
            return oldest.graphics
        }
        return null
    }

    private releaseOrb(graphics: Graphics): void {
        graphics.visible = false
        this.pool.push(graphics)
    }

    updateContext(context: Partial<ExperienceOrbSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    /**
     * Spawn XP orbs when an enemy dies
     */
    spawnFromEnemy(x: number, y: number, tier: EnemyTier): void {
        const xpValue = TIER_XP_VALUES[tier]
        const color = getOrbColor(xpValue)
        const size = getOrbSize(xpValue)

        // Spawn multiple smaller orbs for larger enemies
        const orbCount = tier === 'boss' ? 5 : tier === 'large' ? 3 : tier === 'medium' ? 2 : 1
        const xpPerOrb = Math.ceil(xpValue / orbCount)

        for (let i = 0; i < orbCount; i++) {
            this.spawn(x, y, xpPerOrb, color, size)
        }
    }

    /**
     * Spawn a single XP orb
     */
    spawn(x: number, y: number, xpValue: number, color?: number, size?: number): void {
        const graphics = this.acquireOrb()
        if (!graphics) return

        const orbColor = color ?? getOrbColor(xpValue)
        const orbSize = size ?? getOrbSize(xpValue)

        // Redraw with correct color and size
        graphics.clear()
        graphics.moveTo(0, -orbSize)
        graphics.lineTo(orbSize * 0.67, 0)
        graphics.lineTo(0, orbSize)
        graphics.lineTo(-orbSize * 0.67, 0)
        graphics.closePath()
        graphics.fill(orbColor)

        // Add glow effect
        graphics.circle(0, 0, orbSize * 0.5)
        graphics.fill({ color: 0xffffff, alpha: 0.5 })

        // Random burst direction
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 3

        graphics.position.set(x, y)
        graphics.visible = true
        graphics.alpha = 1
        graphics.scale.set(1)

        this.orbs.push({
            graphics,
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2, // Initial upward burst
            xpValue,
            life: 30, // 30 seconds lifetime
            maxLife: 30,
            collected: false,
            collectSpeed: 0,
        })
    }

    /**
     * Update orbs and check collection
     */
    update(deltaSeconds: number, playerX: number, playerY: number): void {
        for (let i = this.orbs.length - 1; i >= 0; i--) {
            const orb = this.orbs[i]

            // Decrease lifetime
            orb.life -= deltaSeconds

            if (orb.life <= 0) {
                this.releaseOrb(orb.graphics)
                this.orbs.splice(i, 1)
                continue
            }

            // Calculate distance to player
            const dx = playerX - orb.x
            const dy = playerY - orb.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Check collection
            if (dist < this.collectRadius) {
                this.collectOrb(orb, i)
                continue
            }

            // Magnetic attraction when close
            if (dist < this.magnetRadius) {
                // Accelerate towards player
                const magnetStrength = 1 - dist / this.magnetRadius
                orb.collectSpeed = Math.min(
                    orb.collectSpeed + magnetStrength * 20 * deltaSeconds,
                    15
                )

                const nx = dx / dist
                const ny = dy / dist
                orb.vx = nx * orb.collectSpeed
                orb.vy = ny * orb.collectSpeed
            } else {
                // Natural movement (slow down)
                orb.vx *= 0.95
                orb.vy *= 0.95

                // Slight gravity
                orb.vy += 0.5 * deltaSeconds
            }

            // Move
            orb.x += orb.vx
            orb.y += orb.vy

            // Bounce off walls
            if (orb.x < 10) {
                orb.x = 10
                orb.vx *= -0.5
            } else if (orb.x > this.context.width - 10) {
                orb.x = this.context.width - 10
                orb.vx *= -0.5
            }
            if (orb.y < 10) {
                orb.y = 10
                orb.vy *= -0.5
            } else if (orb.y > this.context.height - 10) {
                orb.y = this.context.height - 10
                orb.vy *= -0.5
            }

            // Update graphics
            orb.graphics.position.set(orb.x, orb.y)

            // Pulse effect
            const pulse = 1 + Math.sin(orb.life * 10) * 0.1
            orb.graphics.scale.set(pulse)

            // Fade out in last 3 seconds
            if (orb.life < 3) {
                orb.graphics.alpha = orb.life / 3
            }
        }
    }

    private collectOrb(orb: ExperienceOrb, index: number): void {
        this.totalXpCollected += orb.xpValue

        if (this.onXpCollected) {
            this.onXpCollected(orb.xpValue, this.totalXpCollected)
        }

        // Visual feedback - scale up briefly then disappear
        orb.graphics.scale.set(1.5)
        orb.graphics.alpha = 0.5

        this.releaseOrb(orb.graphics)
        this.orbs.splice(index, 1)
    }

    /**
     * Get total XP collected
     */
    getTotalXp(): number {
        return this.totalXpCollected
    }

    /**
     * Get active orb count
     */
    getActiveCount(): number {
        return this.orbs.length
    }

    /**
     * Reset the system
     */
    reset(): void {
        for (const orb of this.orbs) {
            this.releaseOrb(orb.graphics)
        }
        this.orbs = []
        this.totalXpCollected = 0
    }

    /**
     * Destroy the system
     */
    destroy(): void {
        this.reset()
        for (const orb of this.pool) {
            this.context.container.removeChild(orb)
            orb.destroy()
        }
        this.pool = []
    }
}
