/**
 * BlackHoleSystem - Interstellar-style black hole with massive grid distortion
 * Features:
 * - Event horizon (point of no return)
 * - Accretion disk with rotation
 * - Gravitational lensing effect
 * - Massive grid distortion affecting wide area
 * - Particle absorption and spaghettification
 */

import { Container, Graphics, BlurFilter } from 'pixi.js'
import { BlackHoleConfig } from './WorldGenerator'

interface AccretionParticle {
    angle: number
    radius: number
    speed: number
    size: number
    brightness: number
    layer: number // 0 = back, 1 = front (for 3D effect)
}

interface AbsorbedObject {
    x: number
    y: number
    targetX: number
    targetY: number
    progress: number
    stretch: number
    rotation: number
    size: number
    color: number
}

export class BlackHoleSystem {
    private container: Container
    private config: BlackHoleConfig

    // Visual elements
    private eventHorizon: Graphics
    private accretionDiskBack: Graphics
    private accretionDiskFront: Graphics
    private lensingRing: Graphics
    private photonSphere: Graphics
    private coreGlow: Graphics

    // Accretion disk particles
    private particles: AccretionParticle[] = []
    private readonly PARTICLE_COUNT = 80

    // Objects being absorbed
    private absorbedObjects: AbsorbedObject[] = []

    // Animation state
    private time = 0
    private pulseIntensity = 0

    // Grid distortion data (passed to shader)
    private distortionRadius: number
    private distortionStrength: number

    constructor(container: Container, config: BlackHoleConfig) {
        this.container = container
        this.config = config

        // Calculate distortion parameters based on mass
        this.distortionRadius = Math.sqrt(config.mass) * 3 // Large radius
        this.distortionStrength = config.mass / 5000

        // Create visual layers (back to front order)
        this.accretionDiskBack = new Graphics()
        this.eventHorizon = new Graphics()
        this.coreGlow = new Graphics()
        this.photonSphere = new Graphics()
        this.lensingRing = new Graphics()
        this.accretionDiskFront = new Graphics()

        // Add to container in order
        this.container.addChild(this.accretionDiskBack)
        this.container.addChild(this.eventHorizon)
        this.container.addChild(this.coreGlow)
        this.container.addChild(this.photonSphere)
        this.container.addChild(this.lensingRing)
        this.container.addChild(this.accretionDiskFront)

        // Position container
        this.container.position.set(config.x, config.y)

        // Initialize particles
        this.initializeParticles()

        // Initial render
        this.render()
    }

    private initializeParticles(): void {
        for (let i = 0; i < this.PARTICLE_COUNT; i++) {
            const layer = Math.random() < 0.5 ? 0 : 1
            const minRadius = this.config.eventHorizonRadius * 1.5
            const maxRadius = this.config.accretionDiskRadius

            this.particles.push({
                angle: Math.random() * Math.PI * 2,
                radius: minRadius + Math.random() * (maxRadius - minRadius),
                speed: (0.5 + Math.random() * 0.5) * this.config.rotationSpeed,
                size: 1 + Math.random() * 3,
                brightness: 0.3 + Math.random() * 0.7,
                layer,
            })
        }
    }

    /**
     * Update the black hole animation
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds

        // Update particle positions
        for (const particle of this.particles) {
            // Particles orbit faster when closer (Kepler's law simulation)
            const speedMultiplier = Math.pow(this.config.accretionDiskRadius / particle.radius, 1.5)
            particle.angle += particle.speed * speedMultiplier * deltaSeconds

            // Slowly spiral inward
            particle.radius -= deltaSeconds * 2
            if (particle.radius < this.config.eventHorizonRadius * 1.3) {
                // Reset particle to outer edge
                particle.radius = this.config.accretionDiskRadius * (0.8 + Math.random() * 0.2)
                particle.angle = Math.random() * Math.PI * 2
            }
        }

        // Update absorbed objects
        for (let i = this.absorbedObjects.length - 1; i >= 0; i--) {
            const obj = this.absorbedObjects[i]
            obj.progress += deltaSeconds * 0.5

            // Spaghettification effect - stretch increases as it approaches
            obj.stretch = 1 + obj.progress * 5
            obj.rotation += deltaSeconds * 10

            // Move toward center
            const t = Math.min(1, obj.progress)
            obj.x = obj.x + (obj.targetX - obj.x) * t * 0.1
            obj.y = obj.y + (obj.targetY - obj.y) * t * 0.1

            // Remove when absorbed
            if (obj.progress > 2) {
                this.absorbedObjects.splice(i, 1)
            }
        }

        // Decay pulse intensity
        this.pulseIntensity *= 0.95

        this.render()
    }

    /**
     * Render all visual elements
     */
    private render(): void {
        this.renderEventHorizon()
        this.renderAccretionDisk()
        this.renderPhotonSphere()
        this.renderLensingRing()
        this.renderCoreGlow()
    }

    private renderEventHorizon(): void {
        this.eventHorizon.clear()

        const radius = this.config.eventHorizonRadius

        // Pure black center - the event horizon
        this.eventHorizon.circle(0, 0, radius)
        this.eventHorizon.fill(0x000000)

        // Subtle edge glow (hawking radiation hint)
        const edgeGlow = 0.05 + Math.sin(this.time * 2) * 0.02
        this.eventHorizon.circle(0, 0, radius + 2)
        this.eventHorizon.stroke({ color: 0x4400ff, width: 3, alpha: edgeGlow })
    }

    private renderAccretionDisk(): void {
        this.accretionDiskBack.clear()
        this.accretionDiskFront.clear()

        const innerRadius = this.config.eventHorizonRadius * 1.3
        const outerRadius = this.config.accretionDiskRadius

        // Draw elliptical disk (perspective view)
        const diskTilt = 0.3 // How tilted the disk appears

        // Back half of disk (behind black hole)
        this.renderDiskHalf(this.accretionDiskBack, innerRadius, outerRadius, diskTilt, 0)

        // Front half of disk (in front of black hole)
        this.renderDiskHalf(this.accretionDiskFront, innerRadius, outerRadius, diskTilt, 1)

        // Render particles
        this.renderParticles()
    }

    private renderDiskHalf(
        graphics: Graphics,
        innerRadius: number,
        outerRadius: number,
        tilt: number,
        layer: number
    ): void {
        const segments = 40
        const startAngle = layer === 0 ? Math.PI : 0
        const endAngle = layer === 0 ? Math.PI * 2 : Math.PI

        // Gradient rings from outer to inner
        const ringCount = 8
        for (let ring = 0; ring < ringCount; ring++) {
            const t = ring / ringCount
            const radius = outerRadius - t * (outerRadius - innerRadius)

            // Color gradient: outer = red/orange, inner = white/blue (temperature)
            const temp = t // 0 = cool outer, 1 = hot inner
            const r = Math.floor(255 * (0.8 + temp * 0.2))
            const g = Math.floor(180 * (1 - temp * 0.5))
            const b = Math.floor(100 * (1 - temp) + 200 * temp)
            const color = (r << 16) | (g << 8) | b

            const alpha = (0.1 + t * 0.3) * (0.7 + Math.sin(this.time * 3 + ring) * 0.3)

            // Draw arc
            for (let i = 0; i < segments; i++) {
                const angle1 = startAngle + (i / segments) * Math.PI
                const angle2 = startAngle + ((i + 1) / segments) * Math.PI

                const x1 = Math.cos(angle1) * radius
                const y1 = Math.sin(angle1) * radius * tilt
                const x2 = Math.cos(angle2) * radius
                const y2 = Math.sin(angle2) * radius * tilt

                graphics.moveTo(x1, y1)
                graphics.lineTo(x2, y2)
                graphics.stroke({ color, width: 3 + (1 - t) * 5, alpha })
            }
        }
    }

    private renderParticles(): void {
        const tilt = 0.3

        for (const particle of this.particles) {
            const x = Math.cos(particle.angle) * particle.radius
            const y = Math.sin(particle.angle) * particle.radius * tilt

            // Determine which layer to draw on
            const isBackHalf = particle.angle > Math.PI / 2 && particle.angle < Math.PI * 1.5
            const graphics = particle.layer === 0 ? this.accretionDiskBack : this.accretionDiskFront

            // Only draw if in correct half
            if ((isBackHalf && particle.layer === 0) || (!isBackHalf && particle.layer === 1)) {
                // Color based on radius (temperature)
                const temp =
                    1 -
                    (particle.radius - this.config.eventHorizonRadius * 1.3) /
                        (this.config.accretionDiskRadius - this.config.eventHorizonRadius * 1.3)
                const r = Math.floor(255 * (0.8 + temp * 0.2))
                const g = Math.floor(200 * (1 - temp * 0.3))
                const b = Math.floor(100 * (1 - temp) + 255 * temp)
                const color = (r << 16) | (g << 8) | b

                graphics.circle(x, y, particle.size)
                graphics.fill({ color, alpha: particle.brightness * 0.8 })
            }
        }
    }

    private renderPhotonSphere(): void {
        this.photonSphere.clear()

        // Photon sphere - where light orbits (1.5x Schwarzschild radius)
        const radius = this.config.eventHorizonRadius * 1.5
        const segments = 60

        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            const wobble = Math.sin(this.time * 5 + i * 0.5) * 2

            const x = Math.cos(angle) * (radius + wobble)
            const y = Math.sin(angle) * (radius + wobble)

            const alpha = 0.1 + Math.sin(this.time * 8 + i) * 0.05

            this.photonSphere.circle(x, y, 1)
            this.photonSphere.fill({ color: 0xffffff, alpha })
        }
    }

    private renderLensingRing(): void {
        this.lensingRing.clear()

        // Einstein ring - gravitational lensing effect
        const radius = this.config.eventHorizonRadius * 2.5
        const pulseRadius = radius + this.pulseIntensity * 20

        // Main ring
        this.lensingRing.circle(0, 0, pulseRadius)
        this.lensingRing.stroke({
            color: 0x88aaff,
            width: 2,
            alpha: 0.2 + this.pulseIntensity * 0.3,
        })

        // Secondary ring (chromatic aberration effect)
        this.lensingRing.circle(0, 0, pulseRadius * 1.05)
        this.lensingRing.stroke({
            color: 0xffaa88,
            width: 1,
            alpha: 0.1 + this.pulseIntensity * 0.2,
        })
    }

    private renderCoreGlow(): void {
        this.coreGlow.clear()

        // Subtle glow at the very center
        const glowRadius = this.config.eventHorizonRadius * 0.5
        const pulse = 0.1 + Math.sin(this.time * 4) * 0.05 + this.pulseIntensity * 0.3

        // Dark purple core glow
        this.coreGlow.circle(0, 0, glowRadius)
        this.coreGlow.fill({ color: 0x2200aa, alpha: pulse })
    }

    /**
     * Trigger a gravity pulse (e.g., from WorldEvent)
     */
    pulse(intensity: number = 1): void {
        this.pulseIntensity = intensity
    }

    /**
     * Start absorbing an object (spaghettification effect)
     */
    absorbObject(worldX: number, worldY: number, size: number, color: number): void {
        const localX = worldX - this.config.x
        const localY = worldY - this.config.y

        this.absorbedObjects.push({
            x: localX,
            y: localY,
            targetX: 0,
            targetY: 0,
            progress: 0,
            stretch: 1,
            rotation: 0,
            size,
            color,
        })
    }

    /**
     * Get gravitational pull force at a position
     */
    getGravityAt(worldX: number, worldY: number): { fx: number; fy: number; strength: number } {
        const dx = this.config.x - worldX
        const dy = this.config.y - worldY
        const distSq = dx * dx + dy * dy
        const dist = Math.sqrt(distSq)

        if (dist < 1) {
            return { fx: 0, fy: 0, strength: 0 }
        }

        // Gravity falls off with distance squared
        const strength = (this.config.pullStrength * this.config.mass) / distSq

        // Normalize direction
        const fx = (dx / dist) * strength
        const fy = (dy / dist) * strength

        return { fx, fy, strength }
    }

    /**
     * Check if a position is inside the event horizon
     */
    isInsideEventHorizon(worldX: number, worldY: number): boolean {
        const dx = worldX - this.config.x
        const dy = worldY - this.config.y
        return Math.sqrt(dx * dx + dy * dy) < this.config.eventHorizonRadius
    }

    /**
     * Get distortion parameters for shader
     */
    getDistortionParams(): {
        x: number
        y: number
        radius: number
        strength: number
        mass: number
    } {
        return {
            x: this.config.x,
            y: this.config.y,
            radius: this.distortionRadius,
            strength: this.distortionStrength + this.pulseIntensity * 0.5,
            mass: this.config.mass,
        }
    }

    /**
     * Get position
     */
    getPosition(): { x: number; y: number } {
        return { x: this.config.x, y: this.config.y }
    }

    /**
     * Destroy and cleanup
     */
    destroy(): void {
        // Destroy all Graphics objects to free GPU memory
        this.accretionDiskBack.destroy()
        this.eventHorizon.destroy()
        this.coreGlow.destroy()
        this.photonSphere.destroy()
        this.lensingRing.destroy()
        this.accretionDiskFront.destroy()

        this.container.removeChildren()
        this.particles = []
        this.absorbedObjects = []
    }
}
