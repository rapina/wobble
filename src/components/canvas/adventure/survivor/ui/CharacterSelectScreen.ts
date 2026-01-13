import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { PLAYABLE_CHARACTERS, WOBBLE_STATS } from '../types'
import { SKILL_DEFINITIONS, PASSIVE_DEFINITIONS, getCharacterSkillConfig, SkillDefinition } from '../skills'
import { STAGES, StageConfig } from '../PhysicsModifiers'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore, isSkillUnlocked, skillToFormulaMap } from '@/stores/progressStore'
import { getFormula } from '@/formulas/registry'

export interface CharacterSelectContext {
    container: Container
    width: number
    height: number
}

// Stage preview particle
interface PreviewParticle {
    x: number
    y: number
    vx: number
    vy: number
    size: number
    alpha: number
    color: number
}

export class CharacterSelectScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number

    // Available characters from collection
    private availableCharacters: WobbleShape[] = ['circle']
    private selectedCharacterIndex = 0

    // Selected stage
    private selectedStageIndex = 0

    // UI elements
    private characterCardContainer!: Container
    private previewWobble: Wobble | null = null
    private charLeftArrowBtn!: Container
    private charRightArrowBtn!: Container

    // Stage UI elements
    private stagePreviewContainer!: Container
    private stagePreviewGraphics!: Graphics
    private stageLeftArrowBtn!: Container
    private stageRightArrowBtn!: Container

    // Stage preview particles
    private previewParticles: PreviewParticle[] = []

    // Selected skills (player chooses up to 5)
    private selectedSkills: string[] = []
    private readonly MAX_SKILLS = 5

    // Drag and drop state
    private draggingSkillId: string | null = null
    private dragGhost: Container | null = null
    private dragStartPos = { x: 0, y: 0 }
    private isDragging = false
    private slotBounds: Array<{ x: number; y: number; width: number; height: number }> = []

    // Action buttons
    private startButton!: Container
    private exitButton!: Container

    // Animation state
    private animPhase = 0
    private isVisible = false

    // Callbacks
    onStartGame?: (character: WobbleShape, stageId: string, selectedSkills: string[]) => void
    onExit?: () => void

    constructor(context: CharacterSelectContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    getSelectedCharacter(): WobbleShape {
        return this.availableCharacters[this.selectedCharacterIndex] || 'circle'
    }

    getSelectedStage(): StageConfig {
        return STAGES[this.selectedStageIndex]
    }

    show(): void {
        console.log('[CharacterSelectScreen] show() CALLED')
        this.isVisible = true
        this.animPhase = 0
        this.screenContainer.visible = true

        // Refresh available characters from collection
        this.refreshAvailableCharacters()

        console.log('[CharacterSelectScreen] Calling createUI...')
        this.createUI()
        this.initStagePreviewParticles()
        console.log(`[CharacterSelectScreen] show() COMPLETED - visible: ${this.screenContainer.visible}, children: ${this.screenContainer.children.length}`)
    }

    /**
     * Get available characters from collection store
     */
    private refreshAvailableCharacters(): void {
        const collectionState = useCollectionStore.getState()
        this.availableCharacters = PLAYABLE_CHARACTERS.filter((char) =>
            collectionState.isUnlocked(char)
        )

        // Ensure at least circle is available (fallback)
        if (this.availableCharacters.length === 0) {
            this.availableCharacters = ['circle']
        }

        // Ensure selected index is valid
        if (this.selectedCharacterIndex >= this.availableCharacters.length) {
            this.selectedCharacterIndex = 0
        }
    }

    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animPhase += deltaSeconds

        // Animate character wobble
        if (this.previewWobble) {
            const breathe = Math.sin(this.animPhase * 2.5) * 0.05
            this.previewWobble.updateOptions({
                wobblePhase: this.animPhase,
                scaleX: 1 + breathe,
                scaleY: 1 - breathe,
            })
        }

        // Float character card
        if (this.characterCardContainer) {
            const baseY = 70
            const float = Math.sin(this.animPhase * 1.5) * 3
            this.characterCardContainer.position.y = baseY + float
        }

        // Pulse arrows
        const arrowPulse = 1 + Math.sin(this.animPhase * 3) * 0.03
        if (this.charLeftArrowBtn?.scale.x >= 0.9) this.charLeftArrowBtn.scale.set(arrowPulse)
        if (this.charRightArrowBtn?.scale.x >= 0.9) this.charRightArrowBtn.scale.set(arrowPulse)
        if (this.stageLeftArrowBtn?.scale.x >= 0.9) this.stageLeftArrowBtn.scale.set(arrowPulse)
        if (this.stageRightArrowBtn?.scale.x >= 0.9) this.stageRightArrowBtn.scale.set(arrowPulse)

        // Pulse buttons
        if (this.startButton) {
            const pulse = 1 + Math.sin(this.animPhase * 3) * 0.02
            this.startButton.scale.set(pulse)
        }

        if (this.exitButton) {
            const pulse = 1 + Math.sin(this.animPhase * 3 + Math.PI) * 0.02
            this.exitButton.scale.set(pulse)
        }

        // Animate stage preview
        this.updateStagePreview(deltaSeconds)
    }

    reset(): void {
        this.hide()
        this.selectedCharacterIndex = 0
        this.selectedStageIndex = 0
        this.selectedSkills = []
        this.animPhase = 0
        this.previewParticles = []
    }

    private selectCharacterByIndex(index: number): void {
        if (this.selectedCharacterIndex === index) return
        this.selectedCharacterIndex = index
        this.createUI()
    }

    private selectNextCharacter(): void {
        const nextIndex = (this.selectedCharacterIndex + 1) % this.availableCharacters.length
        this.selectCharacterByIndex(nextIndex)
    }

    private selectPrevCharacter(): void {
        const prevIndex =
            (this.selectedCharacterIndex - 1 + this.availableCharacters.length) %
            this.availableCharacters.length
        this.selectCharacterByIndex(prevIndex)
    }

    private selectStage(index: number): void {
        if (this.selectedStageIndex === index) return
        this.selectedStageIndex = index
        this.createUI()
        this.initStagePreviewParticles()
    }

    private selectNextStage(): void {
        const nextIndex = (this.selectedStageIndex + 1) % STAGES.length
        this.selectStage(nextIndex)
    }

    private selectPrevStage(): void {
        const prevIndex = (this.selectedStageIndex - 1 + STAGES.length) % STAGES.length
        this.selectStage(prevIndex)
    }

    /**
     * Initialize particles for stage preview based on stage type
     */
    private initStagePreviewParticles(): void {
        const stage = STAGES[this.selectedStageIndex]
        this.previewParticles = []

        const previewWidth = this.width - 60
        const previewHeight = 160

        switch (stage.id) {
            case 'normal':
                // Gentle floating particles
                for (let i = 0; i < 15; i++) {
                    this.previewParticles.push({
                        x: Math.random() * previewWidth,
                        y: Math.random() * previewHeight,
                        vx: (Math.random() - 0.5) * 20,
                        vy: (Math.random() - 0.5) * 20,
                        size: 2 + Math.random() * 3,
                        alpha: 0.3 + Math.random() * 0.4,
                        color: stage.particleColor,
                    })
                }
                break

            case 'low-gravity':
                // Stars floating upward slowly
                for (let i = 0; i < 25; i++) {
                    this.previewParticles.push({
                        x: Math.random() * previewWidth,
                        y: Math.random() * previewHeight,
                        vx: (Math.random() - 0.5) * 5,
                        vy: -10 - Math.random() * 20, // Floating up
                        size: 1 + Math.random() * 3,
                        alpha: 0.4 + Math.random() * 0.6,
                        color: Math.random() > 0.7 ? 0xffffff : stage.particleColor,
                    })
                }
                break

            case 'elastic':
                // Bouncy particles
                for (let i = 0; i < 20; i++) {
                    this.previewParticles.push({
                        x: Math.random() * previewWidth,
                        y: Math.random() * previewHeight,
                        vx: (Math.random() - 0.5) * 80,
                        vy: (Math.random() - 0.5) * 80,
                        size: 3 + Math.random() * 4,
                        alpha: 0.5 + Math.random() * 0.3,
                        color: stage.particleColor,
                    })
                }
                break

            case 'momentum':
                // Heavy, slow particles
                for (let i = 0; i < 12; i++) {
                    this.previewParticles.push({
                        x: Math.random() * previewWidth,
                        y: Math.random() * previewHeight,
                        vx: (Math.random() - 0.5) * 30,
                        vy: (Math.random() - 0.5) * 30,
                        size: 5 + Math.random() * 6,
                        alpha: 0.6 + Math.random() * 0.3,
                        color: stage.particleColor,
                    })
                }
                break

            case 'vortex':
                // Particles that will orbit center
                for (let i = 0; i < 30; i++) {
                    const angle = Math.random() * Math.PI * 2
                    const dist = 20 + Math.random() * 50
                    this.previewParticles.push({
                        x: previewWidth / 2 + Math.cos(angle) * dist,
                        y: previewHeight / 2 + Math.sin(angle) * dist,
                        vx: Math.cos(angle + Math.PI / 2) * 40,
                        vy: Math.sin(angle + Math.PI / 2) * 40,
                        size: 2 + Math.random() * 3,
                        alpha: 0.4 + Math.random() * 0.4,
                        color: stage.particleColor,
                    })
                }
                break
        }
    }

    /**
     * Update stage preview animation
     */
    private updateStagePreview(deltaSeconds: number): void {
        if (!this.stagePreviewContainer || !this.stagePreviewGraphics) return

        const stage = STAGES[this.selectedStageIndex]
        const previewWidth = this.width - 60
        const previewHeight = 160

        // Use clear() - the Batcher issue was fixed in usePixiApp.ts
        this.stagePreviewGraphics.clear()

        // Draw background gradient
        const bgTop = stage.bgColor
        const bgBottom = this.darkenColor(stage.bgColor, 0.3)
        const bands = 6
        for (let i = 0; i < bands; i++) {
            const y = (i / bands) * previewHeight
            const h = previewHeight / bands + 1
            const blend = i / (bands - 1)
            const color = this.lerpColor(bgTop, bgBottom, blend)
            this.stagePreviewGraphics.rect(0, y, previewWidth, h)
            this.stagePreviewGraphics.fill(color)
        }

        // Update and draw particles based on stage type
        for (const p of this.previewParticles) {
            // Update position
            p.x += p.vx * deltaSeconds
            p.y += p.vy * deltaSeconds

            // Stage-specific physics
            switch (stage.id) {
                case 'normal':
                    // Gentle drift
                    p.vx *= 0.99
                    p.vy *= 0.99
                    break

                case 'low-gravity':
                    // Float upward, wrap around
                    if (p.y < -5) {
                        p.y = previewHeight + 5
                        p.x = Math.random() * previewWidth
                    }
                    break

                case 'elastic':
                    // Bounce off walls
                    if (p.x < 0 || p.x > previewWidth) {
                        p.vx *= -0.9
                        p.x = Math.max(0, Math.min(previewWidth, p.x))
                    }
                    if (p.y < 0 || p.y > previewHeight) {
                        p.vy *= -0.9
                        p.y = Math.max(0, Math.min(previewHeight, p.y))
                    }
                    break

                case 'momentum':
                    // Heavy friction
                    p.vx *= 0.98
                    p.vy *= 0.98
                    // Wrap around
                    if (p.x < -10) p.x = previewWidth + 10
                    if (p.x > previewWidth + 10) p.x = -10
                    if (p.y < -10) p.y = previewHeight + 10
                    if (p.y > previewHeight + 10) p.y = -10
                    break

                case 'vortex': {
                    // Pull toward center and orbit
                    const centerX = previewWidth / 2
                    const centerY = previewHeight / 2
                    const dx = centerX - p.x
                    const dy = centerY - p.y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist > 10) {
                        const pull = 50 / dist
                        p.vx += (dx / dist) * pull * deltaSeconds
                        p.vy += (dy / dist) * pull * deltaSeconds
                    }
                    // Add orbital motion
                    const angle = Math.atan2(dy, dx) + Math.PI / 2
                    p.vx += Math.cos(angle) * 30 * deltaSeconds
                    p.vy += Math.sin(angle) * 30 * deltaSeconds
                    // Friction
                    p.vx *= 0.995
                    p.vy *= 0.995
                    break
                }
            }

            // Draw particle
            const pulse = 0.8 + Math.sin(this.animPhase * 3 + p.x * 0.1) * 0.2
            this.stagePreviewGraphics.circle(p.x, p.y, p.size * pulse)
            this.stagePreviewGraphics.fill({ color: p.color, alpha: p.alpha * pulse })
        }

        // Stage-specific overlay effects
        switch (stage.id) {
            case 'low-gravity':
                // Draw a few twinkling stars
                for (let i = 0; i < 5; i++) {
                    const sx = (i * 0.2 + 0.1) * previewWidth
                    const sy = (Math.sin(this.animPhase + i) * 0.3 + 0.3) * previewHeight
                    const twinkle = Math.sin(this.animPhase * 5 + i * 2) * 0.5 + 0.5
                    this.stagePreviewGraphics.circle(sx, sy, 1.5)
                    this.stagePreviewGraphics.fill({ color: 0xffffff, alpha: twinkle })
                }
                break

            case 'vortex':
                // Draw spiral lines
                const centerX = previewWidth / 2
                const centerY = previewHeight / 2
                for (let arm = 0; arm < 3; arm++) {
                    const startAngle = (arm / 3) * Math.PI * 2 + this.animPhase * 0.5
                    for (let i = 0; i < 20; i++) {
                        const t = i / 20
                        const angle = startAngle + t * Math.PI
                        const dist = 10 + t * 50
                        const x = centerX + Math.cos(angle) * dist
                        const y = centerY + Math.sin(angle) * dist
                        this.stagePreviewGraphics.circle(x, y, 1)
                        this.stagePreviewGraphics.fill({ color: stage.particleColor, alpha: 0.3 * (1 - t) })
                    }
                }
                break
        }
    }

    /**
     * Draw a pentagon radar chart for character stats
     */
    private drawRadarChart(
        container: Container,
        stats: number[],
        labels: string[],
        centerX: number,
        centerY: number,
        radius: number,
        fillColor: number,
        textColor: number,
        mutedColor: number
    ): void {
        const numStats = stats.length
        const angleStep = (Math.PI * 2) / numStats
        const startAngle = -Math.PI / 2 // Start from top

        const maxValue = 1.5
        const getPoint = (index: number, value: number) => {
            const angle = startAngle + index * angleStep
            const dist = (value / maxValue) * radius
            return {
                x: centerX + Math.cos(angle) * dist,
                y: centerY + Math.sin(angle) * dist,
            }
        }

        // Draw grid lines (concentric pentagons)
        const gridLevels = [0.5, 1.0, 1.5]
        gridLevels.forEach((level) => {
            const grid = new Graphics()
            for (let i = 0; i < numStats; i++) {
                const p = getPoint(i, level)
                if (i === 0) {
                    grid.moveTo(p.x, p.y)
                } else {
                    grid.lineTo(p.x, p.y)
                }
            }
            grid.closePath()
            grid.stroke({ color: mutedColor, width: 1, alpha: level === 1.0 ? 0.4 : 0.2 })
            container.addChild(grid)
        })

        // Draw axis lines from center
        const axes = new Graphics()
        for (let i = 0; i < numStats; i++) {
            const p = getPoint(i, maxValue)
            axes.moveTo(centerX, centerY)
            axes.lineTo(p.x, p.y)
        }
        axes.stroke({ color: mutedColor, width: 1, alpha: 0.15 })
        container.addChild(axes)

        // Draw stat polygon (filled)
        const statPoly = new Graphics()
        for (let i = 0; i < numStats; i++) {
            const p = getPoint(i, stats[i])
            if (i === 0) {
                statPoly.moveTo(p.x, p.y)
            } else {
                statPoly.lineTo(p.x, p.y)
            }
        }
        statPoly.closePath()
        statPoly.fill({ color: fillColor, alpha: 0.3 })
        statPoly.stroke({ color: fillColor, width: 2, alpha: 0.8 })
        container.addChild(statPoly)

        // Draw stat points
        for (let i = 0; i < numStats; i++) {
            const p = getPoint(i, stats[i])
            const point = new Graphics()
            point.circle(p.x, p.y, 4)
            point.fill({ color: fillColor, alpha: 1 })
            point.circle(p.x, p.y, 4)
            point.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 })
            container.addChild(point)
        }

        // Draw labels
        const labelOffset = radius + 16
        for (let i = 0; i < numStats; i++) {
            const angle = startAngle + i * angleStep
            const lx = centerX + Math.cos(angle) * labelOffset
            const ly = centerY + Math.sin(angle) * labelOffset

            const label = new Text({
                text: labels[i],
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fontWeight: 'bold',
                    fill: textColor,
                }),
            })
            label.anchor.set(0.5)
            label.position.set(lx, ly)
            container.addChild(label)

            // Show stat value
            const value = stats[i]
            const valueColor = value > 1 ? 0x27ae60 : value < 1 ? 0xe74c3c : mutedColor
            const valueLabel = new Text({
                text: value.toFixed(1),
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 8,
                    fill: valueColor,
                }),
            })
            valueLabel.anchor.set(0.5)
            valueLabel.position.set(lx, ly + 10)
            container.addChild(valueLabel)
        }
    }

    private lerpColor(from: number, to: number, t: number): number {
        const fromR = (from >> 16) & 0xff
        const fromG = (from >> 8) & 0xff
        const fromB = from & 0xff
        const toR = (to >> 16) & 0xff
        const toG = (to >> 8) & 0xff
        const toB = to & 0xff
        const r = Math.round(fromR + (toR - fromR) * t)
        const g = Math.round(fromG + (toG - fromG) * t)
        const b = Math.round(fromB + (toB - fromB) * t)
        return (r << 16) | (g << 8) | b
    }

    private darkenColor(color: number, factor: number): number {
        const r = Math.round(((color >> 16) & 0xff) * (1 - factor))
        const g = Math.round(((color >> 8) & 0xff) * (1 - factor))
        const b = Math.round((color & 0xff) * (1 - factor))
        return (r << 16) | (g << 8) | b
    }

    private createUI(): void {
        console.log(`[CharacterSelectScreen] createUI() CALLED - children before remove: ${this.screenContainer.children.length}`)
        this.screenContainer.removeChildren()
        console.log(`[CharacterSelectScreen] removeChildren done - children: ${this.screenContainer.children.length}`)

        // === THEME COLORS ===
        const bgTopColor = 0x7db8b0
        const bgBottomColor = 0x5a9a91
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38
        const textMuted = 0x5a6b66
        const accentGold = 0xd4a574

        const selectedShape = this.getSelectedCharacter()
        const selectedChar = WOBBLE_CHARACTERS[selectedShape]
        const selectedStage = STAGES[this.selectedStageIndex]
        const skillConfig = getCharacterSkillConfig(selectedShape)
        const charStats = WOBBLE_STATS[selectedShape]

        // Background gradient
        const bg = new Graphics()
        const bands = 8
        for (let i = 0; i < bands; i++) {
            const y = (i / bands) * this.height
            const h = this.height / bands + 1
            const blend = i / (bands - 1)
            const r1 = (bgTopColor >> 16) & 0xff
            const g1 = (bgTopColor >> 8) & 0xff
            const b1 = bgTopColor & 0xff
            const r2 = (bgBottomColor >> 16) & 0xff
            const g2 = (bgBottomColor >> 8) & 0xff
            const b2 = bgBottomColor & 0xff
            const r = Math.round(r1 + (r2 - r1) * blend)
            const g = Math.round(g1 + (g2 - g1) * blend)
            const b = Math.round(b1 + (b2 - b1) * blend)
            const color = (r << 16) | (g << 8) | b
            bg.rect(0, y, this.width, h)
            bg.fill(color)
        }
        this.screenContainer.addChild(bg)

        // Dot pattern
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
        const cardY = 20
        const cardWidth = this.width - 40
        const cardHeight = this.height - 85

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
        card.stroke({ color: accentGold, width: 3 })
        this.screenContainer.addChild(card)

        // ========== 1. CHARACTER SECTION (TOP) ==========
        const charSectionY = cardY + 25

        // Character preview container
        this.characterCardContainer = new Container()
        this.characterCardContainer.position.set(this.centerX, charSectionY + 45)
        this.screenContainer.addChild(this.characterCardContainer)

        // Character wobble (centered, larger)
        this.previewWobble = new Wobble({
            size: 55,
            shape: selectedShape,
            expression: 'happy',
            color: selectedChar.color,
            showShadow: true,
        })
        this.previewWobble.position.set(0, 0)
        this.characterCardContainer.addChild(this.previewWobble)

        // Character name
        const charNameText = new Text({
            text: selectedChar.nameKo,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        charNameText.anchor.set(0.5)
        charNameText.position.set(0, 50)
        this.characterCardContainer.addChild(charNameText)

        // Character page dots
        const charDotsY = 70
        const charDotGap = 12
        const charTotalDotsWidth = (this.availableCharacters.length - 1) * charDotGap
        this.availableCharacters.forEach((char, i) => {
            const isSelected = i === this.selectedCharacterIndex
            const charColor = WOBBLE_CHARACTERS[char].color
            const dot = new Graphics()
            const dotX = -charTotalDotsWidth / 2 + i * charDotGap
            dot.circle(dotX, charDotsY, isSelected ? 5 : 3)
            dot.fill({
                color: isSelected ? charColor : textMuted,
                alpha: isSelected ? 1 : 0.3,
            })
            this.characterCardContainer.addChild(dot)
        })

        // Character arrows
        this.charLeftArrowBtn = this.createArrowButton('<', this.centerX - 90, charSectionY + 45, () => {
            this.selectPrevCharacter()
        })
        this.screenContainer.addChild(this.charLeftArrowBtn)

        this.charRightArrowBtn = this.createArrowButton('>', this.centerX + 90, charSectionY + 45, () => {
            this.selectNextCharacter()
        })
        this.screenContainer.addChild(this.charRightArrowBtn)

        // ========== 2. STATS SECTION (Radar chart - centered) ==========
        const statsSectionY = charSectionY + 130

        const statsContainer = new Container()
        statsContainer.position.set(this.centerX, statsSectionY)
        this.screenContainer.addChild(statsContainer)

        // Radar chart (centered, larger)
        const radarRadius = 45

        const statLabels = ['HP', 'DMG', 'RATE', 'SPD', 'KNOCK']
        const statValues = [
            charStats.healthMultiplier,
            charStats.damageMultiplier,
            charStats.fireRateMultiplier,
            charStats.moveSpeedMultiplier,
            charStats.knockbackMultiplier,
        ]

        this.drawRadarChart(
            statsContainer,
            statValues,
            statLabels,
            0,
            45,
            radarRadius,
            selectedChar.color,
            textDark,
            textMuted
        )

        // ========== 3. SKILL SELECTION SECTION (Drag & Drop Grid) ==========
        const skillSectionY = statsSectionY + 115
        const studiedFormulas = useProgressStore.getState().studiedFormulas
        const allSkills = Object.values(SKILL_DEFINITIONS)

        // Skills label with selection count
        const skillsLabel = new Text({
            text: `SKILLS (${this.selectedSkills.length}/${this.MAX_SKILLS})`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: textMuted,
                letterSpacing: 1,
            }),
        })
        skillsLabel.anchor.set(0.5)
        skillsLabel.position.set(this.centerX, skillSectionY)
        this.screenContainer.addChild(skillsLabel)

        // ===== 5 Fixed Slots for Selected Skills (Drop Targets) =====
        const slotY = skillSectionY + 18
        const slotSize = 44
        const slotGap = 8
        const totalSlotsWidth = this.MAX_SKILLS * slotSize + (this.MAX_SKILLS - 1) * slotGap
        const slotsStartX = this.centerX - totalSlotsWidth / 2

        // Clear slot bounds for drop detection
        this.slotBounds = []

        for (let i = 0; i < this.MAX_SKILLS; i++) {
            const slotX = slotsStartX + i * (slotSize + slotGap)
            const selectedSkillId = this.selectedSkills[i]
            const skillDef = selectedSkillId ? SKILL_DEFINITIONS[selectedSkillId] : null

            // Store slot bounds for drop detection
            this.slotBounds.push({
                x: slotX,
                y: slotY,
                width: slotSize,
                height: slotSize,
            })

            const slotContainer = new Container()
            slotContainer.position.set(slotX, slotY)
            this.screenContainer.addChild(slotContainer)

            const slotBg = new Graphics()
            slotBg.roundRect(0, 0, slotSize, slotSize, 8)

            if (skillDef) {
                // Filled slot
                slotBg.fill({ color: skillDef.color, alpha: 0.3 })
                slotBg.roundRect(0, 0, slotSize, slotSize, 8)
                slotBg.stroke({ color: skillDef.color, width: 2, alpha: 0.8 })

                const icon = new Text({
                    text: skillDef.icon,
                    style: new TextStyle({ fontSize: 18, fill: skillDef.color }),
                })
                icon.anchor.set(0.5)
                icon.position.set(slotSize / 2, slotSize / 2 - 5)
                slotContainer.addChild(icon)

                const name = new Text({
                    text: skillDef.nameKo.slice(0, 4),
                    style: new TextStyle({ fontSize: 8, fill: textDark, fontWeight: 'bold' }),
                })
                name.anchor.set(0.5)
                name.position.set(slotSize / 2, slotSize - 8)
                slotContainer.addChild(name)

                // Tap to remove from slot
                slotContainer.eventMode = 'static'
                slotContainer.cursor = 'pointer'
                slotContainer.on('pointerdown', () => {
                    if (!this.isDragging) {
                        this.removeSkillFromSlot(i)
                    }
                })
            } else {
                // Empty slot
                slotBg.fill({ color: textMuted, alpha: 0.1 })
                slotBg.roundRect(0, 0, slotSize, slotSize, 8)
                slotBg.stroke({ color: textMuted, width: 1, alpha: 0.3, alignment: 0.5 })

                const plus = new Text({
                    text: '+',
                    style: new TextStyle({ fontSize: 20, fill: textMuted, fontWeight: 'bold' }),
                })
                plus.anchor.set(0.5)
                plus.position.set(slotSize / 2, slotSize / 2)
                plus.alpha = 0.5
                slotContainer.addChild(plus)
            }
            slotContainer.addChild(slotBg)
        }

        // ===== Skill Grid with Vertical Scroll =====
        const gridY = slotY + slotSize + 12
        const gridCols = 5 // Same as slot count
        const gridGap = slotGap
        const skillCardSize = slotSize // Same size as slots
        const gridPadding = (cardWidth - (gridCols * skillCardSize + (gridCols - 1) * gridGap)) / 2
        const visibleRows = 2 // Show 2 rows at a time
        const visibleHeight = visibleRows * skillCardSize + (visibleRows - 1) * gridGap
        const gridRows = Math.ceil(allSkills.length / gridCols)
        const totalGridHeight = gridRows * skillCardSize + (gridRows - 1) * gridGap

        // Grid wrapper with mask for scrolling
        const gridWrapper = new Container()
        gridWrapper.position.set(cardX + gridPadding, gridY)
        this.screenContainer.addChild(gridWrapper)

        const gridMask = new Graphics()
        gridMask.rect(0, 0, cardWidth - gridPadding * 2, visibleHeight)
        gridMask.fill(0xffffff)
        gridWrapper.addChild(gridMask)

        const gridScrollContainer = new Container()
        gridScrollContainer.mask = gridMask
        gridWrapper.addChild(gridScrollContainer)

        const gridContent = new Container()
        gridScrollContainer.addChild(gridContent)

        // Scroll state
        let gridScrollY = 0
        const maxGridScroll = Math.max(0, totalGridHeight - visibleHeight)

        allSkills.forEach((skillDef, index) => {
            const col = index % gridCols
            const row = Math.floor(index / gridCols)
            const skillCardX = col * (skillCardSize + gridGap)
            const skillCardY = row * (skillCardSize + gridGap)

            const isUnlocked = isSkillUnlocked(skillDef.id, studiedFormulas)
            const isSelected = this.selectedSkills.includes(skillDef.id)

            const skillCard = new Container()
            skillCard.position.set(skillCardX, skillCardY)
            gridContent.addChild(skillCard)

            const bg = new Graphics()
            bg.roundRect(0, 0, skillCardSize, skillCardSize, 8)
            if (!isUnlocked) {
                bg.fill({ color: 0x666666, alpha: 0.2 })
                bg.stroke({ color: 0x666666, width: 1, alpha: 0.3 })
            } else if (isSelected) {
                bg.fill({ color: skillDef.color, alpha: 0.4 })
                bg.stroke({ color: skillDef.color, width: 2, alpha: 1 })
            } else {
                bg.fill({ color: skillDef.color, alpha: 0.15 })
                bg.stroke({ color: skillDef.color, width: 1, alpha: 0.5 })
            }
            skillCard.addChild(bg)

            if (isUnlocked) {
                const icon = new Text({
                    text: skillDef.icon,
                    style: new TextStyle({ fontSize: 18, fill: skillDef.color }),
                })
                icon.anchor.set(0.5)
                icon.position.set(skillCardSize / 2, skillCardSize / 2 - 5)
                skillCard.addChild(icon)

                const name = new Text({
                    text: skillDef.nameKo.slice(0, 4),
                    style: new TextStyle({
                        fontSize: 8,
                        fill: textDark,
                        fontWeight: 'bold',
                    }),
                })
                name.anchor.set(0.5)
                name.position.set(skillCardSize / 2, skillCardSize - 8)
                skillCard.addChild(name)
            } else {
                // Locked skill - show "?" and hint
                const questionMark = new Text({
                    text: '?',
                    style: new TextStyle({
                        fontSize: 22,
                        fill: 0x888888,
                        fontWeight: 'bold',
                    }),
                })
                questionMark.anchor.set(0.5)
                questionMark.position.set(skillCardSize / 2, skillCardSize / 2 - 2)
                questionMark.alpha = 0.7
                skillCard.addChild(questionMark)

                // Get required formula for hint
                const requiredFormulas = skillToFormulaMap[skillDef.id] || []
                const formulaId = requiredFormulas[0]
                const formula = formulaId ? getFormula(formulaId) : null
                const hintText = formula ? formula.name : '???'

                const hint = new Text({
                    text: hintText,
                    style: new TextStyle({
                        fontSize: 7,
                        fill: 0x888888,
                    }),
                })
                hint.anchor.set(0.5)
                hint.position.set(skillCardSize / 2, skillCardSize - 7)
                hint.alpha = 0.8
                skillCard.addChild(hint)
            }

            // Checkmark for selected
            if (isSelected) {
                const check = new Graphics()
                check.circle(skillCardSize - 6, 6, 5)
                check.fill({ color: skillDef.color })
                check.circle(skillCardSize - 6, 6, 5)
                check.stroke({ color: 0xffffff, width: 1.5 })
                skillCard.addChild(check)

                const checkText = new Text({
                    text: '✓',
                    style: new TextStyle({ fontSize: 7, fill: 0xffffff, fontWeight: 'bold' }),
                })
                checkText.anchor.set(0.5)
                checkText.position.set(skillCardSize - 6, 6)
                skillCard.addChild(checkText)
            }

            // Store skill info for event handling
            skillCard.name = skillDef.id
            skillCard.eventMode = 'static'
            skillCard.cursor = isUnlocked ? 'pointer' : 'default'
        })

        // Edge fade for vertical scroll
        const fadeHeight = 15
        const topFade = new Graphics()
        for (let i = 0; i < fadeHeight; i++) {
            const alpha = 1 - i / fadeHeight
            topFade.rect(0, i, cardWidth - gridPadding * 2, 1)
            topFade.fill({ color: cardBgColor, alpha: alpha * 0.9 })
        }
        topFade.visible = false
        gridWrapper.addChild(topFade)

        const bottomFade = new Graphics()
        for (let i = 0; i < fadeHeight; i++) {
            const alpha = i / fadeHeight
            bottomFade.rect(0, visibleHeight - fadeHeight + i, cardWidth - gridPadding * 2, 1)
            bottomFade.fill({ color: cardBgColor, alpha: alpha * 0.9 })
        }
        bottomFade.visible = maxGridScroll > 0
        gridWrapper.addChild(bottomFade)

        // Scroll indicator dots
        if (gridRows > visibleRows) {
            const dotCount = gridRows - visibleRows + 1
            const dotGap = 6
            const dotsHeight = dotCount * dotGap
            const dotsX = cardWidth - gridPadding * 2 + 8
            const dotsStartY = (visibleHeight - dotsHeight) / 2

            for (let i = 0; i < dotCount; i++) {
                const dot = new Graphics()
                dot.circle(dotsX, dotsStartY + i * dotGap, 2)
                dot.fill({ color: textMuted, alpha: i === 0 ? 0.8 : 0.3 })
                gridWrapper.addChild(dot)
            }
        }

        // Unified pointer handling for scroll and drag
        let scrollStartY = 0
        let scrollStartOffset = 0
        let isScrolling = false
        let pointerStartSkillId: string | null = null

        gridWrapper.eventMode = 'static'

        // Grid wrapper absolute position
        const gridWrapperX = cardX + gridPadding
        const gridWrapperY = gridY

        gridWrapper.on('pointerdown', (e) => {
            scrollStartY = e.global.y
            scrollStartOffset = gridScrollY
            isScrolling = false
            this.dragStartPos = { x: e.global.x, y: e.global.y }

            // Calculate which skill card is under pointer using grid position
            const localX = e.global.x - gridWrapperX
            const localY = e.global.y - gridWrapperY + gridScrollY // Account for scroll

            const col = Math.floor(localX / (skillCardSize + gridGap))
            const row = Math.floor(localY / (skillCardSize + gridGap))

            // Check if within cell (not in gap)
            const cellX = localX - col * (skillCardSize + gridGap)
            const cellY = localY - row * (skillCardSize + gridGap)
            const inCell = cellX >= 0 && cellX < skillCardSize && cellY >= 0 && cellY < skillCardSize

            console.log('[DRAG DEBUG] pointerdown:', {
                global: { x: e.global.x, y: e.global.y },
                wrapperPos: { x: gridWrapperX, y: gridWrapperY },
                local: { x: localX, y: localY },
                gridScrollY,
                col, row,
                cell: { x: cellX, y: cellY },
                inCell,
                skillCardSize, gridGap
            })

            // Check if within grid bounds and inside a cell
            if (col >= 0 && col < gridCols && row >= 0 && row < gridRows && inCell) {
                const index = row * gridCols + col
                if (index < allSkills.length) {
                    const skillDef = allSkills[index]
                    const isUnlocked = isSkillUnlocked(skillDef.id, studiedFormulas)
                    console.log('[DRAG DEBUG] skill found:', { index, skillId: skillDef.id, isUnlocked })
                    if (isUnlocked) {
                        pointerStartSkillId = skillDef.id
                        this.draggingSkillId = skillDef.id
                        this.isDragging = false
                        console.log('[DRAG DEBUG] drag started for:', skillDef.id)
                    }
                }
            } else {
                console.log('[DRAG DEBUG] outside grid or in gap')
            }
        })

        gridWrapper.on('pointermove', (e) => {
            if (scrollStartY === 0) return

            const dy = e.global.y - scrollStartY
            const dx = e.global.x - this.dragStartPos.x
            const distance = Math.sqrt(dx * dx + dy * dy)

            // Determine if scrolling or dragging
            if (!isScrolling && !this.isDragging) {
                // If a skill is selected, prioritize drag over scroll
                if (this.draggingSkillId && distance > 10) {
                    console.log('[DRAG DEBUG] pointermove: switching to DRAG mode (skill selected)', { distance, skillId: this.draggingSkillId })
                    this.isDragging = true
                    this.createDragGhost(this.draggingSkillId, e.global.x, e.global.y)
                } else if (!this.draggingSkillId && Math.abs(dy) > 8) {
                    // No skill selected, allow scroll
                    console.log('[DRAG DEBUG] pointermove: switching to SCROLL mode (no skill)', { dy, dx })
                    isScrolling = true
                }
            }

            // Handle scroll
            if (isScrolling && !this.isDragging) {
                gridScrollY = Math.max(0, Math.min(maxGridScroll, scrollStartOffset - dy))
                gridContent.y = -gridScrollY
                topFade.visible = gridScrollY > 5
                bottomFade.visible = gridScrollY < maxGridScroll - 5
            }

            // Handle drag ghost movement
            if (this.isDragging && this.dragGhost) {
                this.dragGhost.position.set(e.global.x, e.global.y)
                this.highlightHoveredSlot(e.global.x, e.global.y)
            }
        })

        gridWrapper.on('pointerup', (e) => {
            console.log('[DRAG DEBUG] pointerup:', {
                draggingSkillId: this.draggingSkillId,
                isDragging: this.isDragging,
                isScrolling,
                pointerStartSkillId
            })
            if (this.draggingSkillId) {
                if (this.isDragging) {
                    // Drop on slot
                    console.log('[DRAG DEBUG] pointerup: dropping skill')
                    this.handleDrop(e.global.x, e.global.y)
                } else if (!isScrolling && pointerStartSkillId) {
                    // Tap - toggle selection
                    console.log('[DRAG DEBUG] pointerup: tap to toggle', pointerStartSkillId)
                    this.toggleSkillSelection(pointerStartSkillId)
                }
            }
            this.cleanupDrag()
            scrollStartY = 0
            isScrolling = false
            pointerStartSkillId = null
        })

        gridWrapper.on('pointerupoutside', () => {
            this.cleanupDrag()
            scrollStartY = 0
            isScrolling = false
            pointerStartSkillId = null
        })

        // Global pointer events for drag (outside grid area)
        this.screenContainer.eventMode = 'static'
        this.screenContainer.on('pointermove', (e) => {
            if (!this.isDragging || !this.dragGhost) return
            this.dragGhost.position.set(e.global.x, e.global.y)
            this.highlightHoveredSlot(e.global.x, e.global.y)
        })

        this.screenContainer.on('pointerup', (e) => {
            if (this.isDragging && this.draggingSkillId) {
                this.handleDrop(e.global.x, e.global.y)
            }
            this.cleanupDrag()
        })

        this.screenContainer.on('pointerupoutside', () => {
            this.cleanupDrag()
        })

        // ========== 4. PASSIVE SECTION ==========
        const passiveSectionY = gridY + visibleHeight + 15
        const passiveDef = PASSIVE_DEFINITIONS[skillConfig.passive]

        // Passive label
        const passiveLabel = new Text({
            text: 'PASSIVE',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: textMuted,
                letterSpacing: 1,
            }),
        })
        passiveLabel.anchor.set(0.5)
        passiveLabel.position.set(this.centerX, passiveSectionY)
        this.screenContainer.addChild(passiveLabel)

        // Passive pill
        const passivePillY = passiveSectionY + 18
        if (passiveDef) {
            const passiveNameText = `${passiveDef.icon} ${passiveDef.nameKo}`
            const passivePillWidth = 120

            const passivePill = new Graphics()
            passivePill.roundRect(this.centerX - passivePillWidth / 2, passivePillY, passivePillWidth, 28, 14)
            passivePill.fill({ color: passiveDef.color, alpha: 0.15 })
            passivePill.roundRect(this.centerX - passivePillWidth / 2, passivePillY, passivePillWidth, 28, 14)
            passivePill.stroke({ color: passiveDef.color, width: 1.5, alpha: 0.6 })
            this.screenContainer.addChild(passivePill)

            const passiveText = new Text({
                text: passiveNameText,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: textDark,
                }),
            })
            passiveText.anchor.set(0.5)
            passiveText.position.set(this.centerX, passivePillY + 14)
            this.screenContainer.addChild(passiveText)

            // Passive description
            const passiveDescY = passivePillY + 34
            const passiveDesc = new Text({
                text: passiveDef.descriptionKo,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fill: textMuted,
                    wordWrap: true,
                    wordWrapWidth: this.width - 80,
                    align: 'center',
                }),
            })
            passiveDesc.anchor.set(0.5, 0)
            passiveDesc.position.set(this.centerX, passiveDescY)
            this.screenContainer.addChild(passiveDesc)
        } else {
            const noPassiveText = new Text({
                text: '-',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 12,
                    fill: textMuted,
                }),
            })
            noPassiveText.anchor.set(0.5)
            noPassiveText.position.set(this.centerX, passivePillY + 14)
            this.screenContainer.addChild(noPassiveText)
        }

        // ========== 5. STAGE/BACKGROUND SECTION (BOTTOM) ==========
        const stageSectionY = passiveSectionY + 80
        const previewWidth = cardWidth - 20
        const previewHeight = 160

        // Section label
        const stageLabel = new Text({
            text: 'STAGE',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: textMuted,
                letterSpacing: 2,
            }),
        })
        stageLabel.anchor.set(0.5)
        stageLabel.position.set(this.centerX, stageSectionY)
        this.screenContainer.addChild(stageLabel)

        // Stage preview container
        const previewY = stageSectionY + 15
        this.stagePreviewContainer = new Container()
        this.stagePreviewContainer.position.set(cardX + 10, previewY)
        this.screenContainer.addChild(this.stagePreviewContainer)

        // Preview background
        const previewBorder = new Graphics()
        previewBorder.roundRect(0, 0, previewWidth, previewHeight, 12)
        previewBorder.fill({ color: selectedStage.bgColor, alpha: 1 })
        this.stagePreviewContainer.addChild(previewBorder)

        // Animated preview graphics
        this.stagePreviewGraphics = new Graphics()
        this.stagePreviewContainer.addChild(this.stagePreviewGraphics)

        // Stage info overlay (centered in preview)
        const stageInfoOverlay = new Container()
        stageInfoOverlay.position.set(previewWidth / 2, previewHeight / 2)
        this.stagePreviewContainer.addChild(stageInfoOverlay)

        // Stage icon + name + formula centered
        const stageIcon = new Text({
            text: selectedStage.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 22,
                fill: 0xffffff,
            }),
        })
        stageIcon.anchor.set(0.5)
        stageIcon.position.set(-50, 0)
        stageIcon.alpha = 0.9
        stageInfoOverlay.addChild(stageIcon)

        const stageNameText = new Text({
            text: selectedStage.nameKo,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        stageNameText.anchor.set(0, 0.5)
        stageNameText.position.set(-30, -10)
        stageInfoOverlay.addChild(stageNameText)

        const formulaText = new Text({
            text: selectedStage.description,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: selectedStage.particleColor,
            }),
        })
        formulaText.anchor.set(0, 0.5)
        formulaText.position.set(-30, 10)
        stageInfoOverlay.addChild(formulaText)

        // Preview border stroke
        const borderStroke = new Graphics()
        borderStroke.roundRect(0, 0, previewWidth, previewHeight, 12)
        borderStroke.stroke({ color: selectedStage.particleColor, width: 2, alpha: 0.8 })
        this.stagePreviewContainer.addChild(borderStroke)

        // Stage trait description (below preview)
        const traitY = previewY + previewHeight + 10
        const traitText = new Text({
            text: selectedStage.trait,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: textMuted,
            }),
        })
        traitText.anchor.set(0.5)
        traitText.position.set(this.centerX, traitY)
        this.screenContainer.addChild(traitText)

        // Stage dots
        const stageDotY = traitY + 20
        const stageDotGap = 14
        const stageTotalDotsWidth = (STAGES.length - 1) * stageDotGap
        STAGES.forEach((stage, i) => {
            const isSelected = i === this.selectedStageIndex
            const dot = new Graphics()
            const dotX = this.centerX - stageTotalDotsWidth / 2 + i * stageDotGap
            dot.circle(dotX, stageDotY, isSelected ? 5 : 3)
            dot.fill({
                color: isSelected ? stage.particleColor : textMuted,
                alpha: isSelected ? 1 : 0.4,
            })
            this.screenContainer.addChild(dot)
        })

        // Stage arrows
        this.stageLeftArrowBtn = this.createSmallArrowButton('<', cardX + 24, previewY + previewHeight / 2, () => {
            this.selectPrevStage()
        })
        this.screenContainer.addChild(this.stageLeftArrowBtn)

        this.stageRightArrowBtn = this.createSmallArrowButton('>', cardX + cardWidth - 24, previewY + previewHeight / 2, () => {
            this.selectNextStage()
        })
        this.screenContainer.addChild(this.stageRightArrowBtn)

        // ========== ACTION BUTTONS ==========
        const btnY = this.height - 40
        const btnWidth = 100
        const btnGap = 15

        this.startButton = this.createActionButton(
            'PLAY',
            this.centerX - btnWidth / 2 - btnGap / 2,
            btnY,
            btnWidth,
            0x5a9a91,
            () => {
                this.handleStartGame()
            }
        )
        this.screenContainer.addChild(this.startButton)

        this.exitButton = this.createActionButton(
            'EXIT',
            this.centerX + btnWidth / 2 + btnGap / 2,
            btnY,
            btnWidth,
            0xc75050,
            () => this.onExit?.()
        )
        this.screenContainer.addChild(this.exitButton)

        console.log(`[CharacterSelectScreen] createUI() COMPLETED - children: ${this.screenContainer.children.length}`)
    }

    private createArrowButton(symbol: string, x: number, y: number, onClick: () => void): Container {
        const btn = new Container()
        btn.position.set(x, y)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        const btnSize = 32
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38
        const accentGold = 0xd4a574

        const shadow = new Graphics()
        shadow.circle(2, 3, btnSize / 2)
        shadow.fill({ color: cardShadowColor, alpha: 0.3 })
        btn.addChild(shadow)

        const bg = new Graphics()
        bg.circle(0, 0, btnSize / 2)
        bg.fill(cardBgColor)
        bg.circle(0, 0, btnSize / 2)
        bg.stroke({ color: accentGold, width: 2 })
        btn.addChild(bg)

        const arrow = new Text({
            text: symbol,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
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
        btn.on('pointerup', () => btn.scale.set(1))
        btn.on('pointerupoutside', () => btn.scale.set(1))

        return btn
    }

    private createSmallArrowButton(symbol: string, x: number, y: number, onClick: () => void): Container {
        const btn = new Container()
        btn.position.set(x, y)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        // Semi-transparent background circle
        const bg = new Graphics()
        bg.circle(0, 0, 16)
        bg.fill({ color: 0x000000, alpha: 0.3 })
        btn.addChild(bg)

        const arrow = new Text({
            text: symbol,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        arrow.anchor.set(0.5)
        btn.addChild(arrow)

        btn.on('pointerdown', () => {
            btn.scale.set(0.85)
            onClick()
        })
        btn.on('pointerup', () => btn.scale.set(1))
        btn.on('pointerupoutside', () => btn.scale.set(1))

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

        const height = 38
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38

        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 2, -height / 2 + 3, width, height, 10)
        shadow.fill({ color: cardShadowColor, alpha: 0.4 })
        btn.addChild(shadow)

        const bg = new Graphics()
        bg.roundRect(-width / 2, -height / 2, width, height, 10)
        bg.fill(cardBgColor)
        bg.roundRect(-width / 2, -height / 2, width, height, 10)
        bg.stroke({ color: accentColor, width: 2 })
        btn.addChild(bg)

        const btnText = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: textDark,
                letterSpacing: 2,
            }),
        })
        btnText.anchor.set(0.5)
        btn.addChild(btnText)

        btn.on('pointerdown', () => btn.scale.set(0.95))
        btn.on('pointerup', () => {
            btn.scale.set(1)
            onClick()
        })
        btn.on('pointerupoutside', () => btn.scale.set(1))

        return btn
    }

    private handleStartGame(): void {
        const stage = STAGES[this.selectedStageIndex]
        this.hide()
        this.onStartGame?.(this.getSelectedCharacter(), stage.id, this.selectedSkills)
    }

    getSelectedSkills(): string[] {
        return [...this.selectedSkills]
    }

    private toggleSkillSelection(skillId: string): void {
        const index = this.selectedSkills.indexOf(skillId)
        if (index >= 0) {
            // Deselect
            this.selectedSkills.splice(index, 1)
        } else if (this.selectedSkills.length < this.MAX_SKILLS) {
            // Select (if under limit)
            this.selectedSkills.push(skillId)
        }
        // Refresh UI
        this.createUI()
    }

    private removeSkillFromSlot(slotIndex: number): void {
        if (slotIndex >= 0 && slotIndex < this.selectedSkills.length) {
            this.selectedSkills.splice(slotIndex, 1)
            this.createUI()
        }
    }

    private createDragGhost(skillId: string, x: number, y: number): void {
        const skillDef = SKILL_DEFINITIONS[skillId]
        if (!skillDef) return

        // Remove existing ghost
        if (this.dragGhost) {
            this.dragGhost.destroy()
        }

        this.dragGhost = new Container()
        this.dragGhost.position.set(x, y)
        this.dragGhost.alpha = 0.9
        this.dragGhost.scale.set(1.1) // Slightly larger for visibility

        const ghostSize = 44 // Same as slot size
        const bg = new Graphics()
        bg.roundRect(-ghostSize / 2, -ghostSize / 2, ghostSize, ghostSize, 8)
        bg.fill({ color: skillDef.color, alpha: 0.7 })
        bg.roundRect(-ghostSize / 2, -ghostSize / 2, ghostSize, ghostSize, 8)
        bg.stroke({ color: 0xffffff, width: 2 })
        this.dragGhost.addChild(bg)

        const icon = new Text({
            text: skillDef.icon,
            style: new TextStyle({ fontSize: 18, fill: 0xffffff }),
        })
        icon.anchor.set(0.5)
        icon.position.set(0, -5)
        this.dragGhost.addChild(icon)

        const name = new Text({
            text: skillDef.nameKo.slice(0, 4),
            style: new TextStyle({ fontSize: 8, fill: 0xffffff, fontWeight: 'bold' }),
        })
        name.anchor.set(0.5)
        name.position.set(0, 14)
        this.dragGhost.addChild(name)

        this.screenContainer.addChild(this.dragGhost)
    }

    private highlightHoveredSlot(x: number, y: number): void {
        // This could be enhanced to show visual feedback on hovered slot
        // For now we just track position for drop detection
    }

    private handleDrop(x: number, y: number): void {
        if (!this.draggingSkillId) return

        // Check if dropped on a slot
        for (let i = 0; i < this.slotBounds.length; i++) {
            const slot = this.slotBounds[i]
            if (
                x >= slot.x &&
                x <= slot.x + slot.width &&
                y >= slot.y &&
                y <= slot.y + slot.height
            ) {
                // Dropped on this slot
                this.addSkillToSlot(this.draggingSkillId, i)
                return
            }
        }
    }

    private addSkillToSlot(skillId: string, slotIndex: number): void {
        // Check if skill already selected
        const existingIndex = this.selectedSkills.indexOf(skillId)

        if (existingIndex >= 0) {
            // Already selected - move to new slot
            this.selectedSkills.splice(existingIndex, 1)
        }

        // If slot has a skill, we need to handle replacement
        if (slotIndex < this.selectedSkills.length) {
            // Insert at specific position
            this.selectedSkills.splice(slotIndex, 0, skillId)
            // If over limit, remove last
            if (this.selectedSkills.length > this.MAX_SKILLS) {
                this.selectedSkills.pop()
            }
        } else if (this.selectedSkills.length < this.MAX_SKILLS) {
            // Add to end (or specific slot if within range)
            this.selectedSkills.push(skillId)
        }

        this.createUI()
    }

    private cleanupDrag(): void {
        this.draggingSkillId = null
        this.isDragging = false
        this.dragStartPos = { x: 0, y: 0 }

        if (this.dragGhost) {
            this.dragGhost.destroy()
            this.dragGhost = null
        }
    }
}
