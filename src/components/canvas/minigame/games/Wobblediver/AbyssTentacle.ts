/**
 * AbyssTentacle.ts - Tentacle that rises from the abyss to pull the wormhole
 *
 * A creepy tentacle that emerges from the abyss water surface and reaches
 * toward the wormhole, pulling it in different directions. The tentacle's
 * reach and strength depends on the water surface level - higher water means
 * more aggressive pulling.
 */

import { Container, Graphics } from 'pixi.js'
import { AbyssTentacleConfig } from './StageConfig'

interface TentacleSegment {
    x: number
    y: number
    angle: number
}

export class AbyssTentacle {
    public container: Container
    private graphics: Graphics

    // Configuration
    private baseX: number
    private baseY: number // Y position of abyss surface (lower = deeper in screen)
    private maxLength: number
    private basePullStrength: number
    private directionChangeInterval: number
    private maxDisplacement: number
    private color: number
    private segmentCount: number

    // State
    private segments: TentacleSegment[] = []
    private time = 0
    private currentDirection = 0 // -1 to 1 (left to right)
    private targetDirection = 0
    private directionTimer = 0
    private currentLength = 0
    private targetLength: number
    private wormholeX = 0
    private wormholeY = 0
    private isActive = false

    // Water level influence (0 = low water, 1 = high water/close to wormhole)
    private waterLevelInfluence = 0

    // Animation parameters
    private wavePhase = 0
    private waveSpeed = 2
    private waveAmplitude = 10

    // Grab state - when tentacle "catches" the wormhole
    private isGrabbing = false
    private grabStrength = 0
    private grabTargetX = 0

    constructor(config: AbyssTentacleConfig, baseY: number) {
        this.baseX = config.baseX
        this.baseY = baseY
        this.maxLength = config.maxLength
        this.basePullStrength = config.pullStrength
        this.directionChangeInterval = config.directionChangeInterval
        this.maxDisplacement = config.maxDisplacement
        this.color = config.color
        this.segmentCount = config.segments

        this.targetLength = this.maxLength * 0.3 // Start short
        this.directionTimer = Math.random() * this.directionChangeInterval

        this.container = new Container()
        this.graphics = new Graphics()
        this.container.addChild(this.graphics)

        this.initSegments()
    }

    /**
     * Initialize tentacle segments
     */
    private initSegments(): void {
        this.segments = []
        for (let i = 0; i < this.segmentCount; i++) {
            this.segments.push({
                x: this.baseX,
                y: this.baseY,
                angle: -Math.PI / 2, // Point upward initially
            })
        }
    }

    /**
     * Set the wormhole position that this tentacle will try to reach
     */
    setWormholePosition(x: number, y: number): void {
        this.wormholeX = x
        this.wormholeY = y
        this.isActive = true
    }

    /**
     * Update the water surface level (affects tentacle reach and strength)
     * @param surfaceY The Y position of the water surface
     * @param screenHeight The total screen height for normalization
     */
    setWaterLevel(surfaceY: number, screenHeight: number): void {
        this.baseY = surfaceY

        // Calculate water level influence (0-1)
        // Higher water (lower surfaceY) = more influence
        // Normalize based on screen height
        const normalizedHeight = surfaceY / screenHeight
        // Water at bottom (1.0) = 0 influence, water at middle (0.5) = high influence
        this.waterLevelInfluence = Math.max(0, 1 - normalizedHeight * 1.2)
    }

    /**
     * Update tentacle animation and physics
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.wavePhase += deltaSeconds * this.waveSpeed

        // Direction change is influenced by water level (higher = more erratic)
        const directionChangeSpeed = 1 + this.waterLevelInfluence * 2

        // Update direction change timer
        this.directionTimer -= deltaSeconds * directionChangeSpeed
        if (this.directionTimer <= 0) {
            // More extreme direction changes at higher water levels
            const directionRange = 0.6 + this.waterLevelInfluence * 0.4
            this.targetDirection = (Math.random() * 2 - 1) * directionRange
            this.directionTimer = this.directionChangeInterval * (0.8 + Math.random() * 0.4)

            // Chance to "grab" and pull strongly
            if (Math.random() < this.waterLevelInfluence * 0.3) {
                this.isGrabbing = true
                this.grabStrength = 0.5 + this.waterLevelInfluence * 0.5
                this.grabTargetX = this.targetDirection * this.maxDisplacement * 1.5
            }
        }

        // Smooth direction transition (faster at higher water levels)
        const transitionSpeed = 2 + this.waterLevelInfluence * 3
        this.currentDirection +=
            (this.targetDirection - this.currentDirection) * deltaSeconds * transitionSpeed

        // Update grab state
        if (this.isGrabbing) {
            this.grabStrength -= deltaSeconds * 0.5
            if (this.grabStrength <= 0) {
                this.isGrabbing = false
                this.grabStrength = 0
            }
        }

        // Update length based on distance to wormhole and water level
        if (this.isActive) {
            const distToWormhole = Math.abs(this.wormholeY - this.baseY)
            // Higher water level = tentacle can extend further
            const reachMultiplier = 0.7 + this.waterLevelInfluence * 0.5
            this.targetLength = Math.min(this.maxLength * reachMultiplier, distToWormhole * 0.95)
        }
        this.currentLength += (this.targetLength - this.currentLength) * deltaSeconds * 2

        // Wave amplitude increases with water level
        this.waveAmplitude = 8 + this.waterLevelInfluence * 8

        // Update segments using inverse kinematics toward the wormhole
        this.updateSegments()

        // Draw the tentacle
        this.draw()
    }

    /**
     * Update segment positions using a simple IK approach
     */
    private updateSegments(): void {
        if (this.segments.length === 0) return

        const segmentLength = this.currentLength / this.segmentCount

        // Calculate target position (wormhole with offset based on direction and grab state)
        let offsetX = this.currentDirection * this.maxDisplacement
        if (this.isGrabbing) {
            offsetX = this.grabTargetX * this.grabStrength + offsetX * (1 - this.grabStrength)
        }
        const targetX = this.wormholeX + offsetX
        const targetY = this.wormholeY

        // Start from base
        let prevX = this.baseX
        let prevY = this.baseY

        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i]
            const t = (i + 1) / this.segments.length

            // Calculate ideal position (lerp between base and target)
            const idealX = prevX + (targetX - this.baseX) * (1 / this.segmentCount)
            const idealY = prevY - segmentLength // Move upward

            // Add wave motion (stronger at higher water levels)
            const waveOffset =
                Math.sin(this.wavePhase + i * 0.8) * this.waveAmplitude * (1 - t * 0.5)

            // Calculate angle from previous segment
            const dx = idealX + waveOffset - prevX
            const dy = idealY - prevY
            segment.angle = Math.atan2(dy, dx)

            // Position segment at fixed distance from previous
            segment.x = prevX + Math.cos(segment.angle) * segmentLength
            segment.y = prevY + Math.sin(segment.angle) * segmentLength

            prevX = segment.x
            prevY = segment.y
        }
    }

    /**
     * Get the displacement to apply to the wormhole
     * The pull is stronger when water level is higher
     */
    getDisplacement(): { x: number; y: number } {
        if (!this.isActive || this.segments.length === 0) {
            return { x: 0, y: 0 }
        }

        // Displacement based on tentacle tip position relative to wormhole
        const tip = this.segments[this.segments.length - 1]
        const distToWormhole = Math.sqrt(
            (tip.x - this.wormholeX) ** 2 + (tip.y - this.wormholeY) ** 2
        )

        // Large influence radius - tentacles always affect the wormhole
        const influenceRadius = 150 + this.waterLevelInfluence * 100

        if (distToWormhole > influenceRadius) {
            return { x: 0, y: 0 }
        }

        // Much stronger pull strength (3x base multiplier)
        const effectivePullStrength = this.basePullStrength * (1.5 + this.waterLevelInfluence * 2.5)

        // Pull toward the tentacle tip (stronger influence curve)
        const influence = Math.pow(1 - distToWormhole / influenceRadius, 0.5) // sqrt for stronger near effect

        // Stronger grab boost
        const grabBoost = this.isGrabbing ? 1 + this.grabStrength * 3 : 1

        // Direct pull based on direction to tentacle base (more dramatic movement)
        const dirX = this.baseX - this.wormholeX
        const dirY = this.baseY - this.wormholeY
        const dirLen = Math.sqrt(dirX * dirX + dirY * dirY) || 1

        // Strong horizontal pull toward tentacle base
        const pullX = (dirX / dirLen) * 80 * effectivePullStrength * influence * grabBoost
        // Moderate vertical pull toward the abyss
        const pullY =
            (dirY / dirLen) * 40 * effectivePullStrength * influence * grabBoost +
            this.waterLevelInfluence * 20 * influence // Extra downward pull

        return { x: pullX, y: pullY }
    }

    /**
     * Draw the tentacle
     */
    private draw(): void {
        const g = this.graphics
        g.clear()

        if (this.segments.length === 0) return

        // Base width increases with water level (more menacing)
        const baseWidth = 10 + this.waterLevelInfluence * 6
        const tipWidth = 2 + this.waterLevelInfluence * 2

        // Draw main tentacle body
        g.moveTo(this.baseX - baseWidth / 2, this.baseY)

        // Draw left edge
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i]
            const t = (i + 1) / this.segments.length
            const width = baseWidth + (tipWidth - baseWidth) * t
            const perpAngle = segment.angle + Math.PI / 2
            const offsetX = Math.cos(perpAngle) * (width / 2)
            const offsetY = Math.sin(perpAngle) * (width / 2)
            g.lineTo(segment.x + offsetX, segment.y + offsetY)
        }

        // Draw tip
        const tip = this.segments[this.segments.length - 1]
        g.lineTo(tip.x + Math.cos(tip.angle) * 5, tip.y + Math.sin(tip.angle) * 5)

        // Draw right edge (reverse)
        for (let i = this.segments.length - 1; i >= 0; i--) {
            const segment = this.segments[i]
            const t = (i + 1) / this.segments.length
            const width = baseWidth + (tipWidth - baseWidth) * t
            const perpAngle = segment.angle - Math.PI / 2
            const offsetX = Math.cos(perpAngle) * (width / 2)
            const offsetY = Math.sin(perpAngle) * (width / 2)
            g.lineTo(segment.x + offsetX, segment.y + offsetY)
        }

        // Close path back to base
        g.lineTo(this.baseX + baseWidth / 2, this.baseY)
        g.closePath()

        // Color gets more intense at higher water levels
        const alpha = 0.7 + this.waterLevelInfluence * 0.3
        g.fill({ color: this.color, alpha })

        // Draw suckers along the tentacle
        for (let i = 1; i < this.segments.length - 1; i++) {
            const segment = this.segments[i]
            const t = (i + 1) / this.segments.length
            const suckerSize = (2 + this.waterLevelInfluence * 2) * (1 - t * 0.5)

            // Sucker on one side (alternating)
            const sideSign = i % 2 === 0 ? 1 : -1
            const perpAngle = segment.angle + (Math.PI / 2) * sideSign
            const suckerX = segment.x + Math.cos(perpAngle) * (suckerSize + 2)
            const suckerY = segment.y + Math.sin(perpAngle) * (suckerSize + 2)

            g.circle(suckerX, suckerY, suckerSize)
            g.fill({ color: 0x3a1a30, alpha: 0.8 })

            // Inner sucker
            g.circle(suckerX, suckerY, suckerSize * 0.5)
            g.fill({ color: 0x2a1020, alpha: 0.9 })
        }

        // Draw highlight/glow on tentacle (stronger when grabbing)
        const glowBase = this.isGrabbing ? 0.2 : 0.1
        const glowAlpha = glowBase + Math.sin(this.time * 3) * 0.05 + this.waterLevelInfluence * 0.1
        for (let i = 0; i < this.segments.length; i += 2) {
            const segment = this.segments[i]
            const t = (i + 1) / this.segments.length
            const glowSize = (baseWidth + (tipWidth - baseWidth) * t) * 0.4

            g.circle(segment.x, segment.y, glowSize)
            g.fill({ color: this.isGrabbing ? 0xaa6aaa : 0x8a4a80, alpha: glowAlpha })
        }

        // Draw grab indicator at tip when grabbing
        if (this.isGrabbing && this.grabStrength > 0.2) {
            const pulseSize = 8 + Math.sin(this.time * 10) * 3
            g.circle(tip.x, tip.y, pulseSize)
            g.fill({ color: 0xff6a90, alpha: this.grabStrength * 0.5 })
        }
    }

    /**
     * Move the tentacle base position
     */
    setBasePosition(x: number, y: number): void {
        this.baseX = x
        this.baseY = y
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
