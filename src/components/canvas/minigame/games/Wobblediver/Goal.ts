/**
 * Goal.ts - Safety cushion that catches the falling wobble
 *
 * A soft landing pad pushed/pulled by a helper wobble
 */

import { Container, Graphics } from 'pixi.js'
import { Blob, BlobExpression } from '@/components/canvas/Blob'

export interface GoalConfig {
    x: number
    y: number
    radius: number
    perfectRadius?: number  // Inner zone for perfect hit
}

export class Goal {
    public container: Container
    private cushionGraphics: Graphics
    private glowGraphics: Graphics
    private helperWobble: Blob

    public x: number
    public y: number
    public radius: number
    public perfectRadius: number

    // Animation state
    private time = 0
    private isHit = false
    private bounceAmount = 0  // For landing animation

    // Helper wobble animation
    private helperSide: 'left' | 'right' = 'left'
    private pushProgress = 0
    private isPushing = false

    constructor(config: GoalConfig) {
        this.container = new Container()
        this.x = config.x
        this.y = config.y
        this.radius = config.radius
        this.perfectRadius = config.perfectRadius ?? config.radius * 0.4

        // Glow layer (behind)
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Cushion graphics
        this.cushionGraphics = new Graphics()
        this.container.addChild(this.cushionGraphics)

        // Helper wobble (pushes the cushion)
        this.helperWobble = new Blob({
            size: 22,
            color: 0x3498db,  // Blue color
            shape: 'circle',
            expression: 'happy',
            glowIntensity: 0.2,
            glowColor: 0x3498db,
        })
        this.container.addChild(this.helperWobble)

        this.container.position.set(this.x, this.y)
        this.draw()
        this.updateHelperPosition()
    }

    private draw(): void {
        const g = this.cushionGraphics
        g.clear()

        const width = this.radius * 2.2
        const height = this.radius * 0.8
        const bounce = this.bounceAmount

        // Cushion shadow
        g.ellipse(0, height * 0.3 + 5, width * 0.45, height * 0.2)
        g.fill({ color: 0x000000, alpha: 0.2 })

        // Main cushion body (soft rectangle with rounded ends)
        g.roundRect(-width / 2, -height / 2 - bounce * 10, width, height + bounce * 5, height * 0.4)
        g.fill({ color: 0xe74c3c })  // Red cushion

        // Cushion top highlight
        g.roundRect(-width / 2 + 4, -height / 2 + 4 - bounce * 10, width - 8, height * 0.4, height * 0.3)
        g.fill({ color: 0xec7063, alpha: 0.6 })

        // Cushion stripes (like a mattress)
        const stripeCount = 5
        const stripeWidth = width / (stripeCount * 2)
        for (let i = 0; i < stripeCount; i++) {
            const stripeX = -width / 2 + stripeWidth + i * (width / stripeCount)
            g.moveTo(stripeX, -height / 2 + 8 - bounce * 10)
            g.lineTo(stripeX, height / 2 - 8 - bounce * 5)
            g.stroke({ color: 0xc0392b, width: 2, alpha: 0.4 })
        }

        // Side cushion edge (thickness)
        g.roundRect(-width / 2, height * 0.1, width, height * 0.3, height * 0.15)
        g.fill({ color: 0xc0392b })

        // Perfect zone indicator (center target)
        const targetSize = this.perfectRadius
        g.circle(0, 0 - bounce * 7, targetSize)
        g.fill({ color: 0xf1c40f, alpha: 0.5 })
        g.stroke({ color: 0xf39c12, width: 2 })

        // Center star/cross for aiming
        const starSize = targetSize * 0.5
        g.moveTo(-starSize, 0 - bounce * 7)
        g.lineTo(starSize, 0 - bounce * 7)
        g.moveTo(0, -starSize - bounce * 7)
        g.lineTo(0, starSize - bounce * 7)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.8 })
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        const pulse = 1 + Math.sin(this.time * 3) * 0.1
        const alpha = 0.15 + Math.sin(this.time * 3) * 0.05
        const width = this.radius * 2.2

        // Soft glow under cushion
        g.ellipse(0, this.radius * 0.2, width * 0.5 * pulse, this.radius * 0.3 * pulse)
        g.fill({ color: 0xe74c3c, alpha })
    }

    private updateHelperPosition(): void {
        const width = this.radius * 2.2
        const offsetX = this.helperSide === 'left' ? -width / 2 - 20 : width / 2 + 20

        // Idle bobbing animation
        const bobY = Math.sin(this.time * 2.5) * 3

        if (this.isPushing) {
            // Pushing animation
            const pushOffset = Math.sin(this.pushProgress * Math.PI) * 15
            const pushDir = this.helperSide === 'left' ? 1 : -1
            this.helperWobble.setPosition(offsetX + pushOffset * pushDir, bobY)

            // Squish while pushing
            const effort = Math.sin(this.pushProgress * Math.PI)
            this.helperWobble.updateOptions({
                scaleX: 1 + effort * 0.2,
                scaleY: 1 - effort * 0.15,
            })
        } else {
            this.helperWobble.setPosition(offsetX, bobY)
            this.helperWobble.updateOptions({
                scaleX: 1,
                scaleY: 1,
            })
        }
    }

    private updateHelperExpression(): void {
        let expression: BlobExpression = 'happy'

        if (this.isPushing) {
            expression = 'effort'
        } else if (this.isHit) {
            expression = 'excited'
        }

        this.helperWobble.updateOptions({
            expression,
            wobblePhase: this.time * 2,
        })
    }

    /**
     * Update animation
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds

        // Bounce decay
        if (this.bounceAmount > 0) {
            this.bounceAmount *= 0.9
            if (this.bounceAmount < 0.01) this.bounceAmount = 0
            this.draw()
        }

        // Push animation
        if (this.isPushing) {
            this.pushProgress += deltaSeconds * 2
            if (this.pushProgress >= 1) {
                this.isPushing = false
                this.pushProgress = 0
            }
        }

        this.drawGlow()
        this.updateHelperPosition()
        this.updateHelperExpression()
    }

    /**
     * Start push animation (called when goal moves)
     */
    private triggerPush(): void {
        this.isPushing = true
        this.pushProgress = 0
    }

    /**
     * Check if a point is inside the goal
     */
    checkHit(px: number, py: number): { hit: boolean; perfect: boolean; distance: number } {
        // Use rectangular hit detection for cushion shape
        const width = this.radius * 2.2
        const height = this.radius * 0.8

        const dx = px - this.x
        const dy = py - this.y

        // Check if within cushion bounds
        const inCushion = Math.abs(dx) <= width / 2 && Math.abs(dy) <= height / 2

        // Perfect hit is center area
        const distance = Math.sqrt(dx * dx + dy * dy)
        const perfect = distance <= this.perfectRadius

        return {
            hit: inCushion,
            perfect,
            distance,
        }
    }

    /**
     * Show hit animation
     */
    showHit(perfect: boolean): void {
        this.isHit = true
        this.bounceAmount = perfect ? 1.5 : 1.0
        this.draw()

        // Flash effect on cushion
        const g = this.cushionGraphics
        const width = this.radius * 2.2
        const height = this.radius * 0.8
        const color = perfect ? 0xf1c40f : 0xffffff

        g.roundRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, height * 0.5)
        g.fill({ color, alpha: 0.5 })
    }

    /**
     * Move goal to new position with push animation
     */
    moveTo(newX: number, y: number): void {
        // Determine push direction based on movement
        if (newX > this.x) {
            this.helperSide = 'left'  // Push from left
        } else if (newX < this.x) {
            this.helperSide = 'right'  // Push from right
        }

        this.x = newX
        this.y = y
        this.container.position.set(newX, y)
        this.isHit = false
        this.triggerPush()
        this.draw()
    }

    /**
     * Resize goal
     */
    setRadius(radius: number, perfectRadius?: number): void {
        this.radius = radius
        this.perfectRadius = perfectRadius ?? radius * 0.4
        this.draw()
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
