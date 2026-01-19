/**
 * MiniGameResultScreen.ts - Result screen for minigames
 * Supports multiple themes: 'default' (Balatro style) and 'abyss' (Wobblediver style)
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { getRankFromScore, RankConfig } from './MiniGameTypes'

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
    gold: 0xcc88ff,      // Eldritch purple-gold
    red: 0x8b2020,       // Blood red
    blue: 0x6a3d7a,      // Deep purple
    cyan: 0x9b59b6,      // Purple
    bgCard: 0x1a0a20,    // Very dark purple
    bgDark: 0x0a0510,    // Almost black with purple tint
    border: 0x3d1a50,    // Purple border
    textPrimary: 0xeeddff,  // Pale purple-white
    textSecondary: 0x8877aa, // Muted purple
    accent: 0xcc88ff,    // Bright purple
    glow: 0x6a3080,      // Purple glow
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
    private abyssEyes: AbyssEye[] = []
    private abyssTentacles: AbyssTentacle[] = []
    private abyssVignetteAlpha = 0

    // Callbacks
    onRetry?: () => void
    onExit?: () => void

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
            const cardDelay = this.theme === 'abyss' ? 0.3 : 0.1  // Delay card for abyss darkness
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

                // Abyss eye reaction on rank reveal
                if (this.theme === 'abyss' && rankProgress >= 1 && rankProgress < 1.05) {
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
    }

    private createUI(): void {
        if (!this.data) return

        const c = this.colors

        // Dark background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(c.bgDark)
        this.screenContainer.addChild(bg)

        // Abyss theme: add effect graphics layer (behind card)
        if (this.theme === 'abyss') {
            this.abyssEffectGraphics = new Graphics()
            this.screenContainer.addChild(this.abyssEffectGraphics)
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
            cardShadow.roundRect(this.cardX + 6, this.cardY + 8, this.cardWidth, this.cardHeight, 16)
            cardShadow.fill({ color: 0x8b0000, alpha: 0.4 })
        }
        cardShadow.roundRect(this.cardX + 4, this.cardY + 6, this.cardWidth, this.cardHeight, 16)
        cardShadow.fill(0x000000)
        this.card.addChild(cardShadow)

        // Card background with theme-specific styling
        const cardBg = new Graphics()
        if (this.theme === 'abyss') {
            // Outer glow
            cardBg.roundRect(this.cardX - 4, this.cardY - 4, this.cardWidth + 8, this.cardHeight + 8, 18)
            cardBg.fill({ color: c.glow, alpha: 0.3 })
        }
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.fill(c.bgCard)
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.stroke({ color: this.theme === 'abyss' ? c.accent : c.gold, width: 3 })
        this.card.addChild(cardBg)

        // Title badge
        const badgeWidth = this.theme === 'abyss' ? 160 : 140
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
        rankShadow.roundRect(-rankBoxSize / 2 + 2, -rankBoxSize / 2 + 4, rankBoxSize, rankBoxSize, 12)
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
            'S': '심연이 두려워한다',
            'A': '인상적인 저항',
            'B': '쓸만한 먹이',
            'C': '평범한 제물',
            'D': '보잘것없는 영혼',
        }
        const rankMessage = new Text({
            text: this.theme === 'abyss' ? (abyssMessages[rankConfig.rank] || rankConfig.message) : rankConfig.message,
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

        const btnY = this.centerY + this.cardHeight / 2 + 40
        const btnWidth = 100
        const btnGap = 16

        // Theme-specific button colors
        const retryColor = this.theme === 'abyss' ? c.blue : COLORS.blue
        const exitColor = this.theme === 'abyss' ? c.red : COLORS.red

        // Retry button
        const retryLabel = this.theme === 'abyss' ? 'DESCEND' : 'RETRY'
        const retryBtn = this.createButton(retryLabel, btnWidth, 40, retryColor)
        retryBtn.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        retryBtn.eventMode = 'static'
        retryBtn.cursor = 'pointer'
        retryBtn.on('pointertap', () => this.onRetry?.())
        this.buttonsContainer.addChild(retryBtn)

        // Exit button
        const exitLabel = this.theme === 'abyss' ? 'FLEE' : 'EXIT'
        const exitBtn = this.createButton(exitLabel, btnWidth, 40, exitColor)
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

        // Create tentacles reaching from edges
        const tentacleCount = 10
        for (let i = 0; i < tentacleCount; i++) {
            const side = i % 4
            let x: number, y: number, angle: number
            switch (side) {
                case 0:  // Top
                    x = this.width * 0.1 + Math.random() * this.width * 0.8
                    y = 0
                    angle = Math.PI / 2 + (Math.random() - 0.5) * 0.4
                    break
                case 1:  // Right
                    x = this.width
                    y = this.height * 0.1 + Math.random() * this.height * 0.8
                    angle = Math.PI + (Math.random() - 0.5) * 0.4
                    break
                case 2:  // Bottom
                    x = this.width * 0.1 + Math.random() * this.width * 0.8
                    y = this.height
                    angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4
                    break
                default:  // Left
                    x = 0
                    y = this.height * 0.1 + Math.random() * this.height * 0.8
                    angle = (Math.random() - 0.5) * 0.4
                    break
            }
            this.abyssTentacles.push({
                startX: x,
                startY: y,
                angle,
                length: 0,
                targetLength: 60 + Math.random() * 80,
                phase: Math.random() * Math.PI * 2,
                waveSpeed: 2 + Math.random() * 2,
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

        // Update tentacles
        for (const tentacle of this.abyssTentacles) {
            tentacle.length += (tentacle.targetLength - tentacle.length) * deltaSeconds * 1.5
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

        // Draw tentacles
        for (const tentacle of this.abyssTentacles) {
            this.drawAbyssTentacle(g, tentacle)
        }

        // Draw eyes
        for (const eye of this.abyssEyes) {
            this.drawAbyssEye(g, eye)
        }
    }

    /**
     * Draw a single abyss tentacle
     */
    private drawAbyssTentacle(g: Graphics, tentacle: AbyssTentacle): void {
        if (tentacle.length < 5) return

        const segments = 8
        const segmentLength = tentacle.length / segments
        const baseWidth = 12

        let x = tentacle.startX
        let y = tentacle.startY
        let angle = tentacle.angle

        for (let i = 0; i < segments; i++) {
            const t = i / segments
            const width = baseWidth * (1 - t * 0.7)
            const wave = Math.sin(this.animTime * tentacle.waveSpeed + tentacle.phase + i * 0.4) * 8 * t

            // Curve toward center
            const toCenterX = this.centerX - x
            const toCenterY = this.centerY - y
            const toCenterAngle = Math.atan2(toCenterY, toCenterX)
            angle += (toCenterAngle - angle) * 0.08

            const nextX = x + Math.cos(angle) * segmentLength + Math.cos(angle + Math.PI / 2) * wave
            const nextY = y + Math.sin(angle) * segmentLength + Math.sin(angle + Math.PI / 2) * wave

            // Draw segment
            const perpX = Math.cos(angle + Math.PI / 2) * width / 2
            const perpY = Math.sin(angle + Math.PI / 2) * width / 2

            g.moveTo(x + perpX, y + perpY)
            g.lineTo(nextX + perpX * 0.8, nextY + perpY * 0.8)
            g.lineTo(nextX - perpX * 0.8, nextY - perpY * 0.8)
            g.lineTo(x - perpX, y - perpY)
            g.closePath()

            const colorT = t
            const r = Math.floor(0x4a + (0x1a - 0x4a) * colorT)
            const gr = Math.floor(0x20 + (0x0a - 0x20) * colorT)
            const b = Math.floor(0x60 + (0x20 - 0x60) * colorT)
            const tentacleColor = (r << 16) | (gr << 8) | b
            g.fill({ color: tentacleColor, alpha: 0.85 })

            // Suckers
            if (i > 1 && i % 2 === 0 && tentacle.length > 30) {
                g.circle(x, y, width * 0.25)
                g.fill({ color: 0x6a3080, alpha: 0.5 })
                g.circle(x, y, width * 0.12)
                g.fill({ color: 0x1a0a20, alpha: 0.7 })
            }

            x = nextX
            y = nextY
        }
    }

    /**
     * Draw a single abyss eye
     */
    private drawAbyssEye(g: Graphics, eye: AbyssEye): void {
        if (eye.openness < 0.1) return

        const size = eye.size

        // Outer glow
        const glowColor = 0x6a3080
        g.ellipse(eye.x, eye.y, size + 12, (size + 12) * 0.5 * eye.openness)
        g.fill({ color: glowColor, alpha: 0.2 * eye.intensity })

        g.ellipse(eye.x, eye.y, size + 6, (size + 6) * 0.5 * eye.openness)
        g.fill({ color: glowColor, alpha: 0.35 * eye.intensity })

        // Eye white
        g.ellipse(eye.x, eye.y, size, size * 0.5 * eye.openness)
        g.fill({ color: 0xeeeedd, alpha: 0.85 })

        // Iris
        const irisSize = size * 0.65
        const lookDist = size * 0.15
        const pupilX = eye.x + Math.cos(eye.lookAngle) * lookDist
        const pupilY = eye.y + Math.sin(eye.lookAngle) * lookDist * eye.openness

        g.ellipse(pupilX, pupilY, irisSize, irisSize * 0.5 * eye.openness)
        g.fill({ color: 0xaa1133, alpha: 0.95 })

        // Pupil
        const pupilSize = irisSize * 0.4
        g.ellipse(pupilX, pupilY, pupilSize, pupilSize * 0.5 * eye.openness)
        g.fill({ color: 0x000000, alpha: 0.98 })

        // Highlight
        g.circle(pupilX - pupilSize * 0.4, pupilY - pupilSize * 0.2 * eye.openness, pupilSize * 0.25)
        g.fill({ color: 0xffffff, alpha: 0.8 })
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

        for (const tentacle of this.abyssTentacles) {
            if (isGoodRank) {
                // Tentacles recoil
                tentacle.targetLength *= 0.7
            } else {
                // Tentacles reach closer (claiming the soul)
                tentacle.targetLength *= 1.3
            }
        }
    }
}
