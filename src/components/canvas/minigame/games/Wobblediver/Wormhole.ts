/**
 * Wormhole.ts - Gravity well portal with funnel effect
 *
 * A teleporter pad with a visible gravity funnel pulling downward
 * Creates the illusion of depth and gravitational pull
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

// Gravity line spiraling down
interface GravityLine {
    startAngle: number
    phase: number
    speed: number
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

export class Wormhole {
    public container: Container
    private funnelGraphics: Graphics // The funnel/gravity well
    private baseGraphics: Graphics // Top ellipse ring
    private glowGraphics: Graphics // Glow effects
    private beamGraphics: Graphics // Light beams
    private particleGraphics: Graphics // Particles

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

    // Suction animation
    private isSucking = false
    private suckTimer = 0
    private suckDuration = 0.6

    // Visual elements
    private funnelParticles: FunnelParticle[] = []
    private gravityLines: GravityLine[] = []
    private beams: LightBeam[] = []

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

        this.initGravityLines()
        this.initBeams()
        this.initFunnelParticles()
        this.draw()
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

    private initGravityLines(): void {
        const count = 12
        for (let i = 0; i < count; i++) {
            this.gravityLines.push({
                startAngle: (Math.PI * 2 * i) / count,
                phase: Math.random() * Math.PI * 2,
                speed: 0.3 + Math.random() * 0.3,
            })
        }
    }

    private initBeams(): void {
        const count = this.isFinish ? 6 : 4
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
        const count = 20
        for (let i = 0; i < count; i++) {
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

    private draw(): void {
        if (this.orientation === 'vertical') {
            // Vertical portal: Diablo/Portal game style doorway
            this.drawVerticalPortal()
        } else {
            // Horizontal portal: Funnel/gravity well style
            this.drawGlow()
            this.drawFunnel()
            this.drawParticles()
            this.drawBase()
            this.drawBeams()
        }
    }

    /**
     * Draw vertical portal - Diablo/Portal game inspired standing doorway
     */
    private drawVerticalPortal(): void {
        const g = this.glowGraphics
        const fg = this.funnelGraphics
        const pg = this.particleGraphics
        const bg = this.baseGraphics
        const beamG = this.beamGraphics

        g.clear()
        fg.clear()
        pg.clear()
        bg.clear()
        beamG.clear()

        // Vertical portal dimensions (tall oval)
        const rx = this.radius * 0.6 * this.widthScale // Width
        const ry = this.radius * 1.2 // Height (taller than wide)
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.08
        const intensityBoost = 1 + this.proximityIntensity * 0.4

        // === OUTER GLOW (on glowGraphics) ===
        const glowLayers = 5
        for (let i = glowLayers; i >= 0; i--) {
            const scale = 1 + i * 0.15
            const alpha = (0.08 - i * 0.012) * intensityBoost
            g.ellipse(0, 0, rx * scale * pulse, ry * scale * pulse)
            g.fill({ color: this.colors.glow, alpha: Math.max(0, alpha) })
        }

        // Hit flash
        if (this.hitFlashTimer > 0) {
            const flashAlpha = (this.hitFlashTimer / 0.3) * 0.5
            g.ellipse(0, 0, rx * 1.4, ry * 1.4)
            g.fill({ color: 0xffffff, alpha: flashAlpha })
        }

        // === PORTAL INTERIOR (on funnelGraphics) ===
        // Dark void center with gradient layers
        const voidLayers = 8
        for (let i = 0; i < voidLayers; i++) {
            const t = i / voidLayers
            const layerRx = rx * (1 - t * 0.85)
            const layerRy = ry * (1 - t * 0.85)
            const alpha = 0.3 + t * 0.5

            fg.ellipse(0, 0, layerRx, layerRy)
            fg.fill({ color: this.colors.dark, alpha })
        }

        // Swirling energy rings inside
        const ringCount = 6
        for (let i = 0; i < ringCount; i++) {
            const t = (i + 1) / (ringCount + 1)
            const ringRx = rx * (1 - t * 0.7)
            const ringRy = ry * (1 - t * 0.7)
            const waveOffset = Math.sin(this.time * 2 + i * 0.8) * 3
            const alpha = (0.25 - t * 0.15) * intensityBoost

            fg.ellipse(waveOffset * (1 - t), 0, ringRx, ringRy)
            fg.stroke({ color: this.colors.secondary, width: 2, alpha })
        }

        // Center singularity/void
        const centerPulse = 0.7 + Math.sin(this.pulsePhase * 1.5) * 0.3
        fg.ellipse(0, 0, rx * 0.15 * centerPulse, ry * 0.15 * centerPulse)
        fg.fill({ color: this.colors.glow, alpha: 0.4 })
        fg.ellipse(0, 0, rx * 0.08 * centerPulse, ry * 0.08 * centerPulse)
        fg.fill({ color: 0xffffff, alpha: 0.6 })

        // === SWIRLING PARTICLES (on particleGraphics) ===
        for (const particle of this.funnelParticles) {
            // Orbit around the portal edge
            const orbitRx = rx * (0.7 + particle.depth * 0.4)
            const orbitRy = ry * (0.7 + particle.depth * 0.4)
            const px = Math.cos(particle.angle) * orbitRx
            const py = Math.sin(particle.angle) * orbitRy

            // Particle with trail
            const trailCount = 4
            for (let t = trailCount - 1; t >= 0; t--) {
                const trailAngle = particle.angle - t * 0.2
                const tx = Math.cos(trailAngle) * orbitRx
                const ty = Math.sin(trailAngle) * orbitRy
                const trailAlpha = particle.alpha * (1 - t / trailCount) * 0.5
                const trailSize = particle.size * (1 - (t / trailCount) * 0.4)

                pg.circle(tx, ty, trailSize)
                pg.fill({ color: this.colors.beam, alpha: trailAlpha })
            }

            // Main particle
            pg.circle(px, py, particle.size)
            pg.fill({ color: this.colors.beam, alpha: particle.alpha })

            // Bright core
            pg.circle(px, py, particle.size * 0.4)
            pg.fill({ color: 0xffffff, alpha: particle.alpha * 0.8 })
        }

        // === PORTAL FRAME/EDGE (on baseGraphics) ===
        // Outer glowing ring
        bg.ellipse(0, 0, rx * pulse, ry * pulse)
        bg.stroke({
            color: this.colors.primary,
            width: 4,
            alpha: Math.min(1, 0.9 * intensityBoost),
        })

        // Inner ring
        bg.ellipse(0, 0, rx * 0.92 * pulse, ry * 0.92 * pulse)
        bg.stroke({
            color: this.colors.secondary,
            width: 2,
            alpha: Math.min(1, 0.7 * intensityBoost),
        })

        // Animated edge sparks
        const sparkCount = 16
        for (let i = 0; i < sparkCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkCount + this.rotationAngle
            const sparkPulse = 0.5 + Math.sin(this.time * 4 + i * 0.7) * 0.5
            const sparkX = Math.cos(angle) * rx * 1.02
            const sparkY = Math.sin(angle) * ry * 1.02
            const sparkSize = 2 + sparkPulse * 2

            bg.circle(sparkX, sparkY, sparkSize)
            bg.fill({ color: this.colors.beam, alpha: 0.4 * sparkPulse * intensityBoost })
        }

        // === ENERGY WISPS (on beamGraphics) ===
        const wispCount = 4
        for (let i = 0; i < wispCount; i++) {
            const baseAngle = (Math.PI * 2 * i) / wispCount + this.time * 0.5
            const wispPhase = this.time * 2 + i * 1.5
            const wispLength = 15 + Math.sin(wispPhase) * 10
            const wispAlpha = 0.3 + Math.sin(wispPhase + 1) * 0.2

            // Wisp emanates from edge
            const startX = Math.cos(baseAngle) * rx * 0.95
            const startY = Math.sin(baseAngle) * ry * 0.95
            const endX = Math.cos(baseAngle) * (rx + wispLength)
            const endY = Math.sin(baseAngle) * (ry * 0.8 + wispLength * 0.6)

            beamG.moveTo(startX, startY)
            beamG.lineTo(endX, endY)
            beamG.stroke({
                color: this.colors.beam,
                width: 3,
                alpha: wispAlpha * intensityBoost,
            })

            // Wisp tip glow
            beamG.circle(endX, endY, 3)
            beamG.fill({ color: this.colors.beam, alpha: wispAlpha * 0.6 })
        }
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        const pulse = 1 + Math.sin(this.pulsePhase) * 0.08
        const intensityBoost = 1 + this.proximityIntensity * 0.5
        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio

        // === BIOLUMINESCENT OUTER AURA ===
        // Organic pulsing glow layers
        const layers = 5 + Math.floor(this.proximityIntensity * 2)
        for (let i = layers; i >= 0; i--) {
            const layerPulse = pulse + Math.sin(this.time * 2 + i * 0.5) * 0.05
            const scale = 1.2 + i * 0.15
            const alpha = (0.05 + this.proximityIntensity * 0.03 - i * 0.008) * layerPulse
            g.ellipse(0, 0, rx * scale * layerPulse, ry * scale * layerPulse)
            g.fill({ color: this.colors.glow, alpha: Math.max(0, alpha) })
        }

        // === EVENT HORIZON RING ===
        // A distinct bright ring at the edge where light bends
        const horizonPulse = 0.8 + Math.sin(this.pulsePhase * 2) * 0.2
        const horizonRx = rx * 1.05 * pulse
        const horizonRy = ry * 1.05 * pulse

        // Outer soft edge
        g.ellipse(0, 0, horizonRx * 1.08, horizonRy * 1.08)
        g.stroke({ color: this.colors.glow, width: 4, alpha: 0.15 * horizonPulse * intensityBoost })

        // Main horizon ring
        g.ellipse(0, 0, horizonRx, horizonRy)
        g.stroke({
            color: this.colors.primary,
            width: 2,
            alpha: 0.4 * horizonPulse * intensityBoost,
        })

        // === GRAVITATIONAL LENSING DISTORTION ===
        // Subtle warped light effects around the edge
        const distortionCount = 8
        for (let i = 0; i < distortionCount; i++) {
            const angle = (Math.PI * 2 * i) / distortionCount + this.time * 0.3
            const distortPulse = 0.5 + Math.sin(this.time * 4 + i * 1.2) * 0.5
            const distortLength = 15 + distortPulse * 10
            const distortWidth = 3 + distortPulse * 2

            const startX = Math.cos(angle) * horizonRx * 1.1
            const startY = Math.sin(angle) * horizonRy * 1.1
            const endX = Math.cos(angle) * (horizonRx * 1.1 + distortLength)
            const endY = Math.sin(angle) * (horizonRy * 1.1 + distortLength * 0.4)

            // Light streak being pulled in
            g.moveTo(endX, endY)
            g.lineTo(startX, startY)
            g.stroke({
                color: this.colors.beam,
                width: distortWidth,
                alpha: 0.2 * distortPulse * intensityBoost,
            })
        }

        // Suction/hit flash
        if (this.isSucking) {
            const progress = this.suckTimer / this.suckDuration
            const flashAlpha = Math.sin(progress * Math.PI) * 0.6
            const flashScale = 1.4 - progress * 0.4
            g.ellipse(0, 0, rx * flashScale, ry * flashScale)
            g.fill({ color: 0xffffff, alpha: flashAlpha })
        }

        if (this.hitFlashTimer > 0) {
            const flashAlpha = (this.hitFlashTimer / 0.3) * 0.5
            g.ellipse(0, 0, rx * 1.3, ry * 1.3)
            g.fill({ color: 0xffffff, alpha: flashAlpha })
        }
    }

    private drawFunnel(): void {
        const g = this.funnelGraphics
        g.clear()

        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio
        const depth = this.radius * this.funnelDepth
        const intensityBoost = 1 + this.proximityIntensity * 0.3

        // === DEEP VOID INTERIOR ===
        // Multiple layers creating depth illusion with exponential darkening
        const funnelLayers = 20
        for (let i = funnelLayers; i >= 0; i--) {
            const t = i / funnelLayers // 0 = bottom, 1 = top
            // Exponential shrinking for more dramatic depth
            const shrinkFactor = Math.pow(t, 0.7)
            const layerRx = rx * (0.02 + shrinkFactor * 0.98)
            const layerRy = ry * (0.02 + shrinkFactor * 0.98)
            const layerY = depth * (1 - t) * 1.1 // Slight overshoot for depth

            // Exponential darkening toward center
            const darkness = Math.pow(1 - t, 1.5)
            const alpha = 0.1 + darkness * 0.6

            g.ellipse(0, layerY, layerRx, layerRy)
            g.fill({ color: this.colors.dark, alpha })
        }

        // === ORGANIC WALL SHADING (3D rim effect) ===
        // Left side brighter (rim lighting)
        const rimLayers = 8
        for (let i = 0; i < rimLayers; i++) {
            const t = i / rimLayers
            const rimY = depth * t * 0.8
            const rimRx = rx * (1 - t * 0.85)
            const rimRy = ry * (1 - t * 0.85)

            // Crescent shape on the left side for rim lighting
            const rimOffset = -rimRx * 0.15
            const rimAlpha = (0.15 - t * 0.12) * intensityBoost

            g.ellipse(rimOffset, rimY, rimRx * 0.3, rimRy * 0.8)
            g.fill({ color: this.colors.glow, alpha: rimAlpha })
        }

        // === BIOLUMINESCENT VEINS (organic tendrils spiraling down) ===
        for (const line of this.gravityLines) {
            const baseAngle = line.startAngle + this.rotationAngle
            // Organic pulsing movement
            const pulseOffset = Math.sin(this.time * 1.5 + line.phase) * 0.3

            g.moveTo(Math.cos(baseAngle) * rx, Math.sin(baseAngle) * ry)

            const segments = 16
            for (let i = 1; i <= segments; i++) {
                const t = i / segments
                // More dramatic spiral with organic wobble
                const spiralAngle = baseAngle + t * Math.PI * 1.2 + pulseOffset * t
                const shrink = 1 - Math.pow(t, 0.8) * 0.97
                // Organic wave in the tendril
                const waveOffset =
                    Math.sin(t * Math.PI * 3 + this.time * 2 + line.phase) * 5 * (1 - t)

                const px =
                    Math.cos(spiralAngle) * rx * shrink +
                    waveOffset * Math.cos(spiralAngle + Math.PI / 2)
                const py = Math.sin(spiralAngle) * ry * shrink + depth * t + waveOffset * 0.3

                g.lineTo(px, py)
            }

            // Pulsing glow effect
            const glowPulse = 0.5 + Math.sin(this.time * 2 + line.phase) * 0.3
            g.stroke({
                color: this.colors.primary,
                width: 2 + glowPulse,
                alpha: (0.25 + this.proximityIntensity * 0.2) * intensityBoost * glowPulse,
            })
        }

        // === EVENT HORIZON RINGS ===
        // Rings that appear to be pulled into the void
        const ringCount = 7
        for (let i = 1; i <= ringCount; i++) {
            const t = i / (ringCount + 1)
            const ringRx = rx * (1 - Math.pow(t, 0.6) * 0.92)
            const ringRy = ry * (1 - Math.pow(t, 0.6) * 0.92)
            const ringY = depth * Math.pow(t, 0.8)

            // Rings pulse at different phases
            const ringPulse = 0.6 + Math.sin(this.time * 3 - t * 4 + this.pulsePhase) * 0.4
            const alpha = (0.35 - t * 0.25) * intensityBoost * ringPulse

            g.ellipse(0, ringY, ringRx, ringRy)
            g.stroke({ color: this.colors.secondary, width: 1.5 + (1 - t) * 1.5, alpha })
        }

        // === ABYSSAL SINGULARITY ===
        // Deep glow emanating from the void
        const singularityPulse = 0.5 + Math.sin(this.pulsePhase * 1.5) * 0.3
        const singularityY = depth * 0.95

        // Outer ethereal glow
        for (let i = 4; i >= 0; i--) {
            const glowSize = (8 + i * 6) * singularityPulse + this.proximityIntensity * 4
            const glowAlpha = (0.08 - i * 0.015) * intensityBoost
            g.ellipse(0, singularityY, glowSize * 1.5, glowSize * 0.6)
            g.fill({ color: this.colors.glow, alpha: glowAlpha })
        }

        // Core light being pulled in
        const coreSize = 6 + this.proximityIntensity * 4
        g.ellipse(0, singularityY, coreSize * 1.2, coreSize * 0.5)
        g.fill({ color: this.colors.beam, alpha: 0.5 * singularityPulse })

        g.ellipse(0, singularityY, coreSize * 0.6, coreSize * 0.25)
        g.fill({ color: 0xffffff, alpha: 0.7 * singularityPulse })

        // Tiny bright point (the actual singularity)
        g.ellipse(0, singularityY, 2, 1)
        g.fill({ color: 0xffffff, alpha: 0.9 })
    }

    private drawParticles(): void {
        const g = this.particleGraphics
        g.clear()

        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio
        const depth = this.radius * this.funnelDepth

        for (const particle of this.funnelParticles) {
            // Calculate position based on depth with accelerating spiral
            const depthCurve = Math.pow(particle.depth, 0.6) // Accelerate toward center
            const shrink = 1 - depthCurve * 0.97
            const px = Math.cos(particle.angle) * rx * shrink
            const py = Math.sin(particle.angle) * ry * shrink + depth * depthCurve

            // Particles get brighter then fade as they approach singularity
            const brightnessPhase = Math.sin(particle.depth * Math.PI) // Peak brightness in middle
            const fadeAlpha =
                particle.alpha * (0.3 + brightnessPhase * 0.7) * (1 - particle.depth * 0.5)
            const size = particle.size * (1 - depthCurve * 0.7)

            // Elongated trail (stretched by gravitational pull)
            const trailCount = 5
            for (let i = trailCount - 1; i >= 0; i--) {
                const trailDepth = Math.max(0, particle.depth - i * 0.06)
                const trailDepthCurve = Math.pow(trailDepth, 0.6)
                const trailShrink = 1 - trailDepthCurve * 0.97
                const trailAngle = particle.angle - i * 0.12 * (1 + particle.depth) // Trail stretches more as it falls
                const tx = Math.cos(trailAngle) * rx * trailShrink
                const ty = Math.sin(trailAngle) * ry * trailShrink + depth * trailDepthCurve
                const trailAlpha = fadeAlpha * (1 - i / trailCount) * 0.4
                const trailSize = size * (1 - (i / trailCount) * 0.5)

                g.circle(tx, ty, trailSize)
                g.fill({ color: this.colors.beam, alpha: trailAlpha })
            }

            // Main particle with glow
            g.circle(px, py, size * 1.5)
            g.fill({ color: this.colors.glow, alpha: fadeAlpha * 0.3 })

            g.circle(px, py, size)
            g.fill({ color: this.colors.beam, alpha: fadeAlpha })

            // Bright core (like captured light)
            g.circle(px, py, size * 0.5)
            g.fill({ color: 0xffffff, alpha: fadeAlpha * 0.9 })
        }

        // === LIGHT BEING PULLED IN (from outside) ===
        // Additional particles at the edge being captured
        const capturedCount = 6
        for (let i = 0; i < capturedCount; i++) {
            const angle = (Math.PI * 2 * i) / capturedCount + this.time * 0.5
            const capturePhase = (this.time * 0.8 + i * 0.5) % 1
            const captureT = Math.pow(capturePhase, 0.5) // Accelerate inward

            // Start from outside, spiral in
            const startR = 1.3
            const endR = 0.1
            const r = startR - (startR - endR) * captureT
            const spiralAngle = angle + captureT * Math.PI * 0.8

            const cx = Math.cos(spiralAngle) * rx * r
            const cy = Math.sin(spiralAngle) * ry * r + depth * captureT * 0.3

            const captureAlpha = Math.sin(capturePhase * Math.PI) * 0.4
            const captureSize = 2 + (1 - captureT) * 3

            if (captureAlpha > 0.05) {
                // Trail
                for (let t = 3; t >= 0; t--) {
                    const trailPhase = Math.max(0, capturePhase - t * 0.08)
                    const trailT = Math.pow(trailPhase, 0.5)
                    const trailR = startR - (startR - endR) * trailT
                    const trailSpiralAngle = angle + trailT * Math.PI * 0.8
                    const trailX = Math.cos(trailSpiralAngle) * rx * trailR
                    const trailY = Math.sin(trailSpiralAngle) * ry * trailR + depth * trailT * 0.3

                    g.circle(trailX, trailY, captureSize * (1 - t * 0.2))
                    g.fill({ color: this.colors.beam, alpha: captureAlpha * (1 - t * 0.25) * 0.5 })
                }

                g.circle(cx, cy, captureSize)
                g.fill({ color: this.colors.beam, alpha: captureAlpha })
            }
        }
    }

    private drawBase(): void {
        const g = this.baseGraphics
        g.clear()

        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio
        const alphaBoost = 1 + this.proximityIntensity * 0.3
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.03

        // === 3D OUTER RIM ===
        // Shadow/depth on the back edge (top of ellipse = further away)
        g.ellipse(0, -ry * 0.08, rx * 1.02, ry * 0.3)
        g.fill({ color: 0x000000, alpha: 0.2 })

        // Main outer ring with glow
        g.ellipse(0, 0, rx * pulse, ry * pulse)
        g.stroke({ color: this.colors.primary, width: 4, alpha: Math.min(1, 0.95 * alphaBoost) })

        // Inner bright edge (rim highlight)
        g.ellipse(0, 0, rx * 0.96 * pulse, ry * 0.96 * pulse)
        g.stroke({ color: this.colors.glow, width: 2, alpha: Math.min(1, 0.5 * alphaBoost) })

        // Second decorative ring
        g.ellipse(0, 0, rx * 0.88 * pulse, ry * 0.88 * pulse)
        g.stroke({ color: this.colors.secondary, width: 1.5, alpha: Math.min(1, 0.4 * alphaBoost) })

        // Perfect zone ring with pulsing glow
        const perfectPulse = 0.8 + Math.sin(this.pulsePhase * 2) * 0.2
        const perfectRx = this.perfectRadius * this.widthScale
        const perfectRy = this.perfectRadius * this.ellipseRatio
        g.ellipse(0, 0, perfectRx * perfectPulse, perfectRy * perfectPulse)
        g.stroke({
            color: this.colors.beam,
            width: 2,
            alpha: Math.min(1, 0.6 * alphaBoost * perfectPulse),
        })

        // === BIOLUMINESCENT NODULES ===
        // Organic glowing points around the rim
        const noduleCount = 16
        for (let i = 0; i < noduleCount; i++) {
            const angle = (Math.PI * 2 * i) / noduleCount + this.rotationAngle * 0.3
            const nodulePulse = 0.5 + Math.sin(this.time * 3 + i * 0.8) * 0.5

            const nx = Math.cos(angle) * rx * 1.02
            const ny = Math.sin(angle) * ry * 1.02
            const noduleSize = 3 + nodulePulse * 2

            // Outer glow
            g.circle(nx, ny, noduleSize * 2)
            g.fill({ color: this.colors.glow, alpha: 0.15 * nodulePulse * alphaBoost })

            // Core
            g.circle(nx, ny, noduleSize)
            g.fill({ color: this.colors.beam, alpha: 0.5 * nodulePulse * alphaBoost })

            // Bright center
            g.circle(nx, ny, noduleSize * 0.4)
            g.fill({ color: 0xffffff, alpha: 0.6 * nodulePulse })
        }

        // === ORGANIC TENDRILS connecting nodules ===
        for (let i = 0; i < noduleCount; i++) {
            const angle1 = (Math.PI * 2 * i) / noduleCount + this.rotationAngle * 0.3
            const angle2 =
                (Math.PI * 2 * ((i + 1) % noduleCount)) / noduleCount + this.rotationAngle * 0.3

            const x1 = Math.cos(angle1) * rx * 1.02
            const y1 = Math.sin(angle1) * ry * 1.02
            const x2 = Math.cos(angle2) * rx * 1.02
            const y2 = Math.sin(angle2) * ry * 1.02

            // Wavy connection
            const midAngle = (angle1 + angle2) / 2
            const waveOffset = Math.sin(this.time * 2 + i) * 3
            const cx = Math.cos(midAngle) * (rx * 1.06 + waveOffset)
            const cy = Math.sin(midAngle) * (ry * 1.06 + waveOffset * 0.4)

            g.moveTo(x1, y1)
            g.quadraticCurveTo(cx, cy, x2, y2)
            g.stroke({ color: this.colors.primary, width: 1.5, alpha: 0.25 * alphaBoost })
        }
    }

    private drawBeams(): void {
        const g = this.beamGraphics
        g.clear()

        const intensityBoost = 1 + this.proximityIntensity * 0.6
        const suckBoost = this.isSucking ? 1.4 : 1

        for (const beam of this.beams) {
            const angle = beam.angle + this.rotationAngle * 0.3
            const bx = Math.cos(angle) * this.radius * 0.75 * this.widthScale
            const by = Math.sin(angle) * this.radius * 0.75 * this.ellipseRatio

            const baseHeight = beam.height * intensityBoost * suckBoost
            const animatedHeight =
                baseHeight * (0.6 + Math.sin(this.time * beam.speed * 3 + beam.phase) * 0.4)
            const animatedAlpha =
                beam.alpha *
                (0.5 + Math.sin(this.time * beam.speed * 2 + beam.phase) * 0.5) *
                intensityBoost

            // Outer beam
            g.moveTo(bx - beam.width / 2, by)
            g.lineTo(bx + beam.width / 2, by)
            g.lineTo(bx + beam.width * 0.15, by - animatedHeight)
            g.lineTo(bx - beam.width * 0.15, by - animatedHeight)
            g.closePath()
            g.fill({ color: this.colors.beam, alpha: animatedAlpha * 0.4 })

            // Inner bright core
            g.moveTo(bx - beam.width * 0.25, by)
            g.lineTo(bx + beam.width * 0.25, by)
            g.lineTo(bx, by - animatedHeight * 0.85)
            g.closePath()
            g.fill({ color: 0xffffff, alpha: animatedAlpha * 0.35 })
        }
    }

    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pulsePhase += deltaSeconds * (2.5 + this.proximityIntensity * 2)
        this.rotationAngle += deltaSeconds * (0.4 + this.proximityIntensity * 0.8)

        // Smooth proximity transition
        this.proximityIntensity +=
            (this.targetProximity - this.proximityIntensity) * deltaSeconds * 5

        // Suction animation
        if (this.isSucking) {
            this.suckTimer += deltaSeconds
            // Spawn extra particles during suction
            if (Math.random() < deltaSeconds * 25) {
                this.spawnFunnelParticle()
            }
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
                // Vertical portal: particles orbit around the edge
                particle.angle += particle.rotationSpeed * deltaSeconds * speedMultiplier
                // Slowly vary depth to create layered orbits
                particle.depth += Math.sin(this.time + particle.angle) * deltaSeconds * 0.1
                particle.depth = Math.max(0, Math.min(1, particle.depth))
            } else {
                // Horizontal portal: spiral down into singularity
                particle.depth += particle.speed * deltaSeconds * speedMultiplier
                particle.angle += particle.rotationSpeed * deltaSeconds * (1 + particle.depth)

                // Respawn when reached singularity
                if (particle.depth >= 1) {
                    this.funnelParticles.splice(i, 1)
                    this.spawnFunnelParticle()
                }
            }
        }

        // Maintain particle count
        while (this.funnelParticles.length < 20 + (this.isSucking ? 15 : 0)) {
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

        this.draw()
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
        // Burst of particles
        for (let i = 0; i < 15; i++) {
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
        this.draw()
    }

    /**
     * Set horizontal width scale (1.0 = normal, 2.0 = double width)
     */
    setWidthScale(scale: number): void {
        this.widthScale = scale
        this.draw()
    }

    /**
     * Set portal orientation
     * - 'horizontal': Flat funnel style (looking down into it)
     * - 'vertical': Standing doorway style (Diablo/Portal game style)
     */
    setOrientation(orientation: PortalOrientation): void {
        this.orientation = orientation
        // No rotation needed - we use completely different rendering per orientation
        this.draw()
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
