/**
 * Wormhole.ts - Gravity well portal with funnel effect (Optimized)
 *
 * A teleporter pad with a visible gravity funnel pulling downward
 * Creates the illusion of depth and gravitational pull
 *
 * Performance optimizations:
 * - Static elements drawn once and cached
 * - Reduced particle/layer counts
 * - Dirty flag system for static redraws
 */

import { Container, Graphics } from 'pixi.js'
import { PortalOrientation } from './StageConfig'

export interface WormholeConfig {
    x: number
    y: number
    radius: number
    perfectRadius?: number
    isFinish?: boolean
    portalColor?: 'purple' | 'teal' | 'red' | 'gold'
    widthScale?: number // Horizontal stretch factor (1.0 = normal, 2.0 = double width)
    orientation?: PortalOrientation // 'horizontal' (default) or 'vertical'
}

// Particle falling into the funnel
interface FunnelParticle {
    angle: number // Position around the funnel
    depth: number // 0 = at opening, 1 = at singularity
    speed: number
    size: number
    alpha: number
    rotationSpeed: number
}

// Light beam shooting upward
interface LightBeam {
    angle: number
    width: number
    height: number
    alpha: number
    speed: number
    phase: number
}

// Reduced constants for performance
const PARTICLE_COUNT = 8 // Was 20
const TRAIL_COUNT = 2 // Was 5
const GRAVITY_LINE_COUNT = 6 // Was 12
const FUNNEL_LAYERS = 8 // Was 20
const RING_COUNT = 4 // Was 7
const NODULE_COUNT = 8 // Was 16
const BEAM_COUNT_FINISH = 4 // Was 6
const BEAM_COUNT_NORMAL = 3 // Was 4

export class Wormhole {
    public container: Container
    private funnelGraphics: Graphics // The funnel/gravity well (static)
    private baseGraphics: Graphics // Top ellipse ring (static)
    private glowGraphics: Graphics // Glow effects (dynamic)
    private beamGraphics: Graphics // Light beams (dynamic)
    private particleGraphics: Graphics // Particles (dynamic)

    public x: number
    public y: number
    public radius: number
    public perfectRadius: number
    public isFinish: boolean
    public widthScale: number // Horizontal stretch (1.0 = circle, 2.0 = wide ellipse)
    public orientation: PortalOrientation // 'horizontal' or 'vertical'

    // Animation state
    private time = 0
    private rotationAngle = 0
    private pulsePhase = 0
    private isHit = false
    private hitFlashTimer = 0

    // Proximity effect
    private proximityIntensity = 0
    private targetProximity = 0
    private lastProximityBucket = -1 // For dirty checking

    // Suction animation
    private isSucking = false
    private suckTimer = 0
    private suckDuration = 0.6

    // Visual elements
    private funnelParticles: FunnelParticle[] = []
    private beams: LightBeam[] = []

    // Static elements dirty flag
    private staticDirty = true

    // Portal colors
    private colors: {
        primary: number
        secondary: number
        glow: number
        beam: number
        dark: number
    }

    // Funnel dimensions
    private readonly ellipseRatio = 0.4 // Slightly less flat
    private readonly funnelDepth = 1.2 // Deeper funnel for more 3D effect

    constructor(config: WormholeConfig) {
        this.container = new Container()
        this.x = config.x
        this.y = config.y
        this.radius = config.radius
        this.perfectRadius = config.perfectRadius ?? config.radius * 0.4
        this.isFinish = config.isFinish ?? true
        this.widthScale = config.widthScale ?? 1.0
        this.orientation = config.orientation ?? 'horizontal'

        this.colors = this.getColorTheme(config.portalColor ?? (this.isFinish ? 'teal' : 'purple'))

        // Create graphics layers (back to front)
        this.glowGraphics = new Graphics()
        this.funnelGraphics = new Graphics()
        this.particleGraphics = new Graphics()
        this.baseGraphics = new Graphics()
        this.beamGraphics = new Graphics()

        this.container.addChild(this.glowGraphics)
        this.container.addChild(this.funnelGraphics)
        this.container.addChild(this.particleGraphics)
        this.container.addChild(this.baseGraphics)
        this.container.addChild(this.beamGraphics)

        this.container.position.set(this.x, this.y)

        this.initBeams()
        this.initFunnelParticles()
        this.drawStatic()
        this.drawDynamic()
    }

    private getColorTheme(color: string) {
        // Abyss-style colors: dark, mysterious, bioluminescent
        switch (color) {
            case 'gold':
                return {
                    primary: 0xc9a227, // Muted gold
                    secondary: 0x8b6914, // Dark gold
                    glow: 0xd4a84b, // Warm glow
                    beam: 0xe8d5a3, // Pale gold beam
                    dark: 0x1a1510, // Very dark
                }
            case 'teal':
                // Finish portal - bioluminescent deep sea creature feel
                return {
                    primary: 0x2dd4bf, // Bright teal (bioluminescent)
                    secondary: 0x0d9488, // Deep teal
                    glow: 0x5eead4, // Bright glow
                    beam: 0x99f6e4, // Pale teal beam
                    dark: 0x042f2e, // Abyssal dark teal
                }
            case 'red':
                // Danger/warning - eerie deep sea predator
                return {
                    primary: 0xdc2626, // Blood red
                    secondary: 0x7f1d1d, // Deep crimson
                    glow: 0xef4444, // Eerie red glow
                    beam: 0xfca5a5, // Pale red
                    dark: 0x1c0a0a, // Nearly black red
                }
            case 'purple':
            default:
                // Default portal - mysterious void
                return {
                    primary: 0x8b5cf6, // Vibrant purple
                    secondary: 0x5b21b6, // Deep purple
                    glow: 0xa78bfa, // Soft purple glow
                    beam: 0xc4b5fd, // Pale lavender beam
                    dark: 0x0f0a1a, // Void black-purple
                }
        }
    }

    private initBeams(): void {
        const count = this.isFinish ? BEAM_COUNT_FINISH : BEAM_COUNT_NORMAL
        for (let i = 0; i < count; i++) {
            this.beams.push({
                angle: (Math.PI * 2 * i) / count,
                width: 4 + Math.random() * 3,
                height: this.radius * (0.6 + Math.random() * 0.4),
                alpha: 0.25 + Math.random() * 0.2,
                speed: 0.4 + Math.random() * 0.4,
                phase: Math.random() * Math.PI * 2,
            })
        }
    }

    private initFunnelParticles(): void {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            this.spawnFunnelParticle()
        }
    }

    private spawnFunnelParticle(): void {
        this.funnelParticles.push({
            angle: Math.random() * Math.PI * 2,
            depth: Math.random() * 0.3, // Start near the top
            speed: 0.3 + Math.random() * 0.4,
            size: 2 + Math.random() * 3,
            alpha: 0.4 + Math.random() * 0.4,
            rotationSpeed: 2 + Math.random() * 3,
        })
    }

    /**
     * Draw static elements (funnel, base) - only when dirty
     */
    private drawStatic(): void {
        if (!this.staticDirty) return
        this.staticDirty = false

        if (this.orientation === 'vertical') {
            this.drawVerticalPortalStatic()
        } else {
            this.drawFunnelStatic()
            this.drawBaseStatic()
        }
    }

    /**
     * Draw dynamic elements (glow, particles, beams) - every frame
     */
    private drawDynamic(): void {
        if (this.orientation === 'vertical') {
            this.drawVerticalPortalDynamic()
        } else {
            this.drawGlow()
            this.drawParticles()
            this.drawBeams()
        }
    }

    /**
     * Draw vertical portal static elements
     */
    private drawVerticalPortalStatic(): void {
        const fg = this.funnelGraphics
        const bg = this.baseGraphics

        fg.clear()
        bg.clear()

        const rx = this.radius * 0.6 * this.widthScale
        const ry = this.radius * 1.2

        // === PORTAL INTERIOR (static void layers) ===
        const voidLayers = 5 // Reduced from 8
        for (let i = 0; i < voidLayers; i++) {
            const t = i / voidLayers
            const layerRx = rx * (1 - t * 0.85)
            const layerRy = ry * (1 - t * 0.85)
            const alpha = 0.3 + t * 0.5

            fg.ellipse(0, 0, layerRx, layerRy)
            fg.fill({ color: this.colors.dark, alpha })
        }

        // === PORTAL FRAME/EDGE (static) ===
        bg.ellipse(0, 0, rx, ry)
        bg.stroke({ color: this.colors.primary, width: 4, alpha: 0.9 })

        bg.ellipse(0, 0, rx * 0.92, ry * 0.92)
        bg.stroke({ color: this.colors.secondary, width: 2, alpha: 0.7 })
    }

    /**
     * Draw vertical portal dynamic elements
     */
    private drawVerticalPortalDynamic(): void {
        const g = this.glowGraphics
        const pg = this.particleGraphics
        const beamG = this.beamGraphics

        g.clear()
        pg.clear()
        beamG.clear()

        const rx = this.radius * 0.6 * this.widthScale
        const ry = this.radius * 1.2
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.08
        const intensityBoost = 1 + this.proximityIntensity * 0.4

        // === OUTER GLOW ===
        const glowLayers = 3 // Reduced from 5
        for (let i = glowLayers; i >= 0; i--) {
            const scale = 1 + i * 0.15
            const alpha = (0.08 - i * 0.015) * intensityBoost
            g.ellipse(0, 0, rx * scale * pulse, ry * scale * pulse)
            g.fill({ color: this.colors.glow, alpha: Math.max(0, alpha) })
        }

        // Hit flash
        if (this.hitFlashTimer > 0) {
            const flashAlpha = (this.hitFlashTimer / 0.3) * 0.5
            g.ellipse(0, 0, rx * 1.4, ry * 1.4)
            g.fill({ color: 0xffffff, alpha: flashAlpha })
        }

        // === SWIRLING PARTICLES ===
        for (const particle of this.funnelParticles) {
            const orbitRx = rx * (0.7 + particle.depth * 0.4)
            const orbitRy = ry * (0.7 + particle.depth * 0.4)
            const px = Math.cos(particle.angle) * orbitRx
            const py = Math.sin(particle.angle) * orbitRy

            // Simplified trail (reduced count)
            for (let t = TRAIL_COUNT - 1; t >= 0; t--) {
                const trailAngle = particle.angle - t * 0.25
                const tx = Math.cos(trailAngle) * orbitRx
                const ty = Math.sin(trailAngle) * orbitRy
                const trailAlpha = particle.alpha * (1 - t / TRAIL_COUNT) * 0.5

                pg.circle(tx, ty, particle.size * (1 - t * 0.3))
                pg.fill({ color: this.colors.beam, alpha: trailAlpha })
            }

            // Main particle
            pg.circle(px, py, particle.size)
            pg.fill({ color: this.colors.beam, alpha: particle.alpha })
        }

        // === ENERGY WISPS (simplified) ===
        const wispCount = 3 // Reduced from 4
        for (let i = 0; i < wispCount; i++) {
            const baseAngle = (Math.PI * 2 * i) / wispCount + this.time * 0.5
            const wispPhase = this.time * 2 + i * 1.5
            const wispLength = 15 + Math.sin(wispPhase) * 10
            const wispAlpha = 0.3 + Math.sin(wispPhase + 1) * 0.2

            const startX = Math.cos(baseAngle) * rx * 0.95
            const startY = Math.sin(baseAngle) * ry * 0.95
            const endX = Math.cos(baseAngle) * (rx + wispLength)
            const endY = Math.sin(baseAngle) * (ry * 0.8 + wispLength * 0.6)

            beamG.moveTo(startX, startY)
            beamG.lineTo(endX, endY)
            beamG.stroke({ color: this.colors.beam, width: 3, alpha: wispAlpha * intensityBoost })
        }
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.08
        const intensityBoost = 1 + this.proximityIntensity * 0.5
        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio

        // === SIMPLIFIED OUTER AURA ===
        const layers = 3 // Reduced from 5+
        for (let i = layers; i >= 0; i--) {
            const scale = 1.2 + i * 0.15
            const alpha = (0.06 - i * 0.012) * intensityBoost
            g.ellipse(0, 0, rx * scale * pulse, ry * scale * pulse)
            g.fill({ color: this.colors.glow, alpha: Math.max(0, alpha) })
        }

        // === EVENT HORIZON RING (simplified) ===
        const horizonRx = rx * 1.05 * pulse
        const horizonRy = ry * 1.05 * pulse

        g.ellipse(0, 0, horizonRx, horizonRy)
        g.stroke({ color: this.colors.primary, width: 2, alpha: 0.4 * intensityBoost })

        // Suction/hit flash
        if (this.isSucking) {
            const progress = this.suckTimer / this.suckDuration
            const flashAlpha = Math.sin(progress * Math.PI) * 0.6
            g.ellipse(0, 0, rx * (1.4 - progress * 0.4), ry * (1.4 - progress * 0.4))
            g.fill({ color: 0xffffff, alpha: flashAlpha })
        }

        if (this.hitFlashTimer > 0) {
            const flashAlpha = (this.hitFlashTimer / 0.3) * 0.5
            g.ellipse(0, 0, rx * 1.3, ry * 1.3)
            g.fill({ color: 0xffffff, alpha: flashAlpha })
        }
    }

    /**
     * Draw funnel static elements - only called when dirty
     */
    private drawFunnelStatic(): void {
        const g = this.funnelGraphics
        g.clear()

        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio
        const depth = this.radius * this.funnelDepth

        // === DEEP VOID INTERIOR (simplified) ===
        for (let i = FUNNEL_LAYERS; i >= 0; i--) {
            const t = i / FUNNEL_LAYERS
            const shrinkFactor = Math.pow(t, 0.7)
            const layerRx = rx * (0.02 + shrinkFactor * 0.98)
            const layerRy = ry * (0.02 + shrinkFactor * 0.98)
            const layerY = depth * (1 - t) * 1.1

            const darkness = Math.pow(1 - t, 1.5)
            const alpha = 0.1 + darkness * 0.6

            g.ellipse(0, layerY, layerRx, layerRy)
            g.fill({ color: this.colors.dark, alpha })
        }

        // === STATIC SPIRAL LINES (no animation) ===
        for (let lineIdx = 0; lineIdx < GRAVITY_LINE_COUNT; lineIdx++) {
            const baseAngle = (Math.PI * 2 * lineIdx) / GRAVITY_LINE_COUNT

            g.moveTo(Math.cos(baseAngle) * rx, Math.sin(baseAngle) * ry)

            const segments = 10 // Reduced from 16
            for (let i = 1; i <= segments; i++) {
                const t = i / segments
                const spiralAngle = baseAngle + t * Math.PI * 1.2
                const shrink = 1 - Math.pow(t, 0.8) * 0.97

                const px = Math.cos(spiralAngle) * rx * shrink
                const py = Math.sin(spiralAngle) * ry * shrink + depth * t

                g.lineTo(px, py)
            }

            g.stroke({ color: this.colors.primary, width: 2, alpha: 0.25 })
        }

        // === STATIC RINGS ===
        for (let i = 1; i <= RING_COUNT; i++) {
            const t = i / (RING_COUNT + 1)
            const ringRx = rx * (1 - Math.pow(t, 0.6) * 0.92)
            const ringRy = ry * (1 - Math.pow(t, 0.6) * 0.92)
            const ringY = depth * Math.pow(t, 0.8)

            g.ellipse(0, ringY, ringRx, ringRy)
            g.stroke({ color: this.colors.secondary, width: 2, alpha: 0.3 - t * 0.15 })
        }

        // === SINGULARITY (static core) ===
        const singularityY = depth * 0.95
        g.ellipse(0, singularityY, 10, 4)
        g.fill({ color: this.colors.glow, alpha: 0.3 })
        g.ellipse(0, singularityY, 4, 2)
        g.fill({ color: 0xffffff, alpha: 0.7 })
    }

    private drawParticles(): void {
        const g = this.particleGraphics
        g.clear()

        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio
        const depth = this.radius * this.funnelDepth

        for (const particle of this.funnelParticles) {
            const depthCurve = Math.pow(particle.depth, 0.6)
            const shrink = 1 - depthCurve * 0.97
            const px = Math.cos(particle.angle) * rx * shrink
            const py = Math.sin(particle.angle) * ry * shrink + depth * depthCurve

            const brightnessPhase = Math.sin(particle.depth * Math.PI)
            const fadeAlpha = particle.alpha * (0.3 + brightnessPhase * 0.7) * (1 - particle.depth * 0.5)
            const size = particle.size * (1 - depthCurve * 0.7)

            // Simplified trail
            for (let i = TRAIL_COUNT - 1; i >= 0; i--) {
                const trailDepth = Math.max(0, particle.depth - i * 0.08)
                const trailDepthCurve = Math.pow(trailDepth, 0.6)
                const trailShrink = 1 - trailDepthCurve * 0.97
                const trailAngle = particle.angle - i * 0.15 * (1 + particle.depth)
                const tx = Math.cos(trailAngle) * rx * trailShrink
                const ty = Math.sin(trailAngle) * ry * trailShrink + depth * trailDepthCurve

                g.circle(tx, ty, size * (1 - i * 0.3))
                g.fill({ color: this.colors.beam, alpha: fadeAlpha * (1 - i / TRAIL_COUNT) * 0.4 })
            }

            // Main particle (no glow layer)
            g.circle(px, py, size)
            g.fill({ color: this.colors.beam, alpha: fadeAlpha })
        }
    }

    /**
     * Draw base static elements - only called when dirty
     */
    private drawBaseStatic(): void {
        const g = this.baseGraphics
        g.clear()

        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio

        // === OUTER RIM (static) ===
        g.ellipse(0, -ry * 0.08, rx * 1.02, ry * 0.3)
        g.fill({ color: 0x000000, alpha: 0.2 })

        // Main outer ring
        g.ellipse(0, 0, rx, ry)
        g.stroke({ color: this.colors.primary, width: 4, alpha: 0.95 })

        // Inner ring
        g.ellipse(0, 0, rx * 0.96, ry * 0.96)
        g.stroke({ color: this.colors.glow, width: 2, alpha: 0.5 })

        // Perfect zone ring
        const perfectRx = this.perfectRadius * this.widthScale
        const perfectRy = this.perfectRadius * this.ellipseRatio
        g.ellipse(0, 0, perfectRx, perfectRy)
        g.stroke({ color: this.colors.beam, width: 2, alpha: 0.5 })

        // === NODULES (static, no animation) ===
        for (let i = 0; i < NODULE_COUNT; i++) {
            const angle = (Math.PI * 2 * i) / NODULE_COUNT
            const nx = Math.cos(angle) * rx * 1.02
            const ny = Math.sin(angle) * ry * 1.02

            g.circle(nx, ny, 4)
            g.fill({ color: this.colors.beam, alpha: 0.5 })
        }
    }

    private drawBeams(): void {
        const g = this.beamGraphics
        g.clear()

        const suckBoost = this.isSucking ? 1.4 : 1

        for (const beam of this.beams) {
            const angle = beam.angle + this.rotationAngle * 0.3
            const bx = Math.cos(angle) * this.radius * 0.75 * this.widthScale
            const by = Math.sin(angle) * this.radius * 0.75 * this.ellipseRatio

            const animatedHeight = beam.height * suckBoost * (0.6 + Math.sin(this.time * beam.speed * 3 + beam.phase) * 0.4)
            const animatedAlpha = beam.alpha * (0.5 + Math.sin(this.time * beam.speed * 2 + beam.phase) * 0.5)

            // Single beam triangle (no inner core)
            g.moveTo(bx - beam.width / 2, by)
            g.lineTo(bx + beam.width / 2, by)
            g.lineTo(bx, by - animatedHeight)
            g.closePath()
            g.fill({ color: this.colors.beam, alpha: animatedAlpha * 0.4 })
        }
    }

    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pulsePhase += deltaSeconds * (2.5 + this.proximityIntensity * 2)
        this.rotationAngle += deltaSeconds * (0.4 + this.proximityIntensity * 0.8)

        // Smooth proximity transition
        this.proximityIntensity += (this.targetProximity - this.proximityIntensity) * deltaSeconds * 5

        // Check if proximity changed enough to redraw static elements
        const currentBucket = Math.floor(this.proximityIntensity * 4)
        if (currentBucket !== this.lastProximityBucket) {
            this.lastProximityBucket = currentBucket
            this.staticDirty = true
        }

        // Suction animation
        if (this.isSucking) {
            this.suckTimer += deltaSeconds
            if (this.suckTimer >= this.suckDuration) {
                this.isSucking = false
                this.suckTimer = 0
            }
        }

        // Update particles based on orientation
        const speedMultiplier = 1 + this.proximityIntensity * 0.5 + (this.isSucking ? 1 : 0)
        for (let i = this.funnelParticles.length - 1; i >= 0; i--) {
            const particle = this.funnelParticles[i]

            if (this.orientation === 'vertical') {
                particle.angle += particle.rotationSpeed * deltaSeconds * speedMultiplier
                particle.depth += Math.sin(this.time + particle.angle) * deltaSeconds * 0.1
                particle.depth = Math.max(0, Math.min(1, particle.depth))
            } else {
                particle.depth += particle.speed * deltaSeconds * speedMultiplier
                particle.angle += particle.rotationSpeed * deltaSeconds * (1 + particle.depth)

                if (particle.depth >= 1) {
                    this.funnelParticles.splice(i, 1)
                    this.spawnFunnelParticle()
                }
            }
        }

        // Maintain particle count (reduced)
        const targetCount = PARTICLE_COUNT + (this.isSucking ? 4 : 0)
        while (this.funnelParticles.length < targetCount) {
            this.spawnFunnelParticle()
        }

        // Update beams
        for (const beam of this.beams) {
            beam.phase += deltaSeconds * beam.speed
        }

        // Hit flash decay
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaSeconds
        }

        // Only redraw static when needed
        this.drawStatic()
        this.drawDynamic()
    }

    setProximity(normalizedDistance: number): void {
        if (normalizedDistance > 2) {
            this.targetProximity = 0
        } else if (normalizedDistance > 1) {
            this.targetProximity = (2 - normalizedDistance) * 0.3
        } else {
            this.targetProximity = 1 - normalizedDistance * 0.7
        }
    }

    checkHit(px: number, py: number): { hit: boolean; perfect: boolean; distance: number } {
        const dx = px - this.x
        const dy = py - this.y

        // Get radii based on orientation
        let rx: number, ry: number, perfectRx: number, perfectRy: number

        if (this.orientation === 'vertical') {
            // Vertical portal: tall oval (narrower width, taller height)
            rx = this.radius * 0.6 * this.widthScale
            ry = this.radius * 1.2
            perfectRx = this.perfectRadius * 0.6 * this.widthScale
            perfectRy = this.perfectRadius * 1.2
        } else {
            // Horizontal portal: flat ellipse
            rx = this.radius * this.widthScale
            ry = this.radius * this.ellipseRatio
            perfectRx = this.perfectRadius * this.widthScale
            perfectRy = this.perfectRadius * this.ellipseRatio
        }

        // Elliptical hit detection: normalize by radii
        const normalizedDist = Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)

        // Perfect zone also elliptical
        const perfectNormalizedDist = Math.sqrt((dx / perfectRx) ** 2 + (dy / perfectRy) ** 2)

        return {
            hit: normalizedDist <= 1,
            perfect: perfectNormalizedDist <= 1,
            distance: normalizedDist * this.radius, // Approximate distance for compatibility
        }
    }

    showSuckIn(): void {
        this.isSucking = true
        this.suckTimer = 0
        // Spawn a few extra particles (reduced from 15)
        for (let i = 0; i < 4; i++) {
            this.spawnFunnelParticle()
        }
    }

    showHit(perfect: boolean): void {
        this.isHit = true
        this.hitFlashTimer = 0.3
        this.pulsePhase = 0
        this.showSuckIn()
    }

    moveTo(newX: number, newY: number): void {
        this.x = newX
        this.y = newY
        this.container.position.set(newX, newY)
        this.isHit = false
    }

    setRadius(radius: number, perfectRadius?: number): void {
        this.radius = radius
        this.perfectRadius = perfectRadius ?? radius * 0.4
        this.beams = []
        this.initBeams()
        this.staticDirty = true
        this.drawStatic()
        this.drawDynamic()
    }

    /**
     * Set horizontal width scale (1.0 = normal, 2.0 = double width)
     */
    setWidthScale(scale: number): void {
        this.widthScale = scale
        this.staticDirty = true
    }

    /**
     * Set portal orientation
     * - 'horizontal': Flat funnel style (looking down into it)
     * - 'vertical': Standing doorway style (Diablo/Portal game style)
     */
    setOrientation(orientation: PortalOrientation): void {
        this.orientation = orientation
        this.staticDirty = true
    }

    /**
     * Get the exit velocity direction based on orientation
     * Returns a unit vector for the exit direction
     */
    getExitDirection(): { x: number; y: number } {
        if (this.orientation === 'vertical') {
            // Vertical portal shoots left or right (random)
            return { x: Math.random() > 0.5 ? 1 : -1, y: 0 }
        } else {
            // Horizontal portal shoots down
            return { x: 0, y: 1 }
        }
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
