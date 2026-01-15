import { Container, Graphics } from 'pixi.js'

interface BlackHoleSystemContext {
    container: Container
    width: number // viewport width (for distance calculations)
    height: number // viewport height (for distance calculations)
}

interface BlackHoleConfig {
    spawnDistance: number // distance from player when spawned
    orbitDistance: number // max distance from player to orbit around
    moveSpeed: number // pixels per second
    moveInterval: number // seconds between direction changes
    pullRadius: number // radius for pulling orbs
    consumeRadius: number // radius for consuming orbs
    dangerRadius: number // radius where player starts taking damage
    damagePerSecond: number // damage per second at max proximity
}

const DEFAULT_CONFIG: BlackHoleConfig = {
    spawnDistance: 200, // spawn 200px from player
    orbitDistance: 300, // orbit within 300px of player
    moveSpeed: 15, // Very slow
    moveInterval: 8, // Change direction every 8 seconds
    pullRadius: 150,
    consumeRadius: 30,
    dangerRadius: 120, // Player danger zone
    damagePerSecond: 15, // Damage per second at closest point
}

export class BlackHoleSystem {
    private context: BlackHoleSystemContext
    private config: BlackHoleConfig

    // Position (world coordinates)
    private x = 0
    private y = 0

    // Player position reference (for orbit calculations)
    private playerX = 0
    private playerY = 0

    // Movement
    private targetX = 0
    private targetY = 0
    private moveTimer = 0

    // Graphics
    private graphics: Graphics
    private innerGraphics: Graphics
    private particleGraphics: Graphics

    // Animation
    private rotation = 0
    private pulsePhase = 0
    private isActive = false

    // Sucked particles for visual effect
    private suckingParticles: Array<{
        x: number
        y: number
        angle: number
        dist: number
        speed: number
        color: number
    }> = []

    constructor(context: BlackHoleSystemContext, config?: Partial<BlackHoleConfig>) {
        this.context = context
        this.config = { ...DEFAULT_CONFIG, ...config }

        // Position will be set when activated with player position

        // Create graphics containers
        this.graphics = new Graphics()
        this.innerGraphics = new Graphics()
        this.particleGraphics = new Graphics()

        this.context.container.addChild(this.particleGraphics)
        this.context.container.addChild(this.graphics)
        this.context.container.addChild(this.innerGraphics)

        this.graphics.visible = false
        this.innerGraphics.visible = false
        this.particleGraphics.visible = false
    }

    updateContext(context: Partial<BlackHoleSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    /**
     * Activate the black hole at a position relative to player
     */
    activate(playerX: number, playerY: number): void {
        this.isActive = true
        this.playerX = playerX
        this.playerY = playerY

        // Spawn at a random angle from player
        const angle = Math.random() * Math.PI * 2
        this.x = playerX + Math.cos(angle) * this.config.spawnDistance
        this.y = playerY + Math.sin(angle) * this.config.spawnDistance
        this.targetX = this.x
        this.targetY = this.y

        this.graphics.visible = true
        this.innerGraphics.visible = true
        this.particleGraphics.visible = true
        this.pickNewTarget()

        // Initialize some sucking particles
        this.initializeSuckingParticles()
    }

    /**
     * Deactivate the black hole
     */
    deactivate(): void {
        this.isActive = false
        this.graphics.visible = false
        this.innerGraphics.visible = false
        this.particleGraphics.visible = false
        this.suckingParticles = []
    }

    /**
     * Get current position (for physics modifiers)
     */
    getPosition(): { x: number; y: number } {
        return { x: this.x, y: this.y }
    }

    /**
     * Get position as ratio (0-1) for vortexCenter
     */
    getPositionRatio(): { x: number; y: number } {
        return {
            x: this.x / this.context.width,
            y: this.y / this.context.height,
        }
    }

    /**
     * Get pull radius
     */
    getPullRadius(): number {
        return this.config.pullRadius
    }

    /**
     * Get consume radius
     */
    getConsumeRadius(): number {
        return this.config.consumeRadius
    }

    /**
     * Get danger radius (for player damage zone)
     */
    getDangerRadius(): number {
        return this.config.dangerRadius
    }

    /**
     * Get damage per second at max proximity
     */
    getDamagePerSecond(): number {
        return this.config.damagePerSecond
    }

    /**
     * Calculate player proximity effect (0-1, 1 = at center)
     * Returns effect intensity based on distance
     */
    getPlayerProximityEffect(playerX: number, playerY: number): number {
        if (!this.isActive) return 0

        const dx = this.x - playerX
        const dy = this.y - playerY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist >= this.config.dangerRadius) return 0

        // Stronger effect as player gets closer (inverse curve)
        const normalizedDist = dist / this.config.dangerRadius
        return Math.pow(1 - normalizedDist, 1.5) // Exponential increase near center
    }

    /**
     * Check if active
     */
    getIsActive(): boolean {
        return this.isActive
    }

    /**
     * Update the black hole (infinite map - orbits around player)
     */
    update(deltaSeconds: number, playerX: number, playerY: number): void {
        if (!this.isActive) return

        // Track player position for orbit calculations
        this.playerX = playerX
        this.playerY = playerY

        // Update animation
        this.rotation += deltaSeconds * 0.8
        this.pulsePhase += deltaSeconds * 2

        // Update movement
        this.moveTimer += deltaSeconds
        if (this.moveTimer >= this.config.moveInterval) {
            this.moveTimer = 0
            this.pickNewTarget()
        }

        // Move toward target (very slowly)
        const dx = this.targetX - this.x
        const dy = this.targetY - this.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist > 5) {
            const speed = this.config.moveSpeed * deltaSeconds
            this.x += (dx / dist) * Math.min(speed, dist)
            this.y += (dy / dist) * Math.min(speed, dist)
        }

        // Update sucking particles
        this.updateSuckingParticles(deltaSeconds)

        // Draw the black hole
        this.draw()
    }

    private pickNewTarget(): void {
        // Pick a random position within orbit distance of player (infinite map)
        const angle = Math.random() * Math.PI * 2
        const distance = this.config.spawnDistance + Math.random() * (this.config.orbitDistance - this.config.spawnDistance)
        this.targetX = this.playerX + Math.cos(angle) * distance
        this.targetY = this.playerY + Math.sin(angle) * distance
    }

    private initializeSuckingParticles(): void {
        this.suckingParticles = []
        const count = 20

        for (let i = 0; i < count; i++) {
            this.suckingParticles.push({
                x: 0,
                y: 0,
                angle: Math.random() * Math.PI * 2,
                dist: 40 + Math.random() * 100,
                speed: 0.5 + Math.random() * 1.5,
                color: Math.random() > 0.5 ? 0xaa44ff : 0x6622cc,
            })
        }
    }

    private updateSuckingParticles(deltaSeconds: number): void {
        for (const particle of this.suckingParticles) {
            // Spiral inward
            particle.angle += particle.speed * deltaSeconds * 2
            particle.dist -= deltaSeconds * 30

            // Reset when too close
            if (particle.dist < 15) {
                particle.dist = 40 + Math.random() * 100
                particle.angle = Math.random() * Math.PI * 2
            }

            // Calculate actual position
            particle.x = this.x + Math.cos(particle.angle) * particle.dist
            particle.y = this.y + Math.sin(particle.angle) * particle.dist
        }
    }

    private draw(): void {
        this.graphics.clear()
        this.innerGraphics.clear()
        this.particleGraphics.clear()

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.1

        // Draw outer distortion rings
        for (let i = 4; i >= 0; i--) {
            const ringRadius = (30 + i * 20) * pulse
            const alpha = 0.15 - i * 0.025
            this.graphics.circle(this.x, this.y, ringRadius)
            this.graphics.stroke({ color: 0x6622cc, width: 2, alpha })
        }

        // Draw spiral arms (rotating)
        for (let arm = 0; arm < 4; arm++) {
            const armAngle = this.rotation + (arm * Math.PI) / 2

            this.graphics.moveTo(this.x, this.y)

            for (let t = 0; t <= 1; t += 0.05) {
                const spiralAngle = armAngle + t * Math.PI * 2
                const spiralRadius = 15 + t * 60 * pulse
                const px = this.x + Math.cos(spiralAngle) * spiralRadius
                const py = this.y + Math.sin(spiralAngle) * spiralRadius
                this.graphics.lineTo(px, py)
            }

            this.graphics.stroke({ color: 0xaa44ff, width: 3, alpha: 0.4 })
        }

        // Draw sucking particles
        for (const particle of this.suckingParticles) {
            const alpha = Math.min(1, particle.dist / 100) * 0.7
            const size = 2 + (particle.dist / 100) * 3
            this.particleGraphics.circle(particle.x, particle.y, size)
            this.particleGraphics.fill({ color: particle.color, alpha })
        }

        // Draw core glow
        const glowRadius = 35 * pulse
        this.graphics.circle(this.x, this.y, glowRadius)
        this.graphics.fill({ color: 0x2d1b4e, alpha: 0.6 })

        // Draw event horizon (dark center)
        const coreRadius = 20 * pulse
        this.innerGraphics.circle(this.x, this.y, coreRadius)
        this.innerGraphics.fill({ color: 0x0a0510, alpha: 0.95 })

        // Draw inner bright ring
        this.innerGraphics.circle(this.x, this.y, coreRadius)
        this.innerGraphics.stroke({ color: 0xaa44ff, width: 3, alpha: 0.8 })

        // Draw central singularity point
        const singularityPulse = 1 + Math.sin(this.pulsePhase * 3) * 0.3
        this.innerGraphics.circle(this.x, this.y, 5 * singularityPulse)
        this.innerGraphics.fill({ color: 0xffffff, alpha: 0.9 })
    }

    /**
     * Reset the system
     */
    reset(): void {
        this.deactivate()
        this.x = 0
        this.y = 0
        this.targetX = 0
        this.targetY = 0
        this.playerX = 0
        this.playerY = 0
        this.moveTimer = 0
        this.rotation = 0
        this.pulsePhase = 0
    }

    /**
     * Destroy the system
     */
    destroy(): void {
        this.context.container.removeChild(this.graphics)
        this.context.container.removeChild(this.innerGraphics)
        this.context.container.removeChild(this.particleGraphics)
        this.graphics.destroy()
        this.innerGraphics.destroy()
        this.particleGraphics.destroy()
    }
}
