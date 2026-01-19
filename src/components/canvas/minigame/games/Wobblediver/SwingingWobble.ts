/**
 * SwingingWobble.ts - Wobble that swings on a rope (pendulum physics)
 *
 * Physics formula: T = 2π√(L/g)
 * - T: Period of oscillation
 * - L: Length of rope
 * - g: Gravitational acceleration
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Blob, BlobExpression } from '@/components/canvas/Blob'

export type SwingState = 'swinging' | 'released' | 'success' | 'failed' | 'drowning'

export interface PendulumPhysics {
    anchorX: number
    anchorY: number
    ropeLength: number
    angle: number      // Current angle from vertical (radians)
    angularVelocity: number
    gravity: number
}

export class SwingingWobble {
    public container: Container
    private blob: Blob
    private ropeGraphics: Graphics
    private trajectoryGraphics: Graphics
    private hpBarGraphics: Graphics

    // Physics state
    public physics: PendulumPhysics
    private damping = 0.998  // Very slight damping for realism

    // Trajectory preview constants (must match release physics)
    private readonly releaseScale = 2.5
    private readonly projectileGravity = 350

    // Trajectory visibility settings (controlled by difficulty)
    private trajectoryMode: 'always' | 'timed' | 'flicker' | 'hidden' = 'always'
    private trajectoryDuration = 0      // How long trajectory shows (for 'timed' mode)
    private trajectoryTimer = 0         // Current timer
    private flickerInterval = 0.3       // Flicker on/off interval
    private flickerOnRatio = 0.5        // Ratio of time visible during flicker

    // Game state
    public state: SwingState = 'swinging'
    private stateTime = 0

    // Released state (projectile motion)
    private releaseVx = 0
    private releaseVy = 0
    private releaseX = 0
    private releaseY = 0

    // Goal tracking for expressions
    private goalX = 0
    private goalY = 0
    private prevDistanceToGoal = Infinity
    private approachState: 'approaching' | 'receding' | 'neutral' = 'neutral'

    // Shock reaction (when switch is pressed)
    private shockTimer = 0
    private isShocked = false

    // HP system
    private maxHp = 100
    private currentHp = 100
    private hpDamageOnBounce = 25  // HP lost per wall bounce
    private isHurt = false
    private hurtTimer = 0

    // Drowning state
    private drowningTimer = 0
    private drowningDepth = 0
    private drowningRotation = 0
    private drowningSurfaceY = 0

    // Speech bubble
    private speechBubbleContainer: Container
    private speechBubbleGraphics: Graphics
    private speechBubbleText: Text
    private speechBubbleTimer = 0
    private speechBubbleDuration = 0
    private isSpeechBubbleVisible = false

    constructor(anchorX: number, anchorY: number, ropeLength: number, startAngle: number = Math.PI / 4) {
        this.container = new Container()

        // Initialize physics
        // Note: gravity is scaled for pixel-based simulation (not real-world 9.8 m/s²)
        this.physics = {
            anchorX,
            anchorY,
            ropeLength,
            angle: startAngle,
            angularVelocity: 0,
            gravity: 600,  // Pixel-based gravity for responsive swing
        }

        // Create trajectory preview (behind rope)
        this.trajectoryGraphics = new Graphics()
        this.container.addChild(this.trajectoryGraphics)

        // Create rope graphics
        this.ropeGraphics = new Graphics()
        this.container.addChild(this.ropeGraphics)

        // Create blob
        this.blob = new Blob({
            size: 32,
            color: 0xf5b041,
            shape: 'circle',
            expression: 'excited',
            glowIntensity: 0.3,
            glowColor: 0xf5b041,
        })
        this.container.addChild(this.blob)

        // Create HP bar (above wobble)
        this.hpBarGraphics = new Graphics()
        this.container.addChild(this.hpBarGraphics)

        // Create speech bubble
        this.speechBubbleContainer = new Container()
        this.speechBubbleContainer.visible = false
        this.container.addChild(this.speechBubbleContainer)

        this.speechBubbleGraphics = new Graphics()
        this.speechBubbleContainer.addChild(this.speechBubbleGraphics)

        this.speechBubbleText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: 0x1a0a20,
            }),
        })
        this.speechBubbleText.anchor.set(0.5)
        this.speechBubbleContainer.addChild(this.speechBubbleText)

        this.updatePosition()
        this.drawRope()
        this.drawHpBar()
    }

    private drawHpBar(): void {
        const g = this.hpBarGraphics
        g.clear()

        // Only show HP bar when released and HP is not full
        if (this.state !== 'released' || this.currentHp >= this.maxHp) {
            return
        }

        const pos = this.getPosition()
        const barWidth = 40
        const barHeight = 6
        const barY = pos.y - 28  // Above wobble

        // Background
        g.roundRect(pos.x - barWidth / 2, barY, barWidth, barHeight, 3)
        g.fill({ color: 0x1a1a2e, alpha: 0.8 })
        g.stroke({ color: 0x2d2d44, width: 1 })

        // HP fill
        const hpPercent = this.currentHp / this.maxHp
        const fillWidth = Math.max(0, (barWidth - 2) * hpPercent)

        if (fillWidth > 0) {
            // Color based on HP
            let color: number
            if (hpPercent > 0.5) {
                color = 0x4ecdc4  // Cyan
            } else if (hpPercent > 0.25) {
                color = 0xc9a227  // Gold
            } else {
                color = 0xe85d4c  // Red
            }

            g.roundRect(pos.x - barWidth / 2 + 1, barY + 1, fillWidth, barHeight - 2, 2)
            g.fill({ color })
        }
    }

    /**
     * Show a speech bubble with text
     */
    showSpeechBubble(text: string, duration: number = 1.5): void {
        this.speechBubbleText.text = text
        this.speechBubbleDuration = duration
        this.speechBubbleTimer = 0
        this.isSpeechBubbleVisible = true
        this.speechBubbleContainer.visible = true
        this.speechBubbleContainer.alpha = 1
        this.speechBubbleContainer.scale.set(0.5)
        this.drawSpeechBubble()
    }

    private updateSpeechBubble(deltaSeconds: number): void {
        if (!this.isSpeechBubbleVisible) return

        this.speechBubbleTimer += deltaSeconds

        // Pop-in animation
        const popDuration = 0.15
        if (this.speechBubbleTimer < popDuration) {
            const t = this.speechBubbleTimer / popDuration
            const scale = 0.5 + 0.5 * this.easeOutBack(t)
            this.speechBubbleContainer.scale.set(scale)
        } else {
            this.speechBubbleContainer.scale.set(1)
        }

        // Fade out near end
        const fadeStart = this.speechBubbleDuration - 0.3
        if (this.speechBubbleTimer > fadeStart) {
            const fadeProgress = (this.speechBubbleTimer - fadeStart) / 0.3
            this.speechBubbleContainer.alpha = 1 - fadeProgress
        }

        // Hide when done
        if (this.speechBubbleTimer >= this.speechBubbleDuration) {
            this.isSpeechBubbleVisible = false
            this.speechBubbleContainer.visible = false
        }

        // Update position to follow wobble (use blob's actual position)
        this.speechBubbleContainer.position.set(this.blob.x, this.blob.y - 50)
    }

    private drawSpeechBubble(): void {
        const g = this.speechBubbleGraphics
        g.clear()

        // Measure text
        const textWidth = this.speechBubbleText.width
        const textHeight = this.speechBubbleText.height
        const paddingX = 10
        const paddingY = 6
        const bubbleWidth = textWidth + paddingX * 2
        const bubbleHeight = textHeight + paddingY * 2
        const tailHeight = 8

        // Bubble background
        g.roundRect(-bubbleWidth / 2, -bubbleHeight - tailHeight, bubbleWidth, bubbleHeight, 8)
        g.fill({ color: 0xffffff, alpha: 0.95 })
        g.stroke({ color: 0x6a3d7a, width: 2 })

        // Tail (triangle pointing down)
        g.moveTo(-6, -tailHeight)
        g.lineTo(0, 0)
        g.lineTo(6, -tailHeight)
        g.fill({ color: 0xffffff, alpha: 0.95 })

        // Tail border
        g.moveTo(-6, -tailHeight)
        g.lineTo(0, 0)
        g.lineTo(6, -tailHeight)
        g.stroke({ color: 0x6a3d7a, width: 2 })

        // Position text
        this.speechBubbleText.position.set(0, -bubbleHeight / 2 - tailHeight)
    }

    private easeOutBack(x: number): number {
        const c1 = 1.70158
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
    }

    /**
     * Get the pendulum period based on rope length
     */
    getPeriod(): number {
        return 2 * Math.PI * Math.sqrt(this.physics.ropeLength / this.physics.gravity)
    }

    /**
     * Configure trajectory preview visibility based on difficulty
     * @param mode - 'always' | 'timed' | 'flicker' | 'hidden'
     * @param options - Additional options for the mode
     */
    setTrajectoryMode(
        mode: 'always' | 'timed' | 'flicker' | 'hidden',
        options?: { duration?: number; flickerInterval?: number; flickerOnRatio?: number }
    ): void {
        this.trajectoryMode = mode
        this.trajectoryTimer = 0

        if (options?.duration !== undefined) {
            this.trajectoryDuration = options.duration
            this.trajectoryTimer = options.duration  // Start with full time
        }
        if (options?.flickerInterval !== undefined) {
            this.flickerInterval = options.flickerInterval
        }
        if (options?.flickerOnRatio !== undefined) {
            this.flickerOnRatio = options.flickerOnRatio
        }
    }

    /**
     * Set goal position for distance-based expressions
     */
    setGoalPosition(x: number, y: number): void {
        this.goalX = x
        this.goalY = y
    }

    /**
     * Add energy to keep pendulum swinging (called when switch is pressed)
     * Adds angular velocity in the current direction of swing
     * Also triggers a shock reaction
     */
    addEnergy(amount: number): void {
        if (this.state !== 'swinging') return

        // Add energy in the direction of current motion
        const direction = this.physics.angularVelocity >= 0 ? 1 : -1

        // If nearly stopped, pick a random direction
        if (Math.abs(this.physics.angularVelocity) < 0.1) {
            const randomDir = Math.random() > 0.5 ? 1 : -1
            this.physics.angularVelocity += amount * randomDir
        } else {
            this.physics.angularVelocity += amount * direction
        }

        // Trigger shock reaction
        this.isShocked = true
        this.shockTimer = 0.4  // Show shocked expression for 0.4 seconds
    }

    /**
     * Get current angular velocity magnitude for animation sync
     */
    getSwingIntensity(): number {
        return Math.abs(this.physics.angularVelocity)
    }

    /**
     * Handle wall bounce - returns true if bounced, false if HP depleted
     */
    bounceOffWall(wallSide: 'left' | 'right' | 'top', boundaryValue: number): boolean {
        if (this.state !== 'released') return false

        // Correct position to prevent multiple collisions
        const buffer = 20  // Push out of wall
        if (wallSide === 'left') {
            this.releaseX = boundaryValue + buffer
            // Reverse X velocity with some energy loss
            this.releaseVx *= -0.7
        } else if (wallSide === 'right') {
            this.releaseX = boundaryValue - buffer
            // Reverse X velocity with some energy loss
            this.releaseVx *= -0.7
        } else if (wallSide === 'top') {
            this.releaseY = boundaryValue + buffer
            // Reverse Y velocity with some energy loss
            this.releaseVy *= -0.7
            // Also reduce upward momentum
            if (this.releaseVy < 0) this.releaseVy = Math.abs(this.releaseVy) * 0.5
        }

        // Take damage
        this.currentHp -= this.hpDamageOnBounce
        this.isHurt = true
        this.hurtTimer = 0.3

        return this.currentHp > 0
    }

    /**
     * Apply impulse force (for obstacle bumping)
     * @param dirX - Direction X (normalized)
     * @param dirY - Direction Y (normalized)
     * @param force - Force magnitude
     */
    applyImpulse(dirX: number, dirY: number, force: number): void {
        if (this.state !== 'released') return

        this.releaseVx += dirX * force
        this.releaseVy += dirY * force

        // Trigger brief hurt state for visual feedback
        this.isHurt = true
        this.hurtTimer = 0.15
    }

    /**
     * Push away from a point (for obstacle collision)
     */
    pushAwayFrom(obstacleX: number, obstacleY: number, pushForce: number = 300): void {
        if (this.state !== 'released') return

        const dx = this.releaseX - obstacleX
        const dy = this.releaseY - obstacleY
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < 1) return  // Avoid division by zero

        // Normalize direction
        const dirX = dx / dist
        const dirY = dy / dist

        // Apply push impulse
        this.applyImpulse(dirX, dirY, pushForce)

        // Also move position slightly to prevent re-collision
        this.releaseX += dirX * 10
        this.releaseY += dirY * 10
    }

    /**
     * Get current HP percentage (0-1)
     */
    getHpPercent(): number {
        return this.currentHp / this.maxHp
    }

    /**
     * Get current HP value
     */
    getHp(): number {
        return this.currentHp
    }

    /**
     * Check if HP is depleted
     */
    isHpDepleted(): boolean {
        return this.currentHp <= 0
    }

    /**
     * Reset HP (for new round)
     */
    resetHp(): void {
        this.currentHp = this.maxHp
        this.isHurt = false
        this.hurtTimer = 0
    }

    /**
     * Get current distance to goal
     */
    private getDistanceToGoal(): number {
        const pos = this.getPosition()
        const dx = pos.x - this.goalX
        const dy = pos.y - this.goalY
        return Math.sqrt(dx * dx + dy * dy)
    }

    /**
     * Check if trajectory should be visible based on current mode
     */
    private isTrajectoryVisible(): boolean {
        switch (this.trajectoryMode) {
            case 'always':
                return true

            case 'hidden':
                return false

            case 'timed':
                return this.trajectoryTimer > 0

            case 'flicker':
                // Cycle through on/off based on stateTime
                const cycleTime = this.stateTime % this.flickerInterval
                return cycleTime < this.flickerInterval * this.flickerOnRatio

            default:
                return true
        }
    }

    /**
     * Update physics simulation
     */
    update(deltaSeconds: number): void {
        this.stateTime += deltaSeconds

        if (this.state === 'swinging') {
            this.updateSwinging(deltaSeconds)
        } else if (this.state === 'released') {
            this.updateReleased(deltaSeconds)
        } else if (this.state === 'drowning') {
            this.updateDrowning(deltaSeconds)
        }

        // Update speech bubble
        this.updateSpeechBubble(deltaSeconds)
    }

    private updateSwinging(deltaSeconds: number): void {
        // Pendulum equation: α = -(g/L) * sin(θ)
        const angularAcceleration = -(this.physics.gravity / this.physics.ropeLength) * Math.sin(this.physics.angle)

        // Update angular velocity
        this.physics.angularVelocity += angularAcceleration * deltaSeconds

        // Apply damping
        this.physics.angularVelocity *= this.damping

        // Update angle
        this.physics.angle += this.physics.angularVelocity * deltaSeconds

        // Update trajectory timer (for 'timed' mode)
        if (this.trajectoryMode === 'timed' && this.trajectoryTimer > 0) {
            this.trajectoryTimer -= deltaSeconds
        }

        // Update shock timer
        if (this.shockTimer > 0) {
            this.shockTimer -= deltaSeconds
            if (this.shockTimer <= 0) {
                this.isShocked = false
            }
        }

        // Update visual
        this.updatePosition()
        this.drawRope()
        this.drawTrajectoryPreview()
        this.updateExpression()
    }

    private updateReleased(deltaSeconds: number): void {
        // Simple projectile motion (use class constant for consistency with preview)
        this.releaseVy += this.projectileGravity * deltaSeconds
        this.releaseX += this.releaseVx * deltaSeconds
        this.releaseY += this.releaseVy * deltaSeconds

        this.blob.setPosition(this.releaseX, this.releaseY)

        // Subtle rotation based on velocity direction
        const rotation = Math.atan2(this.releaseVy, this.releaseVx)
        this.blob.rotation = rotation * 0.2

        // Update hurt timer
        if (this.hurtTimer > 0) {
            this.hurtTimer -= deltaSeconds
            if (this.hurtTimer <= 0) {
                this.isHurt = false
            }
        }

        // Track approach state for expressions
        const currentDistance = this.getDistanceToGoal()
        if (currentDistance < this.prevDistanceToGoal - 5) {
            this.approachState = 'approaching'
        } else if (currentDistance > this.prevDistanceToGoal + 5) {
            this.approachState = 'receding'
        }
        this.prevDistanceToGoal = currentDistance

        this.updateExpression()
        this.drawHpBar()
    }

    /**
     * Start drowning animation at the given surface Y position
     */
    startDrowning(surfaceY: number): void {
        if (this.state === 'drowning') return

        this.state = 'drowning'
        this.stateTime = 0
        this.drowningTimer = 0
        this.drowningDepth = 0
        this.drowningSurfaceY = surfaceY
        this.drowningRotation = 0

        // Slow down horizontal movement
        this.releaseVx *= 0.3
        this.releaseVy = 0
    }

    private updateDrowning(deltaSeconds: number): void {
        this.drowningTimer += deltaSeconds

        // Sink slowly with struggle
        const sinkSpeed = 40 + this.drowningTimer * 20  // Accelerate sinking
        this.drowningDepth += sinkSpeed * deltaSeconds

        // Wobble and rotate as sinking (struggling)
        const struggleIntensity = Math.max(0, 1 - this.drowningTimer * 0.5)  // Fades over 2 seconds
        const wobbleX = Math.sin(this.drowningTimer * 8) * 5 * struggleIntensity
        const wobbleY = Math.sin(this.drowningTimer * 6) * 3 * struggleIntensity

        // Spin slowly as sinking
        this.drowningRotation += deltaSeconds * (2 + this.drowningTimer)

        // Update position
        this.releaseX += wobbleX * deltaSeconds * 10
        this.releaseY = this.drowningSurfaceY + this.drowningDepth

        this.blob.setPosition(this.releaseX + wobbleX, this.releaseY + wobbleY)
        this.blob.rotation = this.drowningRotation

        // Scale down as sinking deeper (being consumed)
        const sinkProgress = Math.min(1, this.drowningTimer / 1.5)
        const scale = 1 - sinkProgress * 0.5

        this.updateExpression(scale)
    }

    /**
     * Check if drowning animation is complete
     */
    isDrowningComplete(): boolean {
        return this.state === 'drowning' && this.drowningTimer > 1.5
    }

    /**
     * Get drowning progress (0-1) for external effects
     */
    getDrowningProgress(): number {
        if (this.state !== 'drowning') return 0
        return Math.min(1, this.drowningTimer / 1.5)
    }

    private updatePosition(): void {
        // Calculate position from pendulum angle
        const x = this.physics.anchorX + Math.sin(this.physics.angle) * this.physics.ropeLength
        const y = this.physics.anchorY + Math.cos(this.physics.angle) * this.physics.ropeLength

        this.blob.setPosition(x, y)
    }

    private drawRope(): void {
        if (this.state !== 'swinging') {
            this.ropeGraphics.clear()
            return
        }

        const g = this.ropeGraphics
        g.clear()

        const wobblePos = this.getPosition()

        // Draw rope
        g.moveTo(this.physics.anchorX, this.physics.anchorY)
        g.lineTo(wobblePos.x, wobblePos.y)
        g.stroke({ color: 0x8b4513, width: 4 })

        // Draw anchor point
        g.circle(this.physics.anchorX, this.physics.anchorY, 6)
        g.fill({ color: 0x5d4e37 })
        g.stroke({ color: 0x3d2e17, width: 2 })
    }

    /**
     * Draw trajectory preview showing where wobble will go if released now
     */
    private drawTrajectoryPreview(): void {
        const g = this.trajectoryGraphics
        g.clear()

        if (this.state !== 'swinging') return
        if (!this.isTrajectoryVisible()) return

        // Get current position
        const startX = this.physics.anchorX + Math.sin(this.physics.angle) * this.physics.ropeLength
        const startY = this.physics.anchorY + Math.cos(this.physics.angle) * this.physics.ropeLength

        // Calculate release velocity (same formula as release())
        const tangentSpeed = this.physics.angularVelocity * this.physics.ropeLength
        const tangentAngle = this.physics.angle + Math.PI / 2

        let vx = Math.sin(tangentAngle) * tangentSpeed * this.releaseScale
        let vy = Math.cos(tangentAngle) * tangentSpeed * this.releaseScale

        // Don't show trajectory if barely moving
        const speed = Math.sqrt(vx * vx + vy * vy)
        if (speed < 30) return

        // Simulate projectile motion and draw dots
        let x = startX
        let y = startY
        const dt = 0.05  // Time step for simulation
        const numPoints = 12  // Number of preview points
        const maxTime = 0.8  // Max preview time

        for (let i = 0; i < numPoints; i++) {
            const t = (i + 1) * (maxTime / numPoints)

            // Projectile motion equations
            x = startX + vx * t
            y = startY + vy * t + 0.5 * this.projectileGravity * t * t

            // Fade out dots over distance
            const alpha = 0.6 * (1 - i / numPoints)
            const dotSize = 4 * (1 - i / numPoints * 0.5)

            // Draw dot
            g.circle(x, y, dotSize)
            g.fill({ color: 0xf5b041, alpha })
        }

        // Draw direction arrow at start
        const arrowLength = Math.min(speed * 0.15, 40)
        const arrowAngle = Math.atan2(vy, vx)

        const arrowEndX = startX + Math.cos(arrowAngle) * arrowLength
        const arrowEndY = startY + Math.sin(arrowAngle) * arrowLength

        // Arrow line
        g.moveTo(startX, startY)
        g.lineTo(arrowEndX, arrowEndY)
        g.stroke({ color: 0xf5b041, width: 3, alpha: 0.8 })

        // Arrow head
        const headSize = 8
        const headAngle = Math.PI / 6
        g.moveTo(arrowEndX, arrowEndY)
        g.lineTo(
            arrowEndX - Math.cos(arrowAngle - headAngle) * headSize,
            arrowEndY - Math.sin(arrowAngle - headAngle) * headSize
        )
        g.moveTo(arrowEndX, arrowEndY)
        g.lineTo(
            arrowEndX - Math.cos(arrowAngle + headAngle) * headSize,
            arrowEndY - Math.sin(arrowAngle + headAngle) * headSize
        )
        g.stroke({ color: 0xf5b041, width: 3, alpha: 0.8 })
    }

    private updateExpression(drowningScale: number = 1): void {
        let expression: BlobExpression = 'excited'
        let scaleX = 1
        let scaleY = 1

        if (this.state === 'success') {
            expression = 'happy'
            // Celebratory squish
            scaleX = 1.2
            scaleY = 0.85
        } else if (this.state === 'failed') {
            expression = 'dizzy'  // Dazed look after failure
            // Squished look
            scaleX = 1.3
            scaleY = 0.7
        } else if (this.state === 'drowning') {
            // Panic/struggle expression while drowning
            const progress = this.getDrowningProgress()
            if (progress < 0.3) {
                expression = 'struggle'  // Initial panic
            } else if (progress < 0.7) {
                expression = 'dizzy'  // Losing consciousness
            } else {
                expression = 'sleepy'  // Fading out
            }
            // Rapid breathing/pulsing effect + shrinking as consumed
            const pulse = Math.sin(this.drowningTimer * 12) * 0.1 * (1 - progress)
            scaleX = (1 + pulse) * drowningScale
            scaleY = (1 - pulse) * drowningScale
        } else if (this.state === 'released') {
            // Check if hurt (just bounced off wall)
            if (this.isHurt) {
                expression = 'dizzy'
                // Flash red and shake
                const shake = Math.sin(this.hurtTimer * 40) * 0.15
                scaleX = 1 + shake
                scaleY = 1 - shake
                // Tint would be nice but we'll use expression
            } else {
                // Expression based on approach state
                const speed = Math.sqrt(this.releaseVx ** 2 + this.releaseVy ** 2)
                const distance = this.getDistanceToGoal()

                // Worried expression when HP is low
                const hpPercent = this.getHpPercent()
                if (hpPercent <= 0.25) {
                    expression = 'struggle'
                } else if (distance < 80) {
                    // Very close to goal - excited!
                    expression = 'excited'
                    scaleX = 1.15
                    scaleY = 0.9
                } else if (this.approachState === 'approaching') {
                    // Getting closer - hopeful
                    expression = 'happy'
                    if (speed > 100) {
                        scaleX = 1.1
                        scaleY = 0.92
                    }
                } else if (this.approachState === 'receding') {
                    // Getting farther - worried
                    expression = 'worried'
                    if (speed > 100) {
                        scaleX = 0.9
                        scaleY = 1.1
                    }
                } else {
                    // Neutral falling
                    expression = 'neutral'
                    if (speed > 100) {
                        scaleX = 1.05
                        scaleY = 0.95
                    }
                }
            }
        } else if (this.state === 'swinging') {
            // Check if shocked (switch was pressed)
            if (this.isShocked) {
                expression = 'struggle'  // Pained expression
                // Shake/vibrate effect
                const shakeIntensity = this.shockTimer / 0.4
                scaleX = 1 + Math.sin(this.shockTimer * 50) * 0.1 * shakeIntensity
                scaleY = 1 - Math.sin(this.shockTimer * 50) * 0.1 * shakeIntensity
            } else {
                // Change expression based on angular velocity
                const angularSpeed = Math.abs(this.physics.angularVelocity)
                if (angularSpeed > 2) {
                    expression = 'surprised'
                } else if (angularSpeed > 1) {
                    expression = 'worried'
                }
            }
        }

        this.blob.updateOptions({
            expression,
            scaleX,
            scaleY,
            wobblePhase: this.stateTime * 3,
        })
    }

    /**
     * Release the wobble from the rope
     */
    release(): void {
        if (this.state !== 'swinging') return

        // Calculate current position BEFORE changing state
        // (getPosition() returns different values based on state)
        const currentX = this.physics.anchorX + Math.sin(this.physics.angle) * this.physics.ropeLength
        const currentY = this.physics.anchorY + Math.cos(this.physics.angle) * this.physics.ropeLength

        this.releaseX = currentX
        this.releaseY = currentY

        // Calculate release velocity (tangent to circular motion)
        // v = ω * r (angular velocity * radius)
        const tangentSpeed = this.physics.angularVelocity * this.physics.ropeLength
        const tangentAngle = this.physics.angle + Math.PI / 2 // Perpendicular to rope

        // Use class constant for consistent physics with trajectory preview
        this.releaseVx = Math.sin(tangentAngle) * tangentSpeed * this.releaseScale
        this.releaseVy = Math.cos(tangentAngle) * tangentSpeed * this.releaseScale

        // Now change state
        this.state = 'released'
        this.stateTime = 0

        // Clear visuals
        this.ropeGraphics.clear()
        this.trajectoryGraphics.clear()
    }

    /**
     * Mark as successful (hit goal)
     */
    markSuccess(): void {
        this.state = 'success'
        this.stateTime = 0
    }

    /**
     * Mark as failed (missed or hit obstacle)
     */
    markFailed(): void {
        this.state = 'failed'
        this.stateTime = 0
    }

    /**
     * Get current position
     */
    getPosition(): { x: number; y: number } {
        if (this.state === 'released' || this.state === 'success' || this.state === 'failed') {
            return { x: this.releaseX, y: this.releaseY }
        }
        return {
            x: this.physics.anchorX + Math.sin(this.physics.angle) * this.physics.ropeLength,
            y: this.physics.anchorY + Math.cos(this.physics.angle) * this.physics.ropeLength,
        }
    }

    /**
     * Get alpha for fade out animation
     */
    getAlpha(): number {
        if (this.state === 'success') {
            return Math.max(0, 1 - this.stateTime / 0.5)
        }
        if (this.state === 'failed') {
            return Math.max(0, 1 - this.stateTime / 0.3)
        }
        if (this.state === 'drowning') {
            // Fade out as sinking deeper
            const progress = this.getDrowningProgress()
            return Math.max(0, 1 - progress * 0.8)  // Don't fully fade to see sinking
        }
        return 1
    }

    /**
     * Apply fade alpha to visual elements only (not speech bubble)
     * This allows speech bubbles to remain visible during fade-out states like drowning
     */
    applyFadeAlpha(): void {
        const alpha = this.getAlpha()
        this.blob.alpha = alpha
        this.ropeGraphics.alpha = alpha
        this.trajectoryGraphics.alpha = alpha
        this.hpBarGraphics.alpha = alpha
    }

    /**
     * Check if animation is complete
     */
    isAnimationComplete(): boolean {
        if (this.state === 'success' && this.stateTime > 0.5) return true
        if (this.state === 'failed' && this.stateTime > 0.3) return true
        if (this.state === 'drowning' && this.drowningTimer > 1.5) return true
        return false
    }

    /**
     * Check if wobble is out of bounds
     */
    isOutOfBounds(width: number, height: number): boolean {
        const pos = this.getPosition()
        return pos.x < -50 || pos.x > width + 50 || pos.y > height + 50
    }

    get x(): number {
        return this.getPosition().x
    }

    get y(): number {
        return this.getPosition().y
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
