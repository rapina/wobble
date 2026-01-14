import { Container, Graphics } from 'pixi.js'

// Color themes that cycle over time - bright and vibrant to contrast with black enemies
interface ColorTheme {
    name: string
    bgTop: number
    bgBottom: number
    accent1: number
    accent2: number
    particles: number[]
}

const COLOR_THEMES: ColorTheme[] = [
    {
        // Balatro Green Felt - primary theme
        name: 'felt',
        bgTop: 0x3d6b59, // felt green
        bgBottom: 0x2d5a4a, // darker felt
        accent1: 0xc9a227, // Balatro gold
        accent2: 0x4a9eff, // Balatro blue
        particles: [0x4d7b69, 0x5d8b79, 0xc9a227, 0x4a9eff],
    },
    {
        // Balatro Deep Green
        name: 'deep',
        bgTop: 0x2d5a4a, // darker felt
        bgBottom: 0x1d4a3a, // deep green
        accent1: 0xe85d4c, // Balatro red
        accent2: 0xc9a227, // Balatro gold
        particles: [0x3d6b59, 0x4d7b69, 0xe85d4c, 0xc9a227],
    },
    {
        // Balatro Emerald
        name: 'emerald',
        bgTop: 0x4d7b69, // lighter felt
        bgBottom: 0x3d6b59, // felt green
        accent1: 0xc9a227, // Balatro gold
        accent2: 0xFF6B9D, // Balatro pink
        particles: [0x5d8b79, 0x6d9b89, 0xc9a227, 0xFF6B9D],
    },
    {
        // Balatro Night
        name: 'night',
        bgTop: 0x374244, // dark panel
        bgBottom: 0x1a1a2e, // deep dark
        accent1: 0x4a9eff, // Balatro blue
        accent2: 0xc9a227, // Balatro gold
        particles: [0x4a5658, 0x5a6668, 0x4a9eff, 0xc9a227],
    },
    {
        // Balatro Jade
        name: 'jade',
        bgTop: 0x5d8b79, // jade green
        bgBottom: 0x4d7b69, // deeper jade
        accent1: 0xc9a227, // Balatro gold
        accent2: 0x4a9eff, // Balatro blue
        particles: [0x6d9b89, 0x7dab99, 0xc9a227, 0x4a9eff],
    },
    {
        // Balatro Dusk
        name: 'dusk',
        bgTop: 0x3d5a5a, // teal felt
        bgBottom: 0x2d4a4a, // dark teal
        accent1: 0xe85d4c, // Balatro red
        accent2: 0xFF6B9D, // Balatro pink
        particles: [0x4d6b6b, 0x5d7b7b, 0xe85d4c, 0xFF6B9D],
    },
]

// Floating particle for ambient effect
interface FloatingParticle {
    x: number
    y: number
    size: number
    color: number
    alpha: number
    speedX: number
    speedY: number
    phase: number
    type: 'circle' | 'hexagon' | 'diamond'
}

// Animated wave layer
interface WaveLayer {
    phase: number
    amplitude: number
    frequency: number
    yOffset: number
    color: number
    alpha: number
}

interface BackgroundSystemContext {
    bgContainer: Container
    width: number
    height: number
}

// Collapse fragment for game over effect
interface CollapseFragment {
    x: number
    y: number
    width: number
    height: number
    vx: number
    vy: number
    rotation: number
    rotationSpeed: number
    color: number
    delay: number
    active: boolean
}

export class BackgroundSystem {
    private context: BackgroundSystemContext
    private gradientGraphics: Graphics
    private particleGraphics: Graphics
    private waveGraphics: Graphics
    private gridGraphics: Graphics
    private collapseGraphics: Graphics

    private particles: FloatingParticle[] = []
    private waveLayers: WaveLayer[] = []
    private animTime = 0
    private currentThemeIndex = 0
    private themeTransitionProgress = 0
    private readonly THEME_DURATION = 90 // seconds per theme
    private readonly TRANSITION_DURATION = 5 // seconds for smooth transition

    // Collapse effect state
    private isCollapsing = false
    private collapseTime = 0
    private collapseFragments: CollapseFragment[] = []
    private collapseDarkness = 0

    // Stage theme override
    private stageThemeOverride: ColorTheme | null = null

    constructor(context: BackgroundSystemContext) {
        this.context = context

        // Create graphics layers (back to front)
        this.gradientGraphics = new Graphics()
        this.context.bgContainer.addChild(this.gradientGraphics)

        this.gridGraphics = new Graphics()
        this.context.bgContainer.addChild(this.gridGraphics)

        this.waveGraphics = new Graphics()
        this.context.bgContainer.addChild(this.waveGraphics)

        this.particleGraphics = new Graphics()
        this.context.bgContainer.addChild(this.particleGraphics)

        this.collapseGraphics = new Graphics()
        this.context.bgContainer.addChild(this.collapseGraphics)
    }

    updateContext(context: Partial<BackgroundSystemContext>): void {
        this.context = { ...this.context, ...context }
    }

    /**
     * Set a stage-specific theme override
     * Creates a custom theme from the given color
     */
    setTheme(bgColor: number): void {
        const darkerBg = this.darkenColor(bgColor, 0.3)
        const lighterBg = this.lightenColor(bgColor, 0.2)

        this.stageThemeOverride = {
            name: 'stage',
            bgTop: bgColor,
            bgBottom: darkerBg,
            accent1: lighterBg,
            accent2: this.lightenColor(bgColor, 0.4),
            particles: [
                this.lightenColor(bgColor, 0.3),
                this.lightenColor(bgColor, 0.5),
                0xffffff,
                this.lightenColor(bgColor, 0.2),
            ],
        }
    }

    /**
     * Clear theme override (use default cycling themes)
     */
    clearTheme(): void {
        this.stageThemeOverride = null
    }

    private darkenColor(color: number, factor: number): number {
        const r = Math.round(((color >> 16) & 0xff) * (1 - factor))
        const g = Math.round(((color >> 8) & 0xff) * (1 - factor))
        const b = Math.round((color & 0xff) * (1 - factor))
        return (r << 16) | (g << 8) | b
    }

    private lightenColor(color: number, factor: number): number {
        const r = Math.min(255, Math.round(((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * factor))
        const g = Math.min(255, Math.round(((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * factor))
        const b = Math.min(255, Math.round((color & 0xff) + (255 - (color & 0xff)) * factor))
        return (r << 16) | (g << 8) | b
    }

    // Initialize background
    initialize(background: Graphics): void {
        background.clear()
        background.rect(0, 0, this.context.width, this.context.height)
        background.fill(COLOR_THEMES[0].bgBottom)

        // Create floating particles
        this.createParticles()

        // Create wave layers
        this.createWaveLayers()

        // Initial draw
        this.drawGradient(COLOR_THEMES[0], COLOR_THEMES[0], 0)
        this.drawGrid(COLOR_THEMES[0])
    }

    // Create ambient floating particles - Balatro style
    private createParticles(): void {
        this.particles = []
        const particleCount = 50

        for (let i = 0; i < particleCount; i++) {
            const types: ('circle' | 'hexagon' | 'diamond')[] = ['circle', 'diamond', 'diamond'] // More diamonds for card feel
            this.particles.push({
                x: Math.random() * this.context.width,
                y: Math.random() * this.context.height,
                size: 4 + Math.random() * 10, // Slightly larger
                color: 0xffffff, // Will be updated per theme
                alpha: 0.12 + Math.random() * 0.18, // Higher alpha for dark background
                speedX: (Math.random() - 0.5) * 0.4,
                speedY: -0.3 - Math.random() * 0.4, // Drift upward
                phase: Math.random() * Math.PI * 2,
                type: types[Math.floor(Math.random() * types.length)],
            })
        }
    }

    // Create decorative wave layers
    private createWaveLayers(): void {
        this.waveLayers = [
            {
                phase: 0,
                amplitude: 15,
                frequency: 0.02,
                yOffset: this.context.height * 0.7,
                color: 0x000000,
                alpha: 0.06, // Reduced for softer look
            },
            {
                phase: Math.PI / 3,
                amplitude: 12,
                frequency: 0.025,
                yOffset: this.context.height * 0.75,
                color: 0x000000,
                alpha: 0.05,
            },
            {
                phase: Math.PI / 2,
                amplitude: 10,
                frequency: 0.03,
                yOffset: this.context.height * 0.8,
                color: 0x000000,
                alpha: 0.04,
            },
        ]
    }

    // Update all background effects
    update(delta: number, activePerksCount: number, gameTime: number = 0): void {
        const deltaSeconds = delta / 60
        this.animTime += deltaSeconds

        // Use stage theme override if set
        if (this.stageThemeOverride) {
            const theme = this.stageThemeOverride
            this.drawGradient(theme, theme, 0)
            this.drawGrid(theme)
            this.drawWaves(theme, theme, 0)
            this.updateParticles(deltaSeconds, theme, theme, 0)
            return
        }

        // Calculate current theme and transition
        const totalThemeTime = this.THEME_DURATION + this.TRANSITION_DURATION
        const cycleTime = gameTime % (COLOR_THEMES.length * totalThemeTime)
        this.currentThemeIndex = Math.floor(cycleTime / totalThemeTime) % COLOR_THEMES.length
        const timeInTheme = cycleTime % totalThemeTime

        // Calculate transition progress (0-1, only during transition period)
        if (timeInTheme > this.THEME_DURATION) {
            this.themeTransitionProgress =
                (timeInTheme - this.THEME_DURATION) / this.TRANSITION_DURATION
        } else {
            this.themeTransitionProgress = 0
        }

        const currentTheme = COLOR_THEMES[this.currentThemeIndex]
        const nextTheme = COLOR_THEMES[(this.currentThemeIndex + 1) % COLOR_THEMES.length]

        // Update all visual elements
        this.drawGradient(currentTheme, nextTheme, this.themeTransitionProgress)
        this.drawGrid(this.lerpTheme(currentTheme, nextTheme, this.themeTransitionProgress))
        this.drawWaves(currentTheme, nextTheme, this.themeTransitionProgress)
        this.updateParticles(deltaSeconds, currentTheme, nextTheme, this.themeTransitionProgress)
    }

    // Draw animated gradient background
    private drawGradient(from: ColorTheme, to: ColorTheme, t: number): void {
        this.gradientGraphics.clear()

        const topColor = this.lerpColor(from.bgTop, to.bgTop, t)
        const bottomColor = this.lerpColor(from.bgBottom, to.bgBottom, t)

        // Create gradient effect with multiple bands
        const bands = 8
        for (let i = 0; i < bands; i++) {
            const y = (i / bands) * this.context.height
            const h = this.context.height / bands + 1
            const blend = i / (bands - 1)
            const color = this.lerpColor(topColor, bottomColor, blend)

            this.gradientGraphics.rect(0, y, this.context.width, h)
            this.gradientGraphics.fill(color)
        }

        // Add subtle vignette effect at edges
        const vignetteAlpha = 0.15
        this.gradientGraphics.rect(0, 0, this.context.width, this.context.height)
        this.gradientGraphics.fill({
            color: 0x000000,
            alpha: 0,
        })

        // Top/bottom darkening
        for (let i = 0; i < 3; i++) {
            const alpha = vignetteAlpha * (1 - i / 3)
            // Top
            this.gradientGraphics.rect(0, i * 20, this.context.width, 20)
            this.gradientGraphics.fill({ color: 0x000000, alpha })
            // Bottom
            this.gradientGraphics.rect(
                0,
                this.context.height - (i + 1) * 20,
                this.context.width,
                20
            )
            this.gradientGraphics.fill({ color: 0x000000, alpha })
        }
    }

    // Draw subtle card suit pattern - Balatro style
    private drawGrid(theme: ColorTheme): void {
        this.gridGraphics.clear()

        const gridSize = 60
        const rows = Math.ceil(this.context.height / gridSize) + 1
        const cols = Math.ceil(this.context.width / gridSize) + 1

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * gridSize + (row % 2) * (gridSize / 2)
                const y = row * gridSize

                // Pulsing alpha based on position and time
                const pulse = Math.sin(this.animTime * 0.3 + x * 0.008 + y * 0.008) * 0.5 + 0.5
                const alpha = 0.04 + pulse * 0.04

                // Draw small diamond shape (like card suits)
                const size = 8
                this.gridGraphics.poly([x, y - size, x + size, y, x, y + size, x - size, y])
                this.gridGraphics.fill({ color: theme.accent1, alpha })
            }
        }
    }

    // Draw hexagon shape
    private drawHexagon(
        g: Graphics,
        x: number,
        y: number,
        size: number,
        color: number,
        alpha: number
    ): void {
        const points: number[] = []
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 2
            points.push(x + size * Math.cos(angle))
            points.push(y + size * Math.sin(angle))
        }
        g.poly(points)
        g.stroke({ color, width: 1, alpha })
    }

    // Draw animated wave layers
    private drawWaves(from: ColorTheme, to: ColorTheme, t: number): void {
        this.waveGraphics.clear()

        for (const layer of this.waveLayers) {
            layer.phase += 0.02

            this.waveGraphics.moveTo(0, this.context.height)

            // Draw wave path
            for (let x = 0; x <= this.context.width; x += 5) {
                const waveY =
                    layer.yOffset +
                    Math.sin(x * layer.frequency + layer.phase) * layer.amplitude +
                    Math.sin(x * layer.frequency * 2 + layer.phase * 1.5) * (layer.amplitude * 0.3)
                this.waveGraphics.lineTo(x, waveY)
            }

            this.waveGraphics.lineTo(this.context.width, this.context.height)
            this.waveGraphics.closePath()

            // Use darker, muted color for waves
            this.waveGraphics.fill({ color: 0x000000, alpha: layer.alpha })
        }
    }

    // Update floating particles
    private updateParticles(
        deltaSeconds: number,
        from: ColorTheme,
        to: ColorTheme,
        t: number
    ): void {
        this.particleGraphics.clear()

        const themeParticles = from.particles.map((c, i) =>
            this.lerpColor(c, to.particles[i] || to.particles[0], t)
        )

        for (const particle of this.particles) {
            // Update position
            particle.x += particle.speedX * deltaSeconds * 60
            particle.y += particle.speedY * deltaSeconds * 60
            particle.phase += deltaSeconds * 2

            // Wrap around screen
            if (particle.y < -20) {
                particle.y = this.context.height + 20
                particle.x = Math.random() * this.context.width
            }
            if (particle.x < -20) particle.x = this.context.width + 20
            if (particle.x > this.context.width + 20) particle.x = -20

            // Pulsing effect
            const pulse = Math.sin(particle.phase) * 0.3 + 0.7
            const alpha = particle.alpha * pulse

            // Pick color from theme
            const colorIndex = Math.floor(particle.phase * 0.1) % themeParticles.length
            particle.color = themeParticles[colorIndex]

            // Draw particle based on type
            this.drawParticle(particle, alpha)
        }
    }

    // Draw individual particle
    private drawParticle(particle: FloatingParticle, alpha: number): void {
        const { x, y, size, color, type } = particle

        switch (type) {
            case 'circle':
                this.particleGraphics.circle(x, y, size)
                this.particleGraphics.fill({ color, alpha })
                break

            case 'hexagon':
                this.drawHexagon(this.particleGraphics, x, y, size, color, alpha)
                this.particleGraphics.poly([
                    x,
                    y - size,
                    x + size * 0.866,
                    y - size * 0.5,
                    x + size * 0.866,
                    y + size * 0.5,
                    x,
                    y + size,
                    x - size * 0.866,
                    y + size * 0.5,
                    x - size * 0.866,
                    y - size * 0.5,
                ])
                this.particleGraphics.fill({ color, alpha })
                break

            case 'diamond':
                this.particleGraphics.poly([x, y - size, x + size, y, x, y + size, x - size, y])
                this.particleGraphics.fill({ color, alpha })
                break
        }
    }

    // Interpolate between two colors
    private lerpColor(from: number, to: number, t: number): number {
        const fromR = (from >> 16) & 0xff
        const fromG = (from >> 8) & 0xff
        const fromB = from & 0xff

        const toR = (to >> 16) & 0xff
        const toG = (to >> 8) & 0xff
        const toB = to & 0xff

        const r = Math.round(fromR + (toR - fromR) * t)
        const g = Math.round(fromG + (toG - fromG) * t)
        const b = Math.round(fromB + (toB - fromB) * t)

        return (r << 16) | (g << 8) | b
    }

    // Interpolate entire theme
    private lerpTheme(from: ColorTheme, to: ColorTheme, t: number): ColorTheme {
        return {
            name: t < 0.5 ? from.name : to.name,
            bgTop: this.lerpColor(from.bgTop, to.bgTop, t),
            bgBottom: this.lerpColor(from.bgBottom, to.bgBottom, t),
            accent1: this.lerpColor(from.accent1, to.accent1, t),
            accent2: this.lerpColor(from.accent2, to.accent2, t),
            particles: from.particles.map((c, i) =>
                this.lerpColor(c, to.particles[i] || to.particles[0], t)
            ),
        }
    }

    // Reset background state
    reset(): void {
        this.animTime = 0
        this.currentThemeIndex = 0
        this.themeTransitionProgress = 0

        // Clear stage theme override
        this.stageThemeOverride = null

        // Reset particles
        for (const particle of this.particles) {
            particle.x = Math.random() * this.context.width
            particle.y = Math.random() * this.context.height
            particle.phase = Math.random() * Math.PI * 2
        }

        // Reset wave phases
        for (const wave of this.waveLayers) {
            wave.phase = Math.random() * Math.PI * 2
        }

        // Reset collapse state
        this.isCollapsing = false
        this.collapseTime = 0
        this.collapseFragments = []
        this.collapseDarkness = 0
        this.collapseGraphics.clear()
    }

    // Start collapse animation for game over
    startCollapse(): void {
        if (this.isCollapsing) return

        this.isCollapsing = true
        this.collapseTime = 0
        this.collapseDarkness = 0
        this.collapseFragments = []

        // Get current theme colors for fragments
        const currentTheme = COLOR_THEMES[this.currentThemeIndex]
        const colors = [
            currentTheme.bgTop,
            currentTheme.bgBottom,
            currentTheme.accent1,
            currentTheme.accent2,
        ]

        // Create fragment grid - pieces that will fall
        const cols = 8
        const rows = 12
        const fragWidth = this.context.width / cols
        const fragHeight = this.context.height / rows
        const centerX = this.context.width / 2
        const centerY = this.context.height / 2

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * fragWidth
                const y = row * fragHeight

                // Calculate distance from center for delay (outer pieces fall first)
                const dx = x + fragWidth / 2 - centerX
                const dy = y + fragHeight / 2 - centerY
                const distFromCenter = Math.sqrt(dx * dx + dy * dy)
                const maxDist = Math.sqrt(centerX * centerX + centerY * centerY)
                const normalizedDist = distFromCenter / maxDist

                // Delay based on distance (outer falls first, center last)
                const delay = (1 - normalizedDist) * 0.8 + Math.random() * 0.1

                // Random velocity (falling down with some horizontal scatter)
                const angleFromCenter = Math.atan2(dy, dx)
                const speed = 100 + Math.random() * 200

                this.collapseFragments.push({
                    x,
                    y,
                    width: fragWidth + 1, // Slight overlap to prevent gaps
                    height: fragHeight + 1,
                    vx: Math.cos(angleFromCenter) * speed * 0.3,
                    vy: speed + Math.random() * 100,
                    rotation: 0,
                    rotationSpeed: (Math.random() - 0.5) * 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    delay,
                    active: false,
                })
            }
        }
    }

    // Update collapse animation
    updateCollapse(delta: number): boolean {
        if (!this.isCollapsing) return false

        const deltaSeconds = delta / 60
        this.collapseTime += deltaSeconds

        // Increase darkness overlay
        this.collapseDarkness = Math.min(1, this.collapseTime * 1.5)

        // Draw collapse effect
        this.collapseGraphics.clear()

        // Dark overlay growing from edges - Balatro dark
        const darkAlpha = this.collapseDarkness * 0.9
        this.collapseGraphics.rect(0, 0, this.context.width, this.context.height)
        this.collapseGraphics.fill({ color: 0x1a1a1a, alpha: darkAlpha })

        let allFallen = true
        const gravity = 800

        // Update and draw fragments
        for (const frag of this.collapseFragments) {
            // Activate fragment after delay
            if (!frag.active && this.collapseTime >= frag.delay) {
                frag.active = true
            }

            if (frag.active) {
                // Apply physics
                frag.vy += gravity * deltaSeconds
                frag.x += frag.vx * deltaSeconds
                frag.y += frag.vy * deltaSeconds
                frag.rotation += frag.rotationSpeed * deltaSeconds

                // Draw if still visible
                if (frag.y < this.context.height + 100) {
                    allFallen = false

                    // Save transform, apply rotation around fragment center
                    this.collapseGraphics.rect(frag.x, frag.y, frag.width, frag.height)
                    this.collapseGraphics.fill({ color: frag.color, alpha: 0.9 })

                    // Add slight highlight on edge
                    this.collapseGraphics.rect(frag.x, frag.y, frag.width, 2)
                    this.collapseGraphics.fill({ color: 0xffffff, alpha: 0.2 })
                }
            } else {
                // Draw fragment at original position before it starts falling
                allFallen = false
                this.collapseGraphics.rect(frag.x, frag.y, frag.width, frag.height)
                this.collapseGraphics.fill({ color: frag.color, alpha: 0.8 })
            }
        }

        // Add shockwave effect at start
        if (this.collapseTime < 0.5) {
            const shockwaveProgress = this.collapseTime / 0.5
            const radius = shockwaveProgress * Math.max(this.context.width, this.context.height)
            const alpha = (1 - shockwaveProgress) * 0.3

            this.collapseGraphics.circle(this.context.width / 2, this.context.height / 2, radius)
            this.collapseGraphics.stroke({ color: 0xffffff, width: 3, alpha })
        }

        // Return true when collapse is complete
        return this.collapseTime > 1.5 && allFallen
    }

    // Check if currently collapsing
    getIsCollapsing(): boolean {
        return this.isCollapsing
    }

    // Get current theme for result screen styling
    getCurrentTheme(): ColorTheme {
        return COLOR_THEMES[this.currentThemeIndex]
    }
}
