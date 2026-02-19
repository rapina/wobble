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

    // Static UI elements (created once)
    private staticContainer: Container | null = null
    private dynamicContainer: Container | null = null

    // Dynamic UI elements (updated on stage change)
    private stageCardContainer!: Container
    private stageNameText!: Text
    private stageDescText!: Text
    private formulaText!: Text
    private gimmickDescText!: Text
    private leftArrowBtn!: Container
    private rightArrowBtn!: Container
    private startButton!: Container
    private backButton!: Container
    private iconText!: Text
    private dotsContainer!: Container
    private diffText!: Text
    private starsContainer!: Container

    // Pre-created stage preview containers
    private stagePreviewContainers: Map<string, Container> = new Map()

    // Animation state
    private animPhase = 0
    private isVisible = false
    private isInitialized = false

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

        if (!this.isInitialized) {
            this.createStaticUI()
            this.createDynamicUI()
            this.isInitialized = true
        }
        this.updateStageUI()
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
        this.updateStageUI()
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
    // Card border graphics for color updates
    private cardBorder: Graphics | null = null
    private badgeGraphics: Graphics | null = null
    private infoBoxBorder: Graphics | null = null
    private previewBg: Graphics | null = null

    // Layout constants (calculated once)
    private cardPadding = 0
    private cardX = 0
    private cardY = 0
    private cardWidth = 0
    private cardHeight = 0
    private headerY = 0
    private dotsY = 0
    private previewY = 0
    private previewWidth = 0
    private previewHeight = 0
    private previewX = 0
    private arrowY = 0
    private infoY = 0
    private infoBoxWidth = 0
    private infoBoxX = 0
    private infoBoxHeight = 100
    private difficultyY = 0

    /**
     * Create static UI elements (called once)
     */
    private createStaticUI(): void {
        // Calculate layout constants
        this.cardPadding = Math.min(15, this.width * 0.04)
        this.cardX = this.cardPadding
        this.cardY = this.cardPadding
        this.cardWidth = this.width - this.cardPadding * 2
        this.cardHeight = this.height - this.cardPadding * 2
        this.headerY = this.cardY + 35
        this.dotsY = this.headerY + 90
        this.previewY = this.dotsY + 20
        this.previewWidth = this.cardWidth - 60
        this.previewHeight = 150
        this.previewX = this.cardX + 30
        this.arrowY = this.previewY + this.previewHeight + 22
        this.infoY = this.arrowY + 38
        this.infoBoxWidth = this.cardWidth - 40
        this.infoBoxX = this.cardX + 20
        this.difficultyY = this.infoY + this.infoBoxHeight + 12

        // Static container
        this.staticContainer = new Container()
        this.screenContainer.addChild(this.staticContainer)

        // Dark background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: BALATRO_COLORS.bgDark, alpha: 0.95 })
        this.staticContainer.addChild(bg)

        // Simplified dot pattern (larger spacing for performance)
        const pattern = new Graphics()
        for (let x = 0; x < this.width; x += 40) {
            for (let y = 0; y < this.height; y += 40) {
                pattern.circle(x, y, 1)
            }
        }
        pattern.fill({ color: 0xffffff, alpha: 0.03 })
        this.staticContainer.addChild(pattern)

        // Main card background (border color will be updated)
        const cardBg = new Graphics()
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, BALATRO_DESIGN.radiusLarge)
        cardBg.fill({ color: BALATRO_COLORS.bgCard })
        this.staticContainer.addChild(cardBg)

        // Card border (separate for color updates)
        this.cardBorder = new Graphics()
        this.staticContainer.addChild(this.cardBorder)

        // Decorative corner dots
        this.decorDots = new Graphics()
        this.staticContainer.addChild(this.decorDots)

        // Title badge background
        const badgeW = 160
        const badgeH = 32
        this.badgeGraphics = new Graphics()
        this.staticContainer.addChild(this.badgeGraphics)

        // Title text
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
        titleText.position.set(this.centerX, this.cardY - 2)
        this.staticContainer.addChild(titleText)

        // Difficulty label (static)
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
        diffLabel.position.set(this.centerX, this.difficultyY)
        this.staticContainer.addChild(diffLabel)

        // Pre-create all stage preview containers
        this.createAllStagePreviews()
    }

    /**
     * Create dynamic UI elements (called once)
     */
    private createDynamicUI(): void {
        this.dynamicContainer = new Container()
        this.screenContainer.addChild(this.dynamicContainer)

        // Stage icon
        this.iconText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 48,
                fill: 0xffffff,
            }),
        })
        this.iconText.anchor.set(0.5)
        this.iconText.position.set(this.centerX, this.headerY + 25)
        this.dynamicContainer.addChild(this.iconText)

        // Stage name
        this.stageNameText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
                letterSpacing: 2,
            }),
        })
        this.stageNameText.anchor.set(0.5)
        this.stageNameText.position.set(this.centerX, this.headerY + 65)
        this.dynamicContainer.addChild(this.stageNameText)

        // Stage indicator dots container
        this.dotsContainer = new Container()
        this.dynamicContainer.addChild(this.dotsContainer)

        // Stage card container for floating animation
        this.stageCardContainer = new Container()
        this.stageCardContainer.position.set(this.previewX, this.previewY)
        this.dynamicContainer.addChild(this.stageCardContainer)

        // Preview background
        this.previewBg = new Graphics()
        this.stageCardContainer.addChild(this.previewBg)

        // Gradient overlay
        const previewGradient = new Graphics()
        const gradientSteps = 8
        for (let i = 0; i < gradientSteps; i++) {
            const y = (i / gradientSteps) * this.previewHeight
            const h = this.previewHeight / gradientSteps + 1
            const alpha = 0.05 + (i / gradientSteps) * 0.25
            previewGradient.rect(0, y, this.previewWidth, h)
            previewGradient.fill({ color: 0x000000, alpha })
        }
        const previewMask = new Graphics()
        previewMask.roundRect(0, 0, this.previewWidth, this.previewHeight, BALATRO_DESIGN.radiusMedium)
        previewMask.fill(0xffffff)
        this.stageCardContainer.addChild(previewMask)
        previewGradient.mask = previewMask
        this.stageCardContainer.addChild(previewGradient)

        // Arrow buttons
        const arrowSpacing = 70
        this.leftArrowBtn = createBalatroCircleButton({
            symbol: '<',
            size: 36,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectPrevStage(),
        })
        this.leftArrowBtn.position.set(this.centerX - arrowSpacing, this.arrowY)
        this.dynamicContainer.addChild(this.leftArrowBtn)

        this.rightArrowBtn = createBalatroCircleButton({
            symbol: '>',
            size: 36,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectNextStage(),
        })
        this.rightArrowBtn.position.set(this.centerX + arrowSpacing, this.arrowY)
        this.dynamicContainer.addChild(this.rightArrowBtn)

        // Info box background
        const infoBoxBg = new Graphics()
        infoBoxBg.roundRect(this.infoBoxX, this.infoY, this.infoBoxWidth, this.infoBoxHeight, BALATRO_DESIGN.radiusMedium)
        infoBoxBg.fill({ color: BALATRO_COLORS.bgCardLight })
        this.dynamicContainer.addChild(infoBoxBg)

        // Info box border (for color updates)
        this.infoBoxBorder = new Graphics()
        this.dynamicContainer.addChild(this.infoBoxBorder)

        // Formula text
        this.formulaText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        this.formulaText.anchor.set(0.5)
        this.formulaText.position.set(this.centerX, this.infoY + 25)
        this.dynamicContainer.addChild(this.formulaText)

        // Gimmick title
        this.stageDescText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
            }),
        })
        this.stageDescText.anchor.set(0.5)
        this.stageDescText.position.set(this.centerX, this.infoY + 50)
        this.dynamicContainer.addChild(this.stageDescText)

        // Gimmick description
        this.gimmickDescText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: BALATRO_COLORS.textSecondary,
                wordWrap: true,
                wordWrapWidth: this.infoBoxWidth - 30,
                align: 'center',
                lineHeight: 14,
            }),
        })
        this.gimmickDescText.anchor.set(0.5, 0)
        this.gimmickDescText.position.set(this.centerX, this.infoY + 68)
        this.dynamicContainer.addChild(this.gimmickDescText)

        // Stars container
        this.starsContainer = new Container()
        this.dynamicContainer.addChild(this.starsContainer)

        // Difficulty text
        this.diffText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: 0xffffff,
                letterSpacing: 1,
            }),
        })
        this.diffText.anchor.set(0.5)
        this.diffText.position.set(this.centerX, this.difficultyY + 34)
        this.dynamicContainer.addChild(this.diffText)

        // Action buttons
        const btnY = this.cardY + this.cardHeight - 40
        const btnWidth = 120
        const btnGap = 25

        this.startButton = createBalatroButton({
            label: 'START',
            width: btnWidth,
            color: BALATRO_COLORS.blue,
            onClick: () => this.handleSelectStage(),
        })
        this.startButton.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        this.dynamicContainer.addChild(this.startButton)

        this.backButton = createBalatroButton({
            label: 'BACK',
            width: btnWidth,
            color: BALATRO_COLORS.red,
            onClick: () => this.onBack?.(),
        })
        this.backButton.position.set(this.centerX + btnWidth / 2 + btnGap / 2, btnY)
        this.dynamicContainer.addChild(this.backButton)
    }

    /**
     * Pre-create all stage preview containers
     */
    private createAllStagePreviews(): void {
        for (const stage of STAGES) {
            const container = new Container()
            container.visible = false
            this.drawStagePreviewElements(this.previewWidth, this.previewHeight, stage, container)
            this.stagePreviewContainers.set(stage.id, container)
        }
    }

    /**
     * Update stage-specific UI elements (called on stage change)
     */
    private updateStageUI(): void {
        const stage = STAGES[this.selectedIndex]
        const accentColor = stage.particleColor

        // Update card border
        if (this.cardBorder) {
            this.cardBorder.clear()
            this.cardBorder.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, BALATRO_DESIGN.radiusLarge)
            this.cardBorder.stroke({ color: accentColor, width: BALATRO_DESIGN.borderWidth })
        }

        // Update decorative dots
        if (this.decorDots) {
            this.decorDots.clear()
            drawCornerDots(this.decorDots, this.cardX, this.cardY, this.cardWidth, this.cardHeight, accentColor)
        }

        // Update badge
        if (this.badgeGraphics) {
            this.badgeGraphics.clear()
            const badgeW = 160
            const badgeH = 32
            drawBalatroBadge(this.badgeGraphics, this.centerX - badgeW / 2, this.cardY - 16, badgeW, badgeH, accentColor)
        }

        // Update icon
        this.iconText.text = stage.icon
        this.iconText.style.fill = accentColor

        // Update stage name
        this.stageNameText.text = t(stage.name, 'ko')

        // Update dots
        this.dotsContainer.removeChildren()
        const dotGap = 20
        const totalDotsWidth = (STAGES.length - 1) * dotGap
        STAGES.forEach((s, i) => {
            const isSelected = i === this.selectedIndex
            const stageColor = STAGES[i].particleColor
            const dot = new Graphics()
            const dotX = this.centerX - totalDotsWidth / 2 + i * dotGap

            if (isSelected) {
                dot.circle(dotX, this.dotsY, 9)
                dot.stroke({ color: stageColor, width: 2, alpha: 0.4 })
            }
            dot.circle(dotX, this.dotsY, isSelected ? 6 : 4)
            dot.fill({
                color: isSelected ? stageColor : BALATRO_COLORS.textMuted,
                alpha: isSelected ? 1 : 0.35,
            })
            this.dotsContainer.addChild(dot)
        })

        // Update preview background
        if (this.previewBg) {
            this.previewBg.clear()
            drawBalatroCard(this.previewBg, 0, 0, this.previewWidth, this.previewHeight, {
                bgColor: stage.bgColor,
                borderColor: accentColor,
                borderWidth: BALATRO_DESIGN.borderWidth,
                radius: BALATRO_DESIGN.radiusMedium,
            })
        }

        // Show/hide stage previews
        for (const [stageId, container] of this.stagePreviewContainers) {
            if (stageId === stage.id) {
                container.visible = true
                if (!container.parent) {
                    this.stageCardContainer.addChild(container)
                }
            } else {
                container.visible = false
            }
        }

        // Update info box border
        if (this.infoBoxBorder) {
            this.infoBoxBorder.clear()
            this.infoBoxBorder.roundRect(this.infoBoxX, this.infoY, this.infoBoxWidth, this.infoBoxHeight, BALATRO_DESIGN.radiusMedium)
            this.infoBoxBorder.stroke({ color: accentColor, width: 2 })
        }

        // Update formula text
        this.formulaText.text = stage.description
        this.formulaText.style.fill = accentColor

        // Update gimmick info
        const gimmickDescriptions: Record<string, { title: string; desc: string }> = {
            normal: {
                title: '기본 물리',
                desc: '표준 물리 법칙이 적용됩니다. 3분간 생존하세요!',
            },
        }
        const gimmick = gimmickDescriptions[stage.id] || { title: '', desc: '' }
        this.stageDescText.text = gimmick.title
        this.gimmickDescText.text = gimmick.desc

        // Update difficulty
        const difficulties: Record<string, { level: number; label: string }> = {
            normal: { level: 1, label: 'NORMAL' },
        }
        const diff = difficulties[stage.id] || { level: 1, label: 'NORMAL' }

        // Update stars
        this.starsContainer.removeChildren()
        const starGap = 20
        const starsStartX = this.centerX - starGap
        for (let i = 0; i < 3; i++) {
            const starX = starsStartX + i * starGap
            const isFilled = i < diff.level
            const star = new Graphics()

            const points: number[] = []
            for (let j = 0; j < 10; j++) {
                const angle = (j * Math.PI) / 5 - Math.PI / 2
                const radius = j % 2 === 0 ? 8 : 4
                points.push(starX + Math.cos(angle) * radius)
                points.push(this.difficultyY + 16 + Math.sin(angle) * radius)
            }
            star.poly(points)
            star.fill({
                color: isFilled ? accentColor : BALATRO_COLORS.textMuted,
                alpha: isFilled ? 1 : 0.3,
            })
            this.starsContainer.addChild(star)
        }

        this.diffText.text = diff.label
        this.diffText.style.fill = accentColor
    }

    /**
     * Draw stage-specific visual elements in the preview
     */
    private drawStagePreviewElements(width: number, height: number, stage: StageConfig, container: Container): void {
        const centerX = width / 2
        const centerY = height / 2
        const color = stage.particleColor

        switch (stage.id) {
            case 'normal': {
                // Peaceful floating particles (reduced count)
                for (let i = 0; i < 12; i++) {
                    const x = Math.random() * width
                    const y = Math.random() * height
                    const size = 2 + Math.random() * 3
                    const particle = new Graphics()
                    particle.circle(x, y, size)
                    particle.fill({ color, alpha: 0.3 + Math.random() * 0.3 })
                    container.addChild(particle)
                }
                break
            }
            case 'low-gravity': {
                // Gravity well visualization (reduced rings)
                const wellRadius = 40
                for (let ring = 0; ring < 4; ring++) {
                    const r = wellRadius + ring * 18
                    const ringGfx = new Graphics()
                    ringGfx.circle(centerX, centerY, r)
                    ringGfx.stroke({ color, width: 1.5, alpha: 0.4 - ring * 0.1 })
                    container.addChild(ringGfx)
                }
                // Center glow
                const glow = new Graphics()
                glow.circle(centerX, centerY, 25)
                glow.fill({ color, alpha: 0.4 })
                container.addChild(glow)
                // Floating particles (reduced count)
                for (let i = 0; i < 10; i++) {
                    const angle = (i / 10) * Math.PI * 2
                    const dist = 50 + Math.random() * 40
                    const x = centerX + Math.cos(angle) * dist
                    const y = centerY + Math.sin(angle) * dist
                    const particle = new Graphics()
                    particle.circle(x, y, 3)
                    particle.fill({ color: 0xffffff, alpha: 0.6 })
                    container.addChild(particle)
                }
                break
            }
            case 'elastic': {
                // Bouncy barriers
                const barriers = [
                    { x: width * 0.2, y: height * 0.3, w: 60, h: 8 },
                    { x: width * 0.6, y: height * 0.5, w: 8, h: 50 },
                    { x: width * 0.3, y: height * 0.7, w: 50, h: 8 },
                ]
                for (const b of barriers) {
                    const barrier = new Graphics()
                    barrier.roundRect(b.x, b.y, b.w, b.h, 4)
                    barrier.fill({ color, alpha: 0.8 })
                    barrier.roundRect(b.x, b.y, b.w, b.h, 4)
                    barrier.stroke({ color: 0xffffff, width: 1, alpha: 0.5 })
                    container.addChild(barrier)
                }
                // Bouncing particles (reduced count)
                for (let i = 0; i < 6; i++) {
                    const x = Math.random() * width
                    const y = Math.random() * height
                    const particle = new Graphics()
                    particle.circle(x, y, 4)
                    particle.fill({ color: 0xffffff, alpha: 0.7 })
                    container.addChild(particle)
                }
                break
            }
            case 'momentum': {
                // Crusher visualization
                const crusherWidth = 80
                const crusherHeight = 30
                const crusher = new Graphics()
                crusher.roundRect(
                    centerX - crusherWidth / 2,
                    centerY - crusherHeight / 2,
                    crusherWidth,
                    crusherHeight,
                    8
                )
                crusher.fill({ color, alpha: 0.9 })
                crusher.roundRect(
                    centerX - crusherWidth / 2,
                    centerY - crusherHeight / 2,
                    crusherWidth,
                    crusherHeight,
                    8
                )
                crusher.stroke({ color: 0xffffff, width: 2, alpha: 0.5 })
                container.addChild(crusher)
                // Motion lines (reduced count)
                for (let i = 0; i < 3; i++) {
                    const lineX = centerX - crusherWidth / 2 - 20 - i * 12
                    const line = new Graphics()
                    line.moveTo(lineX, centerY - 10)
                    line.lineTo(lineX - 15, centerY)
                    line.lineTo(lineX, centerY + 10)
                    line.stroke({ color, width: 2, alpha: 0.5 - i * 0.15 })
                    container.addChild(line)
                }
                // Impact particles (reduced count)
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI - Math.PI / 2
                    const dist = 50 + Math.random() * 20
                    const x = centerX + crusherWidth / 2 + Math.cos(angle) * dist
                    const y = centerY + Math.sin(angle) * dist * 0.5
                    const particle = new Graphics()
                    particle.circle(x, y, 2 + Math.random() * 2)
                    particle.fill({ color: 0xffffff, alpha: 0.5 })
                    container.addChild(particle)
                }
                break
            }
            case 'vortex': {
                // Black hole visualization (reduced spiral detail)
                for (let arm = 0; arm < 3; arm++) {
                    const startAngle = (arm / 3) * Math.PI * 2
                    for (let i = 0; i < 12; i++) {
                        const t = i / 12
                        const angle = startAngle + t * Math.PI * 1.5
                        const dist = 15 + t * 60
                        const x = centerX + Math.cos(angle) * dist
                        const y = centerY + Math.sin(angle) * dist
                        const particle = new Graphics()
                        particle.circle(x, y, 2 * (1 - t * 0.5))
                        particle.fill({ color, alpha: 0.6 * (1 - t * 0.5) })
                        container.addChild(particle)
                    }
                }
                // Event horizon
                const horizon = new Graphics()
                horizon.circle(centerX, centerY, 20)
                horizon.fill({ color: 0x000000, alpha: 0.9 })
                horizon.circle(centerX, centerY, 20)
                horizon.stroke({ color, width: 2, alpha: 0.8 })
                container.addChild(horizon)
                // Inner glow
                const innerGlow = new Graphics()
                innerGlow.circle(centerX, centerY, 8)
                innerGlow.fill({ color, alpha: 0.6 })
                container.addChild(innerGlow)
                break
            }
        }
    }

    private handleSelectStage(): void {
        const stage = STAGES[this.selectedIndex]
        this.hide()
        this.onSelectStage?.(stage.id)
    }
}
