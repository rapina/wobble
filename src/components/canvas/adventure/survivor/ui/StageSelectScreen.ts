import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { STAGES, StageConfig } from '../PhysicsModifiers'
import { t } from '@/utils/localization'
import {
    createBalatroButton,
    createBalatroCircleButton,
    BALATRO_COLORS,
    BALATRO_DESIGN,
    drawBalatroCard,
    drawBalatroBadge,
    drawCornerDots,
} from './BalatroButton'

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
            // baseY = cardY(15) + headerY_offset(35) + dotsY_offset(90) + 20 = 160
            const baseY = 160
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

        // Animate decorative dots
        if (this.decorDots) {
            this.decorDots.alpha = 0.3 + Math.sin(this.animPhase * 2) * 0.2
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

    // Decorative dots for animation
    private decorDots: Graphics | null = null

    private createUI(): void {
        this.screenContainer.removeChildren()

        const stage = STAGES[this.selectedIndex]
        const accentColor = stage.particleColor

        // Dark background with Balatro feel
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: BALATRO_COLORS.bgDark, alpha: 0.95 })
        this.screenContainer.addChild(bg)

        // Subtle dot pattern overlay
        const pattern = new Graphics()
        for (let x = 0; x < this.width; x += 20) {
            for (let y = 0; y < this.height; y += 20) {
                pattern.circle(x, y, 1)
                pattern.fill({ color: 0xffffff, alpha: 0.03 })
            }
        }
        this.screenContainer.addChild(pattern)

        // Main card
        const cardPadding = Math.min(15, this.width * 0.04)
        const cardX = cardPadding
        const cardY = cardPadding
        const cardWidth = this.width - cardPadding * 2
        const cardHeight = this.height - cardPadding * 2

        // Main card background using Balatro utility
        const card = new Graphics()
        drawBalatroCard(card, cardX, cardY, cardWidth, cardHeight, {
            bgColor: BALATRO_COLORS.bgCard,
            borderColor: accentColor,
            borderWidth: BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusLarge,
        })
        this.screenContainer.addChild(card)

        // Decorative corner dots
        this.decorDots = new Graphics()
        drawCornerDots(this.decorDots, cardX, cardY, cardWidth, cardHeight, accentColor)
        this.screenContainer.addChild(this.decorDots)

        // Title badge
        const badgeW = 160
        const badgeH = 32
        const badge = new Graphics()
        drawBalatroBadge(badge, this.centerX - badgeW / 2, cardY - 16, badgeW, badgeH, accentColor)
        this.screenContainer.addChild(badge)

        const titleText = new Text({
            text: 'SELECT STAGE',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: 0x000000,
                letterSpacing: BALATRO_DESIGN.letterSpacing,
            }),
        })
        titleText.anchor.set(0.5)
        titleText.position.set(this.centerX, cardY - 2)
        this.screenContainer.addChild(titleText)

        // ========== 1. HEADER SECTION ==========
        const headerY = cardY + 35

        // Stage icon (larger)
        const iconText = new Text({
            text: stage.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 48,
                fill: accentColor,
            }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(this.centerX, headerY + 25)
        this.screenContainer.addChild(iconText)

        // Stage name
        this.stageNameText = new Text({
            text: t(stage.name, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
                letterSpacing: 2,
            }),
        })
        this.stageNameText.anchor.set(0.5)
        this.stageNameText.position.set(this.centerX, headerY + 65)
        this.screenContainer.addChild(this.stageNameText)

        // Stage indicator (page dots)
        const dotsY = headerY + 90
        const dotGap = 20
        const totalDotsWidth = (STAGES.length - 1) * dotGap
        STAGES.forEach((s, i) => {
            const isSelected = i === this.selectedIndex
            const stageColor = STAGES[i].particleColor
            const dot = new Graphics()
            const dotX = this.centerX - totalDotsWidth / 2 + i * dotGap

            // Outer ring for selected
            if (isSelected) {
                dot.circle(dotX, dotsY, 9)
                dot.stroke({ color: stageColor, width: 2, alpha: 0.4 })
            }
            dot.circle(dotX, dotsY, isSelected ? 6 : 4)
            dot.fill({
                color: isSelected ? stageColor : BALATRO_COLORS.textMuted,
                alpha: isSelected ? 1 : 0.35,
            })
            this.screenContainer.addChild(dot)
        })

        // ========== 2. PREVIEW SECTION ==========
        const previewY = dotsY + 20
        const previewWidth = cardWidth - 60
        const previewHeight = 150
        const previewX = cardX + 30

        // Stage card container for floating animation
        this.stageCardContainer = new Container()
        this.stageCardContainer.position.set(previewX, previewY)
        this.screenContainer.addChild(this.stageCardContainer)

        // Preview background with stage color (using Balatro card style)
        const previewBg = new Graphics()
        drawBalatroCard(previewBg, 0, 0, previewWidth, previewHeight, {
            bgColor: stage.bgColor,
            borderColor: accentColor,
            borderWidth: BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusMedium,
        })
        this.stageCardContainer.addChild(previewBg)

        // Gradient overlay for depth
        const previewGradient = new Graphics()
        const gradientSteps = 8
        for (let i = 0; i < gradientSteps; i++) {
            const y = (i / gradientSteps) * previewHeight
            const h = previewHeight / gradientSteps + 1
            const alpha = 0.05 + (i / gradientSteps) * 0.25
            previewGradient.rect(0, y, previewWidth, h)
            previewGradient.fill({ color: 0x000000, alpha })
        }
        // Apply mask to gradient
        const previewMask = new Graphics()
        previewMask.roundRect(0, 0, previewWidth, previewHeight, BALATRO_DESIGN.radiusMedium)
        previewMask.fill(0xffffff)
        this.stageCardContainer.addChild(previewMask)
        previewGradient.mask = previewMask
        this.stageCardContainer.addChild(previewGradient)

        // Stage-specific visual elements
        this.drawStagePreviewElements(previewWidth, previewHeight, stage)

        // Arrow buttons (positioned below preview, wider spacing)
        const arrowY = previewY + previewHeight + 22
        const arrowSpacing = 70
        this.leftArrowBtn = createBalatroCircleButton({
            symbol: '<',
            size: 36,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectPrevStage(),
        })
        this.leftArrowBtn.position.set(this.centerX - arrowSpacing, arrowY)
        this.screenContainer.addChild(this.leftArrowBtn)

        this.rightArrowBtn = createBalatroCircleButton({
            symbol: '>',
            size: 36,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectNextStage(),
        })
        this.rightArrowBtn.position.set(this.centerX + arrowSpacing, arrowY)
        this.screenContainer.addChild(this.rightArrowBtn)

        // ========== 3. GIMMICK INFO SECTION ==========
        const infoY = arrowY + 38 // Below arrow buttons
        const infoBoxWidth = cardWidth - 40
        const infoBoxX = cardX + 20
        const infoBoxHeight = 100

        // Info box background using Balatro card style
        const infoBox = new Graphics()
        drawBalatroCard(infoBox, infoBoxX, infoY, infoBoxWidth, infoBoxHeight, {
            bgColor: BALATRO_COLORS.bgCardLight,
            borderColor: accentColor,
            borderWidth: 2,
            radius: BALATRO_DESIGN.radiusMedium,
        })
        this.screenContainer.addChild(infoBox)

        // Physics formula (large, centered)
        const formulaLabel = new Text({
            text: stage.description,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: accentColor,
            }),
        })
        formulaLabel.anchor.set(0.5)
        formulaLabel.position.set(this.centerX, infoY + 25)
        this.screenContainer.addChild(formulaLabel)
        this.formulaText = formulaLabel

        // Gimmick descriptions
        const gimmickDescriptions: Record<string, { title: string; desc: string }> = {
            normal: {
                title: '기본 물리',
                desc: '표준 물리 법칙이 적용됩니다. 3분간 생존하세요!',
            },
            // Additional stage descriptions will be added here after redesign
        }

        const gimmick = gimmickDescriptions[stage.id] || { title: '', desc: '' }

        // Gimmick title
        const gimmickTitle = new Text({
            text: gimmick.title,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
            }),
        })
        gimmickTitle.anchor.set(0.5)
        gimmickTitle.position.set(this.centerX, infoY + 50)
        this.screenContainer.addChild(gimmickTitle)
        this.stageDescText = gimmickTitle

        // Gimmick description
        const gimmickDesc = new Text({
            text: gimmick.desc,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: BALATRO_COLORS.textSecondary,
                wordWrap: true,
                wordWrapWidth: infoBoxWidth - 30,
                align: 'center',
                lineHeight: 14,
            }),
        })
        gimmickDesc.anchor.set(0.5, 0)
        gimmickDesc.position.set(this.centerX, infoY + 68)
        this.screenContainer.addChild(gimmickDesc)

        // ========== 4. DIFFICULTY INDICATOR ==========
        const difficultyY = infoY + infoBoxHeight + 12
        const difficulties: Record<string, { level: number; label: string }> = {
            normal: { level: 1, label: 'NORMAL' },
            // Additional difficulty ratings will be added here after redesign
        }
        const diff = difficulties[stage.id] || { level: 1, label: 'NORMAL' }

        // Difficulty label
        const diffLabel = new Text({
            text: 'DIFFICULTY',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textSecondary,
                letterSpacing: 1,
            }),
        })
        diffLabel.anchor.set(0.5)
        diffLabel.position.set(this.centerX, difficultyY)
        this.screenContainer.addChild(diffLabel)

        // Difficulty stars
        const starGap = 20
        const starsStartX = this.centerX - starGap
        for (let i = 0; i < 3; i++) {
            const starX = starsStartX + i * starGap
            const isFilled = i < diff.level
            const star = new Graphics()

            // Draw star shape
            const points: number[] = []
            for (let j = 0; j < 10; j++) {
                const angle = (j * Math.PI) / 5 - Math.PI / 2
                const radius = j % 2 === 0 ? 8 : 4
                points.push(starX + Math.cos(angle) * radius)
                points.push(difficultyY + 16 + Math.sin(angle) * radius)
            }
            star.poly(points)
            star.fill({ color: isFilled ? accentColor : BALATRO_COLORS.textMuted, alpha: isFilled ? 1 : 0.3 })
            this.screenContainer.addChild(star)
        }

        // Difficulty text
        const diffText = new Text({
            text: diff.label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: accentColor,
                letterSpacing: 1,
            }),
        })
        diffText.anchor.set(0.5)
        diffText.position.set(this.centerX, difficultyY + 34)
        this.screenContainer.addChild(diffText)

        // ========== 5. ACTION BUTTONS ==========
        const btnY = cardY + cardHeight - 40
        const btnWidth = 120
        const btnGap = 25

        // START button (Balatro blue)
        this.startButton = createBalatroButton({
            label: 'START',
            width: btnWidth,
            color: BALATRO_COLORS.blue,
            onClick: () => this.handleSelectStage(),
        })
        this.startButton.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        this.screenContainer.addChild(this.startButton)

        // BACK button (Balatro red)
        this.backButton = createBalatroButton({
            label: 'BACK',
            width: btnWidth,
            color: BALATRO_COLORS.red,
            onClick: () => this.onBack?.(),
        })
        this.backButton.position.set(this.centerX + btnWidth / 2 + btnGap / 2, btnY)
        this.screenContainer.addChild(this.backButton)
    }

    /**
     * Draw stage-specific visual elements in the preview
     */
    private drawStagePreviewElements(width: number, height: number, stage: StageConfig): void {
        const centerX = width / 2
        const centerY = height / 2
        const color = stage.particleColor

        switch (stage.id) {
            case 'normal': {
                // Peaceful floating particles
                for (let i = 0; i < 20; i++) {
                    const x = Math.random() * width
                    const y = Math.random() * height
                    const size = 2 + Math.random() * 3
                    const particle = new Graphics()
                    particle.circle(x, y, size)
                    particle.fill({ color, alpha: 0.3 + Math.random() * 0.3 })
                    this.stageCardContainer.addChild(particle)
                }
                break
            }
            case 'low-gravity': {
                // Gravity well visualization
                const wellRadius = 40
                for (let ring = 0; ring < 5; ring++) {
                    const r = wellRadius + ring * 15
                    const ringGfx = new Graphics()
                    ringGfx.circle(centerX, centerY, r)
                    ringGfx.stroke({ color, width: 1.5, alpha: 0.4 - ring * 0.08 })
                    this.stageCardContainer.addChild(ringGfx)
                }
                // Center glow
                const glow = new Graphics()
                glow.circle(centerX, centerY, 25)
                glow.fill({ color, alpha: 0.4 })
                this.stageCardContainer.addChild(glow)
                // Floating particles being pulled
                for (let i = 0; i < 15; i++) {
                    const angle = (i / 15) * Math.PI * 2
                    const dist = 50 + Math.random() * 40
                    const x = centerX + Math.cos(angle) * dist
                    const y = centerY + Math.sin(angle) * dist
                    const particle = new Graphics()
                    particle.circle(x, y, 3)
                    particle.fill({ color: 0xffffff, alpha: 0.6 })
                    this.stageCardContainer.addChild(particle)
                }
                break
            }
            case 'elastic': {
                // Bouncy barriers
                const barriers = [
                    { x: width * 0.2, y: height * 0.3, w: 60, h: 8 },
                    { x: width * 0.6, y: height * 0.5, w: 8, h: 50 },
                    { x: width * 0.3, y: height * 0.7, w: 50, h: 8 },
                    { x: width * 0.8, y: height * 0.2, w: 8, h: 40 },
                ]
                for (const b of barriers) {
                    const barrier = new Graphics()
                    barrier.roundRect(b.x, b.y, b.w, b.h, 4)
                    barrier.fill({ color, alpha: 0.8 })
                    barrier.roundRect(b.x, b.y, b.w, b.h, 4)
                    barrier.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
                    this.stageCardContainer.addChild(barrier)
                }
                // Bouncing particles
                for (let i = 0; i < 10; i++) {
                    const x = Math.random() * width
                    const y = Math.random() * height
                    const particle = new Graphics()
                    particle.circle(x, y, 4)
                    particle.fill({ color: 0xffffff, alpha: 0.7 })
                    this.stageCardContainer.addChild(particle)
                }
                break
            }
            case 'momentum': {
                // Crusher visualization
                const crusherWidth = 80
                const crusherHeight = 30
                const crusher = new Graphics()
                crusher.roundRect(centerX - crusherWidth / 2, centerY - crusherHeight / 2, crusherWidth, crusherHeight, 8)
                crusher.fill({ color, alpha: 0.9 })
                crusher.roundRect(centerX - crusherWidth / 2, centerY - crusherHeight / 2, crusherWidth, crusherHeight, 8)
                crusher.stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
                this.stageCardContainer.addChild(crusher)
                // Motion lines
                for (let i = 0; i < 5; i++) {
                    const lineX = centerX - crusherWidth / 2 - 20 - i * 8
                    const line = new Graphics()
                    line.moveTo(lineX, centerY - 10)
                    line.lineTo(lineX - 15, centerY)
                    line.lineTo(lineX, centerY + 10)
                    line.stroke({ color, width: 2, alpha: 0.5 - i * 0.1 })
                    this.stageCardContainer.addChild(line)
                }
                // Impact particles
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI - Math.PI / 2
                    const dist = 50 + Math.random() * 20
                    const x = centerX + crusherWidth / 2 + Math.cos(angle) * dist
                    const y = centerY + Math.sin(angle) * dist * 0.5
                    const particle = new Graphics()
                    particle.circle(x, y, 2 + Math.random() * 2)
                    particle.fill({ color: 0xffffff, alpha: 0.5 })
                    this.stageCardContainer.addChild(particle)
                }
                break
            }
            case 'vortex': {
                // Black hole visualization
                // Spiral arms
                for (let arm = 0; arm < 3; arm++) {
                    const startAngle = (arm / 3) * Math.PI * 2
                    for (let i = 0; i < 20; i++) {
                        const t = i / 20
                        const angle = startAngle + t * Math.PI * 1.5
                        const dist = 15 + t * 60
                        const x = centerX + Math.cos(angle) * dist
                        const y = centerY + Math.sin(angle) * dist
                        const particle = new Graphics()
                        particle.circle(x, y, 2 * (1 - t * 0.5))
                        particle.fill({ color, alpha: 0.6 * (1 - t * 0.5) })
                        this.stageCardContainer.addChild(particle)
                    }
                }
                // Event horizon
                const horizon = new Graphics()
                horizon.circle(centerX, centerY, 20)
                horizon.fill({ color: 0x000000, alpha: 0.9 })
                horizon.circle(centerX, centerY, 20)
                horizon.stroke({ color, width: 2, alpha: 0.8 })
                this.stageCardContainer.addChild(horizon)
                // Inner glow
                const innerGlow = new Graphics()
                innerGlow.circle(centerX, centerY, 8)
                innerGlow.fill({ color, alpha: 0.6 })
                this.stageCardContainer.addChild(innerGlow)
                break
            }
        }
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
