/**
 * MiniGameResultScreen.ts - Result screen for minigames
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { getRankFromScore, RankConfig } from './MiniGameTypes'

// Balatro-style colors
const COLORS = {
    gold: 0xc9a227,
    red: 0xe85d4c,
    blue: 0x4a9eff,
    cyan: 0x4ecdc4,
    bgCard: 0x1a1a2e,
    bgDark: 0x0f0f1a,
    border: 0x1a1a1a,
    textPrimary: 0xffffff,
    textSecondary: 0x888899,
}

export interface MiniGameResultContext {
    container: Container
    width: number
    height: number
}

export interface MiniGameResultData {
    score: number
    gameTime: number
    maxCombo: number
    accuracy: number
    perfectHits: number
    totalShots: number
}

function easeOutBack(x: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

function easeOutQuad(x: number): number {
    return 1 - (1 - x) * (1 - x)
}

export class MiniGameResultScreen {
    public screenContainer: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    // Animation state
    private animTime = 0
    private isVisible = false
    private displayedScore = 0

    // UI elements
    private card: Container | null = null
    private scoreText: Text | null = null
    private rankContainer: Container | null = null
    private buttonsContainer: Container | null = null
    private decorDots: Graphics[] = []

    // Card dimensions
    private cardWidth = 0
    private cardHeight = 0
    private cardX = 0
    private cardY = 0

    // Data
    private data: MiniGameResultData | null = null

    // Callbacks
    onRetry?: () => void
    onExit?: () => void

    constructor(context: MiniGameResultContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
        this.screenContainer.visible = false
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(data: MiniGameResultData): void {
        this.isVisible = true
        this.animTime = 0
        this.displayedScore = 0
        this.data = data
        this.decorDots = []

        this.screenContainer.visible = true
        this.screenContainer.removeChildren()
        this.createUI()
    }

    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible || !this.data) return

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

        // Animate score counting (0.4s - 1.0s)
        if (this.animTime >= 0.4 && this.animTime < 1.0) {
            const progress = Math.min(1, (this.animTime - 0.4) / 0.6)
            this.displayedScore = Math.floor(this.data.score * easeOutQuad(progress))
            if (this.scoreText) {
                this.scoreText.text = this.displayedScore.toLocaleString()
            }
        } else if (this.animTime >= 1.0 && this.scoreText) {
            this.scoreText.text = this.data.score.toLocaleString()
        }

        // Rank pop-in (1.0s - 1.3s)
        if (this.rankContainer && this.animTime >= 1.0) {
            const rankProgress = Math.min(1, (this.animTime - 1.0) / 0.3)
            this.rankContainer.scale.set(easeOutBack(rankProgress))
            this.rankContainer.alpha = rankProgress

            // Pulse after reveal
            if (rankProgress >= 1) {
                const pulse = 1 + Math.sin(this.animTime * 4) * 0.03
                this.rankContainer.scale.set(pulse)
            }
        }

        // Buttons fade-in (1.3s+)
        if (this.buttonsContainer && this.animTime >= 1.3) {
            const btnProgress = Math.min(1, (this.animTime - 1.3) / 0.2)
            this.buttonsContainer.alpha = btnProgress
        }

        // Animate decorative dots
        this.decorDots.forEach((dot, i) => {
            const phase = this.animTime * 2 + i * 0.3
            dot.alpha = 0.3 + Math.sin(phase) * 0.2
        })
    }

    reset(): void {
        this.hide()
        this.animTime = 0
        this.data = null
        this.decorDots = []
    }

    private createUI(): void {
        if (!this.data) return

        // Dark background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(COLORS.bgDark)
        this.screenContainer.addChild(bg)

        // Subtle dot pattern
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

        // Card dimensions (smaller since we removed stats)
        this.cardWidth = Math.min(280, this.width - 40)
        this.cardHeight = 240
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
        cardBg.fill(COLORS.bgCard)
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.stroke({ color: COLORS.gold, width: 3 })
        this.card.addChild(cardBg)

        // Title badge
        const badgeWidth = 140
        const badgeHeight = 32
        const badgeShadow = new Graphics()
        badgeShadow.roundRect(-badgeWidth / 2 + 2, this.cardY - 12 + 4, badgeWidth, badgeHeight, 8)
        badgeShadow.fill(0x000000)
        this.card.addChild(badgeShadow)

        const badge = new Graphics()
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.fill(COLORS.gold)
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.stroke({ color: COLORS.border, width: 3 })
        this.card.addChild(badge)

        const titleText = new Text({
            text: 'GAME OVER',
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

        // Stats section
        const statsY = this.cardY + 50

        // Score
        this.createStatRow(0, statsY, 'SCORE', '0', COLORS.gold)
        this.scoreText = this.card.children[this.card.children.length - 1] as Text

        // Time
        const minutes = Math.floor(this.data.gameTime / 60)
        const seconds = Math.floor(this.data.gameTime % 60)
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        this.createStatRow(0, statsY + 50, 'TIME', timeStr, COLORS.blue)

        // Rank display
        const rankConfig = getRankFromScore(this.data.score)
        const rankY = statsY + 115

        this.rankContainer = new Container()
        this.rankContainer.position.set(0, rankY)
        this.rankContainer.scale.set(0)
        this.rankContainer.alpha = 0
        this.card.addChild(this.rankContainer)

        const rankBoxSize = 60
        const rankShadow = new Graphics()
        rankShadow.roundRect(-rankBoxSize / 2 + 2, -rankBoxSize / 2 + 4, rankBoxSize, rankBoxSize, 12)
        rankShadow.fill(0x000000)
        this.rankContainer.addChild(rankShadow)

        const rankBg = new Graphics()
        rankBg.roundRect(-rankBoxSize / 2, -rankBoxSize / 2, rankBoxSize, rankBoxSize, 12)
        rankBg.fill(0x2a2a3e)
        rankBg.roundRect(-rankBoxSize / 2, -rankBoxSize / 2, rankBoxSize, rankBoxSize, 12)
        rankBg.stroke({ color: rankConfig.color, width: 3 })
        this.rankContainer.addChild(rankBg)

        const rankText = new Text({
            text: rankConfig.rank,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 32,
                fontWeight: 'bold',
                fill: rankConfig.color,
            }),
        })
        rankText.anchor.set(0.5)
        this.rankContainer.addChild(rankText)

        const rankMessage = new Text({
            text: rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: COLORS.textSecondary,
            }),
        })
        rankMessage.anchor.set(0.5)
        rankMessage.position.set(0, rankBoxSize / 2 + 12)
        this.rankContainer.addChild(rankMessage)

        // Decorative corner dots
        this.addDecorativeElements()

        // Action buttons
        this.buttonsContainer = new Container()
        this.buttonsContainer.alpha = 0
        this.screenContainer.addChild(this.buttonsContainer)

        const btnY = this.centerY + this.cardHeight / 2 + 40
        const btnWidth = 100
        const btnGap = 16

        // Retry button
        const retryBtn = this.createButton('RETRY', btnWidth, 40, COLORS.blue)
        retryBtn.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        retryBtn.eventMode = 'static'
        retryBtn.cursor = 'pointer'
        retryBtn.on('pointertap', () => this.onRetry?.())
        this.buttonsContainer.addChild(retryBtn)

        // Exit button
        const exitBtn = this.createButton('EXIT', btnWidth, 40, COLORS.red)
        exitBtn.position.set(this.centerX + btnWidth / 2 + btnGap / 2, btnY)
        exitBtn.eventMode = 'static'
        exitBtn.cursor = 'pointer'
        exitBtn.on('pointertap', () => this.onExit?.())
        this.buttonsContainer.addChild(exitBtn)
    }

    private createStatRow(x: number, y: number, label: string, value: string, color: number): void {
        if (!this.card) return

        const labelText = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: color,
                letterSpacing: 1,
            }),
        })
        labelText.anchor.set(0.5)
        labelText.position.set(x, y)
        this.card.addChild(labelText)

        const valueText = new Text({
            text: value,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: COLORS.textPrimary,
            }),
        })
        valueText.anchor.set(0.5)
        valueText.position.set(x, y + 18)
        this.card.addChild(valueText)
    }

    private createButton(label: string, width: number, height: number, color: number): Container {
        const btn = new Container()

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 2, -height / 2 + 3, width, height, 8)
        shadow.fill(0x000000)
        btn.addChild(shadow)

        // Background
        const bg = new Graphics()
        bg.roundRect(-width / 2, -height / 2, width, height, 8)
        bg.fill(color)
        bg.roundRect(-width / 2, -height / 2, width, height, 8)
        bg.stroke({ color: COLORS.border, width: 2 })
        btn.addChild(bg)

        // Label
        const text = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: COLORS.textPrimary,
                letterSpacing: 2,
            }),
        })
        text.anchor.set(0.5)
        btn.addChild(text)

        return btn
    }

    private addDecorativeElements(): void {
        if (!this.card) return

        const corners = [
            { x: this.cardX + 20, y: this.cardY + 25 },
            { x: this.cardX + this.cardWidth - 20, y: this.cardY + 25 },
            { x: this.cardX + 20, y: this.cardY + this.cardHeight - 20 },
            { x: this.cardX + this.cardWidth - 20, y: this.cardY + this.cardHeight - 20 },
        ]

        corners.forEach((pos) => {
            const dot = new Graphics()
            dot.circle(pos.x, pos.y, 4)
            dot.fill(COLORS.gold)
            dot.alpha = 0.5
            this.card!.addChild(dot)
            this.decorDots.push(dot)
        })
    }
}
