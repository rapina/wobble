import { Application, Container, Ticker, Graphics, Text, TextStyle } from 'pixi.js'
import { pixiColors } from '@/utils/pixiHelpers'
import { Wobble, WobbleShape, WobbleExpression } from '../Wobble'

export type PlayResult = 'success' | 'failure' | 'playing'
export type ScenePhase = 'narration' | 'idle' | 'playing'

export interface NarrationData {
    blobShape: WobbleShape
    blobExpression: WobbleExpression
    text: string
}

export interface AdventureSceneOptions {
    onPlayComplete?: (result: PlayResult) => void
    onNarrationComplete?: () => void
    narrations?: NarrationData[]
    studiedFormulas?: Set<string>
}

let adventureSceneIdCounter = 0

/**
 * Base class for adventure/puzzle mode scenes.
 * Unlike simulation scenes, these:
 * - Show a preview state based on input values
 * - Play animation only when play() is called
 * - Return success/failure result after animation
 */
export abstract class AdventureScene {
    protected app: Application
    public container: Container
    protected ticker: Ticker
    protected width: number
    protected height: number
    protected background: Graphics
    protected gridOverlay: Graphics
    protected variables: Record<string, number> = {}
    protected targetValues: Record<string, number> = {}

    // Grid animation state
    private gridOffsetX = 0
    private gridOffsetY = 0
    private gridSpeed = 0.15
    private gridSize = 40
    private gridColor = 0x2d3748
    private gridAlpha = 0.12

    private boundAnimate: (ticker: Ticker) => void
    protected sceneId: string
    private _destroyed = false
    private baseDrawComplete = false

    // Phase state
    protected phase: ScenePhase = 'idle'
    protected isPlaying = false
    protected isPaused = false
    protected playProgress = 0
    protected onPlayComplete?: (result: PlayResult) => void

    // Narration state
    protected narrations: NarrationData[] = []
    protected narrationIndex = 0
    protected onNarrationComplete?: () => void
    private narratorContainer!: Container
    private narrator!: Wobble | null
    private speechBubble!: Graphics
    private speechText!: Text
    private tapHint!: Text
    private tapHintBadge!: Graphics
    private narrationPhase = 0

    constructor(app: Application, options?: AdventureSceneOptions) {
        const counter = ++adventureSceneIdCounter
        const instanceId = Math.random().toString(36).substring(2, 6)
        this.sceneId = `adv-${counter}-${instanceId}`

        this.app = app
        this.container = new Container()
        this.ticker = app.ticker
        this.width = app.screen.width
        this.height = app.screen.height
        this.onPlayComplete = options?.onPlayComplete
        this.onNarrationComplete = options?.onNarrationComplete
        this.narrations = options?.narrations || []

        // Set initial phase based on narrations
        if (this.narrations.length > 0) {
            this.phase = 'narration'
            this.narrationIndex = 0
        }

        // Create background (defer drawing to first animate frame)
        this.background = new Graphics()
        this.container.addChild(this.background)

        // Create grid overlay (defer drawing to first animate frame)
        this.gridOverlay = new Graphics()
        this.container.addChild(this.gridOverlay)

        // Bind animate function
        this.boundAnimate = (ticker: Ticker) => {
            if (this._destroyed) {
                try {
                    this.ticker.remove(this.boundAnimate)
                } catch {
                    // Ticker may already be destroyed
                }
                return
            }

            // Initial drawing on first frame (after Graphics context is ready)
            if (!this.baseDrawComplete) {
                this.drawBackground()
                this.drawGrid()
                this.onInitialDraw() // Hook for subclasses
                this.setupNarrator()
                this.baseDrawComplete = true
            }

            this.updateGrid(ticker)

            // Phase-based animation (skip if paused)
            if (this.isPaused) {
                // Only animate idle effects when paused
                return
            }

            if (this.phase === 'narration') {
                this.animateNarration(ticker)
            } else if (this.isPlaying) {
                this.animatePlay(ticker)
            } else {
                this.animateIdle(ticker)
            }
        }

        // Setup scene
        this.setup()

        // Start animation loop
        this.ticker.add(this.boundAnimate)

        // Force start ticker if not already started
        if (!this.ticker.started) {
            this.ticker.start()
        }
    }

    protected drawBackground(): void {
        this.background.clear()
        this.background.rect(0, 0, this.width, this.height)
        this.background.fill(pixiColors.backgroundDark)
    }

    private updateGrid(ticker: Ticker): void {
        if (!this.baseDrawComplete) return

        const delta = ticker.deltaMS / 16.67
        const speed = this.gridSpeed * delta

        this.gridOffsetX += speed
        this.gridOffsetY += speed

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
            g.moveTo(x, 0)
            g.lineTo(x, this.height)
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha })
        }

        // Draw horizontal lines
        for (let y = startY; y <= this.height + size; y += size) {
            g.moveTo(0, y)
            g.lineTo(this.width, y)
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha })
        }
    }

    /**
     * Setup narrator UI - Cartoon Network style (called on first frame)
     */
    private setupNarrator(): void {
        // Create narrator container (on top of everything)
        this.narratorContainer = new Container()
        this.narratorContainer.visible = this.phase === 'narration'
        this.container.addChild(this.narratorContainer)

        // Dramatic dark overlay with gradient
        const overlay = new Graphics()
        overlay.rect(0, 0, this.width, this.height)
        overlay.fill({ color: 0x0a0a12, alpha: 0.92 })
        this.narratorContainer.addChild(overlay)

        // Speech bubble (comic style with thick border)
        this.speechBubble = new Graphics()
        this.narratorContainer.addChild(this.speechBubble)

        // Speech text - bold comic style
        const textStyle = new TextStyle({
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 20,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: this.width - 60,
            align: 'center',
            lineHeight: 30,
            fontWeight: 'bold',
        })
        this.speechText = new Text({ text: '', style: textStyle })
        this.narratorContainer.addChild(this.speechText)

        // Tap hint badge background (Balatro style)
        this.tapHintBadge = new Graphics()
        this.narratorContainer.addChild(this.tapHintBadge)

        // Tap hint text - bold for Balatro style
        const hintStyle = new TextStyle({
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: 12,
            fill: 0xffffff,
            fontWeight: 'bold',
        })
        this.tapHint = new Text({ text: 'Tap to continue', style: hintStyle })
        this.narratorContainer.addChild(this.tapHint)

        // Initialize with first narration if exists
        if (this.narrations.length > 0) {
            this.updateNarrator()
        }

        // Make container interactive for tap
        this.narratorContainer.eventMode = 'static'
        this.narratorContainer.cursor = 'pointer'
        this.narratorContainer.on('pointerdown', () => this.advanceNarration())
    }

    /**
     * Update narrator - Cartoon Network episode card style
     */
    private updateNarrator(): void {
        if (!this.narratorContainer || this.narrationIndex >= this.narrations.length) return

        const narration = this.narrations[this.narrationIndex]
        const isShadow = narration.blobShape === 'shadow'

        // Remove old narrator wobble
        if (this.narrator) {
            this.narratorContainer.removeChild(this.narrator)
            this.narrator.destroy()
            this.narrator = null
        }

        // Character size varies - bigger for dramatic moments
        const characterSize = isShadow ? 120 : 100
        const characterY = this.height * 0.35

        // Create narrator wobble - larger and more prominent
        this.narrator = new Wobble({
            size: characterSize,
            shape: narration.blobShape,
            expression: narration.blobExpression,
            color: this.getShapeColor(narration.blobShape),
            showShadow: true,
            shadowOffsetY: 12,
        })
        this.narrator.position.set(this.width / 2, characterY)
        this.narratorContainer.addChild(this.narrator)

        // Speech bubble - comic book style
        this.speechBubble.clear()

        const bubbleY = characterY + characterSize / 2 + 30
        const bubbleWidth = Math.min(this.width - 32, 360)
        const bubbleX = (this.width - bubbleWidth) / 2
        const bubblePadding = 16

        // Update speech text
        this.speechText.text = narration.text
        this.speechText.anchor.set(0.5, 0)
        const textHeight = this.speechText.height + bubblePadding * 2

        // Bubble color based on character
        const bubbleColor = isShadow ? 0x2a2a3a : 0x1a1a2e
        const borderColor = isShadow ? 0x8b0000 : 0xff6b9d

        // Draw Balatro-style speech bubble with 3D shadow
        // Shadow layer (3D depth effect)
        this.speechBubble.roundRect(bubbleX + 2, bubbleY + 4, bubbleWidth, textHeight, 18)
        this.speechBubble.fill({ color: 0x0a0a0a, alpha: 0.7 })

        // Main bubble body
        this.speechBubble.roundRect(bubbleX, bubbleY, bubbleWidth, textHeight, 18)
        this.speechBubble.fill({ color: bubbleColor })

        // Thick outer border (Balatro-style)
        this.speechBubble.roundRect(bubbleX, bubbleY, bubbleWidth, textHeight, 18)
        this.speechBubble.stroke({ color: borderColor, width: 4 })

        // Inner border glow
        this.speechBubble.roundRect(bubbleX + 4, bubbleY + 4, bubbleWidth - 8, textHeight - 8, 14)
        this.speechBubble.stroke({ color: borderColor, width: 1, alpha: 0.3 })

        // Speech tail/arrow with shadow
        const tailX = this.width / 2
        // Tail shadow
        this.speechBubble.moveTo(tailX - 12 + 2, bubbleY + 4)
        this.speechBubble.lineTo(tailX + 2, bubbleY - 12)
        this.speechBubble.lineTo(tailX + 12 + 2, bubbleY + 4)
        this.speechBubble.closePath()
        this.speechBubble.fill({ color: 0x0a0a0a, alpha: 0.5 })

        // Tail border
        this.speechBubble.moveTo(tailX - 15, bubbleY)
        this.speechBubble.lineTo(tailX, bubbleY - 18)
        this.speechBubble.lineTo(tailX + 15, bubbleY)
        this.speechBubble.closePath()
        this.speechBubble.fill({ color: borderColor })

        // Tail fill
        this.speechBubble.moveTo(tailX - 10, bubbleY)
        this.speechBubble.lineTo(tailX, bubbleY - 12)
        this.speechBubble.lineTo(tailX + 10, bubbleY)
        this.speechBubble.closePath()
        this.speechBubble.fill({ color: bubbleColor })

        // Position text
        this.speechText.position.set(this.width / 2, bubbleY + bubblePadding)

        // Tap hint badge at bottom (Balatro style)
        const isLastNarration = this.narrationIndex >= this.narrations.length - 1
        this.tapHint.text = isLastNarration ? '▶ TAP TO START' : 'TAP TO CONTINUE ▶'

        // Calculate badge dimensions
        const hintWidth = this.tapHint.width + 24
        const hintHeight = 32
        const hintX = (this.width - hintWidth) / 2
        const hintY = this.height - 72

        // Draw tap hint badge with 3D shadow
        this.tapHintBadge.clear()
        // Shadow
        this.tapHintBadge.roundRect(hintX + 2, hintY + 3, hintWidth, hintHeight, 10)
        this.tapHintBadge.fill({ color: 0x0a0a0a, alpha: 0.6 })
        // Badge body
        this.tapHintBadge.roundRect(hintX, hintY, hintWidth, hintHeight, 10)
        this.tapHintBadge.fill(isLastNarration ? 0x2980b9 : 0x374244)
        // Border
        this.tapHintBadge.roundRect(hintX, hintY, hintWidth, hintHeight, 10)
        this.tapHintBadge.stroke({ color: 0x1a1a1a, width: 3 })

        this.tapHint.anchor.set(0.5)
        this.tapHint.position.set(this.width / 2, hintY + hintHeight / 2)
    }

    private getShapeColor(shape: WobbleShape): number {
        const colors: Record<WobbleShape, number> = {
            circle: 0xf5b041,
            square: 0x5dade2,
            triangle: 0xe74c3c,
            star: 0xffd700,
            diamond: 0xbb8fce,
            pentagon: 0x82e0aa,
            shadow: 0x1a1a1a,
            einstein: 0xf0e6d3,
        }
        return colors[shape] || 0xf5b041
    }

    /**
     * Animate narration (wobble breathing, hint pulsing)
     */
    private animateNarration(ticker: Ticker): void {
        const delta = ticker.deltaMS / 1000
        this.narrationPhase += delta

        // Animate narrator wobble
        if (this.narrator) {
            this.narrator.updateOptions({
                wobblePhase: this.narrationPhase * 2,
                scaleX: 1 + Math.sin(this.narrationPhase * 3) * 0.02,
                scaleY: 1 - Math.sin(this.narrationPhase * 3) * 0.02,
            })
        }

        // Animate tap hint (pulsing alpha)
        if (this.tapHint) {
            this.tapHint.alpha = 0.5 + Math.sin(this.narrationPhase * 4) * 0.3
        }
    }

    /**
     * Advance to next narration or complete
     */
    public advanceNarration(): void {
        if (this.phase !== 'narration') return

        this.narrationIndex++

        if (this.narrationIndex >= this.narrations.length) {
            // Narration complete
            this.phase = 'idle'
            this.narratorContainer.visible = false
            this.onNarrationComplete?.()
        } else {
            // Show next narration
            this.updateNarrator()
        }
    }

    /**
     * Initialize scene elements (called once)
     */
    protected abstract setup(): void

    /**
     * Idle animation (when not playing)
     * Used for subtle movements, breathing effects, etc.
     */
    protected abstract animateIdle(ticker: Ticker): void

    /**
     * Play animation (when play() is called)
     * Should update playProgress and call completePlay() when done
     */
    protected abstract animatePlay(ticker: Ticker): void

    /**
     * Update preview based on current input values
     * Called when variables change (before play)
     */
    protected abstract updatePreview(): void

    /**
     * Check if current values meet the target
     */
    protected abstract checkSuccess(): boolean

    /**
     * Update scene with new variable values
     */
    public update(variables: Record<string, number>): void {
        this.variables = { ...variables }
        if (!this.isPlaying) {
            this.updatePreview()
        }
    }

    /**
     * Set target values for success check
     */
    public setTargets(targets: Record<string, number>): void {
        this.targetValues = { ...targets }
    }

    /**
     * Start playing the animation
     */
    public play(): void {
        if (this.isPlaying) return

        this.isPlaying = true
        this.playProgress = 0
        this.onPlayStart()
    }

    /**
     * Called when play starts (override for custom behavior)
     */
    protected onPlayStart(): void {
        // Override in subclasses
    }

    /**
     * Called by subclass when animation is complete
     */
    protected completePlay(): void {
        this.isPlaying = false
        const result = this.checkSuccess() ? 'success' : 'failure'
        this.onPlayComplete?.(result)
    }

    /**
     * Reset scene to initial state
     */
    public reset(): void {
        this.isPlaying = false
        this.isPaused = false
        this.playProgress = 0
        this.onReset()
        this.updatePreview()
    }

    /**
     * Pause the scene
     */
    public pause(): void {
        this.isPaused = true
    }

    /**
     * Resume the scene
     */
    public resume(): void {
        this.isPaused = false
    }

    /**
     * Check if scene is paused
     */
    public get paused(): boolean {
        return this.isPaused
    }

    /**
     * Called on reset (override in subclasses)
     */
    protected onReset(): void {
        // Override in subclasses
    }

    /**
     * Called once on first frame for initial drawing (override in subclasses)
     */
    protected onInitialDraw(): void {
        // Override in subclasses
    }

    /**
     * Handle resize
     */
    public resize(): void {
        this.width = this.app.screen.width
        this.height = this.app.screen.height
        if (this.baseDrawComplete) {
            this.drawBackground()
            this.drawGrid()
        }
        this.onResize()
    }

    /**
     * Called on resize (override in subclasses)
     */
    protected onResize(): void {
        // Override in subclasses
    }

    /**
     * Cleanup scene
     */
    public destroy(): void {
        this._destroyed = true

        // Remove ticker callback first
        try {
            if (this.ticker && this.boundAnimate) {
                this.ticker.remove(this.boundAnimate)
            }
        } catch {
            // Ticker may already be destroyed
        }

        // Hide container immediately to prevent render errors
        try {
            this.container.visible = false
            this.container.renderable = false
        } catch {
            // Container may already be destroyed
        }

        // Call subclass cleanup first (before destroying children)
        this.onDestroy()

        // Clear narrator references
        if (this.narrator) {
            try {
                this.narrator.destroy()
            } catch {
                // Already destroyed
            }
            this.narrator = null
        }

        // Remove container from parent
        try {
            if (this.container.parent) {
                this.container.parent.removeChild(this.container)
            }
        } catch {
            // Parent may already be destroyed
        }

        // Use requestAnimationFrame to ensure we're not in a render cycle
        requestAnimationFrame(() => {
            try {
                this.container.destroy({ children: true })
            } catch {
                // Container may already be destroyed
            }
        })
    }

    /**
     * Called on destroy (override in subclasses for cleanup)
     */
    protected onDestroy(): void {
        // Override in subclasses
    }

    protected get centerX(): number {
        return this.width / 2
    }

    protected get centerY(): number {
        return this.height / 2
    }
}
