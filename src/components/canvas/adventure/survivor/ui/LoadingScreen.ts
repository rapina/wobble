/**
 * LoadingScreen - Balatro-style loading screen for world generation
 * Matches the visual style of other UI components
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { BALATRO_COLORS } from './BalatroButton'
import { easeOutBack } from '../utils'

export interface LoadingScreenContext {
    container: Container
    width: number
    height: number
}

export class LoadingScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    // UI elements
    private card: Container | null = null
    private progressBarBg: Graphics | null = null
    private progressBarFill: Graphics | null = null
    private phaseText: Text | null = null
    private detailText: Text | null = null
    private seedText: Text | null = null
    private percentText: Text | null = null

    // Decorative elements
    private decorDots: Graphics[] = []

    // Animation state
    private animTime = 0
    private isVisible = false
    private currentProgress = 0
    private targetProgress = 0

    // Card dimensions
    private cardWidth = 0
    private cardHeight = 0
    private cardX = 0
    private cardY = 0

    constructor(context: LoadingScreenContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    /**
     * Show the loading screen
     */
    show(seed: number): void {
        this.isVisible = true
        this.animTime = 0
        this.currentProgress = 0
        this.targetProgress = 0
        this.screenContainer.visible = true
        this.screenContainer.removeChildren()
        this.decorDots = []

        this.createUI(seed)
    }

    /**
     * Hide the loading screen
     */
    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
    }

    /**
     * Update progress from WorldGenerator
     */
    setProgress(progress: number, phase: string, detail: string): void {
        this.targetProgress = progress

        // Update phase text
        if (this.phaseText) {
            this.phaseText.text = phase
        }

        // Update detail text
        if (this.detailText) {
            this.detailText.text = detail
        }
    }

    /**
     * Update animations
     */
    update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animTime += deltaSeconds

        // Card pop-in animation
        if (this.card) {
            const cardDelay = 0.1
            const cardDuration = 0.4
            const cardProgress = Math.max(0, (this.animTime - cardDelay) / cardDuration)

            if (cardProgress < 1) {
                const scale = easeOutBack(Math.min(1, cardProgress))
                this.card.scale.set(scale)
                this.card.alpha = cardProgress
            } else {
                this.card.scale.set(1)
                this.card.alpha = 1
            }
        }

        // Smooth progress bar animation
        const progressDiff = this.targetProgress - this.currentProgress
        this.currentProgress += progressDiff * Math.min(1, deltaSeconds * 8)

        // Update progress bar fill
        if (this.progressBarFill) {
            const barWidth = this.cardWidth - 60
            const fillWidth = Math.max(0, barWidth * this.currentProgress)

            this.progressBarFill.clear()
            if (fillWidth > 0) {
                this.progressBarFill.roundRect(0, 0, fillWidth, 16, 6)
                this.progressBarFill.fill(BALATRO_COLORS.gold)
            }
        }

        // Update percentage text
        if (this.percentText) {
            this.percentText.text = `${Math.floor(this.currentProgress * 100)}%`
        }

        // Animate decorative dots
        this.decorDots.forEach((dot, i) => {
            const phase = this.animTime * 2 + i * 0.3
            dot.alpha = 0.3 + Math.sin(phase) * 0.2
        })

        // Subtle phase text pulse
        if (this.phaseText) {
            const pulse = 0.9 + Math.sin(this.animTime * 3) * 0.1
            this.phaseText.alpha = pulse
        }
    }

    private createUI(seed: number): void {
        // Dark background with Balatro feel
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(0x0f0f1a)
        this.screenContainer.addChild(bg)

        // Subtle dot pattern (Balatro style)
        const dots = new Graphics()
        for (let x = 0; x < this.width; x += 20) {
            for (let y = 0; y < this.height; y += 20) {
                dots.circle(x, y, 1)
                dots.fill({ color: 0xffffff, alpha: 0.03 })
            }
        }
        this.screenContainer.addChild(dots)

        // Main card container
        this.card = new Container()
        this.card.position.set(this.centerX, this.centerY)
        this.card.scale.set(0)
        this.card.alpha = 0
        this.screenContainer.addChild(this.card)

        // Card dimensions
        this.cardWidth = Math.min(320, this.width - 40)
        this.cardHeight = 220
        this.cardX = -this.cardWidth / 2
        this.cardY = -this.cardHeight / 2

        // Card shadow
        const cardShadow = new Graphics()
        cardShadow.roundRect(this.cardX + 4, this.cardY + 6, this.cardWidth, this.cardHeight, 16)
        cardShadow.fill(0x000000)
        this.card.addChild(cardShadow)

        // Card background
        const cardBg = new Graphics()
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.fill(0x1a1a2e)
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.stroke({ color: BALATRO_COLORS.gold, width: 3 })
        this.card.addChild(cardBg)

        // Title badge
        const badgeWidth = 160
        const badgeHeight = 32
        const badgeShadow = new Graphics()
        badgeShadow.roundRect(-badgeWidth / 2 + 2, this.cardY - 12 + 4, badgeWidth, badgeHeight, 8)
        badgeShadow.fill(0x000000)
        this.card.addChild(badgeShadow)

        const badge = new Graphics()
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.fill(BALATRO_COLORS.gold)
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.stroke({ color: 0x1a1a1a, width: 3 })
        this.card.addChild(badge)

        const titleText = new Text({
            text: 'GENERATING',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0x000000,
                letterSpacing: 3,
            }),
        })
        titleText.anchor.set(0.5)
        titleText.position.set(0, this.cardY + 4)
        this.card.addChild(titleText)

        // Seed display
        this.seedText = new Text({
            text: `SEED: ${seed.toString(16).toUpperCase().padStart(8, '0')}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: 0x888899,
                letterSpacing: 1,
            }),
        })
        this.seedText.anchor.set(0.5)
        this.seedText.position.set(0, this.cardY + 45)
        this.card.addChild(this.seedText)

        // Phase text (current operation)
        this.phaseText = new Text({
            text: 'INITIALIZING...',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xffffff,
                letterSpacing: 2,
            }),
        })
        this.phaseText.anchor.set(0.5)
        this.phaseText.position.set(0, this.cardY + 80)
        this.card.addChild(this.phaseText)

        // Detail text
        this.detailText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: 0x6688aa,
            }),
        })
        this.detailText.anchor.set(0.5)
        this.detailText.position.set(0, this.cardY + 105)
        this.card.addChild(this.detailText)

        // Progress bar background
        const barWidth = this.cardWidth - 60
        const barHeight = 16
        const barX = -barWidth / 2
        const barY = this.cardY + 135

        const barShadow = new Graphics()
        barShadow.roundRect(barX + 2, barY + 3, barWidth, barHeight, 6)
        barShadow.fill(0x000000)
        this.card.addChild(barShadow)

        this.progressBarBg = new Graphics()
        this.progressBarBg.roundRect(barX, barY, barWidth, barHeight, 6)
        this.progressBarBg.fill(0x2a2a3e)
        this.progressBarBg.roundRect(barX, barY, barWidth, barHeight, 6)
        this.progressBarBg.stroke({ color: 0x3a3a4e, width: 2 })
        this.card.addChild(this.progressBarBg)

        // Progress bar fill
        this.progressBarFill = new Graphics()
        this.progressBarFill.position.set(barX + 2, barY + 2)
        this.card.addChild(this.progressBarFill)

        // Percentage text
        this.percentText = new Text({
            text: '0%',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.gold,
            }),
        })
        this.percentText.anchor.set(0.5)
        this.percentText.position.set(0, barY + 35)
        this.card.addChild(this.percentText)

        // Decorative corner dots
        this.addDecorativeElements()

        // Bottom hint text
        const hintText = new Text({
            text: 'Preparing your adventure...',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: 0x555566,
                fontStyle: 'italic',
            }),
        })
        hintText.anchor.set(0.5)
        hintText.position.set(0, this.cardY + this.cardHeight - 25)
        this.card.addChild(hintText)
    }

    private addDecorativeElements(): void {
        if (!this.card) return

        // Four corner decorative dots (like card suits in Balatro)
        const corners = [
            { x: this.cardX + 20, y: this.cardY + 25 },
            { x: this.cardX + this.cardWidth - 20, y: this.cardY + 25 },
            { x: this.cardX + 20, y: this.cardY + this.cardHeight - 20 },
            { x: this.cardX + this.cardWidth - 20, y: this.cardY + this.cardHeight - 20 },
        ]

        corners.forEach((pos) => {
            const dot = new Graphics()
            dot.circle(pos.x, pos.y, 4)
            dot.fill(BALATRO_COLORS.gold)
            dot.alpha = 0.5
            this.card!.addChild(dot)
            this.decorDots.push(dot)
        })
    }

    /**
     * Reset the screen
     */
    reset(): void {
        this.hide()
        this.animTime = 0
        this.currentProgress = 0
        this.targetProgress = 0
        this.decorDots = []
    }
}
