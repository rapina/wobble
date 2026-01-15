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
    animOffset: number // Random offset for varied animation
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

// Orb colors by XP value (brighter, more saturated)
function getOrbColor(xpValue: number): number {
    if (xpValue >= 25) return 0xffd700 // Gold for boss
    if (xpValue >= 8) return 0xd946ef // Vibrant purple for large
    if (xpValue >= 3) return 0x38bdf8 // Bright sky blue for medium
    return 0x4ade80 // Bright green for small
}

function getOrbSize(xpValue: number): number {
    if (xpValue >= 25) return 14
    if (xpValue >= 8) return 12
    if (xpValue >= 3) return 10
    return 8
}

export interface ExperienceOrbSystemOptions {
    poolSize?: number
    magnetRadius?: number
    collectRadius?: number
}

// Black hole info for vortex stage
export interface BlackHoleInfo {
    x: number
    y: number
    pullRadius: number
    consumeRadius: number
}

const DEFAULT_OPTIONS: Required<ExperienceOrbSystemOptions> = {
    poolSize: 100,
    magnetRadius: 120, // Start attracting at this distance
    collectRadius: 30, // Collect when this close
}

export class ExperienceOrbSystem {
    private context: ExperienceOrbSystemContext
    private pool: Graphics[] = []
    private _orbs: ExperienceOrb[] = []
    private poolSize: number

    /** Public accessor for orbs (used by coordinate reset) */
    get orbs(): ExperienceOrb[] {
        return this._orbs
    }
    private magnetRadius: number
    private collectRadius: number

    // Callback when XP is collected
    onXpCollected?: (xp: number, totalXp: number) => void

    private totalXpCollected = 0

    // Merge timer - check for merging periodically
    private mergeTimer = 0
    private readonly MERGE_INTERVAL = 0.5 // Check every 0.5 seconds
    private readonly MERGE_RADIUS = 25 // Orbs within this distance will merge
    private readonly MAX_ORBS = 50 // Start merging aggressively if above this count

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
        if (this._orbs.length > 0) {
            const oldest = this._orbs.shift()!
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

        // Redraw with gem-like appearance
        graphics.clear()

        // Outer glow (soft halo)
        graphics.circle(0, 0, orbSize * 1.3)
        graphics.fill({ color: orbColor, alpha: 0.25 })

        // Main gem body (hexagon for crystal look)
        const sides = 6
        const points: number[] = []
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
            points.push(Math.cos(angle) * orbSize)
            points.push(Math.sin(angle) * orbSize)
        }
        graphics.poly(points)
        graphics.fill(orbColor)
        graphics.poly(points)
        graphics.stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 })

        // Inner bright core (star-like sparkle)
        const coreSize = orbSize * 0.5
        graphics.moveTo(0, -coreSize)
        graphics.lineTo(coreSize * 0.3, -coreSize * 0.3)
        graphics.lineTo(coreSize, 0)
        graphics.lineTo(coreSize * 0.3, coreSize * 0.3)
        graphics.lineTo(0, coreSize)
        graphics.lineTo(-coreSize * 0.3, coreSize * 0.3)
        graphics.lineTo(-coreSize, 0)
        graphics.lineTo(-coreSize * 0.3, -coreSize * 0.3)
        graphics.closePath()
        graphics.fill({ color: 0xffffff, alpha: 0.9 })

        // Top highlight for 3D effect
        graphics.circle(-orbSize * 0.3, -orbSize * 0.3, orbSize * 0.25)
        graphics.fill({ color: 0xffffff, alpha: 0.7 })

        // Random burst direction
        const angle = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 3

        graphics.position.set(x, y)
        graphics.visible = true
        graphics.alpha = 1
        graphics.scale.set(1)

        this._orbs.push({
            graphics,
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2, // Initial upward burst
            xpValue,
            life: 8, // 8 seconds lifetime
            maxLife: 8,
            collected: false,
            collectSpeed: 0,
            animOffset: Math.random() * Math.PI * 2, // Random phase for varied animation
        })
    }

    /**
     * Merge nearby orbs to reduce count and improve performance
     */
    private mergeNearbyOrbs(): void {
        // Use larger merge radius if too many orbs
        const mergeRadius =
            this._orbs.length > this.MAX_ORBS ? this.MERGE_RADIUS * 1.5 : this.MERGE_RADIUS

        // Track which orbs have been merged (to skip them)
        const merged = new Set<number>()

        for (let i = 0; i < this._orbs.length; i++) {
            if (merged.has(i)) continue

            const orbA = this._orbs[i]

            // Don't merge orbs that are being collected
            if (orbA.collectSpeed > 0) continue

            for (let j = i + 1; j < this._orbs.length; j++) {
                if (merged.has(j)) continue

                const orbB = this._orbs[j]

                // Don't merge orbs that are being collected
                if (orbB.collectSpeed > 0) continue

                const dx = orbA.x - orbB.x
                const dy = orbA.y - orbB.y
                const dist = Math.sqrt(dx * dx + dy * dy)

                if (dist < mergeRadius) {
                    // Merge B into A
                    orbA.xpValue += orbB.xpValue

                    // Average position weighted by XP
                    const totalXp = orbA.xpValue
                    const weightB = orbB.xpValue / totalXp
                    orbA.x = orbA.x * (1 - weightB) + orbB.x * weightB
                    orbA.y = orbA.y * (1 - weightB) + orbB.y * weightB

                    // Refresh life (bonus for merging)
                    orbA.life = Math.min(orbA.life + 2, orbA.maxLife)

                    // Update graphics size based on new XP value
                    this.updateOrbGraphics(orbA)

                    merged.add(j)
                }
            }
        }

        // Remove merged orbs (iterate backwards)
        const mergedIndices = Array.from(merged).sort((a, b) => b - a)
        for (const idx of mergedIndices) {
            this.releaseOrb(this._orbs[idx].graphics)
            this._orbs.splice(idx, 1)
        }
    }

    /**
     * Update orb graphics after merge (new size/color)
     */
    private updateOrbGraphics(orb: ExperienceOrb): void {
        const orbColor = getOrbColor(orb.xpValue)
        const orbSize = getOrbSize(orb.xpValue)
        const graphics = orb.graphics

        graphics.clear()

        // Outer glow
        graphics.circle(0, 0, orbSize * 1.3)
        graphics.fill({ color: orbColor, alpha: 0.25 })

        // Main gem body (hexagon)
        const sides = 6
        const points: number[] = []
        for (let i = 0; i < sides; i++) {
            const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
            points.push(Math.cos(angle) * orbSize)
            points.push(Math.sin(angle) * orbSize)
        }
        graphics.poly(points)
        graphics.fill(orbColor)
        graphics.poly(points)
        graphics.stroke({ color: 0xffffff, width: 1.5, alpha: 0.6 })

        // Inner bright core
        const coreSize = orbSize * 0.5
        graphics.moveTo(0, -coreSize)
        graphics.lineTo(coreSize * 0.3, -coreSize * 0.3)
        graphics.lineTo(coreSize, 0)
        graphics.lineTo(coreSize * 0.3, coreSize * 0.3)
        graphics.lineTo(0, coreSize)
        graphics.lineTo(-coreSize * 0.3, coreSize * 0.3)
        graphics.lineTo(-coreSize, 0)
        graphics.lineTo(-coreSize * 0.3, -coreSize * 0.3)
        graphics.closePath()
        graphics.fill({ color: 0xffffff, alpha: 0.9 })

        // Top highlight
        graphics.circle(-orbSize * 0.3, -orbSize * 0.3, orbSize * 0.25)
        graphics.fill({ color: 0xffffff, alpha: 0.7 })
    }

    /**
     * Update orbs and check collection
     * @param blackHole Optional black hole that sucks in orbs (for vortex stage)
     */
    update(
        deltaSeconds: number,
        playerX: number,
        playerY: number,
        blackHole?: BlackHoleInfo
    ): void {
        // Periodically merge nearby orbs
        this.mergeTimer += deltaSeconds
        if (this.mergeTimer >= this.MERGE_INTERVAL) {
            this.mergeTimer = 0
            if (this._orbs.length > 10) {
                // Only merge if there are enough orbs
                this.mergeNearbyOrbs()
            }
        }

        for (let i = this._orbs.length - 1; i >= 0; i--) {
            const orb = this._orbs[i]

            // Decrease lifetime
            orb.life -= deltaSeconds

            if (orb.life <= 0) {
                this.releaseOrb(orb.graphics)
                this._orbs.splice(i, 1)
                continue
            }

            // Calculate distance to player
            const dx = playerX - orb.x
            const dy = playerY - orb.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            // Check collection by player
            if (dist < this.collectRadius) {
                this.collectOrb(orb, i)
                continue
            }

            // Black hole attraction (takes priority over player magnet)
            if (blackHole) {
                const bhDx = blackHole.x - orb.x
                const bhDy = blackHole.y - orb.y
                const bhDist = Math.sqrt(bhDx * bhDx + bhDy * bhDy)

                // Check if consumed by black hole
                if (bhDist < blackHole.consumeRadius) {
                    // Sucked into the void - destroy without giving XP
                    this.consumeOrb(orb, i)
                    continue
                }

                // Strong pull toward black hole
                if (bhDist < blackHole.pullRadius) {
                    const pullStrength = 1 - bhDist / blackHole.pullRadius
                    const pullForce = pullStrength * 8 // Stronger than player magnet

                    const nx = bhDx / bhDist
                    const ny = bhDy / bhDist

                    // Apply accelerating pull
                    orb.vx += nx * pullForce * deltaSeconds * 60
                    orb.vy += ny * pullForce * deltaSeconds * 60

                    // Speed cap
                    const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy)
                    if (speed > 12) {
                        orb.vx = (orb.vx / speed) * 12
                        orb.vy = (orb.vy / speed) * 12
                    }

                    // Move
                    orb.x += orb.vx
                    orb.y += orb.vy

                    // Update graphics with spiral effect
                    const spiralAngle =
                        Math.atan2(bhDy, bhDx) + (1 - bhDist / blackHole.pullRadius) * Math.PI
                    const bobAmount = Math.sin((orb.maxLife - orb.life) * 8 + orb.animOffset) * 3
                    orb.graphics.position.set(orb.x + Math.cos(spiralAngle) * 2, orb.y + bobAmount)
                    orb.graphics.rotation += deltaSeconds * 5 // Fast spin when being sucked

                    // Shrinking effect as it gets closer
                    const shrink = 0.5 + (bhDist / blackHole.pullRadius) * 0.5
                    orb.graphics.scale.set(shrink)

                    // Darker alpha
                    orb.graphics.alpha = 0.5 + (bhDist / blackHole.pullRadius) * 0.5
                    continue
                }
            }

            // Magnetic attraction to player when close
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

            // Infinite map - no wall boundaries
            // Orbs can move freely in world space

            // Update graphics position with gentle bobbing
            const bobAmount = Math.sin((orb.maxLife - orb.life) * 4 + orb.animOffset) * 2
            orb.graphics.position.set(orb.x, orb.y + bobAmount)

            // Gentle rotation
            orb.graphics.rotation = Math.sin((orb.maxLife - orb.life) * 2 + orb.animOffset) * 0.3

            // Pulse effect (scale breathing)
            const pulse = 1 + Math.sin((orb.maxLife - orb.life) * 8 + orb.animOffset) * 0.15
            orb.graphics.scale.set(pulse)

            // Sparkle effect - alpha variation
            const sparkle =
                0.85 + Math.sin((orb.maxLife - orb.life) * 12 + orb.animOffset * 2) * 0.15
            orb.graphics.alpha = sparkle

            // Fade out in last 2 seconds (override sparkle)
            if (orb.life < 2) {
                orb.graphics.alpha = (orb.life / 2) * sparkle
            }
        }
    }

    /**
     * Consume an orb (sucked into black hole - no XP)
     */
    private consumeOrb(orb: ExperienceOrb, index: number): void {
        // Visual feedback - shrink and disappear
        orb.graphics.scale.set(0.2)
        orb.graphics.alpha = 0.3

        this.releaseOrb(orb.graphics)
        this._orbs.splice(index, 1)
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
        this._orbs.splice(index, 1)
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
        return this._orbs.length
    }

    /**
     * Reset the system
     */
    reset(): void {
        for (const orb of this._orbs) {
            this.releaseOrb(orb.graphics)
        }
        this._orbs = []
        this.totalXpCollected = 0
        this.mergeTimer = 0
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
