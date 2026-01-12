import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { PLAYABLE_CHARACTERS, WOBBLE_STATS } from '../types'
import { SKILL_DEFINITIONS, PASSIVE_DEFINITIONS, getCharacterSkillConfig } from '../skills'
import { STAGES, StageConfig } from '../PhysicsModifiers'
import { useCollectionStore } from '@/stores/collectionStore'

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

    // Action buttons
    private startButton!: Container
    private exitButton!: Container

    // Animation state
    private animPhase = 0
    private isVisible = false

    // Callbacks
    onStartGame?: (character: WobbleShape, stageId: string) => void
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
        this.isVisible = true
        this.animPhase = 0
        this.screenContainer.visible = true

        // Refresh available characters from collection
        this.refreshAvailableCharacters()

        this.createUI()
        this.initStagePreviewParticles()
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
        if (!this.stagePreviewGraphics) return

        const stage = STAGES[this.selectedStageIndex]
        const previewWidth = this.width - 60
        const previewHeight = 160

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
        this.screenContainer.removeChildren()

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

        // ========== 3. SKILLS SECTION ==========
        const skillSectionY = statsSectionY + 115
        const startingSkills = skillConfig.startingSkills
            .map(id => SKILL_DEFINITIONS[id])
            .filter(Boolean)

        // Skills label
        const skillsLabel = new Text({
            text: 'SKILLS',
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

        // Skill pills (centered, can have multiple)
        const skillPillY = skillSectionY + 18
        const skillPillWidth = startingSkills.length > 1 ? 85 : 120
        const skillGap = 10
        const totalSkillsWidth = startingSkills.length * skillPillWidth + (startingSkills.length - 1) * skillGap
        let skillStartX = this.centerX - totalSkillsWidth / 2 + skillPillWidth / 2

        startingSkills.forEach((skillDef, index) => {
            const skillX = skillStartX + index * (skillPillWidth + skillGap)
            const skillNameText = `${skillDef.icon} ${skillDef.nameKo}`

            const skillPill = new Graphics()
            skillPill.roundRect(skillX - skillPillWidth / 2, skillPillY, skillPillWidth, 28, 14)
            skillPill.fill({ color: skillDef.color, alpha: 0.15 })
            skillPill.roundRect(skillX - skillPillWidth / 2, skillPillY, skillPillWidth, 28, 14)
            skillPill.stroke({ color: skillDef.color, width: 1.5, alpha: 0.6 })
            this.screenContainer.addChild(skillPill)

            const skillText = new Text({
                text: skillNameText,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: textDark,
                }),
            })
            skillText.anchor.set(0.5)
            skillText.position.set(skillX, skillPillY + 14)
            this.screenContainer.addChild(skillText)
        })

        // No skills message
        if (startingSkills.length === 0) {
            const noSkillText = new Text({
                text: '-',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 12,
                    fill: textMuted,
                }),
            })
            noSkillText.anchor.set(0.5)
            noSkillText.position.set(this.centerX, skillPillY + 14)
            this.screenContainer.addChild(noSkillText)
        }

        // ========== 4. PASSIVE SECTION ==========
        const passiveSectionY = skillSectionY + 60
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
        const stageSectionY = passiveSectionY + 65
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
        this.onStartGame?.(this.getSelectedCharacter(), stage.id)
    }
}
