import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { PLAYABLE_CHARACTERS, WOBBLE_STATS } from '../types'
import {
    SKILL_DEFINITIONS,
    PASSIVE_DEFINITIONS,
    getCharacterSkillConfig,
    SkillDefinition,
} from '../skills'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore, isSkillUnlocked, skillToFormulaMap } from '@/stores/progressStore'
import { getFormula } from '@/formulas/registry'
import { t } from '@/utils/localization'
import {
    createBalatroButton,
    createBalatroCircleButton,
    BALATRO_COLORS,
} from './BalatroButton'

export interface CharacterSelectContext {
    container: Container
    width: number
    height: number
}

export class CharacterSelectScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number

    // Available characters from collection
    private availableCharacters: WobbleShape[] = ['circle']
    private selectedCharacterIndex = 0

    // UI elements
    private characterCardContainer!: Container
    private previewWobble: Wobble | null = null
    private charLeftArrowBtn!: Container
    private charRightArrowBtn!: Container

    // Selected skills (player chooses up to 5)
    private selectedSkills: string[] = []
    private readonly MAX_SKILLS = 5

    // Focused skill for description display
    private focusedSkillId: string | null = null

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
    onSelectCharacter?: (character: WobbleShape, selectedSkills: string[]) => void
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

    show(): void {
        console.log('[CharacterSelectScreen] show() CALLED')
        this.isVisible = true
        this.animPhase = 0
        this.screenContainer.visible = true

        // Refresh available characters from collection
        this.refreshAvailableCharacters()

        console.log('[CharacterSelectScreen] Calling createUI...')
        this.createUI()
        console.log(
            `[CharacterSelectScreen] show() COMPLETED - visible: ${this.screenContainer.visible}, children: ${this.screenContainer.children.length}`
        )
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

        // Pulse buttons
        if (this.startButton) {
            const pulse = 1 + Math.sin(this.animPhase * 3) * 0.02
            this.startButton.scale.set(pulse)
        }

        if (this.exitButton) {
            const pulse = 1 + Math.sin(this.animPhase * 3 + Math.PI) * 0.02
            this.exitButton.scale.set(pulse)
        }
    }

    reset(): void {
        this.hide()
        this.selectedCharacterIndex = 0
        this.selectedSkills = []
        this.focusedSkillId = null
        this.animPhase = 0
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
        console.log(
            `[CharacterSelectScreen] createUI() CALLED - children before remove: ${this.screenContainer.children.length}`
        )
        this.screenContainer.removeChildren()
        console.log(
            `[CharacterSelectScreen] removeChildren done - children: ${this.screenContainer.children.length}`
        )

        // === BALATRO THEME COLORS ===
        const bgTopColor = 0x3d6b59 // Felt green
        const bgBottomColor = 0x2d5a4a // Darker felt
        const cardBgColor = 0x374244 // Dark panel
        const cardShadowColor = 0x1a1a1a // Black shadow
        const textDark = 0xffffff // White text
        const textMuted = 0xaaaaaa // Light gray
        const accentGold = 0xc9a227 // Balatro gold

        const selectedShape = this.getSelectedCharacter()
        const selectedChar = WOBBLE_CHARACTERS[selectedShape]
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

        // Main card (include buttons inside)
        const cardX = 15
        const cardY = 15
        const cardWidth = this.width - 30
        const cardHeight = this.height - 30 // Full height, buttons inside

        // Card shadow
        const cardShadow = new Graphics()
        cardShadow.roundRect(cardX + 4, cardY + 6, cardWidth, cardHeight, 16)
        cardShadow.fill({ color: cardShadowColor, alpha: 0.4 })
        this.screenContainer.addChild(cardShadow)

        // Card background - Balatro style with thick black border
        const card = new Graphics()
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
        card.fill(cardBgColor)
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
        card.stroke({ color: 0x1a1a1a, width: 4 })
        this.screenContainer.addChild(card)

        // ========== 1. CHARACTER SECTION (CENTERED, VERTICAL LAYOUT) ==========
        const charCenterY = cardY + 70

        // Character container (centered)
        this.characterCardContainer = new Container()
        this.characterCardContainer.position.set(this.centerX, charCenterY)
        this.screenContainer.addChild(this.characterCardContainer)

        // Character wobble (larger now that we have more space)
        this.previewWobble = new Wobble({
            size: 70,
            shape: selectedShape,
            expression: 'happy',
            color: selectedChar.color,
            showShadow: true,
        })
        this.previewWobble.position.set(0, 0)
        this.characterCardContainer.addChild(this.previewWobble)

        // Character name (below wobble)
        const charNameText = new Text({
            text: t(selectedChar.name, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        charNameText.anchor.set(0.5)
        charNameText.position.set(0, 55)
        this.characterCardContainer.addChild(charNameText)

        // Character page dots
        const charDotsY = 75
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

        // Character arrows (around character)
        this.charLeftArrowBtn = createBalatroCircleButton({
            symbol: '<',
            size: 32,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectPrevCharacter(),
        })
        this.charLeftArrowBtn.position.set(this.centerX - 70, charCenterY)
        this.screenContainer.addChild(this.charLeftArrowBtn)

        this.charRightArrowBtn = createBalatroCircleButton({
            symbol: '>',
            size: 32,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectNextCharacter(),
        })
        this.charRightArrowBtn.position.set(this.centerX + 70, charCenterY)
        this.screenContainer.addChild(this.charRightArrowBtn)

        // ========== 2. STATS BARS (below character) ==========
        const statsY = charCenterY + 95
        const statsWidth = cardWidth - 60
        const statsStartX = cardX + 30
        const barHeight = 6
        const barGap = 14

        const statItems = [
            { label: 'HP', value: charStats.healthMultiplier, color: 0x2ecc71 },
            { label: 'DMG', value: charStats.damageMultiplier, color: 0xe74c3c },
            { label: 'RATE', value: charStats.fireRateMultiplier, color: 0xf39c12 },
            { label: 'SPD', value: charStats.moveSpeedMultiplier, color: 0x3498db },
            { label: 'KNOCK', value: charStats.knockbackMultiplier, color: 0x9b59b6 },
        ]

        statItems.forEach((stat, index) => {
            const y = statsY + index * barGap

            // Stat label
            const label = new Text({
                text: stat.label,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fontWeight: 'bold',
                    fill: textMuted,
                }),
            })
            label.anchor.set(0, 0.5)
            label.position.set(statsStartX, y)
            this.screenContainer.addChild(label)

            // Bar background
            const barBgX = statsStartX + 45
            const barWidth = statsWidth - 45
            const barBg = new Graphics()
            barBg.roundRect(barBgX, y - barHeight / 2, barWidth, barHeight, 3)
            barBg.fill({ color: textMuted, alpha: 0.2 })
            this.screenContainer.addChild(barBg)

            // Bar fill (value 0.5~2.0 mapped to 0~100%)
            const normalizedValue = Math.min(1, Math.max(0, (stat.value - 0.5) / 1.5))
            const fillWidth = barWidth * normalizedValue
            if (fillWidth > 0) {
                const barFill = new Graphics()
                barFill.roundRect(barBgX, y - barHeight / 2, fillWidth, barHeight, 3)
                barFill.fill({ color: stat.color, alpha: 0.8 })
                this.screenContainer.addChild(barFill)
            }

            // Value text
            const valueText = new Text({
                text: stat.value.toFixed(1),
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 8,
                    fill: textDark,
                }),
            })
            valueText.anchor.set(1, 0.5)
            valueText.position.set(statsStartX + statsWidth, y)
            this.screenContainer.addChild(valueText)
        })

        // ========== 3. SKILL SELECTION SECTION (Drag & Drop Grid) ==========
        const skillSectionY = statsY + statItems.length * barGap + 10
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
                    text: t(skillDef.name, 'ko').slice(0, 4),
                    style: new TextStyle({ fontSize: 8, fill: textDark, fontWeight: 'bold' }),
                })
                name.anchor.set(0.5)
                name.position.set(slotSize / 2, slotSize - 8)
                slotContainer.addChild(name)

                // Tap to show description, double tap or hold to remove
                slotContainer.eventMode = 'static'
                slotContainer.cursor = 'pointer'
                slotContainer.on('pointerdown', () => {
                    if (!this.isDragging) {
                        // Show skill description
                        this.focusedSkillId = selectedSkillId!
                        this.createUI()
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
        const gridY = slotY + slotSize + 10
        const gridCols = 5 // Same as slot count
        const gridGap = slotGap
        const skillCardSize = slotSize // Same size as slots
        const gridPadding = (cardWidth - (gridCols * skillCardSize + (gridCols - 1) * gridGap)) / 2
        const visibleRows = 5 // Show 5 rows at a time
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
                    text: t(skillDef.name, 'ko').slice(0, 4),
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
                const hintText = formula ? t(formula.name, 'ko') : '???'

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

            // Store skill info for event handling (all skills are clickable for description)
            skillCard.name = skillDef.id
            skillCard.eventMode = 'static'
            skillCard.cursor = 'pointer'
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
            const inCell =
                cellX >= 0 && cellX < skillCardSize && cellY >= 0 && cellY < skillCardSize

            // Check if within grid bounds and inside a cell
            if (col >= 0 && col < gridCols && row >= 0 && row < gridRows && inCell) {
                const index = row * gridCols + col
                if (index < allSkills.length) {
                    const skillDef = allSkills[index]
                    const isUnlocked = isSkillUnlocked(skillDef.id, studiedFormulas)
                    // Always set pointerStartSkillId for description display
                    pointerStartSkillId = skillDef.id
                    // Only allow dragging for unlocked skills
                    if (isUnlocked) {
                        this.draggingSkillId = skillDef.id
                        this.isDragging = false
                    }
                }
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
                    this.isDragging = true
                    this.createDragGhost(this.draggingSkillId, e.global.x, e.global.y)
                } else if (!this.draggingSkillId && Math.abs(dy) > 8) {
                    // No skill selected, allow scroll
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
            // Handle drag drop for unlocked skills
            if (this.draggingSkillId && this.isDragging) {
                this.handleDrop(e.global.x, e.global.y)
            }
            // Handle tap on any skill (locked or unlocked) for description/selection
            else if (!isScrolling && pointerStartSkillId) {
                this.toggleSkillSelection(pointerStartSkillId)
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

        // ========== 4. SKILL DESCRIPTION SECTION ==========
        const skillDescSectionY = gridY + visibleHeight + 8
        const focusedSkill = this.focusedSkillId ? SKILL_DEFINITIONS[this.focusedSkillId] : null
        const isFocusedSkillUnlocked = this.focusedSkillId
            ? isSkillUnlocked(this.focusedSkillId, studiedFormulas)
            : true
        const skillDescHeight = focusedSkill && !isFocusedSkillUnlocked ? 52 : 42

        // Skill description box
        const skillDescContainer = new Container()
        skillDescContainer.position.set(cardX + 15, skillDescSectionY)
        this.screenContainer.addChild(skillDescContainer)

        const descBoxWidth = cardWidth - 30
        const descBoxHeight = skillDescHeight

        // Background color based on lock status
        const descBgColor = focusedSkill
            ? isFocusedSkillUnlocked
                ? focusedSkill.color
                : 0x888888
            : textMuted

        const descBg = new Graphics()
        descBg.roundRect(0, 0, descBoxWidth, descBoxHeight, 8)
        descBg.fill({ color: descBgColor, alpha: 0.08 })
        descBg.roundRect(0, 0, descBoxWidth, descBoxHeight, 8)
        descBg.stroke({ color: descBgColor, width: 1, alpha: 0.2 })
        skillDescContainer.addChild(descBg)

        if (focusedSkill) {
            // Skill icon and name
            const skillIcon = new Text({
                text: focusedSkill.icon,
                style: new TextStyle({
                    fontSize: 18,
                    fill: isFocusedSkillUnlocked ? focusedSkill.color : 0x888888,
                }),
            })
            skillIcon.anchor.set(0, 0.5)
            skillIcon.position.set(12, 16)
            skillDescContainer.addChild(skillIcon)

            const skillName = new Text({
                text: t(focusedSkill.name, 'ko'),
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: isFocusedSkillUnlocked ? textDark : 0x666666,
                }),
            })
            skillName.anchor.set(0, 0.5)
            skillName.position.set(36, 16)
            skillDescContainer.addChild(skillName)

            // Lock icon for locked skills
            if (!isFocusedSkillUnlocked) {
                const lockIcon = new Text({
                    text: '🔒',
                    style: new TextStyle({ fontSize: 10 }),
                })
                lockIcon.anchor.set(0, 0.5)
                lockIcon.position.set(skillName.x + skillName.width + 6, 16)
                skillDescContainer.addChild(lockIcon)
            }

            // Skill description
            const skillDesc = new Text({
                text: t(focusedSkill.description, 'ko'),
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fill: textMuted,
                    wordWrap: true,
                    wordWrapWidth: descBoxWidth - 24,
                }),
            })
            skillDesc.anchor.set(0, 0)
            skillDesc.position.set(12, 28)
            skillDescContainer.addChild(skillDesc)

            // Unlock condition for locked skills
            if (!isFocusedSkillUnlocked) {
                const requiredFormulas = skillToFormulaMap[this.focusedSkillId!] || []
                const formulaNames = requiredFormulas
                    .map((fId) => {
                        const f = getFormula(fId)
                        return f ? t(f.name, 'ko') : fId
                    })
                    .join(', ')

                const unlockText = new Text({
                    text: `해금: "${formulaNames}" 공식 학습 필요`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 8,
                        fill: 0xc75050,
                        fontWeight: 'bold',
                    }),
                })
                unlockText.anchor.set(0, 0)
                unlockText.position.set(12, descBoxHeight - 14)
                skillDescContainer.addChild(unlockText)
            }
        } else {
            // Placeholder text
            const placeholder = new Text({
                text: '스킬을 선택하면 설명이 표시됩니다',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fill: textMuted,
                }),
            })
            placeholder.anchor.set(0.5)
            placeholder.position.set(descBoxWidth / 2, descBoxHeight / 2)
            placeholder.alpha = 0.6
            skillDescContainer.addChild(placeholder)
        }

        // ========== 5. PASSIVE SECTION (above buttons) ==========
        const btnY = cardY + cardHeight - 32
        const passivePillY = btnY - 50
        const passiveDef = PASSIVE_DEFINITIONS[skillConfig.passive]

        if (passiveDef) {
            const passiveNameText = `${passiveDef.icon} ${t(passiveDef.name, 'ko')}`
            const passivePillWidth = 140
            const passivePillHeight = 24

            const passivePill = new Graphics()
            passivePill.roundRect(
                this.centerX - passivePillWidth / 2,
                passivePillY,
                passivePillWidth,
                passivePillHeight,
                12
            )
            passivePill.fill({ color: passiveDef.color, alpha: 0.15 })
            passivePill.roundRect(
                this.centerX - passivePillWidth / 2,
                passivePillY,
                passivePillWidth,
                passivePillHeight,
                12
            )
            passivePill.stroke({ color: passiveDef.color, width: 1.5, alpha: 0.6 })
            this.screenContainer.addChild(passivePill)

            const passiveText = new Text({
                text: passiveNameText,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: textDark,
                }),
            })
            passiveText.anchor.set(0.5)
            passiveText.position.set(this.centerX, passivePillY + passivePillHeight / 2)
            this.screenContainer.addChild(passiveText)
        } else {
            const noPassiveText = new Text({
                text: '- 패시브 없음 -',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fill: textMuted,
                }),
            })
            noPassiveText.anchor.set(0.5)
            noPassiveText.position.set(this.centerX, passivePillY + 12)
            noPassiveText.alpha = 0.6
            this.screenContainer.addChild(noPassiveText)
        }

        // ========== 6. ACTION BUTTONS (anchored at bottom) ==========
        const btnWidth = 120
        const btnGap = 25

        this.startButton = createBalatroButton({
            label: 'NEXT',
            width: btnWidth,
            color: BALATRO_COLORS.blue,
            onClick: () => this.handleSelectCharacter(),
        })
        this.startButton.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        this.screenContainer.addChild(this.startButton)

        this.exitButton = createBalatroButton({
            label: 'EXIT',
            width: btnWidth,
            color: BALATRO_COLORS.red,
            onClick: () => this.onExit?.(),
        })
        this.exitButton.position.set(this.centerX + btnWidth / 2 + btnGap / 2, btnY)
        this.screenContainer.addChild(this.exitButton)

        console.log(
            `[CharacterSelectScreen] createUI() COMPLETED - children: ${this.screenContainer.children.length}`
        )
    }

    private handleSelectCharacter(): void {
        this.hide()
        this.onSelectCharacter?.(this.getSelectedCharacter(), this.selectedSkills)
    }

    getSelectedSkills(): string[] {
        return [...this.selectedSkills]
    }

    private toggleSkillSelection(skillId: string): void {
        const studiedFormulas = useProgressStore.getState().studiedFormulas
        const isUnlocked = isSkillUnlocked(skillId, studiedFormulas)

        // Set focused skill for description display (always, even for locked skills)
        this.focusedSkillId = skillId

        // Only allow selection for unlocked skills
        if (isUnlocked) {
            const index = this.selectedSkills.indexOf(skillId)
            if (index >= 0) {
                // Deselect
                this.selectedSkills.splice(index, 1)
            } else if (this.selectedSkills.length < this.MAX_SKILLS) {
                // Select (if under limit)
                this.selectedSkills.push(skillId)
            }
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
            text: t(skillDef.name, 'ko').slice(0, 4),
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
