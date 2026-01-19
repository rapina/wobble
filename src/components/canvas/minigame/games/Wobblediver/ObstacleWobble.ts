/**
 * ObstacleWobble.ts - Tentacle obstacles rising from the abyss
 * Cosmic horror themed obstacles that block the player's path
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
    private baseX: number  // Base anchored in abyss
    private baseY: number
    private startX: number
    private startY: number

    // Tentacle properties
    private tentacleLength: number
    private segmentCount: number
    private segments: TentacleSegment[] = []

    // Movement
    private movement: ObstacleMovement
    private speed: number
    private range: number
    private time = 0
    private phase: number  // Random phase offset

    // Visual state
    private pulseTime = 0
    private isAgitated = false
    private agitationTimer = 0

    // Colors
    private readonly baseColor = 0x3d1a50
    private readonly tipColor = 0x5a2d70
    private readonly suckerColor = 0x2a1030
    private readonly glowColor = 0x8b0000

    constructor(config: ObstacleConfig) {
        this.container = new Container()

        this.baseX = config.x
        this.baseY = config.y + 80  // Base is in the abyss water
        this.startX = config.x
        this.startY = config.y
        this.x = config.x
        this.y = config.y
        this.radius = config.radius ?? 20
        this.movement = config.movement ?? 'sway'
        this.speed = config.speed ?? 1
        this.range = config.range ?? 40
        this.tentacleLength = config.tentacleLength ?? 120
        this.segmentCount = config.segments ?? 8
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
        const segmentLength = this.tentacleLength / this.segmentCount

        let x = this.baseX
        let y = this.baseY
        let angle = -Math.PI / 2  // Point upward

        for (let i = 0; i < this.segmentCount; i++) {
            const t = i / this.segmentCount
            const width = this.radius * 2 * (1 - t * 0.7)  // Taper toward tip

            this.segments.push({ x, y, width, angle })

            x += Math.cos(angle) * segmentLength
            y += Math.sin(angle) * segmentLength
        }

        // Update tip position
        this.x = x
        this.y = y
    }

    private updateSegments(): void {
        const segmentLength = this.tentacleLength / this.segmentCount
        const waveSpeed = this.speed * 2
        const waveAmplitude = 0.3

        let x = this.baseX
        let y = this.baseY

        // Calculate base movement offset
        let baseOffsetX = 0
        switch (this.movement) {
            case 'horizontal':
                baseOffsetX = Math.sin(this.time * this.speed + this.phase) * this.range
                break
            case 'sway':
                baseOffsetX = Math.sin(this.time * this.speed * 0.5 + this.phase) * this.range * 0.5
                break
        }

        x += baseOffsetX

        for (let i = 0; i < this.segmentCount; i++) {
            const t = i / this.segmentCount

            // Base angle points upward with wave motion
            let angle = -Math.PI / 2

            // Add sinusoidal wave along the tentacle
            const wave = Math.sin(this.time * waveSpeed + i * 0.8 + this.phase) * waveAmplitude * (1 + t)

            // Add secondary faster wave for organic feel
            const wave2 = Math.sin(this.time * waveSpeed * 1.5 + i * 0.5 + this.phase) * waveAmplitude * 0.3 * t

            // Agitation makes tentacle thrash more
            const agitationWave = this.isAgitated
                ? Math.sin(this.time * 15 + i * 0.3) * 0.4 * (1 - this.agitationTimer / 0.5)
                : 0

            angle += wave + wave2 + agitationWave

            // Slight curve based on movement
            if (this.movement === 'horizontal' || this.movement === 'sway') {
                const lean = Math.sin(this.time * this.speed + this.phase) * 0.2 * t
                angle += lean
            }

            this.segments[i].x = x
            this.segments[i].y = y
            this.segments[i].angle = angle

            x += Math.cos(angle) * segmentLength
            y += Math.sin(angle) * segmentLength
        }

        // Update collision point (tip of tentacle)
        this.x = x
        this.y = y
    }

    private draw(): void {
        const g = this.graphics
        const glow = this.glowGraphics
        g.clear()
        glow.clear()

        // Pulsing glow intensity
        const pulseIntensity = 0.3 + Math.sin(this.pulseTime * 3) * 0.15
        const agitationGlow = this.isAgitated ? 0.3 : 0

        // Draw glow around tentacle path
        for (let i = 0; i < this.segments.length - 1; i++) {
            const seg = this.segments[i]
            const nextSeg = this.segments[i + 1]
            const glowWidth = seg.width + 15

            glow.moveTo(seg.x, seg.y)
            glow.lineTo(nextSeg.x, nextSeg.y)
            glow.stroke({
                color: this.glowColor,
                width: glowWidth,
                alpha: (pulseIntensity + agitationGlow) * 0.2,
                cap: 'round',
            })
        }

        // Draw tentacle body (from base to tip)
        for (let i = 0; i < this.segments.length - 1; i++) {
            const seg = this.segments[i]
            const nextSeg = this.segments[i + 1]
            const t = i / this.segments.length

            // Interpolate color from base to tip
            const color = this.lerpColor(this.baseColor, this.tipColor, t)

            // Draw segment as thick line
            g.moveTo(seg.x, seg.y)
            g.lineTo(nextSeg.x, nextSeg.y)
            g.stroke({
                color,
                width: seg.width,
                cap: 'round',
                join: 'round',
            })
        }

        // Draw suckers on one side
        for (let i = 2; i < this.segments.length - 1; i += 2) {
            const seg = this.segments[i]
            const suckerSize = seg.width * 0.25
            const suckerOffset = seg.width * 0.3

            // Offset sucker to the side
            const perpAngle = seg.angle + Math.PI / 2
            const suckerX = seg.x + Math.cos(perpAngle) * suckerOffset
            const suckerY = seg.y + Math.sin(perpAngle) * suckerOffset

            // Outer sucker
            g.circle(suckerX, suckerY, suckerSize)
            g.fill({ color: this.tipColor, alpha: 0.8 })

            // Inner dark part
            g.circle(suckerX, suckerY, suckerSize * 0.5)
            g.fill({ color: this.suckerColor, alpha: 0.9 })
        }

        // Draw tip (slightly bulbous)
        const lastSeg = this.segments[this.segments.length - 1]
        const tipSize = lastSeg.width * 0.6

        // Tip glow when agitated
        if (this.isAgitated) {
            glow.circle(this.x, this.y, tipSize + 10)
            glow.fill({ color: 0xff0000, alpha: 0.3 })
        }

        g.circle(this.x, this.y, tipSize)
        g.fill({ color: this.tipColor })

        // Small highlight on tip
        g.circle(this.x - tipSize * 0.2, this.y - tipSize * 0.2, tipSize * 0.3)
        g.fill({ color: 0x7a4095, alpha: 0.5 })
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
     * Update movement and animation
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pulseTime += deltaSeconds

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
     * Check collision with a point (checks against tentacle tip area)
     */
    checkCollision(x: number, y: number): boolean {
        // Check collision with tip
        const dx = x - this.x
        const dy = y - this.y
        const tipDistance = Math.sqrt(dx * dx + dy * dy)
        if (tipDistance < this.radius + 15) {
            return true
        }

        // Also check collision with upper segments
        for (let i = Math.floor(this.segments.length / 2); i < this.segments.length; i++) {
            const seg = this.segments[i]
            const segDx = x - seg.x
            const segDy = y - seg.y
            const segDist = Math.sqrt(segDx * segDx + segDy * segDy)
            if (segDist < seg.width / 2 + 10) {
                return true
            }
        }

        return false
    }

    /**
     * Check if this obstacle can bump (always true for tentacles)
     */
    canBump(): boolean {
        return true
    }

    /**
     * Trigger agitated reaction animation
     */
    showBump(): void {
        this.isAgitated = true
        this.agitationTimer = 0.5
    }

    /**
     * Move to new position
     */
    moveTo(x: number, y: number): void {
        this.baseX = x
        this.baseY = y + 80
        this.startX = x
        this.startY = y
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
     * Set tentacle length
     */
    setLength(length: number): void {
        this.tentacleLength = length
        this.initializeSegments()
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
