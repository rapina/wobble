/**
 * MiniGameResultScreen.ts - Result screen for minigames
 * Supports multiple themes: 'default' (Balatro style) and 'abyss' (Wobblediver style)
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { getRankFromScore, RankConfig } from './MiniGameTypes'
import i18n from '@/i18n'

export type ResultScreenTheme = 'default' | 'abyss'

// Theme color definitions
interface ThemeColors {
    gold: number
    red: number
    blue: number
    cyan: number
    bgCard: number
    bgDark: number
    border: number
    textPrimary: number
    textSecondary: number
    accent: number
    glow: number
}

// Default Balatro-style colors
const DEFAULT_COLORS: ThemeColors = {
    gold: 0xc9a227,
    red: 0xe85d4c,
    blue: 0x4a9eff,
    cyan: 0x4ecdc4,
    bgCard: 0x1a1a2e,
    bgDark: 0x0f0f1a,
    border: 0x1a1a1a,
    textPrimary: 0xffffff,
    textSecondary: 0x888899,
    accent: 0xc9a227,
    glow: 0xc9a227,
}

// Abyss theme colors (deep purple, blood red, eldritch)
const ABYSS_COLORS: ThemeColors = {
    gold: 0xcc88ff, // Eldritch purple-gold
    red: 0x8b2020, // Blood red
    blue: 0x6a3d7a, // Deep purple
    cyan: 0x9b59b6, // Purple
    bgCard: 0x1a0a20, // Very dark purple
    bgDark: 0x0a0510, // Almost black with purple tint
    border: 0x3d1a50, // Purple border
    textPrimary: 0xeeddff, // Pale purple-white
    textSecondary: 0x8877aa, // Muted purple
    accent: 0xcc88ff, // Bright purple
    glow: 0x6a3080, // Purple glow
}

// Backwards compatibility
const COLORS = DEFAULT_COLORS

export interface MiniGameResultContext {
    container: Container
    width: number
    height: number
    theme?: ResultScreenTheme
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

// Abyss theme effect types
interface AbyssEye {
    x: number
    y: number
    size: number
    openness: number
    targetOpenness: number
    lookAngle: number
    intensity: number
    phase: number
}

interface AbyssTentacle {
    startX: number
    startY: number
    angle: number
    length: number
    targetLength: number
    phase: number
    waveSpeed: number
}

export class MiniGameResultScreen {
    public screenContainer: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    // Theme
    private theme: ResultScreenTheme
    private colors: ThemeColors

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

    // Abyss theme effects
    private abyssEffectGraphics: Graphics | null = null
    private abyssTentacleGraphics: Graphics | null = null // Separate layer for tentacles (on top)
    private abyssEyes: AbyssEye[] = []
    private abyssTentacles: AbyssTentacle[] = []
    private abyssVignetteAlpha = 0
    private abyssReactionTriggered = false // Prevent multiple reaction triggers

    // Callbacks
    onRetry?: () => void
    onExit?: () => void
    onContinueWithAd?: (onSuccess: () => void, onFail?: () => void) => void

    // Continue with ad feature
    private continuesUsed = 0
    private maxContinues = 3
    private continueButton: Container | null = null
    private continueLoading = false

    constructor(context: MiniGameResultContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
        this.theme = context.theme || 'default'
        this.colors = this.theme === 'abyss' ? ABYSS_COLORS : DEFAULT_COLORS
        this.screenContainer.visible = false
    }

    /**
     * Set the theme (can be changed before showing)
     */
    setTheme(theme: ResultScreenTheme): void {
        this.theme = theme
        this.colors = theme === 'abyss' ? ABYSS_COLORS : DEFAULT_COLORS
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

        // Reset abyss effects
        this.abyssEyes = []
        this.abyssTentacles = []
        this.abyssVignetteAlpha = 0
        this.abyssReactionTriggered = false

        this.screenContainer.visible = true
        this.screenContainer.removeChildren()
        this.createUI()

        // Initialize abyss effects if theme is abyss
        if (this.theme === 'abyss') {
            this.initAbyssEffects()
        }
    }

    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible || !this.data) return

        this.animTime += deltaSeconds

        // Update abyss effects
        if (this.theme === 'abyss') {
            this.updateAbyssEffects(deltaSeconds)
        }

        // Card pop-in animation
        if (this.card) {
            const cardDelay = this.theme === 'abyss' ? 0.3 : 0.1 // Delay card for abyss darkness
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
        const scoreStart = this.theme === 'abyss' ? 0.6 : 0.4
        const scoreEnd = this.theme === 'abyss' ? 1.2 : 1.0
        if (this.animTime >= scoreStart && this.animTime < scoreEnd) {
            const progress = Math.min(1, (this.animTime - scoreStart) / (scoreEnd - scoreStart))
            this.displayedScore = Math.floor(this.data.score * easeOutQuad(progress))
            if (this.scoreText) {
                this.scoreText.text = this.displayedScore.toLocaleString()
            }
        } else if (this.animTime >= scoreEnd && this.scoreText) {
            this.scoreText.text = this.data.score.toLocaleString()
        }

        // Rank pop-in
        const rankStart = this.theme === 'abyss' ? 1.2 : 1.0
        if (this.rankContainer && this.animTime >= rankStart) {
            const rankProgress = Math.min(1, (this.animTime - rankStart) / 0.3)
            this.rankContainer.scale.set(easeOutBack(rankProgress))
            this.rankContainer.alpha = rankProgress

            // Pulse after reveal
            if (rankProgress >= 1) {
                const pulse = 1 + Math.sin(this.animTime * 4) * 0.03
                this.rankContainer.scale.set(pulse)

                // Abyss eye reaction on rank reveal (only trigger once)
                if (this.theme === 'abyss' && !this.abyssReactionTriggered) {
                    this.abyssReactionTriggered = true
                    this.triggerAbyssReaction()
                }
            }
        }

        // Buttons fade-in
        const btnStart = this.theme === 'abyss' ? 1.5 : 1.3
        if (this.buttonsContainer && this.animTime >= btnStart) {
            const btnProgress = Math.min(1, (this.animTime - btnStart) / 0.2)
            this.buttonsContainer.alpha = btnProgress
        }

        // Animate decorative dots (or eyes for abyss)
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
        this.abyssEyes = []
        this.abyssTentacles = []
        this.abyssVignetteAlpha = 0
        this.abyssReactionTriggered = false
    }

    private createUI(): void {
        if (!this.data) return

        const c = this.colors

        // Dark background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(c.bgDark)
        this.screenContainer.addChild(bg)

        // Abyss theme: add effect graphics layers
        if (this.theme === 'abyss') {
            // Background effects (vignette, eyes) - behind everything
            this.abyssEffectGraphics = new Graphics()
            this.screenContainer.addChild(this.abyssEffectGraphics)
            // Tentacles layer - behind card but above vignette
            this.abyssTentacleGraphics = new Graphics()
            this.screenContainer.addChild(this.abyssTentacleGraphics)
        } else {
            // Default theme: Subtle dot pattern
            const dots = new Graphics()
            for (let x = 0; x < this.width; x += 20) {
                for (let y = 0; y < this.height; y += 20) {
                    dots.circle(x, y, 1)
                    dots.fill({ color: 0xffffff, alpha: 0.03 })
                }
            }
            this.screenContainer.addChild(dots)
        }

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

        // Card shadow - more dramatic for abyss
        const cardShadow = new Graphics()
        if (this.theme === 'abyss') {
            // Red glow shadow for abyss
            cardShadow.roundRect(
                this.cardX + 6,
                this.cardY + 8,
                this.cardWidth,
                this.cardHeight,
                16
            )
            cardShadow.fill({ color: 0x8b0000, alpha: 0.4 })
        }
        cardShadow.roundRect(this.cardX + 4, this.cardY + 6, this.cardWidth, this.cardHeight, 16)
        cardShadow.fill(0x000000)
        this.card.addChild(cardShadow)

        // Card background with theme-specific styling
        const cardBg = new Graphics()
        if (this.theme === 'abyss') {
            // Outer glow
            cardBg.roundRect(
                this.cardX - 4,
                this.cardY - 4,
                this.cardWidth + 8,
                this.cardHeight + 8,
                18
            )
            cardBg.fill({ color: c.glow, alpha: 0.3 })
        }
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.fill(c.bgCard)
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.stroke({ color: this.theme === 'abyss' ? c.accent : c.gold, width: 3 })
        this.card.addChild(cardBg)

        // Title badge
        const badgeWidth = this.theme === 'abyss' ? 180 : 140 // Wider for "CONSUMED" with letterSpacing
        const badgeHeight = 32
        const badgeShadow = new Graphics()
        badgeShadow.roundRect(-badgeWidth / 2 + 2, this.cardY - 12 + 4, badgeWidth, badgeHeight, 8)
        badgeShadow.fill(0x000000)
        this.card.addChild(badgeShadow)

        const badge = new Graphics()
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.fill(this.theme === 'abyss' ? c.red : c.gold)
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.stroke({ color: c.border, width: 3 })
        this.card.addChild(badge)

        // Title text - different for abyss theme
        const titleText = new Text({
            text: this.theme === 'abyss' ? 'CONSUMED' : 'GAME OVER',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: this.theme === 'abyss' ? 16 : 14,
                fontWeight: 'bold',
                fill: this.theme === 'abyss' ? 0xeeddff : 0x000000,
                letterSpacing: 3,
            }),
        })
        titleText.anchor.set(0.5)
        titleText.position.set(0, this.cardY + 4)
        this.card.addChild(titleText)

        // Stats section
        const statsY = this.cardY + 50

        // Score - use theme label
        const scoreLabel = this.theme === 'abyss' ? 'TRIBUTE' : 'SCORE'
        this.createStatRow(0, statsY, scoreLabel, '0', c.accent)
        this.scoreText = this.card.children[this.card.children.length - 1] as Text

        // Time - use theme label
        const minutes = Math.floor(this.data.gameTime / 60)
        const seconds = Math.floor(this.data.gameTime % 60)
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        const timeLabel = this.theme === 'abyss' ? 'SURVIVED' : 'TIME'
        this.createStatRow(0, statsY + 50, timeLabel, timeStr, c.blue)

        // Rank display
        const rankConfig = getRankFromScore(this.data.score)
        const rankY = statsY + 115

        this.rankContainer = new Container()
        this.rankContainer.position.set(0, rankY)
        this.rankContainer.scale.set(0)
        this.rankContainer.alpha = 0
        this.card.addChild(this.rankContainer)

        const rankBoxSize = 60

        // Abyss theme: Add glow behind rank
        if (this.theme === 'abyss') {
            const rankGlow = new Graphics()
            rankGlow.circle(0, 0, rankBoxSize / 2 + 15)
            rankGlow.fill({ color: c.glow, alpha: 0.3 })
            this.rankContainer.addChild(rankGlow)
        }

        const rankShadow = new Graphics()
        rankShadow.roundRect(
            -rankBoxSize / 2 + 2,
            -rankBoxSize / 2 + 4,
            rankBoxSize,
            rankBoxSize,
            12
        )
        rankShadow.fill(0x000000)
        this.rankContainer.addChild(rankShadow)

        const rankBg = new Graphics()
        rankBg.roundRect(-rankBoxSize / 2, -rankBoxSize / 2, rankBoxSize, rankBoxSize, 12)
        rankBg.fill(this.theme === 'abyss' ? 0x2a1a30 : 0x2a2a3e)
        rankBg.roundRect(-rankBoxSize / 2, -rankBoxSize / 2, rankBoxSize, rankBoxSize, 12)
        rankBg.stroke({ color: rankConfig.color, width: 3 })
        this.rankContainer.addChild(rankBg)

        const rankText = new Text({
            text: rankConfig.rank,
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 32,
                fontWeight: 'bold',
                fill: rankConfig.color,
            }),
        })
        rankText.anchor.set(0.5)
        this.rankContainer.addChild(rankText)

        // Rank message - different for abyss theme
        const abyssMessages: Record<string, string> = {
            S: i18n.t('wobblediver.ranks.S'),
            A: i18n.t('wobblediver.ranks.A'),
            B: i18n.t('wobblediver.ranks.B'),
            C: i18n.t('wobblediver.ranks.C'),
            D: i18n.t('wobblediver.ranks.D'),
        }
        const rankMessage = new Text({
            text:
                this.theme === 'abyss'
                    ? abyssMessages[rankConfig.rank] || rankConfig.message
                    : rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: c.textSecondary,
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

        const btnWidth = 100
        const btnGap = 16

        // Continue with ad button (if available)
        const canContinue = this.continuesUsed < this.maxContinues && this.onContinueWithAd
        const continueY = this.centerY + this.cardHeight / 2 + 35
        const normalBtnY = canContinue ? continueY + 55 : this.centerY + this.cardHeight / 2 + 40

        if (canContinue) {
            const remaining = this.maxContinues - this.continuesUsed
            const continueLabel =
                this.theme === 'abyss' ? `REVIVE (${remaining})` : `CONTINUE (${remaining})`

            this.continueButton = this.createContinueButton(continueLabel, 180, 44, c.cyan)
            this.continueButton.position.set(this.centerX, continueY)
            this.continueButton.eventMode = 'static'
            this.continueButton.cursor = 'pointer'
            this.continueButton.on('pointertap', () => this.handleContinueWithAd())
            this.buttonsContainer.addChild(this.continueButton)
        }

        // Theme-specific button colors
        const retryColor = this.theme === 'abyss' ? c.blue : COLORS.blue
        const exitColor = this.theme === 'abyss' ? c.red : COLORS.red

        // Retry button
        const retryLabel = this.theme === 'abyss' ? 'DESCEND' : 'RETRY'
        const retryBtn = this.createButton(retryLabel, btnWidth, 40, retryColor)
        retryBtn.position.set(this.centerX - btnWidth / 2 - btnGap / 2, normalBtnY)
        retryBtn.eventMode = 'static'
        retryBtn.cursor = 'pointer'
        retryBtn.on('pointertap', () => this.onRetry?.())
        this.buttonsContainer.addChild(retryBtn)

        // Exit button
        const exitLabel = this.theme === 'abyss' ? 'FLEE' : 'EXIT'
        const exitBtn = this.createButton(exitLabel, btnWidth, 40, exitColor)
        exitBtn.position.set(this.centerX + btnWidth / 2 + btnGap / 2, normalBtnY)
        exitBtn.eventMode = 'static'
        exitBtn.cursor = 'pointer'
        exitBtn.on('pointertap', () => this.onExit?.())
        this.buttonsContainer.addChild(exitBtn)
    }

    /**
     * Create a continue button with video ad icon
     */
    private createContinueButton(
        label: string,
        width: number,
        height: number,
        color: number
    ): Container {
        const btn = new Container()

        // Shadow (slightly larger for emphasis)
        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 3, -height / 2 + 4, width, height, 10)
        shadow.fill(0x000000)
        btn.addChild(shadow)

        // Background with gradient-like effect
        const bg = new Graphics()
        bg.roundRect(-width / 2, -height / 2, width, height, 10)
        bg.fill(color)
        bg.roundRect(-width / 2, -height / 2, width, height, 10)
        bg.stroke({ color: this.colors.border, width: 2 })
        btn.addChild(bg)

        // Highlight at top
        const highlight = new Graphics()
        highlight.roundRect(-width / 2 + 2, -height / 2 + 2, width - 4, height / 3, 8)
        highlight.fill({ color: 0xffffff, alpha: 0.15 })
        btn.addChild(highlight)

        // Video icon (play triangle in circle)
        const iconSize = 16
        const iconX = -width / 2 + 22
        const icon = new Graphics()
        icon.circle(iconX, 0, iconSize / 2 + 2)
        icon.fill({ color: 0xffffff, alpha: 0.2 })
        icon.moveTo(iconX - 4, -5)
        icon.lineTo(iconX - 4, 5)
        icon.lineTo(iconX + 5, 0)
        icon.closePath()
        icon.fill({ color: 0xffffff, alpha: 0.9 })
        btn.addChild(icon)

        // Label
        const text = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: this.colors.textPrimary,
                letterSpacing: 1,
            }),
        })
        text.anchor.set(0.5)
        text.position.set(10, 0) // Offset to account for icon
        btn.addChild(text)

        return btn
    }

    /**
     * Handle continue with ad button press
     */
    private handleContinueWithAd(): void {
        if (this.continueLoading || !this.onContinueWithAd) return
        if (this.continuesUsed >= this.maxContinues) return

        this.continueLoading = true

        // Visual feedback - disable button
        if (this.continueButton) {
            this.continueButton.alpha = 0.5
        }

        this.onContinueWithAd(
            // On success
            () => {
                this.continuesUsed++
                this.continueLoading = false
                // The scene will handle hiding the result screen and continuing
            },
            // On fail
            () => {
                this.continueLoading = false
                if (this.continueButton) {
                    this.continueButton.alpha = 1
                }
            }
        )
    }

    /**
     * Reset continues counter (call when starting new game from menu)
     */
    resetContinues(): void {
        this.continuesUsed = 0
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
                fill: this.colors.textPrimary,
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
        bg.stroke({ color: this.colors.border, width: 2 })
        btn.addChild(bg)

        // Label
        const text = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: this.colors.textPrimary,
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
            dot.fill(this.colors.accent)
            dot.alpha = 0.5
            this.card!.addChild(dot)
            this.decorDots.push(dot)
        })
    }

    // === ABYSS THEME EFFECTS ===

    /**
     * Initialize abyss theme visual effects (eyes and tentacles)
     */
    private initAbyssEffects(): void {
        // Create watching eyes around the screen edges
        const eyeCount = 6
        for (let i = 0; i < eyeCount; i++) {
            const angle = (i / eyeCount) * Math.PI * 2 + Math.random() * 0.5
            const distance = 200 + Math.random() * 100
            this.abyssEyes.push({
                x: this.centerX + Math.cos(angle) * distance,
                y: this.centerY + Math.sin(angle) * distance * 0.6,
                size: 15 + Math.random() * 12,
                openness: 0,
                targetOpenness: 1,
                lookAngle: Math.atan2(-Math.sin(angle), -Math.cos(angle)),
                intensity: 0.5 + Math.random() * 0.5,
                phase: Math.random() * Math.PI * 2,
            })
        }

        // Create tentacles reaching from edges - more and longer for dramatic effect
        const tentacleCount = 16
        for (let i = 0; i < tentacleCount; i++) {
            const side = i % 4
            let x: number, y: number, angle: number
            switch (side) {
                case 0: // Top
                    x = this.width * 0.1 + Math.random() * this.width * 0.8
                    y = -10
                    angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                case 1: // Right
                    x = this.width + 10
                    y = this.height * 0.1 + Math.random() * this.height * 0.8
                    angle = Math.PI + (Math.random() - 0.5) * 0.5
                    break
                case 2: // Bottom
                    x = this.width * 0.1 + Math.random() * this.width * 0.8
                    y = this.height + 10
                    angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5
                    break
                default: // Left
                    x = -10
                    y = this.height * 0.1 + Math.random() * this.height * 0.8
                    angle = (Math.random() - 0.5) * 0.5
                    break
            }
            // Longer tentacles for better visibility
            this.abyssTentacles.push({
                startX: x,
                startY: y,
                angle,
                length: 0,
                targetLength: 120 + Math.random() * 100,
                phase: Math.random() * Math.PI * 2,
                waveSpeed: 1.5 + Math.random() * 2,
            })
        }

        // Add corner tentacles for extra drama
        const corners = [
            { x: -10, y: -10, angle: Math.PI / 4 },
            { x: this.width + 10, y: -10, angle: (Math.PI * 3) / 4 },
            { x: this.width + 10, y: this.height + 10, angle: (-Math.PI * 3) / 4 },
            { x: -10, y: this.height + 10, angle: -Math.PI / 4 },
        ]
        for (const corner of corners) {
            this.abyssTentacles.push({
                startX: corner.x,
                startY: corner.y,
                angle: corner.angle + (Math.random() - 0.5) * 0.3,
                length: 0,
                targetLength: 150 + Math.random() * 80,
                phase: Math.random() * Math.PI * 2,
                waveSpeed: 1.2 + Math.random() * 1.5,
            })
        }
    }

    /**
     * Update abyss visual effects
     */
    private updateAbyssEffects(deltaSeconds: number): void {
        // Fade in vignette
        this.abyssVignetteAlpha = Math.min(0.8, this.abyssVignetteAlpha + deltaSeconds * 2.5)

        // Update eyes
        for (const eye of this.abyssEyes) {
            eye.openness += (eye.targetOpenness - eye.openness) * deltaSeconds * 2.5
            eye.intensity = 0.5 + Math.sin(this.animTime * 3 + eye.phase) * 0.3
        }

        // Update tentacles - faster growth for better visibility
        // Also ensure targetLength never goes below minimum
        const minTargetLength = 80
        for (const tentacle of this.abyssTentacles) {
            // Ensure targetLength stays above minimum
            if (tentacle.targetLength < minTargetLength) {
                tentacle.targetLength = minTargetLength
            }
            tentacle.length += (tentacle.targetLength - tentacle.length) * deltaSeconds * 2.5
            // Ensure length never goes below a visible minimum
            if (tentacle.length < 10) {
                tentacle.length = Math.max(tentacle.length, 10)
            }
        }

        this.drawAbyssEffects()
    }

    /**
     * Draw abyss visual effects
     */
    private drawAbyssEffects(): void {
        if (!this.abyssEffectGraphics) return

        const g = this.abyssEffectGraphics
        g.clear()

        // Dark vignette
        g.rect(0, 0, this.width, this.height)
        g.fill({ color: 0x0a0510, alpha: this.abyssVignetteAlpha * 0.5 })

        // Radial gradient (darker at edges)
        for (let r = 0; r < 6; r++) {
            const radius = this.width * 0.12 + r * this.width * 0.12
            const alpha = (r / 6) * 0.5 * this.abyssVignetteAlpha
            g.ellipse(this.centerX, this.centerY, radius, radius * 0.7)
            g.fill({ color: 0x0a0510, alpha })
        }

        // Draw eyes on the background layer
        for (const eye of this.abyssEyes) {
            this.drawAbyssEye(g, eye)
        }

        // Draw tentacles on the TOP layer (above card and buttons)
        if (this.abyssTentacleGraphics) {
            const tg = this.abyssTentacleGraphics
            tg.clear()
            for (const tentacle of this.abyssTentacles) {
                this.drawAbyssTentacle(tg, tentacle)
            }
        }
    }

    /**
     * Draw a single abyss tentacle with enhanced visuals
     */
    private drawAbyssTentacle(g: Graphics, tentacle: AbyssTentacle): void {
        if (tentacle.length < 5) return

        const segments = 12
        const segmentLength = tentacle.length / segments
        // Pulsating width based on time
        const pulse = 1 + Math.sin(this.animTime * 3 + tentacle.phase) * 0.15
        const baseWidth = 16 * pulse

        // Store segment positions for multi-pass drawing
        const segmentPositions: { x: number; y: number; angle: number; width: number }[] = []

        let x = tentacle.startX
        let y = tentacle.startY
        let angle = tentacle.angle

        // Calculate all segment positions first
        for (let i = 0; i <= segments; i++) {
            const t = i / segments
            const width = baseWidth * (1 - t * 0.6)
            segmentPositions.push({ x, y, angle, width })

            if (i < segments) {
                // More dramatic wave with secondary oscillation
                const wave1 =
                    Math.sin(this.animTime * tentacle.waveSpeed + tentacle.phase + i * 0.5) * 12 * t
                const wave2 =
                    Math.sin(
                        this.animTime * tentacle.waveSpeed * 0.7 + tentacle.phase * 1.5 + i * 0.3
                    ) *
                    6 *
                    t
                const wave = wave1 + wave2

                // Curve toward center
                const toCenterX = this.centerX - x
                const toCenterY = this.centerY - y
                const toCenterAngle = Math.atan2(toCenterY, toCenterX)
                angle += (toCenterAngle - angle) * 0.1

                x += Math.cos(angle) * segmentLength + Math.cos(angle + Math.PI / 2) * wave
                y += Math.sin(angle) * segmentLength + Math.sin(angle + Math.PI / 2) * wave
            }
        }

        // Pass 1: Draw outer glow
        for (let i = 0; i < segments; i++) {
            const seg = segmentPositions[i]
            const nextSeg = segmentPositions[i + 1]
            const t = i / segments

            const glowWidth = seg.width * 1.8
            const perpX = (Math.cos(seg.angle + Math.PI / 2) * glowWidth) / 2
            const perpY = (Math.sin(seg.angle + Math.PI / 2) * glowWidth) / 2
            const nextPerpX = (Math.cos(nextSeg.angle + Math.PI / 2) * nextSeg.width * 1.8) / 2
            const nextPerpY = (Math.sin(nextSeg.angle + Math.PI / 2) * nextSeg.width * 1.8) / 2

            g.moveTo(seg.x + perpX, seg.y + perpY)
            g.lineTo(nextSeg.x + nextPerpX * 0.85, nextSeg.y + nextPerpY * 0.85)
            g.lineTo(nextSeg.x - nextPerpX * 0.85, nextSeg.y - nextPerpY * 0.85)
            g.lineTo(seg.x - perpX, seg.y - perpY)
            g.closePath()

            const glowR = Math.floor(0x6a + (0x2a - 0x6a) * t)
            const glowG = Math.floor(0x30 + (0x10 - 0x30) * t)
            const glowB = Math.floor(0x90 + (0x40 - 0x90) * t)
            const glowColor = (glowR << 16) | (glowG << 8) | glowB
            g.fill({ color: glowColor, alpha: 0.25 })
        }

        // Pass 2: Draw main tentacle body
        for (let i = 0; i < segments; i++) {
            const seg = segmentPositions[i]
            const nextSeg = segmentPositions[i + 1]
            const t = i / segments

            const perpX = (Math.cos(seg.angle + Math.PI / 2) * seg.width) / 2
            const perpY = (Math.sin(seg.angle + Math.PI / 2) * seg.width) / 2
            const nextPerpX = (Math.cos(nextSeg.angle + Math.PI / 2) * nextSeg.width) / 2
            const nextPerpY = (Math.sin(nextSeg.angle + Math.PI / 2) * nextSeg.width) / 2

            g.moveTo(seg.x + perpX, seg.y + perpY)
            g.lineTo(nextSeg.x + nextPerpX * 0.85, nextSeg.y + nextPerpY * 0.85)
            g.lineTo(nextSeg.x - nextPerpX * 0.85, nextSeg.y - nextPerpY * 0.85)
            g.lineTo(seg.x - perpX, seg.y - perpY)
            g.closePath()

            // Gradient from deep purple at base to dark at tip
            const bodyR = Math.floor(0x5a + (0x1a - 0x5a) * t)
            const bodyG = Math.floor(0x28 + (0x0a - 0x28) * t)
            const bodyB = Math.floor(0x78 + (0x20 - 0x78) * t)
            const tentacleColor = (bodyR << 16) | (bodyG << 8) | bodyB
            g.fill({ color: tentacleColor, alpha: 0.9 })
        }

        // Pass 3: Draw highlight/shine on one side
        for (let i = 0; i < segments; i++) {
            const seg = segmentPositions[i]
            const nextSeg = segmentPositions[i + 1]
            const t = i / segments

            const perpX = Math.cos(seg.angle + Math.PI / 2) * (seg.width * 0.35)
            const perpY = Math.sin(seg.angle + Math.PI / 2) * (seg.width * 0.35)
            const nextPerpX = Math.cos(nextSeg.angle + Math.PI / 2) * (nextSeg.width * 0.35)
            const nextPerpY = Math.sin(nextSeg.angle + Math.PI / 2) * (nextSeg.width * 0.35)

            g.moveTo(seg.x + perpX, seg.y + perpY)
            g.lineTo(nextSeg.x + nextPerpX, nextSeg.y + nextPerpY)
            g.lineTo(nextSeg.x + nextPerpX * 0.5, nextSeg.y + nextPerpY * 0.5)
            g.lineTo(seg.x + perpX * 0.5, seg.y + perpY * 0.5)
            g.closePath()

            const highlightR = Math.floor(0x8a + (0x3a - 0x8a) * t)
            const highlightG = Math.floor(0x40 + (0x18 - 0x40) * t)
            const highlightB = Math.floor(0x98 + (0x48 - 0x98) * t)
            const highlightColor = (highlightR << 16) | (highlightG << 8) | highlightB
            g.fill({ color: highlightColor, alpha: 0.4 * (1 - t * 0.5) })
        }

        // Pass 4: Draw suckers with glow
        for (let i = 2; i < segments; i += 2) {
            if (tentacle.length < 30) continue

            const seg = segmentPositions[i]
            const suckerSize = seg.width * 0.28
            const suckerPulse = 1 + Math.sin(this.animTime * 4 + tentacle.phase + i) * 0.2

            // Sucker glow
            g.circle(seg.x, seg.y, suckerSize * 1.5 * suckerPulse)
            g.fill({ color: 0x8a40a0, alpha: 0.2 })

            // Outer sucker ring
            g.circle(seg.x, seg.y, suckerSize * suckerPulse)
            g.fill({ color: 0x7a3890, alpha: 0.7 })

            // Inner dark hole
            g.circle(seg.x, seg.y, suckerSize * 0.5 * suckerPulse)
            g.fill({ color: 0x150810, alpha: 0.85 })

            // Tiny highlight
            g.circle(seg.x - suckerSize * 0.2, seg.y - suckerSize * 0.2, suckerSize * 0.15)
            g.fill({ color: 0xaa60b0, alpha: 0.5 })
        }
    }

    /**
     * Draw a single abyss eye - Simple red eye with vertical slit pupil
     */
    private drawAbyssEye(g: Graphics, eye: AbyssEye): void {
        if (eye.openness < 0.1) return

        const size = eye.size

        // Outer red glow
        g.ellipse(eye.x, eye.y, size * 1.3, size * 0.6 * eye.openness)
        g.fill({ color: 0xef4444, alpha: 0.3 * eye.intensity })

        // Main eye (red ellipse)
        g.ellipse(eye.x, eye.y, size, size * 0.45 * eye.openness)
        g.fill({ color: 0xdc2626, alpha: 0.8 * eye.intensity })

        // Vertical slit pupil
        const pupilW = size * 0.15
        const pupilH = size * 0.35 * eye.openness
        g.ellipse(eye.x, eye.y, pupilW, pupilH)
        g.fill({ color: 0x000000, alpha: 0.95 })
    }

    /**
     * Trigger eye/tentacle reaction when rank is revealed
     */
    private triggerAbyssReaction(): void {
        if (!this.data) return

        const rankConfig = getRankFromScore(this.data.score)
        const isGoodRank = rankConfig.rank === 'S' || rankConfig.rank === 'A'

        for (const eye of this.abyssEyes) {
            if (isGoodRank) {
                // Eyes widen in surprise/fear
                eye.targetOpenness = 1.4
                eye.intensity = 1
            } else {
                // Eyes narrow (disappointed/satisfied)
                eye.targetOpenness = 0.6
            }
        }

        // Tentacles react dramatically
        for (const tentacle of this.abyssTentacles) {
            if (isGoodRank) {
                // Tentacles recoil in fear/respect
                tentacle.targetLength *= 0.5
                tentacle.waveSpeed *= 1.5 // Faster retreat animation
            } else {
                // Tentacles reach hungrily closer (claiming the soul)
                tentacle.targetLength *= 1.5
                tentacle.waveSpeed *= 0.7 // Slower, more menacing
            }
        }
    }
}
