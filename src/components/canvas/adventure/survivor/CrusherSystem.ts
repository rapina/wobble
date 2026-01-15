import { Container, Graphics } from 'pixi.js'

interface CrusherSystemContext {
    container: Container
    width: number
    height: number
}

interface Crusher {
    x: number
    y: number
    size: number // Square size
    vx: number
    vy: number
    targetX: number
    targetY: number
    mass: number
    phase: number
    chargeTimer: number // Time until next charge
    isCharging: boolean
    chargeDirection: { x: number; y: number }
}

interface CrusherConfig {
    crusherCount: number
    minSize: number
    maxSize: number
    moveSpeed: number
    chargeSpeed: number
    chargeInterval: number
    chargeDuration: number
    pushStrength: number
    damagePerSecond: number
    spawnDistance: number // distance from player when spawned
    orbitDistance: number // max distance from player
}

const DEFAULT_CONFIG: CrusherConfig = {
    crusherCount: 2,
    minSize: 50,
    maxSize: 70,
    moveSpeed: 20,
    chargeSpeed: 150,
    chargeInterval: 5,
    chargeDuration: 0.8,
    pushStrength: 8,
    damagePerSecond: 20,
    spawnDistance: 250, // spawn 250px from player
    orbitDistance: 400, // orbit within 400px of player
}

export class CrusherSystem {
    private context: CrusherSystemContext
    private config: CrusherConfig
    private crushers: Crusher[] = []
    private graphics: Graphics
    private isActive = false
    private animTime = 0

    // Player position reference
    private playerX = 0
    private playerY = 0

    constructor(context: CrusherSystemContext, config?: Partial<CrusherConfig>) {
        this.context = context
        this.config = { ...DEFAULT_CONFIG, ...config }

        this.graphics = new Graphics()
        this.context.container.addChild(this.graphics)
        this.graphics.visible = false
    }

    updateContext(context: Partial<CrusherSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    activate(playerX: number, playerY: number): void {
        this.isActive = true
        this.playerX = playerX
        this.playerY = playerY
        this.graphics.visible = true
        this.createCrushers()
    }

    deactivate(): void {
        this.isActive = false
        this.graphics.visible = false
        this.crushers = []
    }

    getIsActive(): boolean {
        return this.isActive
    }

    getCrushers(): Crusher[] {
        return this.crushers
    }

    private createCrushers(): void {
        this.crushers = []

        for (let i = 0; i < this.config.crusherCount; i++) {
            this.crushers.push(this.createCrusher())
        }
    }

    private createCrusher(): Crusher {
        const size =
            this.config.minSize + Math.random() * (this.config.maxSize - this.config.minSize)
        // Spawn at random angle around player (infinite map)
        const angle = Math.random() * Math.PI * 2
        const distance =
            this.config.spawnDistance +
            Math.random() * (this.config.orbitDistance - this.config.spawnDistance) * 0.5
        const x = this.playerX + Math.cos(angle) * distance
        const y = this.playerY + Math.sin(angle) * distance

        return {
            x,
            y,
            size,
            vx: 0,
            vy: 0,
            targetX: x,
            targetY: y,
            mass: size * 2, // Heavier = bigger
            phase: Math.random() * Math.PI * 2,
            chargeTimer: this.config.chargeInterval * Math.random(),
            isCharging: false,
            chargeDirection: { x: 0, y: 0 },
        }
    }

    update(deltaSeconds: number, playerX: number, playerY: number): void {
        if (!this.isActive) return

        // Track player position
        this.playerX = playerX
        this.playerY = playerY

        this.animTime += deltaSeconds

        for (let i = 0; i < this.crushers.length; i++) {
            const crusher = this.crushers[i]
            crusher.phase += deltaSeconds * 2

            if (crusher.isCharging) {
                // Continue charge movement (infinite map - no wall collision)
                crusher.x += crusher.vx * deltaSeconds
                crusher.y += crusher.vy * deltaSeconds

                // Slow down during charge
                crusher.vx *= 0.98
                crusher.vy *= 0.98

                // End charge if slow enough
                const speed = Math.sqrt(crusher.vx * crusher.vx + crusher.vy * crusher.vy)
                if (speed < 10) {
                    crusher.isCharging = false
                    crusher.vx = 0
                    crusher.vy = 0
                }
            } else {
                // Update charge timer
                crusher.chargeTimer -= deltaSeconds

                if (crusher.chargeTimer <= 0) {
                    // Start charging toward player
                    crusher.chargeTimer = this.config.chargeInterval
                    crusher.isCharging = true

                    const dx = playerX - crusher.x
                    const dy = playerY - crusher.y
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1

                    crusher.chargeDirection = { x: dx / dist, y: dy / dist }
                    crusher.vx = crusher.chargeDirection.x * this.config.chargeSpeed
                    crusher.vy = crusher.chargeDirection.y * this.config.chargeSpeed
                } else {
                    // Slow drift movement
                    if (Math.random() < 0.01) {
                        this.pickNewTarget(crusher)
                    }

                    const dx = crusher.targetX - crusher.x
                    const dy = crusher.targetY - crusher.y
                    const dist = Math.sqrt(dx * dx + dy * dy)

                    if (dist > 5) {
                        const speed = this.config.moveSpeed * deltaSeconds
                        crusher.x += (dx / dist) * Math.min(speed, dist)
                        crusher.y += (dy / dist) * Math.min(speed, dist)
                    }
                }
            }

            // Respawn if too far from player (infinite map)
            const distToPlayer = Math.sqrt((crusher.x - playerX) ** 2 + (crusher.y - playerY) ** 2)
            if (distToPlayer > this.config.orbitDistance * 1.5 && !crusher.isCharging) {
                this.crushers[i] = this.createCrusher()
            }
        }

        this.draw()
    }

    private pickNewTarget(crusher: Crusher): void {
        // Pick target within orbit distance of player (infinite map)
        const angle = Math.random() * Math.PI * 2
        const distance =
            this.config.spawnDistance +
            Math.random() * (this.config.orbitDistance - this.config.spawnDistance)
        crusher.targetX = this.playerX + Math.cos(angle) * distance
        crusher.targetY = this.playerY + Math.sin(angle) * distance
    }

    /**
     * Check collision with crushers
     * Returns push velocity and damage if colliding
     */
    checkCollision(
        x: number,
        y: number,
        radius: number
    ): { pushVx: number; pushVy: number; damage: number; crusherIndex: number } | null {
        if (!this.isActive) return null

        for (let i = 0; i < this.crushers.length; i++) {
            const crusher = this.crushers[i]
            const halfSize = crusher.size / 2

            // Simple AABB collision with circle
            const closestX = Math.max(crusher.x - halfSize, Math.min(x, crusher.x + halfSize))
            const closestY = Math.max(crusher.y - halfSize, Math.min(y, crusher.y + halfSize))

            const dx = x - closestX
            const dy = y - closestY
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < radius) {
                // Calculate push direction (away from crusher center)
                const pushDx = x - crusher.x
                const pushDy = y - crusher.y
                const pushDist = Math.sqrt(pushDx * pushDx + pushDy * pushDy) || 1

                // Push strength based on crusher speed and mass
                const crusherSpeed = Math.sqrt(crusher.vx * crusher.vx + crusher.vy * crusher.vy)
                const pushMagnitude = this.config.pushStrength + crusherSpeed * 0.1

                return {
                    pushVx: (pushDx / pushDist) * pushMagnitude,
                    pushVy: (pushDy / pushDist) * pushMagnitude,
                    damage: this.config.damagePerSecond,
                    crusherIndex: i,
                }
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

        for (const crusher of this.crushers) {
            const dx = crusher.x - playerX
            const dy = crusher.y - playerY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const effectRadius = crusher.size * 1.5

            if (dist < effectRadius) {
                const effect = 1 - dist / effectRadius
                // More intense if crusher is charging
                const chargeBonus = crusher.isCharging ? 1.5 : 1
                maxEffect = Math.max(maxEffect, effect * chargeBonus)
            }
        }

        return maxEffect * 0.4
    }

    /**
     * Check if a crusher is about to charge (warning indicator)
     */
    getCrusherWarnings(): Array<{
        x: number
        y: number
        timeUntilCharge: number
        directionX: number
        directionY: number
    }> {
        const warnings: Array<{
            x: number
            y: number
            timeUntilCharge: number
            directionX: number
            directionY: number
        }> = []

        for (const crusher of this.crushers) {
            if (!crusher.isCharging && crusher.chargeTimer < 1.5) {
                warnings.push({
                    x: crusher.x,
                    y: crusher.y,
                    timeUntilCharge: crusher.chargeTimer,
                    directionX: crusher.chargeDirection.x,
                    directionY: crusher.chargeDirection.y,
                })
            }
        }

        return warnings
    }

    private draw(): void {
        this.graphics.clear()

        for (const crusher of this.crushers) {
            const halfSize = crusher.size / 2
            const shake = crusher.isCharging ? Math.sin(crusher.phase * 20) * 3 : 0
            const pulse = 1 + Math.sin(crusher.phase) * 0.05

            const drawX = crusher.x + shake
            const drawY = crusher.y

            // Draw warning indicator if about to charge
            if (!crusher.isCharging && crusher.chargeTimer < 1.5) {
                const warningAlpha = (1.5 - crusher.chargeTimer) / 1.5
                const warningPulse = Math.sin(this.animTime * 10) * 0.5 + 0.5

                // Exclamation mark
                this.graphics.circle(drawX, drawY - crusher.size * 0.8, 8)
                this.graphics.fill({ color: 0xff0000, alpha: warningAlpha * warningPulse })

                // Warning ring
                this.graphics.circle(drawX, drawY, crusher.size * 0.8)
                this.graphics.stroke({
                    color: 0xff0000,
                    width: 3,
                    alpha: warningAlpha * warningPulse,
                })
            }

            // Draw shadow
            this.graphics.roundRect(
                drawX - halfSize * pulse + 4,
                drawY - halfSize * pulse + 6,
                crusher.size * pulse,
                crusher.size * pulse,
                8
            )
            this.graphics.fill({ color: 0x000000, alpha: 0.3 })

            // Draw main body
            const bodyColor = crusher.isCharging ? 0xff6600 : 0x666666
            this.graphics.roundRect(
                drawX - halfSize * pulse,
                drawY - halfSize * pulse,
                crusher.size * pulse,
                crusher.size * pulse,
                8
            )
            this.graphics.fill({ color: bodyColor, alpha: 0.95 })

            // Draw border
            this.graphics.roundRect(
                drawX - halfSize * pulse,
                drawY - halfSize * pulse,
                crusher.size * pulse,
                crusher.size * pulse,
                8
            )
            this.graphics.stroke({ color: 0x444444, width: 3 })

            // Draw face/pattern
            const faceSize = crusher.size * 0.3

            // Eyes (angry when charging)
            const eyeY = crusher.isCharging ? drawY - faceSize * 0.3 : drawY - faceSize * 0.2
            const eyeAngle = crusher.isCharging ? -0.3 : 0

            // Left eye
            this.graphics.circle(drawX - faceSize * 0.5, eyeY, faceSize * 0.25)
            this.graphics.fill({ color: 0xffaa00, alpha: 0.9 })
            this.graphics.circle(drawX - faceSize * 0.5, eyeY, faceSize * 0.12)
            this.graphics.fill({ color: 0x000000, alpha: 0.9 })

            // Right eye
            this.graphics.circle(drawX + faceSize * 0.5, eyeY, faceSize * 0.25)
            this.graphics.fill({ color: 0xffaa00, alpha: 0.9 })
            this.graphics.circle(drawX + faceSize * 0.5, eyeY, faceSize * 0.12)
            this.graphics.fill({ color: 0x000000, alpha: 0.9 })

            // Mouth
            if (crusher.isCharging) {
                // Angry open mouth
                this.graphics.roundRect(
                    drawX - faceSize * 0.4,
                    drawY + faceSize * 0.2,
                    faceSize * 0.8,
                    faceSize * 0.4,
                    4
                )
                this.graphics.fill({ color: 0x000000, alpha: 0.9 })
            } else {
                // Neutral line
                this.graphics.moveTo(drawX - faceSize * 0.3, drawY + faceSize * 0.3)
                this.graphics.lineTo(drawX + faceSize * 0.3, drawY + faceSize * 0.3)
                this.graphics.stroke({ color: 0x000000, width: 3 })
            }

            // Draw motion lines when charging
            if (crusher.isCharging) {
                const speed = Math.sqrt(crusher.vx * crusher.vx + crusher.vy * crusher.vy)
                if (speed > 20) {
                    const lineCount = 4
                    const oppositeX = -crusher.vx / speed
                    const oppositeY = -crusher.vy / speed

                    for (let i = 0; i < lineCount; i++) {
                        const offset = (i - lineCount / 2) * 15
                        const perpX = -oppositeY * offset
                        const perpY = oppositeX * offset
                        const startX = drawX + perpX + oppositeX * halfSize
                        const startY = drawY + perpY + oppositeY * halfSize
                        const endX = startX + oppositeX * 30
                        const endY = startY + oppositeY * 30

                        this.graphics.moveTo(startX, startY)
                        this.graphics.lineTo(endX, endY)
                        this.graphics.stroke({ color: 0xffaa00, width: 2, alpha: 0.6 })
                    }
                }
            }
        }
    }

    /**
     * Offset all positions (for world coordinate reset)
     */
    offsetPositions(dx: number, dy: number): void {
        this.playerX -= dx
        this.playerY -= dy
        for (const crusher of this.crushers) {
            crusher.x -= dx
            crusher.y -= dy
            crusher.targetX -= dx
            crusher.targetY -= dy
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
