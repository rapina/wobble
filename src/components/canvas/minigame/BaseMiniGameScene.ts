/**
 * BaseMiniGameScene.ts - Base class for all minigame scenes
 */

import { Application, Container, Ticker, Graphics } from 'pixi.js'
import { pixiColors } from '@/utils/pixiHelpers'
import { ScoreSystem, DifficultyManager, LifeSystem } from './systems'
import { DifficultyConfig, DifficultyPhase, HitResult, MiniGameState } from './MiniGameTypes'
import { MiniGameHUD } from './MiniGameHUD'
import { MiniGameResultScreen, MiniGameResultData } from './MiniGameResultScreen'

export type MiniGamePhase = 'ready' | 'playing' | 'paused' | 'gameover' | 'result'

export interface MiniGameCallbacks {
    onGameOver?: (state: MiniGameState) => void
    onRetry?: () => void
    onExit?: () => void
    onContinueWithAd?: (onSuccess: () => void, onFail?: () => void) => void
}

let sceneIdCounter = 0

export abstract class BaseMiniGameScene {
    protected app: Application
    public container: Container
    protected ticker: Ticker
    protected width: number
    protected height: number
    protected background: Graphics
    protected gridOverlay: Graphics

    // Grid animation state
    private gridOffsetX = 0
    private gridOffsetY = 0
    private gridSpeed = 0.25
    private gridSize = 40
    private gridColor = 0x2d3748
    private gridAlpha = 0.15

    private boundAnimate: (ticker: Ticker) => void
    protected sceneId: string
    private _destroyed = false

    // Game systems
    protected scoreSystem: ScoreSystem
    protected difficultyManager: DifficultyManager
    protected lifeSystem: LifeSystem
    protected hud!: MiniGameHUD
    protected resultScreen!: MiniGameResultScreen

    // Game state
    protected gamePhase: MiniGamePhase = 'ready'
    protected gameTime = 0
    protected callbacks: MiniGameCallbacks = {}

    // UI containers
    protected gameContainer!: Container
    protected uiContainer!: Container

    constructor(app: Application, callbacks?: MiniGameCallbacks) {
        const counter = ++sceneIdCounter
        const instanceId = Math.random().toString(36).substring(2, 6)
        this.sceneId = `minigame-${counter}-${instanceId}`

        this.app = app
        this.container = new Container()
        this.ticker = app.ticker
        this.width = app.screen.width
        this.height = app.screen.height
        this.callbacks = callbacks || {}

        // Initialize systems
        this.scoreSystem = new ScoreSystem()
        this.difficultyManager = new DifficultyManager()
        this.lifeSystem = new LifeSystem()

        // Set up system callbacks
        this.setupSystemCallbacks()

        // Create background
        this.background = new Graphics()
        this.drawBackground()
        this.container.addChild(this.background)

        // Create grid overlay
        this.gridOverlay = new Graphics()
        this.container.addChild(this.gridOverlay)

        // Create game container (for game elements)
        this.gameContainer = new Container()
        this.container.addChild(this.gameContainer)

        // Create UI container (for HUD, always on top)
        this.uiContainer = new Container()
        this.container.addChild(this.uiContainer)

        // Create HUD
        this.hud = new MiniGameHUD({
            container: this.uiContainer,
            width: this.width,
            height: this.height,
        })

        // Create result screen
        this.resultScreen = new MiniGameResultScreen({
            container: new Container(),
            width: this.width,
            height: this.height,
        })
        this.resultScreen.onRetry = () => this.handleRetry()
        this.resultScreen.onExit = () => this.callbacks.onExit?.()
        this.resultScreen.onContinueWithAd = this.callbacks.onContinueWithAd
            ? (onSuccess, onFail) => {
                  this.callbacks.onContinueWithAd!(() => {
                      onSuccess()
                      this.handleContinue()
                  }, onFail)
              }
            : undefined
        this.container.addChild(this.resultScreen.screenContainer)

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
            this.updateGrid(ticker)
            this.mainLoop(ticker)
        }

        // Setup scene
        this.setupGame()

        // Start animation loop
        this.ticker.add(this.boundAnimate)
    }

    private setupSystemCallbacks(): void {
        // Difficulty change callback
        this.difficultyManager.setOnPhaseChange((config, previousPhase) => {
            this.onDifficultyChange(config, previousPhase)
        })

        // Life system callbacks
        this.lifeSystem.setOnLifeChange((lives, maxLives) => {
            this.hud.updateLives(lives, maxLives)
        })

        this.lifeSystem.setOnGameOver(() => {
            this.endGame()
        })
    }

    protected drawBackground(): void {
        this.background.clear()
        this.background.rect(0, 0, this.width, this.height)
        this.background.fill(pixiColors.backgroundDark)
    }

    private updateGrid(ticker: Ticker): void {
        const delta = ticker.deltaMS / 16.67
        const speed = this.gridSpeed * delta

        this.gridOffsetX += speed
        this.gridOffsetY += speed

        // Wrap offsets
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

        // Vertical lines
        for (let x = startX; x <= this.width + size; x += size) {
            const distFromEdge = Math.min(Math.max(x, 0), Math.max(this.width - x, 0))
            const edgeFade = Math.min(distFromEdge / 40, 1)

            g.moveTo(x, 0)
            g.lineTo(x, this.height)
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha + edgeFade * 0.08 })
        }

        // Horizontal lines
        for (let y = startY; y <= this.height + size; y += size) {
            const distFromEdge = Math.min(Math.max(y, 0), Math.max(this.height - y, 0))
            const edgeFade = Math.min(distFromEdge / 40, 1)

            g.moveTo(0, y)
            g.lineTo(this.width, y)
            g.stroke({ color: this.gridColor, width: 1, alpha: this.gridAlpha + edgeFade * 0.08 })
        }

        // Corner dots
        for (let x = startX; x <= this.width + size; x += size) {
            for (let y = startY; y <= this.height + size; y += size) {
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
    }

    private mainLoop(ticker: Ticker): void {
        const deltaSeconds = ticker.deltaMS / 1000

        // Update result screen animation if showing
        if (this.gamePhase === 'result') {
            this.resultScreen.update(deltaSeconds)
            return
        }

        // Only update game if playing
        if (this.gamePhase === 'playing') {
            this.gameTime += deltaSeconds
            this.difficultyManager.update(this.gameTime)
            this.hud.updateTimer(this.gameTime)
            this.hud.updateScore(this.scoreSystem.score, this.scoreSystem.combo)
            this.hud.updateDifficulty(this.difficultyManager.phase)
            this.updateGame(deltaSeconds)
        }

        // Always animate (for visual effects)
        this.animate(ticker)
    }

    /**
     * Start the game
     */
    public start(): void {
        if (this.gamePhase === 'ready' || this.gamePhase === 'paused') {
            this.gamePhase = 'playing'
            this.onGameStart()
        }
    }

    /**
     * Pause the game
     */
    public pause(): void {
        if (this.gamePhase === 'playing') {
            this.gamePhase = 'paused'
            this.onGamePause()
        }
    }

    /**
     * Resume the game
     */
    public resume(): void {
        if (this.gamePhase === 'paused') {
            this.gamePhase = 'playing'
            this.onGameResume()
        }
    }

    /**
     * End the game
     */
    protected endGame(): void {
        this.gamePhase = 'gameover'
        this.onGameEnd()

        // Show result screen
        setTimeout(() => {
            this.showResult()
        }, 500)
    }

    private showResult(): void {
        this.gamePhase = 'result'

        const resultData: MiniGameResultData = {
            score: this.scoreSystem.score,
            gameTime: this.gameTime,
            maxCombo: this.scoreSystem.currentState.maxCombo,
            accuracy: this.scoreSystem.getAccuracy(),
            perfectHits: this.scoreSystem.currentState.perfectHits,
            totalShots: this.scoreSystem.currentState.totalShots,
        }

        this.resultScreen.show(resultData)

        if (this.callbacks.onGameOver) {
            this.callbacks.onGameOver(this.getCurrentState())
        }
    }

    private handleRetry(): void {
        this.reset()
        this.callbacks.onRetry?.()
    }

    /**
     * Handle continue after watching rewarded ad
     * Restores one life and resumes from current state
     */
    protected handleContinue(): void {
        // Hide result screen
        this.resultScreen.hide()

        // Restore one life
        this.lifeSystem.gainLife()

        // Resume game
        this.gamePhase = 'playing'

        // Update HUD
        this.hud.updateLives(this.lifeSystem.lives, this.lifeSystem.maxLives)

        // Notify subclass
        this.onGameContinue()
    }

    /**
     * Reset the game
     */
    public reset(): void {
        this.gamePhase = 'ready'
        this.gameTime = 0
        this.scoreSystem.reset()
        this.difficultyManager.reset()
        this.lifeSystem.reset()
        this.resultScreen.hide()

        // Reset HUD
        this.hud.updateTimer(0)
        this.hud.updateScore(0, 0)
        this.hud.updateLives(this.lifeSystem.lives, this.lifeSystem.maxLives)
        this.hud.updateDifficulty('easy')

        this.onGameReset()
    }

    /**
     * Handle a successful hit
     */
    protected onSuccess(hitResult: HitResult): number {
        const points = this.scoreSystem.recordShot(hitResult, this.gameTime)
        if (hitResult.perfect) {
            this.hud.showPerfect()
        }
        return points
    }

    /**
     * Handle a failure (miss)
     */
    protected onFailure(): void {
        this.scoreSystem.recordMiss()
        this.lifeSystem.loseLife()
        this.hud.showMiss()
    }

    /**
     * Get current game state
     */
    protected getCurrentState(): MiniGameState {
        return {
            gameTime: this.gameTime,
            phase: this.difficultyManager.phase,
            score: this.scoreSystem.currentState,
            lives: this.lifeSystem.currentState,
            isGameOver: this.lifeSystem.isGameOver,
            isPaused: this.gamePhase === 'paused',
        }
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

    protected onResize(): void {
        // Override in subclasses
    }

    /**
     * Cleanup scene
     */
    public destroy(): void {
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

    protected get centerX(): number {
        return this.width / 2
    }

    protected get centerY(): number {
        return this.height / 2
    }

    // Abstract methods to be implemented by subclasses
    protected abstract setupGame(): void
    protected abstract updateGame(deltaSeconds: number): void
    protected abstract animate(ticker: Ticker): void
    protected abstract onDifficultyChange(
        config: DifficultyConfig,
        previousPhase: DifficultyPhase
    ): void

    // Optional lifecycle methods
    protected onGameStart(): void {
        // Override in subclasses
    }
    protected onGamePause(): void {
        // Override in subclasses
    }
    protected onGameResume(): void {
        // Override in subclasses
    }
    protected onGameEnd(): void {
        // Override in subclasses
    }

    /**
     * Get game-specific data for records
     * Override in subclasses to provide game-specific metrics
     */
    public getGameData(): Record<string, unknown> {
        return {
            score: this.scoreSystem.score,
            gameTime: this.gameTime,
            maxCombo: this.scoreSystem.currentState.maxCombo,
        }
    }
    protected onGameReset(): void {
        // Override in subclasses
    }
    protected onGameContinue(): void {
        // Override in subclasses
    }
}
