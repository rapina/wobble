import { Container, Graphics } from 'pixi.js'

interface GravityWellSystemContext {
    container: Container
    width: number
    height: number
}

interface GravityWell {
    x: number
    y: number
    targetX: number
    targetY: number
    radius: number // Visual radius
    pullRadius: number // Pull effect radius
    pullStrength: number
    phase: number // Animation phase
    moveTimer: number
}

interface GravityWellConfig {
    wellCount: number
    minRadius: number
    maxRadius: number
    pullRadiusMultiplier: number
    pullStrength: number
    moveSpeed: number
    moveInterval: number
}

const DEFAULT_CONFIG: GravityWellConfig = {
    wellCount: 3,
    minRadius: 20,
    maxRadius: 35,
    pullRadiusMultiplier: 4, // pullRadius = radius * this
    pullStrength: 0.8,
    moveSpeed: 25,
    moveInterval: 6,
}

export class GravityWellSystem {
    private context: GravityWellSystemContext
    private config: GravityWellConfig
    private wells: GravityWell[] = []
    private graphics: Graphics
    private isActive = false
    private animTime = 0

    constructor(context: GravityWellSystemContext, config?: Partial<GravityWellConfig>) {
        this.context = context
        this.config = { ...DEFAULT_CONFIG, ...config }

        this.graphics = new Graphics()
        this.context.container.addChild(this.graphics)
        this.graphics.visible = false
    }

    updateContext(context: Partial<GravityWellSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    activate(): void {
        this.isActive = true
        this.graphics.visible = true
        this.createWells()
    }

    deactivate(): void {
        this.isActive = false
        this.graphics.visible = false
        this.wells = []
    }

    getIsActive(): boolean {
        return this.isActive
    }

    getWells(): GravityWell[] {
        return this.wells
    }

    private createWells(): void {
        this.wells = []
        const margin = 80

        for (let i = 0; i < this.config.wellCount; i++) {
            const radius = this.config.minRadius + Math.random() * (this.config.maxRadius - this.config.minRadius)
            const x = margin + Math.random() * (this.context.width - margin * 2)
            const y = margin + Math.random() * (this.context.height - margin * 2)

            this.wells.push({
                x,
                y,
                targetX: x,
                targetY: y,
                radius,
                pullRadius: radius * this.config.pullRadiusMultiplier,
                pullStrength: this.config.pullStrength,
                phase: Math.random() * Math.PI * 2,
                moveTimer: Math.random() * this.config.moveInterval,
            })
        }
    }

    update(deltaSeconds: number): void {
        if (!this.isActive) return

        this.animTime += deltaSeconds

        for (const well of this.wells) {
            // Update animation phase
            well.phase += deltaSeconds * 2

            // Update movement timer
            well.moveTimer += deltaSeconds
            if (well.moveTimer >= this.config.moveInterval) {
                well.moveTimer = 0
                this.pickNewTarget(well)
            }

            // Move toward target
            const dx = well.targetX - well.x
            const dy = well.targetY - well.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist > 5) {
                const speed = this.config.moveSpeed * deltaSeconds
                well.x += (dx / dist) * Math.min(speed, dist)
                well.y += (dy / dist) * Math.min(speed, dist)
            }
        }

        this.draw()
    }

    private pickNewTarget(well: GravityWell): void {
        const margin = 80
        well.targetX = margin + Math.random() * (this.context.width - margin * 2)
        well.targetY = margin + Math.random() * (this.context.height - margin * 2)
    }

    /**
     * Apply gravity pull to an object (enemies/projectiles)
     * Returns the velocity adjustment
     */
    applyGravityPull(x: number, y: number, vx: number, vy: number, deltaSeconds: number): { vx: number; vy: number } {
        if (!this.isActive) return { vx, vy }

        let newVx = vx
        let newVy = vy

        for (const well of this.wells) {
            const dx = well.x - x
            const dy = well.y - y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < well.pullRadius && dist > well.radius) {
                // Calculate pull strength (stronger when closer)
                const normalizedDist = (dist - well.radius) / (well.pullRadius - well.radius)
                const strength = (1 - normalizedDist) * well.pullStrength

                // Apply pull toward well center
                const pullForce = strength * deltaSeconds * 60
                newVx += (dx / dist) * pullForce
                newVy += (dy / dist) * pullForce
            }
        }

        return { vx: newVx, vy: newVy }
    }

    /**
     * Get player speed multiplier based on proximity to gravity wells
     * Player can escape but moves slower near wells
     * Returns a value between 0.6 (very close) and 1.0 (outside range)
     */
    getPlayerSpeedMultiplier(playerX: number, playerY: number): number {
        if (!this.isActive) return 1.0

        let maxSlowdown = 0

        for (const well of this.wells) {
            const dx = well.x - playerX
            const dy = well.y - playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < well.pullRadius) {
                // Closer = more slowdown
                const normalizedDist = dist / well.pullRadius
                const slowdown = Math.pow(1 - normalizedDist, 1.5) // Exponential slowdown
                maxSlowdown = Math.max(maxSlowdown, slowdown)
            }
        }

        // Speed ranges from 1.0 (no slowdown) to 0.6 (max slowdown near center)
        // Player should always be able to escape with effort
        return 1.0 - maxSlowdown * 0.4
    }

    /**
     * Apply drift toward nearest well
     * - Noticeable pull that affects idle player
     * - Moving player can always escape with effort
     * Returns velocity nudge
     */
    applyPlayerDrift(playerX: number, playerY: number, deltaSeconds: number): { dvx: number; dvy: number } {
        if (!this.isActive) return { dvx: 0, dvy: 0 }

        let dvx = 0
        let dvy = 0

        for (const well of this.wells) {
            const dx = well.x - playerX
            const dy = well.y - playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < well.pullRadius && dist > well.radius) {
                // Gentle drift - noticeable but always escapable
                const normalizedDist = (dist - well.radius) / (well.pullRadius - well.radius)
                const driftStrength = (1 - normalizedDist) * 0.15 // Reduced from 0.5

                dvx += (dx / dist) * driftStrength * deltaSeconds * 60
                dvy += (dy / dist) * driftStrength * deltaSeconds * 60
            }
        }

        return { dvx, dvy }
    }

    /**
     * Check if player is near any gravity well (for visual effects)
     * Returns max proximity effect (0-1)
     */
    getPlayerProximityEffect(playerX: number, playerY: number): number {
        if (!this.isActive) return 0

        let maxEffect = 0

        for (const well of this.wells) {
            const dx = well.x - playerX
            const dy = well.y - playerY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < well.pullRadius) {
                const effect = Math.pow(1 - dist / well.pullRadius, 1.5)
                maxEffect = Math.max(maxEffect, effect)
            }
        }

        return maxEffect * 0.5 // Less intense than black hole
    }

    private draw(): void {
        this.graphics.clear()

        for (const well of this.wells) {
            const pulse = 1 + Math.sin(well.phase) * 0.1

            // Draw pull radius indicator (very subtle)
            this.graphics.circle(well.x, well.y, well.pullRadius)
            this.graphics.stroke({ color: 0x6666ff, width: 1, alpha: 0.1 })

            // Draw outer glow rings
            for (let i = 3; i >= 0; i--) {
                const ringRadius = (well.radius + i * 8) * pulse
                const alpha = 0.15 - i * 0.03
                this.graphics.circle(well.x, well.y, ringRadius)
                this.graphics.fill({ color: 0x4444aa, alpha })
            }

            // Draw swirling particles around well
            const particleCount = 6
            for (let i = 0; i < particleCount; i++) {
                const angle = well.phase * 1.5 + (i * Math.PI * 2) / particleCount
                const orbitRadius = well.radius * 1.5 * pulse
                const px = well.x + Math.cos(angle) * orbitRadius
                const py = well.y + Math.sin(angle) * orbitRadius
                this.graphics.circle(px, py, 3)
                this.graphics.fill({ color: 0xaaaaff, alpha: 0.6 })
            }

            // Draw core
            this.graphics.circle(well.x, well.y, well.radius * pulse)
            this.graphics.fill({ color: 0x2222aa, alpha: 0.8 })

            // Draw bright center
            this.graphics.circle(well.x, well.y, well.radius * 0.4 * pulse)
            this.graphics.fill({ color: 0x6666ff, alpha: 0.9 })

            // Draw highlight
            this.graphics.circle(well.x - well.radius * 0.2, well.y - well.radius * 0.2, well.radius * 0.2)
            this.graphics.fill({ color: 0xffffff, alpha: 0.4 })
        }
    }

    reset(): void {
        this.deactivate()
        this.animTime = 0
    }

    destroy(): void {
        this.context.container.removeChild(this.graphics)
        this.graphics.destroy()
    }
}
