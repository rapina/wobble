import { Container } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../Wobble'
import { WOBBLE_STATS, Enemy } from './types'

export interface PlayerSystemContext {
    gameContainer: Container
    width: number
    height: number
}

export interface PlayerSystemConfig {
    baseSpeed?: number
    baseMaxHealth?: number
    startX?: number
    startY?: number
}

export interface JoystickInput {
    dirX: number
    dirY: number
    magnitude: number
}

export class PlayerSystem {
    private gameContainer: Container
    private width: number
    private height: number

    // Player visual
    readonly player: Wobble

    // Position and velocity
    x: number
    y: number
    private vx = 0
    private vy = 0

    // Health
    health: number
    maxHealth: number

    // Config
    private baseSpeed: number
    private baseMaxHealth: number
    private margin = 30

    // Stats (applied from external source)
    private moveSpeedMultiplier = 1

    // Callbacks
    onHealthChanged?: (health: number, maxHealth: number) => void
    onDeath?: () => void
    onCollisionWithEnemy?: (enemy: Enemy) => void

    constructor(context: PlayerSystemContext, config?: PlayerSystemConfig) {
        this.gameContainer = context.gameContainer
        this.width = context.width
        this.height = context.height

        this.baseSpeed = config?.baseSpeed ?? 4
        this.baseMaxHealth = config?.baseMaxHealth ?? 100
        this.x = config?.startX ?? context.width / 2
        this.y = config?.startY ?? context.height / 2

        this.maxHealth = this.baseMaxHealth
        this.health = this.maxHealth

        // Create player wobble
        this.player = new Wobble({
            size: 50,
            shape: 'circle',
            expression: 'happy',
            color: 0xf5b041,
            showShadow: true,
        })
        this.player.position.set(this.x, this.y)
        this.gameContainer.addChild(this.player)
    }

    /**
     * Set player shape and color based on character
     */
    setCharacter(shape: WobbleShape): void {
        const character = WOBBLE_CHARACTERS[shape]
        const stats = WOBBLE_STATS[shape]

        this.player.updateOptions({
            shape,
            color: character.color,
            expression: 'happy',
        })

        // Apply health multiplier
        this.maxHealth = Math.round(this.baseMaxHealth * stats.healthMultiplier)
        this.health = this.maxHealth
        this.onHealthChanged?.(this.health, this.maxHealth)
    }

    /**
     * Update move speed multiplier from stats
     */
    setMoveSpeedMultiplier(multiplier: number): void {
        this.moveSpeedMultiplier = multiplier
    }

    /**
     * Update player position based on joystick input
     */
    update(delta: number, input: JoystickInput): void {
        const speed = this.baseSpeed * this.moveSpeedMultiplier
        const deadzone = 0.1

        if (input.magnitude > deadzone) {
            this.vx = input.dirX * speed
            this.vy = input.dirY * speed
        } else {
            this.vx = 0
            this.vy = 0
        }

        // Apply velocity
        this.x += this.vx * delta
        this.y += this.vy * delta

        // Keep in bounds
        if (this.x < this.margin) {
            this.x = this.margin
            this.vx = 0
        } else if (this.x > this.width - this.margin) {
            this.x = this.width - this.margin
            this.vx = 0
        }
        if (this.y < this.margin) {
            this.y = this.margin
            this.vy = 0
        } else if (this.y > this.height - this.margin) {
            this.y = this.height - this.margin
            this.vy = 0
        }

        this.player.position.set(this.x, this.y)

        // Update look direction based on velocity
        const velMag = Math.sqrt(this.vx * this.vx + this.vy * this.vy)
        if (velMag > 0.5) {
            this.player.updateOptions({
                lookDirection: { x: this.vx / velMag, y: this.vy / velMag },
            })
        }
    }

    /**
     * Check collisions with enemies
     */
    checkCollisions(enemies: Enemy[]): void {
        for (const enemy of enemies) {
            const dx = enemy.x - this.x
            const dy = enemy.y - this.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            const minDist = 25 + enemy.size / 2

            if (dist < minDist) {
                this.takeDamage(1)
                this.onCollisionWithEnemy?.(enemy)

                // Push enemy back
                const nx = dx / (dist || 1)
                const ny = dy / (dist || 1)
                enemy.vx += nx * 3
                enemy.vy += ny * 3
            }
        }
    }

    /**
     * Take damage
     */
    takeDamage(amount: number): void {
        this.health -= amount
        this.onHealthChanged?.(this.health, this.maxHealth)

        if (this.health <= 0) {
            this.health = 0
            this.player.updateOptions({ expression: 'dizzy' })
            this.onDeath?.()
        }
    }

    /**
     * Update player expression based on health
     */
    updateExpression(): void {
        const healthPercent = this.health / this.maxHealth

        let expression: 'happy' | 'neutral' | 'effort' | 'worried' | 'struggle' | 'dizzy' = 'happy'
        if (healthPercent <= 0.15) {
            expression = 'dizzy'
        } else if (healthPercent <= 0.3) {
            expression = 'struggle'
        } else if (healthPercent <= 0.5) {
            expression = 'worried'
        } else if (healthPercent <= 0.7) {
            expression = 'effort'
        }

        this.player.updateOptions({ expression })
    }

    /**
     * Update wobble animation
     */
    updateAnimation(animPhase: number): void {
        const breathe = Math.sin(animPhase * 3) * 0.02
        this.player.updateOptions({
            wobblePhase: animPhase,
            scaleX: 1 + breathe,
            scaleY: 1 - breathe,
        })
    }

    /**
     * Reset player to center position
     */
    reset(x?: number, y?: number): void {
        this.x = x ?? this.width / 2
        this.y = y ?? this.height / 2
        this.vx = 0
        this.vy = 0
        this.health = this.maxHealth
        this.moveSpeedMultiplier = 1

        this.player.position.set(this.x, this.y)
        this.player.updateOptions({ expression: 'happy' })
    }

    /**
     * Get current velocity
     */
    getVelocity(): { vx: number; vy: number } {
        return { vx: this.vx, vy: this.vy }
    }

    /**
     * Check if player is moving
     */
    isMoving(): boolean {
        return Math.abs(this.vx) > 0.1 || Math.abs(this.vy) > 0.1
    }
}
