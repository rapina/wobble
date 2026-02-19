/**
 * WorkStation
 *
 * Floating holographic physics simulations.
 * Each station displays ethereal, hovering equipment that looks natural floating:
 * - Gravity Lab: Mini planets orbiting in an energy field
 * - Accelerator: Particle ring with glowing particles
 * - Collision Lab: Two energy spheres bouncing
 * - Thermodynamics Lab: Heat containment field with particles
 */

import { Container, Graphics, Text, TextStyle, Circle } from 'pixi.js'
import type { StationConfig, PhysicsProperty } from '@/types/lab'

// Physics property symbols
const PHYSICS_SYMBOLS: Record<PhysicsProperty, string> = {
    gravity: 'G',
    momentum: 'p',
    elasticity: 'e',
    thermodynamics: 'Q',
}

export class WorkStation extends Container {
    private config: StationConfig
    private shadowGraphics: Graphics
    private equipmentGraphics: Graphics
    private glowGraphics: Graphics
    private symbolText: Text

    private _isActive = false
    private _progress = 0
    private _glowIntensity = 0
    private _animPhase = 0
    private interactionPhase = 0

    constructor(config: StationConfig, label: string = '') {
        super()
        this.config = config

        // Set hit area for click detection
        this.hitArea = new Circle(0, 0, 80)

        // Create layers
        this.glowGraphics = new Graphics()
        this.addChild(this.glowGraphics)

        this.shadowGraphics = new Graphics()
        this.addChild(this.shadowGraphics)

        this.equipmentGraphics = new Graphics()
        this.addChild(this.equipmentGraphics)

        // Create physics symbol badge
        const symbolStyle = new TextStyle({
            fontFamily: 'Georgia, serif',
            fontSize: 20,
            fontWeight: 'bold',
            fontStyle: 'italic',
            fill: 0xffffff,
            dropShadow: {
                color: 0x000000,
                blur: 4,
                distance: 0,
            },
        })
        this.symbolText = new Text({
            text: config.formulaSymbol || PHYSICS_SYMBOLS[config.resource],
            style: symbolStyle,
        })
        this.symbolText.anchor.set(0.5, 0.5)
        this.symbolText.x = 0
        this.symbolText.y = 55
        this.addChild(this.symbolText)

        this.draw()
    }

    set isActive(value: boolean) {
        this._isActive = value
    }

    get isActive(): boolean {
        return this._isActive
    }

    set progress(value: number) {
        this._progress = Math.max(0, Math.min(1, value))
    }

    get progress(): number {
        return this._progress
    }

    get stationId(): string {
        return this.config.id
    }

    get resource(): PhysicsProperty {
        return this.config.resource
    }

    get color(): number {
        return this.config.color
    }

    update(deltaTime: number): void {
        this._animPhase += deltaTime * 2

        if (this._isActive) {
            this._glowIntensity = Math.min(1, this._glowIntensity + deltaTime * 3)
            this.interactionPhase += deltaTime * 3
        } else {
            this._glowIntensity = Math.max(0, this._glowIntensity - deltaTime * 2)
            this.interactionPhase += deltaTime * 0.5
        }

        this.draw()
    }

    private draw(): void {
        this.drawShadow()
        this.drawGlow()
        this.drawEquipment()
    }

    private drawShadow(): void {
        const g = this.shadowGraphics
        g.clear()

        // Floating shadow on ground - subtle ellipse
        const shadowPulse = 1 + Math.sin(this._animPhase) * 0.05
        g.ellipse(0, 45, 35 * shadowPulse, 15 * shadowPulse)
        g.fill({ color: 0x000000, alpha: 0.3 })
    }

    private drawEquipment(): void {
        const g = this.equipmentGraphics
        g.clear()

        switch (this.config.simulation) {
            case 'orbital':
                this.drawOrbitalField(g)
                break
            case 'particle-accelerator':
                this.drawParticleRing(g)
                break
            case 'collision':
                this.drawCollisionSpheres(g)
                break
            case 'heat-transfer':
                this.drawHeatField(g)
                break
        }
    }

    /**
     * Gravity Lab - Floating mini planets orbiting each other
     */
    private drawOrbitalField(g: Graphics): void {
        const centerY = -10 // Floating position
        const orbitSpeed = this._isActive ? 1.5 : 0.4

        // Outer energy field (faint circle)
        const fieldPulse = 1 + Math.sin(this._animPhase * 1.5) * 0.05
        g.circle(0, centerY, 50 * fieldPulse)
        g.stroke({ color: this.config.color, width: 1, alpha: 0.2 })

        // Central sun/star with glow
        const sunPulse = 1 + Math.sin(this._animPhase * 2) * 0.15

        // Sun glow layers
        g.circle(0, centerY, 20 * sunPulse)
        g.fill({ color: 0xffdd44, alpha: 0.15 })
        g.circle(0, centerY, 14 * sunPulse)
        g.fill({ color: 0xffdd44, alpha: 0.3 })
        g.circle(0, centerY, 10 * sunPulse)
        g.fill({ color: 0xffee66 })

        // Sun highlight
        g.circle(-3, centerY - 3, 3)
        g.fill({ color: 0xffffff, alpha: 0.6 })

        // Planet 1 - Blue (inner orbit)
        const angle1 = this.interactionPhase * orbitSpeed
        const radius1 = 28
        const p1x = Math.cos(angle1) * radius1
        const p1y = Math.sin(angle1) * radius1 * 0.4 + centerY // Squashed for perspective

        // Planet 1 trail
        for (let i = 1; i <= 4; i++) {
            const trailAngle = angle1 - i * 0.15
            const tx = Math.cos(trailAngle) * radius1
            const ty = Math.sin(trailAngle) * radius1 * 0.4 + centerY
            g.circle(tx, ty, 5 - i)
            g.fill({ color: 0x5dade2, alpha: 0.15 - i * 0.03 })
        }

        // Planet 1 glow
        g.circle(p1x, p1y, 10)
        g.fill({ color: 0x5dade2, alpha: 0.3 })
        g.circle(p1x, p1y, 7)
        g.fill({ color: 0x5dade2 })
        g.circle(p1x - 2, p1y - 2, 2)
        g.fill({ color: 0xffffff, alpha: 0.6 })

        // Planet 2 - Orange (outer orbit)
        const angle2 = this.interactionPhase * orbitSpeed * 0.6 + Math.PI
        const radius2 = 42
        const p2x = Math.cos(angle2) * radius2
        const p2y = Math.sin(angle2) * radius2 * 0.4 + centerY

        // Planet 2 trail
        for (let i = 1; i <= 4; i++) {
            const trailAngle = angle2 - i * 0.12
            const tx = Math.cos(trailAngle) * radius2
            const ty = Math.sin(trailAngle) * radius2 * 0.4 + centerY
            g.circle(tx, ty, 4 - i * 0.7)
            g.fill({ color: 0xe67e22, alpha: 0.15 - i * 0.03 })
        }

        // Planet 2 glow
        g.circle(p2x, p2y, 8)
        g.fill({ color: 0xe67e22, alpha: 0.3 })
        g.circle(p2x, p2y, 5)
        g.fill({ color: 0xe67e22 })
        g.circle(p2x - 1.5, p2y - 1.5, 1.5)
        g.fill({ color: 0xffffff, alpha: 0.5 })

        // Moon orbiting planet 1
        const moonAngle = this.interactionPhase * orbitSpeed * 4
        const moonX = p1x + Math.cos(moonAngle) * 12
        const moonY = p1y + Math.sin(moonAngle) * 5
        g.circle(moonX, moonY, 3)
        g.fill({ color: 0xbdc3c7 })
    }

    /**
     * Accelerator - Energy ring with circling particles
     */
    private drawParticleRing(g: Graphics): void {
        const centerY = -10
        const ringRadius = 40
        const particleCount = 8
        const speed = this._isActive ? 4 : 1

        // Outer glow ring
        g.circle(0, centerY, ringRadius + 8)
        g.stroke({ color: this.config.color, width: 6, alpha: 0.1 })

        // Main energy ring
        g.circle(0, centerY, ringRadius)
        g.stroke({ color: this.config.color, width: 3, alpha: 0.4 })

        // Inner ring
        g.circle(0, centerY, ringRadius - 6)
        g.stroke({ color: this.config.color, width: 1, alpha: 0.3 })

        // Particles circling the ring
        for (let i = 0; i < particleCount; i++) {
            const baseAngle = (i / particleCount) * Math.PI * 2
            const angle = baseAngle + this.interactionPhase * speed

            const px = Math.cos(angle) * ringRadius
            const py = Math.sin(angle) * ringRadius * 0.35 + centerY // Ellipse for perspective

            // Determine if particle is on "front" or "back" of ring
            const isFront = Math.sin(angle) > 0
            const particleAlpha = isFront ? 1 : 0.4

            // Particle trail
            for (let t = 1; t <= 5; t++) {
                const trailAngle = angle - t * 0.08
                const tx = Math.cos(trailAngle) * ringRadius
                const ty = Math.sin(trailAngle) * ringRadius * 0.35 + centerY
                const trailSize = 4 - t * 0.6
                g.circle(tx, ty, trailSize)
                g.fill({ color: 0x00ffff, alpha: (0.3 - t * 0.05) * particleAlpha })
            }

            // Particle glow
            g.circle(px, py, 8)
            g.fill({ color: 0x00ffff, alpha: 0.2 * particleAlpha })

            // Particle core
            g.circle(px, py, 4)
            g.fill({ color: 0x00ffff, alpha: particleAlpha })

            // Bright center
            g.circle(px, py, 2)
            g.fill({ color: 0xffffff, alpha: 0.8 * particleAlpha })
        }

        // Center energy core
        const corePulse = 1 + Math.sin(this._animPhase * 3) * 0.2
        g.circle(0, centerY, 12 * corePulse)
        g.fill({ color: this.config.color, alpha: 0.2 })
        g.circle(0, centerY, 6 * corePulse)
        g.fill({ color: 0xffffff, alpha: 0.5 })
    }

    /**
     * Collision Lab - Two energy spheres bouncing
     */
    private drawCollisionSpheres(g: Graphics): void {
        const centerY = -5
        const bounceSpeed = this._isActive ? 3 : 1

        // Collision animation phase
        const collisionPhase = (this.interactionPhase * bounceSpeed) % (Math.PI * 2)
        const collisionPoint = Math.PI * 0.5 // Where collision happens

        // Calculate sphere positions - they approach, collide, bounce back
        let sphere1X: number, sphere2X: number
        let squash1 = 1,
            squash2 = 1

        if (collisionPhase < collisionPoint) {
            // Approaching
            const t = collisionPhase / collisionPoint
            sphere1X = -35 + t * 30
            sphere2X = 35 - t * 30
        } else if (collisionPhase < collisionPoint + 0.3) {
            // Collision moment - squash
            const t = (collisionPhase - collisionPoint) / 0.3
            sphere1X = -5
            sphere2X = 5
            squash1 = 1 - Math.sin(t * Math.PI) * 0.3
            squash2 = 1 - Math.sin(t * Math.PI) * 0.3
        } else {
            // Bouncing back
            const t = (collisionPhase - collisionPoint - 0.3) / (Math.PI * 2 - collisionPoint - 0.3)
            sphere1X = -5 - t * 30
            sphere2X = 5 + t * 30
        }

        // Energy field boundary
        g.roundRect(-50, centerY - 30, 100, 55, 15)
        g.stroke({ color: this.config.color, width: 1, alpha: 0.2 })

        // Sphere 1 (left, red-orange)
        const color1 = 0xff6b6b
        // Glow
        g.ellipse(sphere1X, centerY, 18 / squash1, 18 * squash1)
        g.fill({ color: color1, alpha: 0.2 })
        // Core
        g.ellipse(sphere1X, centerY, 14 / squash1, 14 * squash1)
        g.fill({ color: color1, alpha: 0.8 })
        // Highlight
        g.circle(sphere1X - 4, centerY - 4, 4)
        g.fill({ color: 0xffffff, alpha: 0.5 })

        // Sphere 2 (right, cyan)
        const color2 = 0x4ecdc4
        // Glow
        g.ellipse(sphere2X, centerY, 18 / squash2, 18 * squash2)
        g.fill({ color: color2, alpha: 0.2 })
        // Core
        g.ellipse(sphere2X, centerY, 14 / squash2, 14 * squash2)
        g.fill({ color: color2, alpha: 0.8 })
        // Highlight
        g.circle(sphere2X - 4, centerY - 4, 4)
        g.fill({ color: 0xffffff, alpha: 0.5 })

        // Collision spark effect
        if (collisionPhase >= collisionPoint && collisionPhase < collisionPoint + 0.4) {
            const sparkIntensity = 1 - (collisionPhase - collisionPoint) / 0.4
            const sparkCount = 6
            for (let i = 0; i < sparkCount; i++) {
                const angle = (i / sparkCount) * Math.PI * 2
                const dist = 20 * (1 - sparkIntensity) + 5
                const sx = Math.cos(angle) * dist
                const sy = centerY + Math.sin(angle) * dist * 0.5
                g.circle(sx, sy, 3 * sparkIntensity)
                g.fill({ color: 0xffff00, alpha: sparkIntensity })
            }
        }
    }

    /**
     * Thermodynamics Lab - Heat containment field with particles
     */
    private drawHeatField(g: Graphics): void {
        const centerY = -8
        const fieldRadius = 38
        const particleCount = 12

        // Temperature oscillation for particle speed
        const temp = this._isActive ? 0.8 + Math.sin(this._animPhase) * 0.2 : 0.3

        // Outer containment field
        g.circle(0, centerY, fieldRadius + 5)
        g.stroke({ color: this.config.color, width: 2, alpha: 0.15 })

        // Inner containment - glass-like sphere
        g.circle(0, centerY, fieldRadius)
        g.fill({ color: this.config.color, alpha: 0.05 })
        g.circle(0, centerY, fieldRadius)
        g.stroke({ color: this.config.color, width: 1.5, alpha: 0.3 })

        // Heat gradient in center (warm glow)
        const heatIntensity = this._isActive ? 0.3 : 0.1
        g.circle(0, centerY, fieldRadius * 0.7)
        g.fill({ color: 0xff6600, alpha: heatIntensity * 0.3 })
        g.circle(0, centerY, fieldRadius * 0.4)
        g.fill({ color: 0xff4400, alpha: heatIntensity * 0.4 })

        // Hot particles bouncing inside
        for (let i = 0; i < particleCount; i++) {
            // Each particle has pseudo-random movement based on index
            const seed = i * 1.7 + 0.3
            const speedMult = 0.5 + (i % 3) * 0.3

            const phase = this.interactionPhase * temp * speedMult + seed * 10

            // Particle bounces in a pattern
            const px = Math.sin(phase * 1.3 + seed) * (fieldRadius - 10) * 0.8
            const py = Math.cos(phase * 1.7 + seed * 2) * (fieldRadius - 10) * 0.5 + centerY

            // Particle size based on "temperature" (kinetic energy)
            const size = 3 + temp * 2

            // Color shifts from orange to red based on speed
            const particleColor = temp > 0.5 ? 0xff4444 : 0xff8844

            // Particle glow
            g.circle(px, py, size + 3)
            g.fill({ color: particleColor, alpha: 0.3 })

            // Particle core
            g.circle(px, py, size)
            g.fill({ color: particleColor, alpha: 0.9 })

            // Hot center
            g.circle(px, py, size * 0.4)
            g.fill({ color: 0xffff00, alpha: 0.6 })
        }

        // Sphere highlight (glass effect)
        g.arc(0, centerY, fieldRadius - 2, -Math.PI * 0.7, -Math.PI * 0.3)
        g.stroke({ color: 0xffffff, width: 2, alpha: 0.2 })
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        if (this._glowIntensity <= 0) return

        const pulse = 0.8 + Math.sin(this._animPhase * 2) * 0.2

        // Glow around the floating object
        g.circle(0, -10, 55 * pulse)
        g.fill({ color: this.config.color, alpha: this._glowIntensity * 0.15 })

        g.circle(0, -10, 40 * pulse)
        g.fill({ color: this.config.color, alpha: this._glowIntensity * 0.1 })
    }

    getWorkerPosition(): { x: number; y: number } {
        // Worker stands below the floating equipment
        return {
            x: this.x,
            y: this.y + 70,
        }
    }
}
