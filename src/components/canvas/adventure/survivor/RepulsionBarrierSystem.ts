import { Container, Graphics } from 'pixi.js'

interface RepulsionBarrierSystemContext {
    container: Container
    width: number
    height: number
}

interface RepulsionBarrier {
    x: number
    y: number
    width: number
    height: number
    angle: number // Rotation angle
    targetAngle: number
    bounceStrength: number
    phase: number
    pulsePhase: number
}

interface RepulsionBarrierConfig {
    barrierCount: number
    minWidth: number
    maxWidth: number
    height: number
    bounceStrength: number
    rotationSpeed: number
    rotationInterval: number
    spawnDistance: number // distance from player when spawned
    maxDistance: number // respawn if further than this from player
}

const DEFAULT_CONFIG: RepulsionBarrierConfig = {
    barrierCount: 4,
    minWidth: 60,
    maxWidth: 100,
    height: 12,
    bounceStrength: 1.2,
    rotationSpeed: 0.5,
    rotationInterval: 4,
    spawnDistance: 200, // spawn 200px from player
    maxDistance: 400, // respawn if > 400px away
}

export class RepulsionBarrierSystem {
    private context: RepulsionBarrierSystemContext
    private config: RepulsionBarrierConfig
    private barriers: RepulsionBarrier[] = []
    private graphics: Graphics
    private isActive = false
    private animTime = 0

    // Player position reference
    private playerX = 0
    private playerY = 0

    constructor(context: RepulsionBarrierSystemContext, config?: Partial<RepulsionBarrierConfig>) {
        this.context = context
        this.config = { ...DEFAULT_CONFIG, ...config }

        this.graphics = new Graphics()
        this.context.container.addChild(this.graphics)
        this.graphics.visible = false
    }

    updateContext(context: Partial<RepulsionBarrierSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    activate(playerX: number, playerY: number): void {
        this.isActive = true
        this.playerX = playerX
        this.playerY = playerY
        this.graphics.visible = true
        this.createBarriers()
    }

    deactivate(): void {
        this.isActive = false
        this.graphics.visible = false
        this.barriers = []
    }

    getIsActive(): boolean {
        return this.isActive
    }

    getBarriers(): RepulsionBarrier[] {
        return this.barriers
    }

    private createBarriers(): void {
        this.barriers = []

        for (let i = 0; i < this.config.barrierCount; i++) {
            this.barriers.push(this.createBarrier())
        }
    }

    private createBarrier(): RepulsionBarrier {
        const width =
            this.config.minWidth + Math.random() * (this.config.maxWidth - this.config.minWidth)
        // Spawn at random angle around player (infinite map)
        const spawnAngle = Math.random() * Math.PI * 2
        const distance = this.config.spawnDistance * (0.5 + Math.random() * 0.5)
        const x = this.playerX + Math.cos(spawnAngle) * distance
        const y = this.playerY + Math.sin(spawnAngle) * distance
        const angle = Math.random() * Math.PI * 2

        return {
            x,
            y,
            width,
            height: this.config.height,
            angle,
            targetAngle: angle,
            bounceStrength: this.config.bounceStrength,
            phase: Math.random() * Math.PI * 2,
            pulsePhase: Math.random() * Math.PI * 2,
        }
    }

    update(deltaSeconds: number, playerX: number, playerY: number): void {
        if (!this.isActive) return

        // Track player position
        this.playerX = playerX
        this.playerY = playerY

        this.animTime += deltaSeconds

        for (let i = 0; i < this.barriers.length; i++) {
            const barrier = this.barriers[i]
            barrier.phase += deltaSeconds
            barrier.pulsePhase += deltaSeconds * 3

            // Check if should pick new rotation target
            if (barrier.phase >= this.config.rotationInterval) {
                barrier.phase = 0
                barrier.targetAngle = barrier.angle + (Math.random() - 0.5) * Math.PI
            }

            // Rotate toward target angle
            const angleDiff = barrier.targetAngle - barrier.angle
            barrier.angle += angleDiff * this.config.rotationSpeed * deltaSeconds

            // Respawn if too far from player (infinite map)
            const dx = barrier.x - playerX
            const dy = barrier.y - playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > this.config.maxDistance) {
                this.barriers[i] = this.createBarrier()
            }
        }

        this.draw()
    }

    /**
     * Check collision with barriers and apply bounce
     * Returns new velocity if bounced, null if no collision
     */
    checkCollision(
        x: number,
        y: number,
        vx: number,
        vy: number,
        radius: number
    ): { vx: number; vy: number; bounced: boolean; barrierIndex: number } | null {
        if (!this.isActive) return null

        for (let i = 0; i < this.barriers.length; i++) {
            const barrier = this.barriers[i]

            // Transform point to barrier's local space
            const cos = Math.cos(-barrier.angle)
            const sin = Math.sin(-barrier.angle)
            const localX = (x - barrier.x) * cos - (y - barrier.y) * sin
            const localY = (x - barrier.x) * sin + (y - barrier.y) * cos

            // Check if point is within barrier bounds (with radius)
            const halfWidth = barrier.width / 2 + radius
            const halfHeight = barrier.height / 2 + radius

            if (Math.abs(localX) < halfWidth && Math.abs(localY) < halfHeight) {
                // Determine which side was hit
                const overlapX = halfWidth - Math.abs(localX)
                const overlapY = halfHeight - Math.abs(localY)

                // Transform velocity to local space
                const localVx = vx * cos - vy * sin
                const localVy = vx * sin + vy * cos

                let newLocalVx = localVx
                let newLocalVy = localVy

                if (overlapX < overlapY) {
                    // Hit horizontal edge - reflect X
                    newLocalVx = -localVx * barrier.bounceStrength
                } else {
                    // Hit vertical edge - reflect Y
                    newLocalVy = -localVy * barrier.bounceStrength
                }

                // Transform back to world space
                const newVx = newLocalVx * cos + newLocalVy * sin
                const newVy = -newLocalVx * sin + newLocalVy * cos

                // Trigger pulse effect
                barrier.pulsePhase = 0

                return { vx: newVx, vy: newVy, bounced: true, barrierIndex: i }
            }
        }

        return null
    }

    /**
     * Get proximity effect for visual feedback
     */
    getPlayerProximityEffect(playerX: number, playerY: number): number {
        if (!this.isActive) return 0

        let maxEffect = 0

        for (const barrier of this.barriers) {
            const dx = barrier.x - playerX
            const dy = barrier.y - playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const effectRadius = barrier.width

            if (dist < effectRadius) {
                const effect = 1 - dist / effectRadius
                maxEffect = Math.max(maxEffect, effect)
            }
        }

        return maxEffect * 0.3 // Subtle effect
    }

    private draw(): void {
        this.graphics.clear()

        for (const barrier of this.barriers) {
            const pulse = 1 + Math.sin(barrier.pulsePhase) * 0.15
            const glowAlpha = 0.3 + Math.sin(barrier.pulsePhase) * 0.2

            // Save transform
            const cos = Math.cos(barrier.angle)
            const sin = Math.sin(barrier.angle)

            // Draw glow effect
            const glowWidth = barrier.width * pulse + 10
            const glowHeight = barrier.height * pulse + 10
            this.drawRotatedRect(
                barrier.x,
                barrier.y,
                glowWidth,
                glowHeight,
                barrier.angle,
                0xff69b4,
                glowAlpha * 0.3
            )

            // Draw outer border
            this.drawRotatedRect(
                barrier.x,
                barrier.y,
                barrier.width * pulse + 4,
                barrier.height * pulse + 4,
                barrier.angle,
                0xffaacc,
                0.8
            )

            // Draw main barrier
            this.drawRotatedRect(
                barrier.x,
                barrier.y,
                barrier.width * pulse,
                barrier.height * pulse,
                barrier.angle,
                0xff69b4,
                0.9
            )

            // Draw highlight line
            this.drawRotatedRect(
                barrier.x,
                barrier.y - barrier.height * 0.2,
                barrier.width * 0.8 * pulse,
                2,
                barrier.angle,
                0xffffff,
                0.5
            )

            // Draw end caps (circles)
            const endOffset = (barrier.width / 2) * pulse
            const leftX = barrier.x - endOffset * cos
            const leftY = barrier.y - endOffset * sin
            const rightX = barrier.x + endOffset * cos
            const rightY = barrier.y + endOffset * sin

            this.graphics.circle(leftX, leftY, (barrier.height / 2) * pulse)
            this.graphics.fill({ color: 0xffaacc, alpha: 0.9 })
            this.graphics.circle(rightX, rightY, (barrier.height / 2) * pulse)
            this.graphics.fill({ color: 0xffaacc, alpha: 0.9 })
        }
    }

    private drawRotatedRect(
        cx: number,
        cy: number,
        width: number,
        height: number,
        angle: number,
        color: number,
        alpha: number
    ): void {
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const hw = width / 2
        const hh = height / 2

        // Calculate corners
        const corners = [
            { x: -hw, y: -hh },
            { x: hw, y: -hh },
            { x: hw, y: hh },
            { x: -hw, y: hh },
        ]

        const points: number[] = []
        for (const c of corners) {
            points.push(cx + c.x * cos - c.y * sin)
            points.push(cy + c.x * sin + c.y * cos)
        }

        this.graphics.poly(points)
        this.graphics.fill({ color, alpha })
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
