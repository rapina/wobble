import { Application, Container, Ticker, Graphics, Text, TextStyle } from 'pixi.js'
import { pixiColors } from '../../../utils/pixiHelpers'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../Wobble'
import { t } from '@/utils/localization'

let sceneIdCounter = 0

// Grid animation directions
type GridDirection = 'diagonal' | 'up' | 'down' | 'left' | 'right'

export abstract class BaseScene {
    protected app: Application
    public container: Container
    protected ticker: Ticker
    protected width: number
    protected height: number
    protected background: Graphics
    protected gridOverlay: Graphics
    protected variables: Record<string, number> = {}

    // Grid animation state
    private gridOffsetX = 0
    private gridOffsetY = 0
    private gridSpeed = 0.25
    private gridDirection: GridDirection = 'diagonal'
    private gridSize = 40
    private gridColor = 0x2d3748
    private gridAlpha = 0.15

    private boundAnimate: (ticker: Ticker) => void
    protected sceneId: string
    private _destroyed = false

    // New wobble discovery animation
    private discoveryOverlay: Container | null = null
    private discoveryQueue: WobbleShape[] = []
    private isShowingDiscovery = false
    private discoveryPhase = 0
    private discoveryWobble: Wobble | null = null
    private onDiscoveryComplete: (() => void) | null = null

    constructor(app: Application) {
        const counter = ++sceneIdCounter
        const instanceId = Math.random().toString(36).substring(2, 6)
        this.sceneId = `${counter}-${instanceId}`

        this.app = app
        this.container = new Container()
        this.ticker = app.ticker
        this.width = app.screen.width
        this.height = app.screen.height

        // Create background
        this.background = new Graphics()
        this.drawBackground()
        this.container.addChild(this.background)

        // Create grid overlay
        this.gridOverlay = new Graphics()
        this.container.addChild(this.gridOverlay)

        // Bind animate function with destroy check
        this.boundAnimate = (ticker: Ticker) => {
            if (this._destroyed) {
                // Stale callback from destroyed scene - remove it safely
                try {
                    this.ticker.remove(this.boundAnimate)
                } catch {
                    // Ticker may already be destroyed
                }
                return
            }
            this.updateGrid(ticker)
            this.animate(ticker)
            this.updateDiscoveryAnimation(ticker)
        }

        // Setup scene
        this.setup()

        // Start animation loop
        this.ticker.add(this.boundAnimate)
    }

    protected drawBackground(): void {
        this.background.clear()
        this.background.rect(0, 0, this.width, this.height)
        this.background.fill(pixiColors.backgroundDark)
    }

    private updateGrid(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const speed = this.gridSpeed * delta

        // Update offset based on direction
        switch (this.gridDirection) {
            case 'diagonal':
                this.gridOffsetX += speed
                this.gridOffsetY += speed
                break
            case 'up':
                this.gridOffsetY -= speed
                break
            case 'down':
                this.gridOffsetY += speed
                break
            case 'left':
                this.gridOffsetX -= speed
                break
            case 'right':
                this.gridOffsetX += speed
                break
        }

        // Wrap offsets to prevent overflow
        this.gridOffsetX = this.gridOffsetX % this.gridSize
        this.gridOffsetY = this.gridOffsetY % this.gridSize

        this.drawGrid()
    }

    private drawGrid(): void {
        const g = this.gridOverlay
        g.clear()

        const size = this.gridSize
        const startX = -size + (this.gridOffsetX % size)
        const startY = -size + (this.gridOffsetY % size)

        // Draw vertical lines
        for (let x = startX; x <= this.width + size; x += size) {
            // Calculate fade based on distance from edges
            const distFromEdge = Math.min(Math.max(x, 0), Math.max(this.width - x, 0))
            const edgeFade = Math.min(distFromEdge / 40, 1)

            g.moveTo(x, 0)
            g.lineTo(x, this.height)
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha + edgeFade * 0.08 })
        }

        // Draw horizontal lines
        for (let y = startY; y <= this.height + size; y += size) {
            const distFromEdge = Math.min(Math.max(y, 0), Math.max(this.height - y, 0))
            const edgeFade = Math.min(distFromEdge / 40, 1)

            g.moveTo(0, y)
            g.lineTo(this.width, y)
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha + edgeFade * 0.08 })
        }

        // Draw corner intersection dots
        for (let x = startX; x <= this.width + size; x += size) {
            for (let y = startY; y <= this.height + size; y += size) {
                // Edge fade
                const distFromEdgeX = Math.min(Math.max(x, 0), Math.max(this.width - x, 0))
                const distFromEdgeY = Math.min(Math.max(y, 0), Math.max(this.height - y, 0))
                const edgeFade = Math.min(Math.min(distFromEdgeX, distFromEdgeY) / 50, 1)

                const alpha = 0.2 * edgeFade

                if (alpha > 0.03 && x > 0 && x < this.width && y > 0 && y < this.height) {
                    g.circle(x, y, 1.5)
                    g.fill({ color: 0x4a5568, alpha })
                }
            }
        }

        // Corner shadows for depth
        this.drawCornerShadows(g)
    }

    private drawCornerShadows(g: Graphics): void {
        // Draw subtle corner gradients using filled triangles
        const cornerSize = 80
        const alpha = 0.15

        // Top-left corner
        g.moveTo(0, 0)
        g.lineTo(cornerSize, 0)
        g.lineTo(0, cornerSize)
        g.closePath()
        g.fill({ color: 0x000000, alpha: alpha * 0.5 })

        // Top-right corner
        g.moveTo(this.width, 0)
        g.lineTo(this.width - cornerSize, 0)
        g.lineTo(this.width, cornerSize)
        g.closePath()
        g.fill({ color: 0x000000, alpha: alpha * 0.5 })

        // Bottom-left corner
        g.moveTo(0, this.height)
        g.lineTo(cornerSize, this.height)
        g.lineTo(0, this.height - cornerSize)
        g.closePath()
        g.fill({ color: 0x000000, alpha: alpha * 0.5 })

        // Bottom-right corner
        g.moveTo(this.width, this.height)
        g.lineTo(this.width - cornerSize, this.height)
        g.lineTo(this.width, this.height - cornerSize)
        g.closePath()
        g.fill({ color: 0x000000, alpha: alpha * 0.5 })
    }

    /**
     * Initialize scene elements (called once)
     */
    protected abstract setup(): void

    /**
     * Animation loop (called every frame)
     */
    protected abstract animate(ticker: Ticker): void

    /**
     * Update scene with new variable values
     */
    public update(variables: Record<string, number>): void {
        this.variables = { ...variables }
        this.onVariablesChange()
    }

    /**
     * Called when variables change (override in subclasses)
     */
    protected onVariablesChange(): void {
        // Override in subclasses
    }

    /**
     * Handle resize
     */
    public resize(): void {
        this.width = this.app.screen.width
        this.height = this.app.screen.height
        this.drawBackground()
        this.drawGrid()
        this.onResize()
    }

    /**
     * Called on resize (override in subclasses)
     */
    protected onResize(): void {
        // Override in subclasses
    }

    /**
     * Show new wobble discovery animation
     */
    public showNewWobbleDiscovery(
        shapes: WobbleShape[],
        lang: string,
        onComplete?: () => void
    ): void {
        if (shapes.length === 0) return

        this.discoveryQueue = [...shapes]
        this.onDiscoveryComplete = onComplete || null
        this.showNextDiscovery(lang)
    }

    private showNextDiscovery(lang: string): void {
        if (this.discoveryQueue.length === 0) {
            this.hideDiscovery()
            if (this.onDiscoveryComplete) {
                this.onDiscoveryComplete()
                this.onDiscoveryComplete = null
            }
            return
        }

        const shape = this.discoveryQueue.shift()!
        const character = WOBBLE_CHARACTERS[shape]
        const wobbleSize = Math.min(this.width, this.height) * 0.2

        // Create overlay container
        if (this.discoveryOverlay) {
            this.container.removeChild(this.discoveryOverlay)
            this.discoveryOverlay.destroy({ children: true })
        }

        this.discoveryOverlay = new Container()
        this.discoveryOverlay.eventMode = 'static'
        this.discoveryOverlay.cursor = 'pointer'

        // Store lang for tap handler
        const storedLang = lang
        this.discoveryOverlay.on('pointertap', () => {
            if (this.discoveryQueue.length > 0) {
                this.showNextDiscovery(storedLang)
            } else {
                this.hideDiscovery()
                if (this.onDiscoveryComplete) {
                    this.onDiscoveryComplete()
                    this.onDiscoveryComplete = null
                }
            }
        })

        // Semi-transparent background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: 0x000000, alpha: 0.7 })
        this.discoveryOverlay.addChild(bg)

        // Create wobble
        this.discoveryWobble = new Wobble({
            size: wobbleSize,
            color: character.color,
            shape: shape,
            expression: 'excited',
            showShadow: true,
        })
        this.discoveryWobble.position.set(this.centerX, this.centerY - 20)
        this.discoveryWobble.scale.set(0)
        this.discoveryOverlay.addChild(this.discoveryWobble)

        // Title text
        const titleStyle = new TextStyle({
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 14,
            fill: 0xffffff,
            align: 'center',
        })
        const discoveryTitle = {
            ko: '새로운 주민 발견!',
            en: 'New Resident Found!',
            ja: '新しい住民を発見！',
        }
        const titleText = new Text({
            text: t(discoveryTitle, lang),
            style: titleStyle,
        })
        titleText.anchor.set(0.5)
        titleText.position.set(this.centerX, this.centerY - wobbleSize - 50)
        titleText.alpha = 0
        this.discoveryOverlay.addChild(titleText)

        // Name text
        const nameStyle = new TextStyle({
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 28,
            fontWeight: 'bold',
            fill: 0xc9a227,
            align: 'center',
        })
        const nameText = new Text({
            text: t(character.name, lang),
            style: nameStyle,
        })
        nameText.anchor.set(0.5)
        nameText.position.set(this.centerX, this.centerY + wobbleSize + 30)
        nameText.alpha = 0
        this.discoveryOverlay.addChild(nameText)

        // Personality text
        const personalityStyle = new TextStyle({
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 12,
            fill: 0xaaaaaa,
            align: 'center',
            wordWrap: true,
            wordWrapWidth: this.width * 0.7,
        })
        const personalityText = new Text({
            text: t(character.personality, lang),
            style: personalityStyle,
        })
        personalityText.anchor.set(0.5)
        personalityText.position.set(this.centerX, this.centerY + wobbleSize + 60)
        personalityText.alpha = 0
        this.discoveryOverlay.addChild(personalityText)

        // Tap hint
        const hintStyle = new TextStyle({
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: 11,
            fill: 0x666666,
            align: 'center',
        })
        const remaining = this.discoveryQueue.length
        const tapNextHint = {
            ko: `탭하여 다음 (${remaining}명 남음)`,
            en: `Tap for next (${remaining} more)`,
            ja: `タップで次へ (残り${remaining}人)`,
        }
        const tapContinueHint = {
            ko: '탭하여 계속',
            en: 'Tap to continue',
            ja: 'タップで続行',
        }
        const hintText = new Text({
            text: remaining > 0 ? t(tapNextHint, lang) : t(tapContinueHint, lang),
            style: hintStyle,
        })
        hintText.anchor.set(0.5)
        hintText.position.set(this.centerX, this.height - 40)
        hintText.alpha = 0
        this.discoveryOverlay.addChild(hintText)

        // Add sparkle particles
        this.createSparkles()

        this.container.addChild(this.discoveryOverlay)
        this.isShowingDiscovery = true
        this.discoveryPhase = 0
    }

    private createSparkles(): void {
        if (!this.discoveryOverlay) return

        for (let i = 0; i < 12; i++) {
            const sparkle = new Graphics()
            const size = 3 + Math.random() * 4
            sparkle.star(0, 0, 4, size, size * 0.4)
            sparkle.fill({ color: 0xc9a227, alpha: 0.8 })

            const angle = (i / 12) * Math.PI * 2
            const radius = 80 + Math.random() * 40
            sparkle.position.set(
                this.centerX + Math.cos(angle) * radius,
                this.centerY - 20 + Math.sin(angle) * radius
            )
            sparkle.alpha = 0
            sparkle.scale.set(0)

            // Store animation data
            ;(sparkle as any)._sparkleData = {
                angle,
                radius,
                delay: i * 0.05,
                speed: 0.5 + Math.random() * 0.5,
            }

            this.discoveryOverlay.addChild(sparkle)
        }
    }

    private updateDiscoveryAnimation(ticker: Ticker): void {
        if (!this.isShowingDiscovery || !this.discoveryOverlay) return

        const delta = ticker.deltaMS / 1000
        this.discoveryPhase += delta

        // Animate wobble entrance
        if (this.discoveryWobble) {
            const targetScale = 1
            const progress = Math.min(this.discoveryPhase / 0.4, 1)
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const bounce = progress < 1 ? easeOut * (1 + Math.sin(progress * Math.PI) * 0.2) : 1
            this.discoveryWobble.scale.set(bounce)

            // Wobble animation
            this.discoveryWobble.updateOptions({
                wobblePhase: this.discoveryPhase * 3,
                scaleX: 1 + Math.sin(this.discoveryPhase * 4) * 0.05,
                scaleY: 1 - Math.sin(this.discoveryPhase * 4) * 0.05,
            })

            // Cycle expressions
            const expressionIndex = Math.floor(this.discoveryPhase / 0.8) % 3
            const expressions: ('excited' | 'happy' | 'surprised')[] = [
                'excited',
                'happy',
                'surprised',
            ]
            this.discoveryWobble.updateOptions({ expression: expressions[expressionIndex] })
        }

        // Animate texts
        const children = this.discoveryOverlay.children
        for (const child of children) {
            if (child instanceof Text) {
                const targetAlpha = 1
                const textDelay = 0.2
                const textProgress = Math.max(
                    0,
                    Math.min((this.discoveryPhase - textDelay) / 0.3, 1)
                )
                child.alpha = textProgress
            }
        }

        // Animate sparkles
        for (const child of children) {
            const data = (child as any)._sparkleData
            if (data) {
                const sparkleProgress = Math.max(0, this.discoveryPhase - data.delay)
                const alpha =
                    Math.min(sparkleProgress / 0.2, 1) *
                    (0.5 + Math.sin(sparkleProgress * data.speed * 5) * 0.5)
                child.alpha = alpha * 0.8
                child.scale.set(0.5 + Math.sin(sparkleProgress * data.speed * 3) * 0.3)
                child.rotation = sparkleProgress * data.speed * 2

                // Float outward slightly
                const floatRadius = data.radius + sparkleProgress * 10
                ;(child as Graphics).position.set(
                    this.centerX + Math.cos(data.angle + sparkleProgress * 0.5) * floatRadius,
                    this.centerY - 20 + Math.sin(data.angle + sparkleProgress * 0.5) * floatRadius
                )
            }
        }
    }

    private hideDiscovery(): void {
        this.isShowingDiscovery = false
        if (this.discoveryOverlay) {
            this.container.removeChild(this.discoveryOverlay)
            this.discoveryOverlay.destroy({ children: true })
            this.discoveryOverlay = null
        }
        this.discoveryWobble = null
        this.discoveryPhase = 0
    }

    /**
     * Cleanup scene
     */
    public destroy(): void {
        this.hideDiscovery()
        this._destroyed = true
        try {
            if (this.ticker && this.boundAnimate) {
                this.ticker.remove(this.boundAnimate)
            }
        } catch {
            // Ticker may already be destroyed
        }
        try {
            this.container.destroy({ children: true })
        } catch {
            // Container may already be destroyed
        }
    }

    /**
     * Get center X of the scene
     */
    protected get centerX(): number {
        return this.width / 2
    }

    /**
     * Get center Y of the scene
     */
    protected get centerY(): number {
        return this.height / 2
    }
}
