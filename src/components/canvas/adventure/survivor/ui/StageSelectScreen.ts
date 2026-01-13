import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { STAGES, StageConfig } from '../PhysicsModifiers'

export interface StageSelectContext {
    container: Container
    width: number
    height: number
}

export class StageSelectScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number

    // Selected stage
    private selectedIndex = 0

    // UI elements
    private stageCardContainer!: Container
    private stageNameText!: Text
    private stageDescText!: Text
    private formulaText!: Text
    private leftArrowBtn!: Container
    private rightArrowBtn!: Container
    private startButton!: Container
    private backButton!: Container

    // Animation state
    private animPhase = 0
    private isVisible = false

    // Callbacks
    onSelectStage?: (stageId: string) => void
    onBack?: () => void

    constructor(context: StageSelectContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    getSelectedStage(): StageConfig {
        return STAGES[this.selectedIndex]
    }

    /**
     * Show the stage selection screen
     */
    show(): void {
        this.isVisible = true
        this.animPhase = 0
        this.screenContainer.visible = true
        this.createUI()
    }

    /**
     * Hide the screen
     */
    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
    }

    /**
     * Update animations
     */
    update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animPhase += deltaSeconds

        // Card container subtle float animation
        if (this.stageCardContainer) {
            const baseY = 90
            const float = Math.sin(this.animPhase * 1.5) * 3
            this.stageCardContainer.position.y = baseY + float
        }

        // Arrow buttons subtle pulse
        if (this.leftArrowBtn && this.rightArrowBtn) {
            const arrowPulse = 1 + Math.sin(this.animPhase * 3) * 0.03
            if (this.leftArrowBtn.scale.x >= 0.9) {
                this.leftArrowBtn.scale.set(arrowPulse)
            }
            if (this.rightArrowBtn.scale.x >= 0.9) {
                this.rightArrowBtn.scale.set(arrowPulse)
            }
        }

        // Start button pulse
        if (this.startButton) {
            const pulse = 1 + Math.sin(this.animPhase * 3) * 0.02
            this.startButton.scale.set(pulse)
        }
    }

    /**
     * Reset the screen
     */
    reset(): void {
        this.hide()
        this.selectedIndex = 0
        this.animPhase = 0
    }

    private selectStage(index: number): void {
        if (this.selectedIndex === index) return
        this.selectedIndex = index
        this.createUI()
    }

    private selectNextStage(): void {
        const nextIndex = (this.selectedIndex + 1) % STAGES.length
        this.selectStage(nextIndex)
    }

    private selectPrevStage(): void {
        const prevIndex = (this.selectedIndex - 1 + STAGES.length) % STAGES.length
        this.selectStage(prevIndex)
    }

    private createUI(): void {
        this.screenContainer.removeChildren()

        const stage = STAGES[this.selectedIndex]

        // === THEME COLORS (based on stage) ===
        const bgTopColor = stage.bgColor
        const bgBottomColor = this.darkenColor(bgTopColor, 0.3)
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38
        const textMuted = 0x5a6b66
        const accentColor = stage.particleColor

        // Gradient background
        const bg = new Graphics()
        const bands = 8
        for (let i = 0; i < bands; i++) {
            const y = (i / bands) * this.height
            const h = this.height / bands + 1
            const blend = i / (bands - 1)
            const color = this.blendColors(bgTopColor, bgBottomColor, blend)
            bg.rect(0, y, this.width, h)
            bg.fill(color)
        }
        this.screenContainer.addChild(bg)

        // Subtle dot pattern
        const pattern = new Graphics()
        for (let row = 0; row < 35; row++) {
            for (let col = 0; col < 20; col++) {
                const px = col * 22 + (row % 2) * 11
                const py = row * 22
                pattern.circle(px, py, 1.5)
                pattern.fill({ color: 0xffffff, alpha: 0.06 })
            }
        }
        this.screenContainer.addChild(pattern)

        // Main card
        const cardX = 20
        const cardY = 30
        const cardWidth = this.width - 40
        const cardHeight = this.height - 100

        // Card shadow
        const cardShadow = new Graphics()
        cardShadow.roundRect(cardX + 4, cardY + 6, cardWidth, cardHeight, 16)
        cardShadow.fill({ color: cardShadowColor, alpha: 0.4 })
        this.screenContainer.addChild(cardShadow)

        // Card background
        const card = new Graphics()
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
        card.fill(cardBgColor)
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
        card.stroke({ color: accentColor, width: 3 })
        this.screenContainer.addChild(card)

        // Title
        const titleY = cardY + 25
        const titleText = new Text({
            text: 'SELECT STAGE',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: textDark,
                letterSpacing: 3,
            }),
        })
        titleText.anchor.set(0.5)
        titleText.position.set(this.centerX, titleY)
        this.screenContainer.addChild(titleText)

        // Stage preview area
        const stageAreaY = titleY + 35
        const stageAreaHeight = 120

        // Stage card container
        this.stageCardContainer = new Container()
        this.stageCardContainer.position.set(this.centerX, stageAreaY + 45)
        this.screenContainer.addChild(this.stageCardContainer)

        // Stage icon (large)
        const iconBg = new Graphics()
        iconBg.circle(0, -10, 40)
        iconBg.fill({ color: accentColor, alpha: 0.2 })
        iconBg.circle(0, -10, 40)
        iconBg.stroke({ color: accentColor, width: 2, alpha: 1 })
        this.stageCardContainer.addChild(iconBg)

        const iconText = new Text({
            text: stage.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 36,
                fontWeight: 'bold',
                fill: accentColor,
            }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(0, -10)
        this.stageCardContainer.addChild(iconText)

        // Stage name
        this.stageNameText = new Text({
            text: stage.nameKo.toUpperCase(),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: textDark,
                letterSpacing: 1,
            }),
        })
        this.stageNameText.anchor.set(0.5)
        this.stageNameText.position.set(0, 45)
        this.stageCardContainer.addChild(this.stageNameText)

        // Stage description (physics formula)
        this.stageDescText = new Text({
            text: stage.name,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: textMuted,
            }),
        })
        this.stageDescText.anchor.set(0.5)
        this.stageDescText.position.set(0, 62)
        this.stageCardContainer.addChild(this.stageDescText)

        // Arrow buttons
        this.leftArrowBtn = this.createArrowButton('<', this.centerX - 90, stageAreaY + 45, () => {
            this.selectPrevStage()
        })
        this.screenContainer.addChild(this.leftArrowBtn)

        this.rightArrowBtn = this.createArrowButton('>', this.centerX + 90, stageAreaY + 45, () => {
            this.selectNextStage()
        })
        this.screenContainer.addChild(this.rightArrowBtn)

        // Stage indicator (page dots)
        const dotsY = stageAreaY + stageAreaHeight + 5
        const dotGap = 12
        const totalDotsWidth = (STAGES.length - 1) * dotGap
        STAGES.forEach((s, i) => {
            const isSelected = i === this.selectedIndex
            const dot = new Graphics()
            const dotX = this.centerX - totalDotsWidth / 2 + i * dotGap
            dot.circle(dotX, dotsY, isSelected ? 4 : 3)
            dot.fill({
                color: isSelected ? textDark : textMuted,
                alpha: isSelected ? 1 : 0.4,
            })
            this.screenContainer.addChild(dot)
        })

        // Divider
        const dividerY = dotsY + 18
        const divider = new Graphics()
        divider.moveTo(cardX + 25, dividerY)
        divider.lineTo(cardX + cardWidth - 25, dividerY)
        divider.stroke({ color: textMuted, width: 1, alpha: 0.3 })
        this.screenContainer.addChild(divider)

        // Physics formula section
        const formulaSectionY = dividerY + 25
        const formulaLabel = new Text({
            text: 'PHYSICS',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: textMuted,
                letterSpacing: 2,
            }),
        })
        formulaLabel.anchor.set(0.5)
        formulaLabel.position.set(this.centerX, formulaSectionY)
        this.screenContainer.addChild(formulaLabel)

        // Formula display
        this.formulaText = new Text({
            text: stage.description,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: accentColor,
            }),
        })
        this.formulaText.anchor.set(0.5)
        this.formulaText.position.set(this.centerX, formulaSectionY + 35)
        this.screenContainer.addChild(this.formulaText)

        // Physics effect description
        const effectDescriptions: Record<string, string> = {
            normal: '표준 물리 법칙이 지배한다',
            'low-gravity': '중력체가 모든 것을 끌어당긴다',
            elastic: '반발 장벽이 모든 것을 튕겨낸다',
            momentum: '거대한 파괴자가 밀어붙인다',
            vortex: '블랙홀이 모든 것을 삼킨다',
        }

        const effectText = new Text({
            text: effectDescriptions[stage.id] || '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: textMuted,
                wordWrap: true,
                wordWrapWidth: cardWidth - 40,
                align: 'center',
            }),
        })
        effectText.anchor.set(0.5)
        effectText.position.set(this.centerX, formulaSectionY + 70)
        this.screenContainer.addChild(effectText)

        // Action buttons
        const btnY = this.height - 45
        const btnWidth = 100
        const btnGap = 15

        // START button (left)
        this.startButton = this.createActionButton(
            'START',
            this.centerX - btnWidth / 2 - btnGap / 2,
            btnY,
            btnWidth,
            0x5a9a91,
            () => {
                this.handleSelectStage()
            }
        )
        this.screenContainer.addChild(this.startButton)

        // BACK button (right)
        this.backButton = this.createActionButton(
            'BACK',
            this.centerX + btnWidth / 2 + btnGap / 2,
            btnY,
            btnWidth,
            0xc75050,
            () => this.onBack?.()
        )
        this.screenContainer.addChild(this.backButton)
    }

    private createArrowButton(
        symbol: string,
        x: number,
        y: number,
        onClick: () => void
    ): Container {
        const btn = new Container()
        btn.position.set(x, y)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        const btnSize = 40
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38
        const accentGold = 0xd4a574

        // Shadow
        const shadow = new Graphics()
        shadow.circle(2, 3, btnSize / 2)
        shadow.fill({ color: cardShadowColor, alpha: 0.3 })
        btn.addChild(shadow)

        // Button background
        const bg = new Graphics()
        bg.circle(0, 0, btnSize / 2)
        bg.fill(cardBgColor)
        bg.circle(0, 0, btnSize / 2)
        bg.stroke({ color: accentGold, width: 2 })
        btn.addChild(bg)

        // Arrow symbol
        const arrow = new Text({
            text: symbol,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        arrow.anchor.set(0.5)
        btn.addChild(arrow)

        btn.on('pointerdown', () => {
            btn.scale.set(0.9)
            onClick()
        })
        btn.on('pointerup', () => {
            btn.scale.set(1)
        })
        btn.on('pointerupoutside', () => {
            btn.scale.set(1)
        })

        return btn
    }

    private createActionButton(
        label: string,
        x: number,
        y: number,
        width: number,
        accentColor: number,
        onClick: () => void
    ): Container {
        const btn = new Container()
        btn.position.set(x, y)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        const height = 40
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 2, -height / 2 + 3, width, height, 10)
        shadow.fill({ color: cardShadowColor, alpha: 0.4 })
        btn.addChild(shadow)

        // Button background
        const bg = new Graphics()
        bg.roundRect(-width / 2, -height / 2, width, height, 10)
        bg.fill(cardBgColor)
        bg.roundRect(-width / 2, -height / 2, width, height, 10)
        bg.stroke({ color: accentColor, width: 2 })
        btn.addChild(bg)

        // Button text
        const btnText = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: textDark,
                letterSpacing: 2,
            }),
        })
        btnText.anchor.set(0.5)
        btn.addChild(btnText)

        btn.on('pointerdown', () => {
            btn.scale.set(0.95)
        })
        btn.on('pointerup', () => {
            btn.scale.set(1)
            onClick()
        })
        btn.on('pointerupoutside', () => {
            btn.scale.set(1)
        })

        return btn
    }

    private handleSelectStage(): void {
        const stage = STAGES[this.selectedIndex]
        this.hide()
        this.onSelectStage?.(stage.id)
    }

    private darkenColor(color: number, factor: number): number {
        const r = Math.round(((color >> 16) & 0xff) * (1 - factor))
        const g = Math.round(((color >> 8) & 0xff) * (1 - factor))
        const b = Math.round((color & 0xff) * (1 - factor))
        return (r << 16) | (g << 8) | b
    }

    private blendColors(color1: number, color2: number, blend: number): number {
        const r1 = (color1 >> 16) & 0xff
        const g1 = (color1 >> 8) & 0xff
        const b1 = color1 & 0xff
        const r2 = (color2 >> 16) & 0xff
        const g2 = (color2 >> 8) & 0xff
        const b2 = color2 & 0xff
        const r = Math.round(r1 + (r2 - r1) * blend)
        const g = Math.round(g1 + (g2 - g1) * blend)
        const b = Math.round(b1 + (b2 - b1) * blend)
        return (r << 16) | (g << 8) | b
    }
}
