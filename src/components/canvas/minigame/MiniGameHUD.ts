/**
 * MiniGameHUD.ts - Common HUD for minigames
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { DifficultyPhase, LIFE_CONFIG } from './MiniGameTypes'

// Balatro-style colors
const COLORS = {
    gold: 0xc9a227,
    red: 0xe85d4c,
    blue: 0x4a9eff,
    cyan: 0x4ecdc4,
    bgCard: 0x1a1a2e,
    border: 0x1a1a1a,
    textPrimary: 0xffffff,
    textMuted: 0x888899,
}

export interface MiniGameHUDContext {
    container: Container
    width: number
    height: number
}

export class MiniGameHUD {
    private container: Container
    private width: number
    private height: number

    // UI elements
    private scoreContainer!: Container
    private scoreText!: Text
    private scoreLabel!: Text
    private comboText!: Text

    // Display mode
    private displayMode: 'score' | 'stage' = 'score'

    private livesContainer!: Container
    private lifeHearts: Graphics[] = []

    private timerContainer!: Container
    private timerText!: Text

    private difficultyContainer!: Container
    private difficultyText!: Text

    // Feedback effects
    private feedbackText!: Text
    private feedbackTimer = 0

    constructor(context: MiniGameHUDContext) {
        this.container = context.container
        this.width = context.width
        this.height = context.height
        this.setup()
    }

    private setup(): void {
        // === Compact Top Bar ===
        const topY = 12
        const padding = 16

        // Score (top-left) - Minimal design
        this.scoreContainer = new Container()
        this.scoreContainer.position.set(padding, topY)
        this.container.addChild(this.scoreContainer)

        const scoreBg = new Graphics()
        this.drawCompactCard(scoreBg, 0, 0, 80, 36)
        this.scoreContainer.addChild(scoreBg)

        this.scoreLabel = new Text({
            text: 'SCORE',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 8,
                fontWeight: 'bold',
                fill: COLORS.textMuted,
                letterSpacing: 1,
            }),
        })
        this.scoreLabel.position.set(8, 5)
        this.scoreContainer.addChild(this.scoreLabel)

        this.scoreText = new Text({
            text: '0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 15,
                fontWeight: 'bold',
                fill: COLORS.textPrimary,
            }),
        })
        this.scoreText.position.set(8, 17)
        this.scoreContainer.addChild(this.scoreText)

        // Combo (next to score)
        this.comboText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: COLORS.cyan,
            }),
        })
        this.comboText.position.set(55, 18)
        this.scoreContainer.addChild(this.comboText)

        // Timer + Difficulty (top-center) - Combined in one element
        this.timerContainer = new Container()
        this.timerContainer.position.set(this.width / 2, topY)
        this.container.addChild(this.timerContainer)

        const timerBg = new Graphics()
        this.drawCompactCard(timerBg, -40, 0, 80, 36)
        this.timerContainer.addChild(timerBg)

        this.timerText = new Text({
            text: '00:00',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: COLORS.textPrimary,
                letterSpacing: 1,
            }),
        })
        this.timerText.anchor.set(0.5)
        this.timerText.position.set(0, 12)
        this.timerContainer.addChild(this.timerText)

        // Difficulty inside timer container
        this.difficultyContainer = new Container()
        this.difficultyContainer.position.set(0, 26)
        this.timerContainer.addChild(this.difficultyContainer)

        this.difficultyText = new Text({
            text: 'EASY',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 8,
                fontWeight: 'bold',
                fill: COLORS.cyan,
                letterSpacing: 1,
            }),
        })
        this.difficultyText.anchor.set(0.5)
        this.difficultyContainer.addChild(this.difficultyText)

        // Lives (top-right) - Compact hearts only
        this.livesContainer = new Container()
        this.livesContainer.position.set(this.width - padding - 70, topY)
        this.container.addChild(this.livesContainer)

        const livesBg = new Graphics()
        this.drawCompactCard(livesBg, 0, 0, 70, 36)
        this.livesContainer.addChild(livesBg)

        // Create heart icons
        this.createHearts()

        // Feedback text (center of screen, for "PERFECT!", "MISS!" etc.)
        this.feedbackText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 32,
                fontWeight: 'bold',
                fill: COLORS.gold,
                stroke: { color: COLORS.border, width: 4 },
            }),
        })
        this.feedbackText.anchor.set(0.5)
        this.feedbackText.position.set(this.width / 2, this.height / 3)
        this.feedbackText.visible = false
        this.container.addChild(this.feedbackText)
    }

    private drawCard(g: Graphics, x: number, y: number, w: number, h: number, borderColor: number): void {
        // Shadow
        g.roundRect(x + 2, y + 3, w, h, 8)
        g.fill({ color: 0x000000, alpha: 0.5 })

        // Background
        g.roundRect(x, y, w, h, 8)
        g.fill(COLORS.bgCard)

        // Border
        g.roundRect(x, y, w, h, 8)
        g.stroke({ color: borderColor, width: 2 })
    }

    private drawCompactCard(g: Graphics, x: number, y: number, w: number, h: number): void {
        // Subtle shadow
        g.roundRect(x + 1, y + 2, w, h, 6)
        g.fill({ color: 0x000000, alpha: 0.3 })

        // Background
        g.roundRect(x, y, w, h, 6)
        g.fill({ color: COLORS.bgCard, alpha: 0.85 })

        // Subtle border
        g.roundRect(x, y, w, h, 6)
        g.stroke({ color: 0x2d2d44, width: 1.5, alpha: 0.6 })
    }

    private createHearts(): void {
        this.lifeHearts = []
        const heartSize = 16
        const heartGap = 3
        const startX = 8

        for (let i = 0; i < LIFE_CONFIG.maxLives; i++) {
            const heart = new Graphics()
            this.drawHeart(heart, startX + i * (heartSize + heartGap), 10, heartSize, true)
            this.livesContainer.addChild(heart)
            this.lifeHearts.push(heart)
        }
    }

    private drawHeart(g: Graphics, x: number, y: number, size: number, filled: boolean): void {
        g.clear()
        const s = size / 18

        // Heart shape using bezier curves
        g.moveTo(x + 9 * s, y + 16 * s)
        g.bezierCurveTo(x + 9 * s, y + 15 * s, x + 9 * s, y + 12 * s, x + 9 * s, y + 12 * s)
        g.bezierCurveTo(x + 9 * s, y + 8 * s, x + 5 * s, y + 4 * s, x + 1 * s, y + 4 * s)
        g.bezierCurveTo(x - 3 * s, y + 4 * s, x - 3 * s, y + 9 * s, x - 3 * s, y + 9 * s)
        g.bezierCurveTo(x - 3 * s, y + 11 * s, x - 2 * s, y + 13 * s, x + 9 * s, y + 18 * s)
        g.bezierCurveTo(x + 20 * s, y + 13 * s, x + 21 * s, y + 11 * s, x + 21 * s, y + 9 * s)
        g.bezierCurveTo(x + 21 * s, y + 9 * s, x + 21 * s, y + 4 * s, x + 17 * s, y + 4 * s)
        g.bezierCurveTo(x + 13 * s, y + 4 * s, x + 9 * s, y + 8 * s, x + 9 * s, y + 12 * s)

        if (filled) {
            g.fill(COLORS.red)
        } else {
            g.fill({ color: 0x333333, alpha: 0.5 })
        }
    }

    /**
     * Set display mode (score or stage)
     */
    setDisplayMode(mode: 'score' | 'stage'): void {
        this.displayMode = mode
        if (mode === 'stage') {
            this.scoreLabel.text = 'STAGE'
            this.comboText.visible = false
        } else {
            this.scoreLabel.text = 'SCORE'
        }
    }

    /**
     * Update score display
     */
    updateScore(score: number, combo: number): void {
        if (this.displayMode === 'stage') return  // Don't update score in stage mode

        this.scoreText.text = score.toLocaleString()

        if (combo > 1) {
            const multiplier = Math.min(1 + combo * 0.1, 3.0)
            this.comboText.text = `x${multiplier.toFixed(1)}`
            this.comboText.visible = true
        } else {
            this.comboText.visible = false
        }
    }

    /**
     * Update stage display
     */
    updateStage(stage: number): void {
        if (this.displayMode !== 'stage') return
        this.scoreText.text = stage.toString()
    }

    /**
     * Update timer display
     */
    updateTimer(gameTime: number): void {
        const minutes = Math.floor(gameTime / 60)
        const seconds = Math.floor(gameTime % 60)
        this.timerText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    /**
     * Update lives display
     */
    updateLives(lives: number, maxLives: number): void {
        for (let i = 0; i < this.lifeHearts.length; i++) {
            const filled = i < lives
            this.drawHeart(this.lifeHearts[i], 8 + i * 19, 10, 16, filled)
        }
    }

    /**
     * Update difficulty indicator
     */
    updateDifficulty(phase: DifficultyPhase): void {
        const phaseNames: Record<DifficultyPhase, string> = {
            easy: 'EASY',
            medium: 'MEDIUM',
            hard: 'HARD',
            insane: 'INSANE!',
        }

        const phaseColors: Record<DifficultyPhase, number> = {
            easy: COLORS.cyan,
            medium: COLORS.gold,
            hard: 0xff8c00,
            insane: COLORS.red,
        }

        this.difficultyText.text = phaseNames[phase]
        this.difficultyText.style.fill = phaseColors[phase]
    }

    /**
     * Show "PERFECT!" feedback
     */
    showPerfect(): void {
        this.showFeedback('PERFECT!', COLORS.gold)
    }

    /**
     * Show "MISS!" feedback
     */
    showMiss(): void {
        this.showFeedback('MISS!', COLORS.red)
    }

    /**
     * Show score popup
     */
    showScorePopup(points: number, x: number, y: number): void {
        const popup = new Text({
            text: `+${points}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: COLORS.gold,
                stroke: { color: COLORS.border, width: 2 },
            }),
        })
        popup.anchor.set(0.5)
        popup.position.set(x, y)
        this.container.addChild(popup)

        // Animate and remove
        let time = 0
        const animate = () => {
            time += 16 / 1000
            popup.y -= 1
            popup.alpha = 1 - time / 0.8

            if (time < 0.8) {
                requestAnimationFrame(animate)
            } else {
                this.container.removeChild(popup)
                popup.destroy()
            }
        }
        animate()
    }

    private showFeedback(text: string, color: number): void {
        this.feedbackText.text = text
        this.feedbackText.style.fill = color
        this.feedbackText.visible = true
        this.feedbackText.scale.set(1.5)
        this.feedbackText.alpha = 1

        // Animate
        let time = 0
        const animate = () => {
            time += 16 / 1000
            const progress = time / 0.5

            this.feedbackText.scale.set(1.5 - progress * 0.5)
            this.feedbackText.alpha = 1 - progress

            if (progress < 1) {
                requestAnimationFrame(animate)
            } else {
                this.feedbackText.visible = false
            }
        }
        animate()
    }

    /**
     * Show or hide all HUD elements
     * Useful for games with custom HUD implementations
     */
    setVisible(visible: boolean): void {
        this.scoreContainer.visible = visible
        this.timerContainer.visible = visible
        this.livesContainer.visible = visible
        // Keep feedbackText separate - it shows important feedback like "PERFECT!"
    }
}
