/**
 * ObstacleWobble.ts - Wall-mounted tentacle obstacles
 * Tentacles extend from walls and attack when player gets close
 */

import { Container, Graphics } from 'pixi.js'

export type ObstacleMovement = 'static' | 'horizontal' | 'vertical' | 'circular' | 'sway'

export interface ObstacleConfig {
    x: number
    y: number
    radius?: number
    movement?: ObstacleMovement
    speed?: number
    range?: number
    tentacleLength?: number
    segments?: number
    side?: 'left' | 'right'  // Which wall the tentacle comes from
    attackRange?: number      // How close player needs to be to trigger attack
}

interface TentacleSegment {
    x: number
    y: number
    width: number
    angle: number
}

export class ObstacleWobble {
    public container: Container
    private graphics: Graphics
    private glowGraphics: Graphics

    // Position (tip of tentacle for collision)
    public x: number
    public y: number
    public radius: number
    private anchorX: number   // Wall anchor point
    private anchorY: number
    private startX: number
    private startY: number

    // Tentacle properties
    private maxLength: number
    private currentLength: number
    private targetLength: number
    private segmentCount: number
    private segments: TentacleSegment[] = []
    public side: 'left' | 'right'  // Public so scene can read it

    // Attack state
    private attackRange: number
    private isAttacking = false
    private attackTimer = 0
    private readonly ATTACK_SPEED = 400      // How fast tentacle extends
    private readonly RETRACT_SPEED = 150     // How fast it retracts
    private readonly IDLE_LENGTH = 30        // Length when idle (just peeking out)
    private readonly ATTACK_HOLD_TIME = 0.8  // How long to stay extended

    // Movement
    private movement: ObstacleMovement
    private speed: number
    private range: number
    private time = 0
    private phase: number

    // Visual state
    private pulseTime = 0
    private isAgitated = false
    private agitationTimer = 0

    // Colors - darker, more menacing
    private readonly baseColor = 0x2a0a35
    private readonly tipColor = 0x4a1a55
    private readonly suckerColor = 0x1a0520
    private readonly glowColor = 0x6b0020

    constructor(config: ObstacleConfig) {
        this.container = new Container()

        this.side = config.side ?? 'left'
        this.anchorX = config.x
        this.anchorY = config.y
        this.startX = config.x
        this.startY = config.y
        this.x = config.x
        this.y = config.y
        this.radius = config.radius ?? 18
        this.movement = config.movement ?? 'static'
        this.speed = config.speed ?? 1
        this.range = config.range ?? 30
        this.maxLength = config.tentacleLength ?? 150
        this.currentLength = this.IDLE_LENGTH
        this.targetLength = this.IDLE_LENGTH
        this.segmentCount = config.segments ?? 10
        this.attackRange = config.attackRange ?? 120
        this.phase = Math.random() * Math.PI * 2

        // Glow layer (behind tentacle)
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Main tentacle graphics
        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        this.initializeSegments()
        this.draw()
    }

    private initializeSegments(): void {
        this.segments = []
        const segmentLength = this.currentLength / this.segmentCount

        let x = this.anchorX
        let y = this.anchorY
        // Point toward center based on side
        let angle = this.side === 'left' ? 0 : Math.PI

        for (let i = 0; i < this.segmentCount; i++) {
            const t = i / this.segmentCount
            const width = this.radius * 2.2 * (1 - t * 0.6)

            this.segments.push({ x, y, width, angle })

            x += Math.cos(angle) * segmentLength
            y += Math.sin(angle) * segmentLength
        }

        this.x = x
        this.y = y
    }

    private updateSegments(): void {
        const segmentLength = this.currentLength / this.segmentCount
        const waveSpeed = this.speed * 2.5
        const waveAmplitude = this.isAttacking ? 0.15 : 0.25

        let x = this.anchorX
        let y = this.anchorY

        // Vertical sway for anchor point
        if (this.movement === 'sway' || this.movement === 'vertical') {
            y += Math.sin(this.time * this.speed * 0.7 + this.phase) * this.range * 0.4
        }

        // Base angle points toward center
        const baseAngle = this.side === 'left' ? 0 : Math.PI

        for (let i = 0; i < this.segmentCount; i++) {
            const t = i / this.segmentCount

            let angle = baseAngle

            // Slight droop (gravity effect)
            angle += t * 0.3

            // Sinusoidal wave along the tentacle
            const wave = Math.sin(this.time * waveSpeed + i * 0.6 + this.phase) * waveAmplitude * t

            // Secondary wave for organic feel
            const wave2 = Math.sin(this.time * waveSpeed * 1.3 + i * 0.4 + this.phase + 1) * waveAmplitude * 0.4 * t

            // Attack lunge motion
            const attackLunge = this.isAttacking
                ? Math.sin(this.attackTimer * 12) * 0.1 * (1 - t)
                : 0

            // Agitation thrashing
            const agitationWave = this.isAgitated
                ? Math.sin(this.time * 18 + i * 0.25) * 0.5 * (1 - this.agitationTimer / 0.5)
                : 0

            angle += wave + wave2 + attackLunge + agitationWave

            this.segments[i].x = x
            this.segments[i].y = y
            this.segments[i].angle = angle
            this.segments[i].width = this.radius * 2.2 * (1 - t * 0.6)

            x += Math.cos(angle) * segmentLength
            y += Math.sin(angle) * segmentLength
        }

        this.x = x
        this.y = y
    }

    private draw(): void {
        const g = this.graphics
        const glow = this.glowGraphics
        g.clear()
        glow.clear()

        if (this.currentLength < 5) return

        const pulseIntensity = 0.25 + Math.sin(this.pulseTime * 2.5) * 0.12
        const attackGlow = this.isAttacking ? 0.35 : 0
        const agitationGlow = this.isAgitated ? 0.25 : 0

        // Draw eerie glow
        for (let i = 0; i < this.segments.length - 1; i++) {
            const seg = this.segments[i]
            const nextSeg = this.segments[i + 1]
            const glowWidth = seg.width + 20

            glow.moveTo(seg.x, seg.y)
            glow.lineTo(nextSeg.x, nextSeg.y)
            glow.stroke({
                color: this.glowColor,
                width: glowWidth,
                alpha: (pulseIntensity + attackGlow + agitationGlow) * 0.15,
                cap: 'round',
            })
        }

        // Draw tentacle body
        for (let i = 0; i < this.segments.length - 1; i++) {
            const seg = this.segments[i]
            const nextSeg = this.segments[i + 1]
            const t = i / this.segments.length

            const color = this.lerpColor(this.baseColor, this.tipColor, t)

            g.moveTo(seg.x, seg.y)
            g.lineTo(nextSeg.x, nextSeg.y)
            g.stroke({
                color,
                width: seg.width,
                cap: 'round',
                join: 'round',
            })
        }

        // Draw suckers
        for (let i = 2; i < this.segments.length - 1; i += 2) {
            const seg = this.segments[i]
            const suckerSize = seg.width * 0.22
            const suckerOffset = seg.width * 0.35

            // Suckers on the underside (toward bottom)
            const perpAngle = seg.angle + Math.PI / 2
            const suckerX = seg.x + Math.cos(perpAngle) * suckerOffset
            const suckerY = seg.y + Math.sin(perpAngle) * suckerOffset

            g.circle(suckerX, suckerY, suckerSize)
            g.fill({ color: this.tipColor, alpha: 0.7 })

            g.circle(suckerX, suckerY, suckerSize * 0.45)
            g.fill({ color: this.suckerColor, alpha: 0.85 })
        }

        // Draw menacing tip
        if (this.segments.length > 0) {
            const tipSize = this.radius * 0.7

            // Danger glow when attacking
            if (this.isAttacking || this.isAgitated) {
                glow.circle(this.x, this.y, tipSize + 12)
                glow.fill({ color: 0xcc0000, alpha: 0.35 })
            }

            g.circle(this.x, this.y, tipSize)
            g.fill({ color: this.tipColor })

            // Highlight
            g.circle(this.x - tipSize * 0.25, this.y - tipSize * 0.25, tipSize * 0.28)
            g.fill({ color: 0x6a3085, alpha: 0.45 })
        }
    }

    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xff
        const g1 = (color1 >> 8) & 0xff
        const b1 = color1 & 0xff

        const r2 = (color2 >> 16) & 0xff
        const g2 = (color2 >> 8) & 0xff
        const b2 = color2 & 0xff

        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)

        return (r << 16) | (g << 8) | b
    }

    /**
     * Check if player is within attack range
     */
    checkProximity(playerX: number, playerY: number): void {
        const dx = playerX - this.anchorX
        const dy = playerY - this.anchorY
        const distance = Math.sqrt(dx * dx + dy * dy)

        // Only attack if player is on the correct side and within range
        const isOnCorrectSide = this.side === 'left' ? dx > 0 : dx < 0

        if (distance < this.attackRange && isOnCorrectSide && !this.isAttacking) {
            this.triggerAttack()
        }
    }

    /**
     * Trigger attack - extend toward player
     */
    private triggerAttack(): void {
        this.isAttacking = true
        this.attackTimer = 0
        this.targetLength = this.maxLength
    }

    /**
     * Update movement and animation
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pulseTime += deltaSeconds

        // Update attack state
        if (this.isAttacking) {
            this.attackTimer += deltaSeconds
            if (this.attackTimer > this.ATTACK_HOLD_TIME) {
                this.isAttacking = false
                this.targetLength = this.IDLE_LENGTH
            }
        }

        // Smoothly extend/retract tentacle
        if (this.currentLength < this.targetLength) {
            this.currentLength = Math.min(
                this.targetLength,
                this.currentLength + this.ATTACK_SPEED * deltaSeconds
            )
        } else if (this.currentLength > this.targetLength) {
            this.currentLength = Math.max(
                this.targetLength,
                this.currentLength - this.RETRACT_SPEED * deltaSeconds
            )
        }

        // Update agitation
        if (this.isAgitated) {
            this.agitationTimer -= deltaSeconds
            if (this.agitationTimer <= 0) {
                this.isAgitated = false
            }
        }

        this.updateSegments()
        this.draw()
    }

    /**
     * Check collision with a point
     */
    checkCollision(x: number, y: number): boolean {
        // Only check collision when extended enough
        if (this.currentLength < this.IDLE_LENGTH + 20) {
            return false
        }

        // Check collision with tip
        const dx = x - this.x
        const dy = y - this.y
        const tipDistance = Math.sqrt(dx * dx + dy * dy)
        if (tipDistance < this.radius + 12) {
            return true
        }

        // Check collision with extended segments
        for (let i = Math.floor(this.segments.length * 0.4); i < this.segments.length; i++) {
            const seg = this.segments[i]
            const segDx = x - seg.x
            const segDy = y - seg.y
            const segDist = Math.sqrt(segDx * segDx + segDy * segDy)
            if (segDist < seg.width / 2 + 8) {
                return true
            }
        }

        return false
    }

    /**
     * Check if this obstacle can bump
     */
    canBump(): boolean {
        return this.currentLength > this.IDLE_LENGTH + 30
    }

    /**
     * Trigger agitated reaction animation
     */
    showBump(): void {
        this.isAgitated = true
        this.agitationTimer = 0.6
    }

    /**
     * Move anchor to new position
     */
    moveTo(x: number, y: number): void {
        this.anchorX = x
        this.anchorY = y
        this.startX = x
        this.startY = y
        this.initializeSegments()
    }

    /**
     * Set which wall this tentacle is attached to
     */
    setSide(side: 'left' | 'right'): void {
        this.side = side
        this.initializeSegments()
    }

    /**
     * Set movement pattern
     */
    setMovement(movement: ObstacleMovement, speed?: number, range?: number): void {
        this.movement = movement
        if (speed !== undefined) this.speed = speed
        if (range !== undefined) this.range = range
    }

    /**
     * Set max tentacle length
     */
    setLength(length: number): void {
        this.maxLength = length
    }

    /**
     * Set attack range
     */
    setAttackRange(range: number): void {
        this.attackRange = range
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
