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
        // Deep Space - Primary theme
        name: 'deepSpace',
        bgTop: 0x0a0a1a, // Deep space blue-black
        bgBottom: 0x050510, // Near black
        accent1: 0x00ffff, // Cyan
        accent2: 0xff00ff, // Magenta
        particles: [0xffffff, 0x88ccff, 0xffcc88, 0xff88cc], // Stars
    },
    {
        // Nebula Purple
        name: 'nebula',
        bgTop: 0x1a0a2e, // Deep purple
        bgBottom: 0x0a0515, // Dark purple-black
        accent1: 0xcc88ff, // Light purple
        accent2: 0x00ffcc, // Teal
        particles: [0xffffff, 0xcc88ff, 0x88ffcc, 0xff88ff],
    },
    {
        // Cosmic Blue
        name: 'cosmic',
        bgTop: 0x0a1a2e, // Deep blue
        bgBottom: 0x050a15, // Dark blue-black
        accent1: 0x4a9eff, // Electric blue
        accent2: 0xff6b4a, // Orange
        particles: [0xffffff, 0x88ccff, 0xffaa88, 0x88ffff],
    },
    {
        // Void Black
        name: 'void',
        bgTop: 0x0f0f1a, // Dark void
        bgBottom: 0x050508, // Almost black
        accent1: 0xff4488, // Hot pink
        accent2: 0x44ff88, // Neon green
        particles: [0xffffff, 0xff88aa, 0x88ffaa, 0xaaaaff],
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
    worldContainer: Container // All world-space elements (gradient, grid, particles)
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

        // All layers in world-space (inside gameContainer, moves with camera)
        this.gradientGraphics = new Graphics()
        this.context.worldContainer.addChild(this.gradientGraphics)

        this.gridGraphics = new Graphics()
        this.context.worldContainer.addChild(this.gridGraphics)

        this.waveGraphics = new Graphics()
        this.context.worldContainer.addChild(this.waveGraphics)

        this.particleGraphics = new Graphics()
        this.context.worldContainer.addChild(this.particleGraphics)

        this.collapseGraphics = new Graphics()
        this.context.worldContainer.addChild(this.collapseGraphics)
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
        const r = Math.min(
            255,
            Math.round(((color >> 16) & 0xff) + (255 - ((color >> 16) & 0xff)) * factor)
        )
        const g = Math.min(
            255,
            Math.round(((color >> 8) & 0xff) + (255 - ((color >> 8) & 0xff)) * factor)
        )
        const b = Math.min(255, Math.round((color & 0xff) + (255 - (color & 0xff)) * factor))
        return (r << 16) | (g << 8) | b
    }

    // Initialize background
    initialize(background: Graphics): void {
        // Clear any legacy background (from BaseScene)
        background.clear()

        // Create wave layers
        this.createWaveLayers()

        // Initial draw at origin (0, 0)
        this.drawGradient(COLOR_THEMES[0], COLOR_THEMES[0], 0, 0, 0)
        this.drawGrid(COLOR_THEMES[0], 0, 0)
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
    update(
        delta: number,
        activePerksCount: number,
        gameTime: number = 0,
        cameraX: number = 0,
        cameraY: number = 0
    ): void {
        const deltaSeconds = delta / 60
        this.animTime += deltaSeconds

        // Use stage theme override if set
        if (this.stageThemeOverride) {
            const theme = this.stageThemeOverride
            this.drawGradient(theme, theme, 0, cameraX, cameraY)
            this.drawGrid(theme, cameraX, cameraY)
            this.drawWaves(theme, theme, 0, cameraX, cameraY)
            this.drawProceduralParticles(theme, cameraX, cameraY)
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
        const lerpedTheme = this.lerpTheme(currentTheme, nextTheme, this.themeTransitionProgress)
        this.drawGradient(currentTheme, nextTheme, this.themeTransitionProgress, cameraX, cameraY)
        this.drawGrid(lerpedTheme, cameraX, cameraY)
        this.drawWaves(currentTheme, nextTheme, this.themeTransitionProgress, cameraX, cameraY)
        this.drawProceduralParticles(lerpedTheme, cameraX, cameraY)
    }

    // Draw solid background at world coordinates around camera
    private drawGradient(
        from: ColorTheme,
        to: ColorTheme,
        t: number,
        cameraX: number,
        cameraY: number
    ): void {
        this.gradientGraphics.clear()

        // Use blended background color (average of top and bottom)
        const bgColor = this.lerpColor(from.bgBottom, to.bgBottom, t)

        // Calculate visible area in world space
        const margin = 100
        const left = cameraX - this.context.width / 2 - margin
        const top = cameraY - this.context.height / 2 - margin
        const w = this.context.width + margin * 2
        const h = this.context.height + margin * 2

        // Draw single solid color
        this.gradientGraphics.rect(left, top, w, h)
        this.gradientGraphics.fill(bgColor)
    }

    // Draw subtle card suit pattern - Balatro style (tiled for infinite map)
    private drawGrid(theme: ColorTheme, cameraX: number = 0, cameraY: number = 0): void {
        // Grid is now rendered via shader (WobbleWorldFilter.diamondGrid)
        // Keeping this method for potential future use
        this.gridGraphics.clear()
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

    // Waves disabled - keeping method for potential future use
    private drawWaves(
        from: ColorTheme,
        to: ColorTheme,
        t: number,
        cameraX: number,
        cameraY: number
    ): void {
        this.waveGraphics.clear()
        // Waves removed for cleaner look
    }

    /**
     * Simple seeded random number generator for procedural content
     */
    private seededRandom(seed: number): number {
        const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453
        return x - Math.floor(x)
    }

    /**
     * Draw procedural stars in the background
     */
    private drawProceduralParticles(theme: ColorTheme, cameraX: number, cameraY: number): void {
        this.particleGraphics.clear()

        // Calculate visible area with margin
        const margin = 100
        const left = cameraX - this.context.width / 2 - margin
        const top = cameraY - this.context.height / 2 - margin
        const right = left + this.context.width + margin * 2
        const bottom = top + this.context.height + margin * 2

        // Grid-based star generation for infinite scrolling
        const cellSize = 80
        const startCellX = Math.floor(left / cellSize)
        const startCellY = Math.floor(top / cellSize)
        const endCellX = Math.ceil(right / cellSize)
        const endCellY = Math.ceil(bottom / cellSize)

        for (let cellX = startCellX; cellX <= endCellX; cellX++) {
            for (let cellY = startCellY; cellY <= endCellY; cellY++) {
                // Seed based on cell position for consistent stars
                const seed = cellX * 73856093 + cellY * 19349663

                // 60% chance of star in cell
                if (this.seededRandom(seed) > 0.6) continue

                // Star position within cell
                const starX = cellX * cellSize + this.seededRandom(seed + 1) * cellSize
                const starY = cellY * cellSize + this.seededRandom(seed + 2) * cellSize

                // Star properties
                const sizeRand = this.seededRandom(seed + 3)
                const size = sizeRand < 0.7 ? 1 : sizeRand < 0.9 ? 1.5 : 2.5 // Most stars are small
                const colorIndex = Math.floor(this.seededRandom(seed + 4) * theme.particles.length)
                const color = theme.particles[colorIndex]

                // Twinkle effect
                const twinkleSpeed = 2 + this.seededRandom(seed + 5) * 3
                const twinklePhase = this.seededRandom(seed + 6) * Math.PI * 2
                const twinkle = 0.5 + 0.5 * Math.sin(this.animTime * twinkleSpeed + twinklePhase)
                const alpha = 0.3 + twinkle * 0.7

                // Draw star
                this.particleGraphics.circle(starX, starY, size)
                this.particleGraphics.fill({ color, alpha })

                // Add glow for larger stars
                if (size > 1.5) {
                    this.particleGraphics.circle(starX, starY, size * 2.5)
                    this.particleGraphics.fill({ color, alpha: alpha * 0.2 })
                }
            }
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
