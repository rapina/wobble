import { Container, Graphics } from 'pixi.js'

export type PickupType = 'magnet' | 'health' | 'bomb'

export interface Pickup {
    graphics: Graphics
    glowGraphics: Graphics
    x: number
    y: number
    type: PickupType
    life: number
    maxLife: number
    collected: boolean
    animOffset: number
}

interface PickupSystemContext {
    container: Container
    width: number
    height: number
}

export interface PickupSystemOptions {
    magnetSpawnInterval?: number // seconds between magnet spawns
    magnetSpawnChance?: number // 0-1 chance to spawn when interval hits
    magnetDuration?: number // how long magnet effect lasts
    spawnRadius?: number // radius around player to spawn pickups
}

const DEFAULT_OPTIONS: Required<PickupSystemOptions> = {
    magnetSpawnInterval: 30, // Every 30 seconds
    magnetSpawnChance: 0.7, // 70% chance
    magnetDuration: 3, // 3 seconds of attraction
    spawnRadius: 300, // Spawn within 300px of player
}

// Pickup visual configs
const PICKUP_CONFIGS: Record<PickupType, { color: number; icon: string; size: number }> = {
    magnet: { color: 0xff6b6b, icon: '🧲', size: 20 },
    health: { color: 0x4ade80, icon: '❤️', size: 18 },
    bomb: { color: 0xfbbf24, icon: '💣', size: 22 },
}

export class PickupSystem {
    private context: PickupSystemContext
    private pickups: Pickup[] = []
    private options: Required<PickupSystemOptions>
    private spawnTimer = 0
    private time = 0

    // Magnet effect state
    private magnetActive = false
    private magnetTimer = 0

    // Callbacks
    onMagnetCollected?: () => void
    onHealthCollected?: () => void
    onBombCollected?: () => void

    constructor(context: PickupSystemContext, options?: PickupSystemOptions) {
        this.context = context
        this.options = { ...DEFAULT_OPTIONS, ...options }
    }

    updateContext(context: Partial<PickupSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    /**
     * Spawn a pickup at position
     */
    spawn(x: number, y: number, type: PickupType): void {
        const config = PICKUP_CONFIGS[type]

        // Create glow graphics (behind main)
        const glowGraphics = new Graphics()
        glowGraphics.circle(0, 0, config.size * 1.8)
        glowGraphics.fill({ color: config.color, alpha: 0.2 })
        glowGraphics.position.set(x, y)
        this.context.container.addChild(glowGraphics)

        // Create main graphics
        const graphics = new Graphics()
        this.drawPickup(graphics, type, config)
        graphics.position.set(x, y)
        this.context.container.addChild(graphics)

        this.pickups.push({
            graphics,
            glowGraphics,
            x,
            y,
            type,
            life: 20, // 20 seconds lifetime
            maxLife: 20,
            collected: false,
            animOffset: Math.random() * Math.PI * 2,
        })
    }

    private drawPickup(
        graphics: Graphics,
        type: PickupType,
        config: (typeof PICKUP_CONFIGS)['magnet']
    ): void {
        graphics.clear()

        if (type === 'magnet') {
            // U-shaped magnet
            const size = config.size

            // Left arm
            graphics.roundRect(-size * 0.6, -size * 0.5, size * 0.35, size, 3)
            graphics.fill(0xff4444) // Red

            // Right arm
            graphics.roundRect(size * 0.25, -size * 0.5, size * 0.35, size, 3)
            graphics.fill(0x4444ff) // Blue

            // Bottom connector (horseshoe)
            graphics.roundRect(-size * 0.6, size * 0.2, size * 1.2, size * 0.35, 3)
            graphics.fill(0x888888) // Gray

            // Magnetic field lines (decorative)
            graphics.moveTo(-size * 0.3, -size * 0.7)
            graphics.quadraticCurveTo(0, -size, size * 0.3, -size * 0.7)
            graphics.stroke({ color: 0xffff00, width: 2, alpha: 0.6 })

            // Inner poles
            graphics.circle(-size * 0.42, -size * 0.3, 4)
            graphics.fill(0xffffff)
            graphics.circle(size * 0.42, -size * 0.3, 4)
            graphics.fill(0xffffff)
        } else if (type === 'health') {
            // Heart/cross shape
            const size = config.size
            graphics.roundRect(-size * 0.5, -size * 0.15, size, size * 0.3, 2)
            graphics.fill(config.color)
            graphics.roundRect(-size * 0.15, -size * 0.5, size * 0.3, size, 2)
            graphics.fill(config.color)

            // Glow
            graphics.roundRect(-size * 0.5, -size * 0.15, size, size * 0.3, 2)
            graphics.stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
        } else if (type === 'bomb') {
            // Bomb shape
            const size = config.size
            graphics.circle(0, size * 0.1, size * 0.5)
            graphics.fill(0x333333)

            // Fuse
            graphics.moveTo(0, -size * 0.4)
            graphics.lineTo(size * 0.2, -size * 0.7)
            graphics.stroke({ color: 0x8b4513, width: 3 })

            // Spark
            graphics.circle(size * 0.2, -size * 0.7, 4)
            graphics.fill(0xffaa00)

            // Highlight
            graphics.circle(-size * 0.2, -size * 0.1, size * 0.15)
            graphics.fill({ color: 0xffffff, alpha: 0.3 })
        }
    }

    /**
     * Spawn a magnet near the player
     */
    spawnMagnetNearPlayer(playerX: number, playerY: number): void {
        const angle = Math.random() * Math.PI * 2
        const distance = this.options.spawnRadius * (0.5 + Math.random() * 0.5)
        const x = playerX + Math.cos(angle) * distance
        const y = playerY + Math.sin(angle) * distance
        this.spawn(x, y, 'magnet')
    }

    /**
     * Update pickups
     */
    update(deltaSeconds: number, playerX: number, playerY: number): void {
        this.time += deltaSeconds

        // Auto spawn magnets periodically
        this.spawnTimer += deltaSeconds
        if (this.spawnTimer >= this.options.magnetSpawnInterval) {
            this.spawnTimer = 0
            if (Math.random() < this.options.magnetSpawnChance) {
                this.spawnMagnetNearPlayer(playerX, playerY)
            }
        }

        // Update magnet effect timer
        if (this.magnetActive) {
            this.magnetTimer -= deltaSeconds
            if (this.magnetTimer <= 0) {
                this.magnetActive = false
            }
        }

        // Update each pickup
        const collectRadius = 35

        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i]

            // Decrease lifetime
            pickup.life -= deltaSeconds
            if (pickup.life <= 0) {
                this.removePickup(i)
                continue
            }

            // Check collection
            const dx = playerX - pickup.x
            const dy = playerY - pickup.y
            const dist = Math.sqrt(dx * dx + dy * dy)

            if (dist < collectRadius) {
                this.collectPickup(pickup, i)
                continue
            }

            // Animation
            const bob = Math.sin(this.time * 3 + pickup.animOffset) * 4
            const pulse = 1 + Math.sin(this.time * 5 + pickup.animOffset) * 0.1
            const rotation = Math.sin(this.time * 2 + pickup.animOffset) * 0.15

            pickup.graphics.position.set(pickup.x, pickup.y + bob)
            pickup.graphics.scale.set(pulse)
            pickup.graphics.rotation = rotation

            // Glow animation
            const glowPulse = 1 + Math.sin(this.time * 4 + pickup.animOffset) * 0.3
            pickup.glowGraphics.position.set(pickup.x, pickup.y + bob)
            pickup.glowGraphics.scale.set(glowPulse)
            pickup.glowGraphics.alpha = 0.3 + Math.sin(this.time * 6 + pickup.animOffset) * 0.15

            // Fade when dying
            if (pickup.life < 3) {
                const fade = pickup.life / 3
                pickup.graphics.alpha = fade
                pickup.glowGraphics.alpha *= fade
            }
        }
    }

    private collectPickup(pickup: Pickup, index: number): void {
        switch (pickup.type) {
            case 'magnet':
                this.magnetActive = true
                this.magnetTimer = this.options.magnetDuration
                this.onMagnetCollected?.()
                break
            case 'health':
                this.onHealthCollected?.()
                break
            case 'bomb':
                this.onBombCollected?.()
                break
        }

        // Collection effect - scale up
        pickup.graphics.scale.set(1.5)
        pickup.graphics.alpha = 0.5

        this.removePickup(index)
    }

    private removePickup(index: number): void {
        const pickup = this.pickups[index]
        this.context.container.removeChild(pickup.graphics)
        this.context.container.removeChild(pickup.glowGraphics)
        pickup.graphics.destroy()
        pickup.glowGraphics.destroy()
        this.pickups.splice(index, 1)
    }

    /**
     * Check if magnet effect is active
     */
    isMagnetActive(): boolean {
        return this.magnetActive
    }

    /**
     * Get remaining magnet time
     */
    getMagnetTimeRemaining(): number {
        return this.magnetTimer
    }

    /**
     * Get active pickup count
     */
    getActiveCount(): number {
        return this.pickups.length
    }

    /**
     * Public accessor for pickups (for coordinate reset)
     */
    getPickups(): Pickup[] {
        return this.pickups
    }

    /**
     * Reset the system
     */
    reset(): void {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            this.removePickup(i)
        }
        this.spawnTimer = 0
        this.magnetActive = false
        this.magnetTimer = 0
    }

    /**
     * Destroy the system
     */
    destroy(): void {
        this.reset()
    }
}
