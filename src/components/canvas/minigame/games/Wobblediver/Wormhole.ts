/**
 * Wormhole.ts - Lovecraftian dimensional portal as goal
 *
 * A swirling vortex of cosmic horror that serves as the finish line
 * Features: vortex shader, tentacle-like edges, watching eyes, particles
 */

import { Container, Graphics, Sprite, RenderTexture } from 'pixi.js'
import { WormholeFilter } from '@/components/canvas/filters/WormholeFilter'

export interface WormholeConfig {
    x: number
    y: number
    radius: number
    perfectRadius?: number  // Inner zone for perfect hit
    isFinish?: boolean      // True for goal wormhole, false for portal
    portalColor?: 'purple' | 'teal' | 'red' | 'gold'  // Color theme
}

// Particle sucked into vortex
interface VortexParticle {
    x: number
    y: number
    angle: number
    distance: number
    speed: number
    size: number
    alpha: number
}

// Tentacle framing the portal
interface Tentacle {
    angle: number
    length: number
    phase: number
    thickness: number
}

// Watching eye in the abyss
interface AbyssEye {
    angle: number
    distance: number
    size: number
    blinkTimer: number
    lookAngle: number
}

export class Wormhole {
    public container: Container
    private vortexGraphics: Graphics
    private vortexSprite: Sprite
    private vortexFilter: WormholeFilter
    private renderTexture: RenderTexture
    private glowGraphics: Graphics
    private tentacleGraphics: Graphics
    private particleGraphics: Graphics
    private eyeGraphics: Graphics

    public x: number
    public y: number
    public radius: number
    public perfectRadius: number
    public isFinish: boolean

    // Animation state
    private time = 0
    private isHit = false
    private hitFlashTimer = 0
    private pulsePhase = 0

    // Vortex particles
    private particles: VortexParticle[] = []
    private particleSpawnTimer = 0

    // Tentacles
    private tentacles: Tentacle[] = []

    // Watching eyes
    private eyes: AbyssEye[] = []

    // Portal color theme
    private colorTheme: {
        inner: [number, number, number, number]
        outer: [number, number, number, number]
        glow: number
    }

    constructor(config: WormholeConfig, app?: any) {
        this.container = new Container()
        this.x = config.x
        this.y = config.y
        this.radius = config.radius
        this.perfectRadius = config.perfectRadius ?? config.radius * 0.4
        this.isFinish = config.isFinish ?? true

        // Set color theme
        this.colorTheme = this.getColorTheme(config.portalColor ?? (this.isFinish ? 'gold' : 'purple'))

        // Create render texture for shader effect
        this.renderTexture = RenderTexture.create({
            width: this.radius * 3,
            height: this.radius * 3,
        })

        // Vortex graphics (will be rendered to texture)
        this.vortexGraphics = new Graphics()

        // Sprite with shader filter
        this.vortexSprite = Sprite.from(this.renderTexture)
        this.vortexSprite.anchor.set(0.5)
        this.vortexFilter = new WormholeFilter({
            center: [0.5, 0.5],
            intensity: 1.0,
            rotation: this.isFinish ? 1.5 : 1.0,
            colorInner: this.colorTheme.inner,
            colorOuter: this.colorTheme.outer,
            chromaticAberration: 1.5,
        })
        this.vortexSprite.filters = [this.vortexFilter]
        this.container.addChild(this.vortexSprite)

        // Glow layer (behind)
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)
        this.container.swapChildren(this.glowGraphics, this.vortexSprite)

        // Tentacles (framing the portal)
        this.tentacleGraphics = new Graphics()
        this.container.addChild(this.tentacleGraphics)

        // Particles (sucked into vortex)
        this.particleGraphics = new Graphics()
        this.container.addChild(this.particleGraphics)

        // Eyes (watching from the void)
        this.eyeGraphics = new Graphics()
        this.container.addChild(this.eyeGraphics)

        this.container.position.set(this.x, this.y)

        this.initTentacles()
        this.initEyes()
        this.initParticles()
        this.draw()
    }

    private getColorTheme(color: string) {
        switch (color) {
            case 'gold':
                return {
                    inner: [0.9, 0.7, 0.2, 1.0] as [number, number, number, number],
                    outer: [0.8, 0.5, 0.1, 1.0] as [number, number, number, number],
                    glow: 0xf1c40f,
                }
            case 'teal':
                return {
                    inner: [0.2, 0.7, 0.7, 1.0] as [number, number, number, number],
                    outer: [0.1, 0.4, 0.5, 1.0] as [number, number, number, number],
                    glow: 0x4ecdc4,
                }
            case 'red':
                return {
                    inner: [0.9, 0.2, 0.2, 1.0] as [number, number, number, number],
                    outer: [0.5, 0.1, 0.2, 1.0] as [number, number, number, number],
                    glow: 0xe74c3c,
                }
            case 'purple':
            default:
                return {
                    inner: [0.6, 0.2, 0.8, 1.0] as [number, number, number, number],
                    outer: [0.3, 0.1, 0.5, 1.0] as [number, number, number, number],
                    glow: 0x9b59b6,
                }
        }
    }

    private initTentacles(): void {
        const count = this.isFinish ? 8 : 6
        for (let i = 0; i < count; i++) {
            this.tentacles.push({
                angle: (Math.PI * 2 * i) / count + Math.random() * 0.2,
                length: this.radius * (1.0 + Math.random() * 0.3),
                phase: Math.random() * Math.PI * 2,
                thickness: 3 + Math.random() * 3,
            })
        }
    }

    private initEyes(): void {
        const count = this.isFinish ? 3 : 2
        for (let i = 0; i < count; i++) {
            this.eyes.push({
                angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
                distance: this.radius * 0.6 + Math.random() * this.radius * 0.2,
                size: 8 + Math.random() * 6,
                blinkTimer: Math.random() * 5,
                lookAngle: 0,
            })
        }
    }

    private initParticles(): void {
        const count = 30
        for (let i = 0; i < count; i++) {
            this.spawnParticle()
        }
    }

    private spawnParticle(): void {
        const angle = Math.random() * Math.PI * 2
        const distance = this.radius * (0.8 + Math.random() * 1.5)
        this.particles.push({
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance,
            angle,
            distance,
            speed: 0.2 + Math.random() * 0.3,
            size: 2 + Math.random() * 3,
            alpha: 0.3 + Math.random() * 0.5,
        })
    }

    private draw(): void {
        // Draw vortex base to graphics (will be filtered)
        const g = this.vortexGraphics
        g.clear()

        // Circular gradient base
        const steps = 40
        for (let i = 0; i < steps; i++) {
            const ratio = i / steps
            const r = this.radius * (1.0 - ratio)
            const alpha = 0.8 - ratio * 0.7
            g.circle(0, 0, r)
            g.fill({ color: this.colorTheme.glow, alpha })
        }

        // Render to texture (shader will be applied to sprite)
        if (this.vortexSprite.texture.baseTexture) {
            // Re-render vortex graphics to texture
            // Note: In production, use app.renderer.render(vortexGraphics, renderTexture)
        }
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.15
        const alpha = 0.2 + Math.sin(this.pulsePhase) * 0.1

        // Soft glow
        g.circle(0, 0, this.radius * 1.5 * pulse)
        g.fill({ color: this.colorTheme.glow, alpha: alpha * 0.5 })

        g.circle(0, 0, this.radius * 1.2 * pulse)
        g.fill({ color: this.colorTheme.glow, alpha })

        // Flash on hit
        if (this.hitFlashTimer > 0) {
            const flashAlpha = this.hitFlashTimer / 0.3
            g.circle(0, 0, this.radius * 2)
            g.fill({ color: 0xffffff, alpha: flashAlpha * 0.5 })
        }
    }

    private drawTentacles(): void {
        const g = this.tentacleGraphics
        g.clear()

        for (const tentacle of this.tentacles) {
            const waveOffset = Math.sin(this.time * 2 + tentacle.phase) * 0.3
            const angle = tentacle.angle + waveOffset

            const baseX = Math.cos(angle) * this.radius * 0.7
            const baseY = Math.sin(angle) * this.radius * 0.7
            const tipX = Math.cos(angle) * tentacle.length
            const tipY = Math.sin(angle) * tentacle.length

            // Curved tentacle using quadratic curve
            const controlX = (baseX + tipX) / 2 + Math.sin(this.time * 3 + tentacle.phase) * 20
            const controlY = (baseY + tipY) / 2 + Math.cos(this.time * 3 + tentacle.phase) * 20

            g.moveTo(baseX, baseY)
            g.quadraticCurveTo(controlX, controlY, tipX, tipY)
            g.stroke({
                color: this.colorTheme.glow,
                width: tentacle.thickness,
                alpha: 0.4,
            })

            // Segments (suckers)
            const segments = 4
            for (let i = 0; i < segments; i++) {
                const t = (i + 1) / (segments + 1)
                // Approximate point on quadratic curve
                const sx = (1 - t) * (1 - t) * baseX + 2 * (1 - t) * t * controlX + t * t * tipX
                const sy = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * controlY + t * t * tipY
                const segSize = tentacle.thickness * 0.8
                g.circle(sx, sy, segSize)
                g.fill({ color: this.colorTheme.glow, alpha: 0.3 })
            }
        }
    }

    private drawParticles(): void {
        const g = this.particleGraphics
        g.clear()

        for (const particle of this.particles) {
            g.circle(particle.x, particle.y, particle.size)
            g.fill({ color: this.colorTheme.glow, alpha: particle.alpha })
        }
    }

    private drawEyes(): void {
        const g = this.eyeGraphics
        g.clear()

        for (const eye of this.eyes) {
            const eyeX = Math.cos(eye.angle) * eye.distance
            const eyeY = Math.sin(eye.angle) * eye.distance

            const isBlinking = eye.blinkTimer < 0.2

            if (!isBlinking) {
                // Eye white
                g.ellipse(eyeX, eyeY, eye.size, eye.size * 0.7)
                g.fill({ color: 0xffffff, alpha: 0.3 })

                // Pupil (looks around)
                const pupilX = eyeX + Math.cos(eye.lookAngle) * eye.size * 0.3
                const pupilY = eyeY + Math.sin(eye.lookAngle) * eye.size * 0.3
                g.circle(pupilX, pupilY, eye.size * 0.4)
                g.fill({ color: this.colorTheme.glow })

                // Highlight
                g.circle(pupilX - eye.size * 0.1, pupilY - eye.size * 0.1, eye.size * 0.15)
                g.fill({ color: 0xffffff, alpha: 0.8 })
            }
        }
    }

    /**
     * Update animation
     */
    update(deltaSeconds: number, renderer?: any): void {
        this.time += deltaSeconds
        this.pulsePhase += deltaSeconds * 3

        // Update shader time
        this.vortexFilter.time = this.time

        // Update particles (spiral inward)
        for (const particle of this.particles) {
            particle.distance -= particle.speed * deltaSeconds * 50
            particle.angle += deltaSeconds * 2
            particle.x = Math.cos(particle.angle) * particle.distance
            particle.y = Math.sin(particle.angle) * particle.distance

            // Fade as approaching center
            if (particle.distance < this.radius * 0.3) {
                particle.alpha *= 0.95
            }

            // Respawn if too close
            if (particle.distance < 5 || particle.alpha < 0.1) {
                const newAngle = Math.random() * Math.PI * 2
                const newDistance = this.radius * (0.8 + Math.random() * 1.5)
                particle.angle = newAngle
                particle.distance = newDistance
                particle.x = Math.cos(newAngle) * newDistance
                particle.y = Math.sin(newAngle) * newDistance
                particle.alpha = 0.3 + Math.random() * 0.5
            }
        }

        // Spawn new particles occasionally
        this.particleSpawnTimer -= deltaSeconds
        if (this.particleSpawnTimer <= 0 && this.particles.length < 40) {
            this.spawnParticle()
            this.particleSpawnTimer = 0.1
        }

        // Update eyes
        for (const eye of this.eyes) {
            eye.blinkTimer -= deltaSeconds
            if (eye.blinkTimer <= 0) {
                eye.blinkTimer = 3 + Math.random() * 4
            }

            // Look around slowly
            eye.lookAngle += deltaSeconds * (Math.random() - 0.5) * 2
        }

        // Update tentacles animation
        for (const tentacle of this.tentacles) {
            tentacle.phase += deltaSeconds * 0.5
        }

        // Hit flash decay
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaSeconds
        }

        // Re-render graphics
        if (renderer) {
            renderer.render({
                container: this.vortexGraphics,
                target: this.renderTexture,
                clear: true,
            })
        }

        this.draw()
        this.drawGlow()
        this.drawTentacles()
        this.drawParticles()
        this.drawEyes()
    }

    /**
     * Check if a point is inside the wormhole
     */
    checkHit(px: number, py: number): { hit: boolean; perfect: boolean; distance: number } {
        const dx = px - this.x
        const dy = py - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        const hit = distance <= this.radius
        const perfect = distance <= this.perfectRadius

        return { hit, perfect, distance }
    }

    /**
     * Show hit animation
     */
    showHit(perfect: boolean): void {
        this.isHit = true
        this.hitFlashTimer = 0.3

        // Pulse effect
        this.pulsePhase = 0
    }

    /**
     * Move wormhole to new position
     */
    moveTo(newX: number, y: number): void {
        this.x = newX
        this.y = y
        this.container.position.set(newX, y)
        this.isHit = false
    }

    /**
     * Resize wormhole
     */
    setRadius(radius: number, perfectRadius?: number): void {
        this.radius = radius
        this.perfectRadius = perfectRadius ?? radius * 0.4

        // Recreate render texture with new size
        this.renderTexture.resize(radius * 3, radius * 3)

        // Reinitialize tentacles and eyes for new size
        this.tentacles = []
        this.eyes = []
        this.initTentacles()
        this.initEyes()

        this.draw()
    }

    destroy(): void {
        this.renderTexture.destroy(true)
        this.container.destroy({ children: true })
    }
}
