/**
 * Wormhole.ts - Clean portal with swirling particles
 *
 * Simplified design matching the intro tutorial style:
 * - Clean glow layers
 * - Simple funnel gradient
 * - Orbiting particles
 * - Pulsing center
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

// Orbiting particle around the portal
interface OrbitParticle {
    angle: number
    speed: number
    size: number
    orbitRadius: number // 0-1, multiplier of portal radius
}

// Constants
const PARTICLE_COUNT = 12
const GLOW_LAYERS = 4
const FUNNEL_LAYERS = 8
const INNER_RING_COUNT = 4

export class Wormhole {
    public container: Container
    private funnelGraphics: Graphics // The funnel layers
    private ringGraphics: Graphics // Outer ring and inner rings
    private glowGraphics: Graphics // Glow effects
    private particleGraphics: Graphics // Orbiting particles

    public x: number
    public y: number
    public radius: number
    public perfectRadius: number
    public isFinish: boolean
    public widthScale: number
    public orientation: PortalOrientation

    // Animation state
    private time = 0
    private pulsePhase = 0
    private hitFlashTimer = 0

    // Proximity effect
    private proximityIntensity = 0
    private targetProximity = 0

    // Suction animation
    private isSucking = false
    private suckTimer = 0
    private suckDuration = 0.6

    // Collapse animation (wormhole shrinks to nothing on goal)
    private isCollapsing = false
    private collapseTimer = 0
    private collapseDuration = 0.7
    private collapseScale = 1.0 // 1 = full size, 0 = gone

    // Visual elements
    private particles: OrbitParticle[] = []

    // Portal colors
    private colors: {
        primary: number
        secondary: number
        glow: number
        bright: number
        dark: number
    }

    // Funnel dimensions
    private readonly ellipseRatio = 0.35 // Flatter for more 3D perspective
    private readonly funnelDepth = 0.8 // Deeper funnel for 3D effect

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
        this.ringGraphics = new Graphics()

        this.container.addChild(this.glowGraphics)
        this.container.addChild(this.funnelGraphics)
        this.container.addChild(this.particleGraphics)
        this.container.addChild(this.ringGraphics)

        this.container.position.set(this.x, this.y)

        this.initParticles()
        this.draw()
    }

    private getColorTheme(color: string) {
        switch (color) {
            case 'gold':
                return {
                    primary: 0xc9a227,
                    secondary: 0x8b6914,
                    glow: 0xd4a84b,
                    bright: 0xe8d5a3,
                    dark: 0x1a1510,
                }
            case 'teal':
                return {
                    primary: 0x2dd4bf,
                    secondary: 0x0d9488,
                    glow: 0x5eead4,
                    bright: 0x99f6e4,
                    dark: 0x042f2e,
                }
            case 'red':
                return {
                    primary: 0xdc2626,
                    secondary: 0x7f1d1d,
                    glow: 0xef4444,
                    bright: 0xfca5a5,
                    dark: 0x1c0a0a,
                }
            case 'purple':
            default:
                return {
                    primary: 0x8b5cf6,
                    secondary: 0x5b21b6,
                    glow: 0xa78bfa,
                    bright: 0xc4b5fd,
                    dark: 0x0f0a1a,
                }
        }
    }

    private initParticles(): void {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            this.particles.push({
                angle: (Math.PI * 2 * i) / PARTICLE_COUNT,
                speed: 0.5 + Math.random() * 0.5,
                size: 2 + Math.random() * 2,
                orbitRadius: 0.7 + Math.random() * 0.15,
            })
        }
    }

    /**
     * Main draw method - called every frame
     */
    private draw(): void {
        if (this.orientation === 'vertical') {
            this.drawVerticalPortal()
        } else {
            this.drawHorizontalPortal()
        }
    }

    /**
     * Draw horizontal portal (looking down into funnel)
     */
    private drawHorizontalPortal(): void {
        const rx = this.radius * this.widthScale
        const ry = this.radius * this.ellipseRatio
        const depth = this.radius * this.funnelDepth
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05
        const intensityBoost = 1 + this.proximityIntensity * 0.3

        // Clear all graphics
        this.glowGraphics.clear()
        this.funnelGraphics.clear()
        this.particleGraphics.clear()
        this.ringGraphics.clear()

        const gg = this.glowGraphics
        const fg = this.funnelGraphics
        const pg = this.particleGraphics
        const rg = this.ringGraphics

        // === OUTER GLOW ===
        for (let i = GLOW_LAYERS - 1; i >= 0; i--) {
            const scale = 1 + i * 0.12
            const alpha = (0.08 - i * 0.015) * intensityBoost
            gg.ellipse(0, 0, rx * scale * pulse, ry * scale * pulse)
            gg.fill({ color: this.colors.glow, alpha: Math.max(0, alpha) })
        }

        // === FUNNEL LAYERS (dark center with depth) ===
        for (let i = 0; i < FUNNEL_LAYERS; i++) {
            const t = i / FUNNEL_LAYERS
            // Exponential shrink for more natural depth
            const shrinkFactor = Math.pow(1 - t, 0.7)
            const layerRx = rx * shrinkFactor
            const layerRy = ry * shrinkFactor
            // Exponential depth offset
            const layerY = depth * Math.pow(t, 0.8)
            const alpha = 0.25 + t * 0.5
            fg.ellipse(0, layerY, layerRx, layerRy)
            fg.fill({ color: this.colors.dark, alpha })
        }

        // === INNER RINGS (pulsing, with depth offset) ===
        for (let i = 0; i < INNER_RING_COUNT; i++) {
            const t = (i + 1) / (INNER_RING_COUNT + 1)
            const shrinkFactor = Math.pow(1 - t, 0.7)
            const ringRx = rx * shrinkFactor
            const ringRy = ry * shrinkFactor
            const ringPulse = 1 + Math.sin(this.time * 3 + i * 0.8) * 0.08
            const ringY = depth * Math.pow(t, 0.8)
            fg.ellipse(0, ringY, ringRx * ringPulse, ringRy * ringPulse)
            fg.stroke({ color: this.colors.secondary, width: 2, alpha: 0.5 - t * 0.25 })
        }

        // === 3D SPHERICAL PARTICLES ===
        for (const p of this.particles) {
            const orbitRx = rx * p.orbitRadius
            const orbitRy = ry * p.orbitRadius
            const px = Math.cos(p.angle) * orbitRx
            const py = Math.sin(p.angle) * orbitRy
            const size = p.size

            // Shadow/base layer
            pg.circle(px + 1, py + 1, size)
            pg.fill({ color: this.colors.secondary, alpha: 0.4 })

            // Main sphere
            pg.circle(px, py, size)
            pg.fill({ color: this.colors.glow, alpha: 0.7 })

            // Highlight (top-left)
            pg.circle(px - size * 0.3, py - size * 0.3, size * 0.4)
            pg.fill({ color: this.colors.bright, alpha: 0.8 })
        }

        // === OUTER RING ===
        rg.ellipse(0, 0, rx * pulse, ry * pulse)
        rg.stroke({ color: this.colors.primary, width: 3, alpha: 0.9 })

        // === PERFECT ZONE RING ===
        const perfectRx = this.perfectRadius * this.widthScale
        const perfectRy = this.perfectRadius * this.ellipseRatio
        rg.ellipse(0, 0, perfectRx, perfectRy)
        rg.stroke({ color: this.colors.bright, width: 1.5, alpha: 0.3 })

        // === HIT/SUCK FLASH ===
        if (this.isSucking) {
            const progress = this.suckTimer / this.suckDuration
            const flashAlpha = Math.sin(progress * Math.PI) * 0.5
            gg.ellipse(0, 0, rx * (1.3 - progress * 0.3), ry * (1.3 - progress * 0.3))
            gg.fill({ color: 0xffffff, alpha: flashAlpha })
        }

        if (this.hitFlashTimer > 0) {
            const flashAlpha = (this.hitFlashTimer / 0.3) * 0.4
            gg.ellipse(0, 0, rx * 1.2, ry * 1.2)
            gg.fill({ color: 0xffffff, alpha: flashAlpha })
        }
    }

    /**
     * Draw vertical portal (standing doorway style)
     */
    private drawVerticalPortal(): void {
        const rx = this.radius * 0.6 * this.widthScale
        const ry = this.radius * 1.2
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.05
        const intensityBoost = 1 + this.proximityIntensity * 0.3

        // Clear all graphics
        this.glowGraphics.clear()
        this.funnelGraphics.clear()
        this.particleGraphics.clear()
        this.ringGraphics.clear()

        const gg = this.glowGraphics
        const fg = this.funnelGraphics
        const pg = this.particleGraphics
        const rg = this.ringGraphics

        // === OUTER GLOW ===
        for (let i = GLOW_LAYERS - 1; i >= 0; i--) {
            const scale = 1 + i * 0.12
            const alpha = (0.08 - i * 0.015) * intensityBoost
            gg.ellipse(0, 0, rx * scale * pulse, ry * scale * pulse)
            gg.fill({ color: this.colors.glow, alpha: Math.max(0, alpha) })
        }

        // === VOID LAYERS ===
        const voidLayers = 6
        for (let i = 0; i < voidLayers; i++) {
            const t = i / voidLayers
            const shrinkFactor = Math.pow(1 - t, 0.7)
            const layerRx = rx * shrinkFactor
            const layerRy = ry * shrinkFactor
            const alpha = 0.25 + t * 0.5
            fg.ellipse(0, 0, layerRx, layerRy)
            fg.fill({ color: this.colors.dark, alpha })
        }

        // === INNER RINGS ===
        for (let i = 0; i < INNER_RING_COUNT; i++) {
            const t = (i + 1) / (INNER_RING_COUNT + 1)
            const shrinkFactor = Math.pow(1 - t, 0.7)
            const ringRx = rx * shrinkFactor
            const ringRy = ry * shrinkFactor
            const ringPulse = 1 + Math.sin(this.time * 3 + i * 0.8) * 0.08
            fg.ellipse(0, 0, ringRx * ringPulse, ringRy * ringPulse)
            fg.stroke({ color: this.colors.secondary, width: 2, alpha: 0.5 - t * 0.25 })
        }

        // === 3D SPHERICAL PARTICLES ===
        for (const p of this.particles) {
            const orbitRx = rx * p.orbitRadius
            const orbitRy = ry * p.orbitRadius
            const px = Math.cos(p.angle) * orbitRx
            const py = Math.sin(p.angle) * orbitRy
            const size = p.size

            // Shadow/base layer
            pg.circle(px + 1, py + 1, size)
            pg.fill({ color: this.colors.secondary, alpha: 0.4 })

            // Main sphere
            pg.circle(px, py, size)
            pg.fill({ color: this.colors.glow, alpha: 0.7 })

            // Highlight (top-left)
            pg.circle(px - size * 0.3, py - size * 0.3, size * 0.4)
            pg.fill({ color: this.colors.bright, alpha: 0.8 })
        }

        // === OUTER RING ===
        rg.ellipse(0, 0, rx * pulse, ry * pulse)
        rg.stroke({ color: this.colors.primary, width: 3, alpha: 0.9 })

        rg.ellipse(0, 0, rx * 0.92 * pulse, ry * 0.92 * pulse)
        rg.stroke({ color: this.colors.secondary, width: 2, alpha: 0.5 })

        // === HIT/SUCK FLASH ===
        if (this.isSucking) {
            const progress = this.suckTimer / this.suckDuration
            const flashAlpha = Math.sin(progress * Math.PI) * 0.5
            gg.ellipse(0, 0, rx * (1.3 - progress * 0.3), ry * (1.3 - progress * 0.3))
            gg.fill({ color: 0xffffff, alpha: flashAlpha })
        }

        if (this.hitFlashTimer > 0) {
            const flashAlpha = (this.hitFlashTimer / 0.3) * 0.4
            gg.ellipse(0, 0, rx * 1.2, ry * 1.2)
            gg.fill({ color: 0xffffff, alpha: flashAlpha })
        }
    }

    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pulsePhase += deltaSeconds * (2.5 + this.proximityIntensity * 2)

        // Smooth proximity transition
        this.proximityIntensity += (this.targetProximity - this.proximityIntensity) * deltaSeconds * 5

        // Suction animation
        if (this.isSucking) {
            this.suckTimer += deltaSeconds
            if (this.suckTimer >= this.suckDuration) {
                this.isSucking = false
                this.suckTimer = 0
            }
        }

        // Collapse animation
        if (this.isCollapsing) {
            this.collapseTimer += deltaSeconds
            const progress = Math.min(1, this.collapseTimer / this.collapseDuration)
            // Ease-in curve for accelerating collapse
            const easeIn = progress * progress * progress
            this.collapseScale = Math.max(0, 1 - easeIn)
            // Apply scale and fade to container
            this.container.scale.set(this.collapseScale)
            this.container.alpha = this.collapseScale
            // Spin faster as it collapses
            this.container.rotation += deltaSeconds * (5 + progress * 15)
            if (progress >= 1) {
                this.isCollapsing = false
                this.container.visible = false
            }
        }

        // Update orbiting particles (faster during collapse)
        const collapseBoost = this.isCollapsing ? 2 + (1 - this.collapseScale) * 5 : 0
        const speedMultiplier = 1 + this.proximityIntensity * 0.5 + (this.isSucking ? 1.5 : 0) + collapseBoost
        for (const p of this.particles) {
            p.angle += p.speed * deltaSeconds * 2 * speedMultiplier
        }

        // Hit flash decay
        if (this.hitFlashTimer > 0) {
            this.hitFlashTimer -= deltaSeconds
        }

        // Redraw every frame
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
    }

    /**
     * Start collapse animation - wormhole shrinks to nothing
     */
    startCollapse(duration: number = 0.7): void {
        this.isCollapsing = true
        this.collapseTimer = 0
        this.collapseDuration = duration
        this.collapseScale = 1.0
    }

    /**
     * Reset collapse state (for next round)
     */
    resetCollapse(): void {
        this.isCollapsing = false
        this.collapseTimer = 0
        this.collapseScale = 1.0
        this.container.scale.set(1)
        this.container.alpha = 1
        this.container.rotation = 0
        this.container.visible = true
    }

    showHit(_perfect: boolean): void {
        this.hitFlashTimer = 0.3
        this.pulsePhase = 0
        this.showSuckIn()
    }

    moveTo(newX: number, newY: number): void {
        this.x = newX
        this.y = newY
        this.container.position.set(newX, newY)
    }

    setRadius(radius: number, perfectRadius?: number): void {
        this.radius = radius
        this.perfectRadius = perfectRadius ?? radius * 0.4
        this.draw()
    }

    /**
     * Set horizontal width scale (1.0 = normal, 2.0 = double width)
     */
    setWidthScale(scale: number): void {
        this.widthScale = scale
    }

    /**
     * Set portal orientation
     * - 'horizontal': Flat funnel style (looking down into it)
     * - 'vertical': Standing doorway style (Diablo/Portal game style)
     */
    setOrientation(orientation: PortalOrientation): void {
        this.orientation = orientation
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
