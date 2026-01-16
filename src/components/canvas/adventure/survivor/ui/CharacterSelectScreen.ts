import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { PLAYABLE_CHARACTERS, WOBBLE_STATS } from '../types'
import { SKILL_DEFINITIONS, PASSIVE_DEFINITIONS, getCharacterSkillConfig, SkillDefinition } from '../skills'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore, isSkillUnlocked } from '@/stores/progressStore'
import { t } from '@/utils/localization'
import { createBalatroButton, createBalatroCircleButton, BALATRO_COLORS } from './BalatroButton'

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
    private skillDescContainer!: Container
    private skillDescText!: Text
    private skillDescNameText!: Text

    // Skill scroll container
    private skillScrollContainer!: Container
    private skillContentContainer!: Container
    private skillScrollMask!: Graphics
    private skillScrollY = 0
    private skillMaxScrollY = 0
    private isDraggingSkills = false
    private dragStartY = 0
    private dragStartScrollY = 0

    // Action buttons
    private startButton!: Container
    private exitButton!: Container

    // Animation state
    private animPhase = 0
    private isVisible = false

    // Callbacks
    onSelectCharacter?: (character: WobbleShape) => void
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
        this.isVisible = true
        this.animPhase = 0
        this.screenContainer.visible = true

        // Refresh available characters from collection
        this.refreshAvailableCharacters()
        this.createUI()
    }

    private refreshAvailableCharacters(): void {
        const collectionState = useCollectionStore.getState()
        this.availableCharacters = PLAYABLE_CHARACTERS.filter((char) =>
            collectionState.isUnlocked(char)
        )

        if (this.availableCharacters.length === 0) {
            this.availableCharacters = ['circle']
        }

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
            const baseY = 100
            const float = Math.sin(this.animPhase * 1.5) * 4
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
        this.animPhase = 0
        this.skillScrollY = 0
        this.isDraggingSkills = false
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

    private createUI(): void {
        this.screenContainer.removeChildren()

        // === SPACE THEME COLORS ===
        const bgTopColor = 0x0a0a1a
        const bgBottomColor = 0x050510
        const cardBgColor = 0x1a1a2e
        const cardShadowColor = 0x1a1a1a
        const textDark = 0xffffff
        const textMuted = 0xaaaaaa

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

        // Star pattern
        const stars = new Graphics()
        for (let i = 0; i < 60; i++) {
            const px = Math.random() * this.width
            const py = Math.random() * this.height
            const size = Math.random() < 0.8 ? 1 : 1.5
            stars.circle(px, py, size)
            stars.fill({ color: 0xffffff, alpha: 0.2 + Math.random() * 0.4 })
        }
        this.screenContainer.addChild(stars)

        // Main card
        const cardX = 15
        const cardY = 15
        const cardWidth = this.width - 30
        const cardHeight = this.height - 30

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
        card.stroke({ color: 0x1a1a1a, width: 4 })
        this.screenContainer.addChild(card)

        // ========== 1. CHARACTER SECTION (LARGE, CENTERED) ==========
        const charCenterY = 100

        this.characterCardContainer = new Container()
        this.characterCardContainer.position.set(this.centerX, charCenterY)
        this.screenContainer.addChild(this.characterCardContainer)

        // Character wobble (LARGER)
        this.previewWobble = new Wobble({
            size: 100, // Increased from 70
            shape: selectedShape,
            expression: 'happy',
            color: selectedChar.color,
            showShadow: true,
        })
        this.previewWobble.position.set(0, 0)
        this.characterCardContainer.addChild(this.previewWobble)

        // Character name
        const charNameText = new Text({
            text: t(selectedChar.name, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        charNameText.anchor.set(0.5)
        charNameText.position.set(0, 70)
        this.characterCardContainer.addChild(charNameText)

        // ========== 2. PASSIVE SKILL (Below character name) ==========
        const passiveDef = PASSIVE_DEFINITIONS[skillConfig.passive]
        const passiveY = 95

        if (passiveDef) {
            const passiveContainer = new Container()
            passiveContainer.position.set(0, passiveY)
            this.characterCardContainer.addChild(passiveContainer)

            const passivePillWidth = 160
            const passivePillHeight = 28

            const passivePill = new Graphics()
            passivePill.roundRect(-passivePillWidth / 2, 0, passivePillWidth, passivePillHeight, 14)
            passivePill.fill({ color: passiveDef.color, alpha: 0.2 })
            passivePill.roundRect(-passivePillWidth / 2, 0, passivePillWidth, passivePillHeight, 14)
            passivePill.stroke({ color: passiveDef.color, width: 2, alpha: 0.6 })
            passiveContainer.addChild(passivePill)

            const passiveText = new Text({
                text: `${passiveDef.icon} ${t(passiveDef.name, 'ko')}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: textDark,
                }),
            })
            passiveText.anchor.set(0.5)
            passiveText.position.set(0, passivePillHeight / 2)
            passiveContainer.addChild(passiveText)

            // Passive description
            const passiveDescText = new Text({
                text: t(passiveDef.description, 'ko'),
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fill: textMuted,
                    wordWrap: true,
                    wordWrapWidth: 200,
                    align: 'center',
                }),
            })
            passiveDescText.anchor.set(0.5, 0)
            passiveDescText.position.set(0, passivePillHeight + 6)
            passiveContainer.addChild(passiveDescText)
        }

        // Character page dots
        const charDotsY = passiveDef ? passiveY + 70 : passiveY + 10
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
        this.charLeftArrowBtn = createBalatroCircleButton({
            symbol: '<',
            size: 36,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectPrevCharacter(),
        })
        this.charLeftArrowBtn.position.set(this.centerX - 90, charCenterY)
        this.screenContainer.addChild(this.charLeftArrowBtn)

        this.charRightArrowBtn = createBalatroCircleButton({
            symbol: '>',
            size: 36,
            color: BALATRO_COLORS.gold,
            onClick: () => this.selectNextCharacter(),
        })
        this.charRightArrowBtn.position.set(this.centerX + 90, charCenterY)
        this.screenContainer.addChild(this.charRightArrowBtn)

        // ========== 3. STATS BARS ==========
        const statsY = charCenterY + (passiveDef ? 180 : 125)
        const statsWidth = cardWidth - 60
        const statsStartX = cardX + 30
        const barHeight = 8
        const barGap = 18

        const statItems = [
            { label: 'HP', value: charStats.healthMultiplier, color: 0x2ecc71 },
            { label: 'DMG', value: charStats.damageMultiplier, color: 0xe74c3c },
            { label: 'RATE', value: charStats.fireRateMultiplier, color: 0xf39c12 },
            { label: 'SPD', value: charStats.moveSpeedMultiplier, color: 0x3498db },
            { label: 'KNOCK', value: charStats.knockbackMultiplier, color: 0x9b59b6 },
        ]

        statItems.forEach((stat, index) => {
            const y = statsY + index * barGap

            const label = new Text({
                text: stat.label,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: textMuted,
                }),
            })
            label.anchor.set(0, 0.5)
            label.position.set(statsStartX, y)
            this.screenContainer.addChild(label)

            const barBgX = statsStartX + 50
            const barWidth = statsWidth - 80
            const barBg = new Graphics()
            barBg.roundRect(barBgX, y - barHeight / 2, barWidth, barHeight, 4)
            barBg.fill({ color: textMuted, alpha: 0.15 })
            this.screenContainer.addChild(barBg)

            const normalizedValue = Math.min(1, Math.max(0, (stat.value - 0.5) / 1.5))
            const fillWidth = barWidth * normalizedValue
            if (fillWidth > 0) {
                const barFill = new Graphics()
                barFill.roundRect(barBgX, y - barHeight / 2, fillWidth, barHeight, 4)
                barFill.fill({ color: stat.color, alpha: 0.8 })
                this.screenContainer.addChild(barFill)
            }

            const valueText = new Text({
                text: stat.value.toFixed(1),
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: textDark,
                }),
            })
            valueText.anchor.set(1, 0.5)
            valueText.position.set(statsStartX + statsWidth, y)
            this.screenContainer.addChild(valueText)
        })

        // ========== 4. UNLOCKED SKILLS (Scrollable grid) ==========
        const skillSectionY = statsY + statItems.length * barGap + 25
        const studiedFormulas = useProgressStore.getState().studiedFormulas
        const allSkills = Object.values(SKILL_DEFINITIONS)
        const unlockedSkills = allSkills.filter((s) => isSkillUnlocked(s.id, studiedFormulas))

        // Skills label
        const skillsLabel = new Text({
            text: `AVAILABLE SKILLS (${unlockedSkills.length}/${allSkills.length})`,
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

        // Scrollable skill grid
        const gridCols = 7
        const skillIconSize = 30
        const skillGap = 8
        const totalGridWidth = gridCols * skillIconSize + (gridCols - 1) * skillGap
        const gridStartX = this.centerX - totalGridWidth / 2
        const gridRows = Math.ceil(allSkills.length / gridCols)
        const totalContentHeight = gridRows * (skillIconSize + skillGap)
        const visibleHeight = 190 // Fixed height for visible area (approx 5 rows)
        const scrollAreaY = skillSectionY + 18

        // Create scroll container
        this.skillScrollContainer = new Container()
        this.skillScrollContainer.position.set(0, scrollAreaY)
        this.screenContainer.addChild(this.skillScrollContainer)

        // Create mask for scrollable area
        this.skillScrollMask = new Graphics()
        this.skillScrollMask.rect(gridStartX - 5, 0, totalGridWidth + 10, visibleHeight)
        this.skillScrollMask.fill(0xffffff)
        this.skillScrollContainer.addChild(this.skillScrollMask)

        // Create content container (this will be scrolled)
        this.skillContentContainer = new Container()
        this.skillContentContainer.mask = this.skillScrollMask
        this.skillContentContainer.eventMode = 'static'
        this.skillScrollContainer.addChild(this.skillContentContainer)

        // Calculate max scroll
        this.skillMaxScrollY = Math.max(0, totalContentHeight - visibleHeight)
        this.skillScrollY = 0

        // Add scroll interaction directly to content container
        let dragStartX = 0
        let hasMoved = false

        this.skillContentContainer.on('pointerdown', (e) => {
            this.isDraggingSkills = true
            this.dragStartY = e.global.y
            dragStartX = e.global.x
            this.dragStartScrollY = this.skillScrollY
            hasMoved = false
        })

        this.skillContentContainer.on('pointermove', (e) => {
            if (!this.isDraggingSkills) return
            const deltaY = e.global.y - this.dragStartY
            const deltaX = e.global.x - dragStartX
            // Only scroll if moved more than 5 pixels
            if (Math.abs(deltaY) > 5 || Math.abs(deltaX) > 5) {
                hasMoved = true
            }
            if (hasMoved) {
                this.skillScrollY = Math.max(0, Math.min(this.skillMaxScrollY, this.dragStartScrollY - deltaY))
                this.skillContentContainer.position.y = -this.skillScrollY
            }
        })

        this.skillContentContainer.on('pointerup', () => {
            this.isDraggingSkills = false
        })

        this.skillContentContainer.on('pointerupoutside', () => {
            this.isDraggingSkills = false
        })

        // Add skill icons to content container
        allSkills.forEach((skillDef, index) => {
            const col = index % gridCols
            const row = Math.floor(index / gridCols)
            const x = gridStartX + col * (skillIconSize + skillGap)
            const y = row * (skillIconSize + skillGap)

            const isUnlocked = isSkillUnlocked(skillDef.id, studiedFormulas)

            const skillIcon = new Container()
            skillIcon.position.set(x, y)
            this.skillContentContainer.addChild(skillIcon)

            const bg = new Graphics()
            bg.roundRect(0, 0, skillIconSize, skillIconSize, 6)
            if (isUnlocked) {
                bg.fill({ color: skillDef.color, alpha: 0.25 })
                bg.roundRect(0, 0, skillIconSize, skillIconSize, 6)
                bg.stroke({ color: skillDef.color, width: 1.5, alpha: 0.7 })
            } else {
                bg.fill({ color: 0x333333, alpha: 0.3 })
                bg.roundRect(0, 0, skillIconSize, skillIconSize, 6)
                bg.stroke({ color: 0x444444, width: 1, alpha: 0.4 })
            }
            skillIcon.addChild(bg)

            // Make the background interactive for clicks
            bg.eventMode = 'static'
            bg.cursor = 'pointer'
            bg.on('pointerup', () => {
                // Only trigger if we didn't drag
                if (!hasMoved) {
                    this.showSkillDescription(skillDef, isUnlocked)
                }
            })

            if (isUnlocked) {
                const icon = new Text({
                    text: skillDef.icon,
                    style: new TextStyle({ fontSize: 14, fill: skillDef.color }),
                })
                icon.anchor.set(0.5)
                icon.position.set(skillIconSize / 2, skillIconSize / 2)
                skillIcon.addChild(icon)
            } else {
                const lock = new Text({
                    text: '?',
                    style: new TextStyle({
                        fontSize: 12,
                        fill: 0x666666,
                        fontWeight: 'bold',
                    }),
                })
                lock.anchor.set(0.5)
                lock.position.set(skillIconSize / 2, skillIconSize / 2)
                lock.alpha = 0.6
                skillIcon.addChild(lock)
            }
        })

        // Scroll indicator (shows if there's more content)
        if (this.skillMaxScrollY > 0) {
            const indicatorContainer = new Container()
            indicatorContainer.position.set(this.centerX, scrollAreaY + visibleHeight + 5)
            this.screenContainer.addChild(indicatorContainer)

            // Up arrow
            const upArrow = new Text({
                text: '▲',
                style: new TextStyle({ fontSize: 8, fill: textMuted }),
            })
            upArrow.anchor.set(0.5)
            upArrow.position.set(-15, 0)
            upArrow.alpha = 0.5
            indicatorContainer.addChild(upArrow)

            // Scroll hint
            const scrollHint = new Text({
                text: 'scroll',
                style: new TextStyle({ fontSize: 8, fill: textMuted }),
            })
            scrollHint.anchor.set(0.5)
            scrollHint.position.set(0, 0)
            scrollHint.alpha = 0.5
            indicatorContainer.addChild(scrollHint)

            // Down arrow
            const downArrow = new Text({
                text: '▼',
                style: new TextStyle({ fontSize: 8, fill: textMuted }),
            })
            downArrow.anchor.set(0.5)
            downArrow.position.set(15, 0)
            downArrow.alpha = 0.5
            indicatorContainer.addChild(downArrow)
        }

        // ========== 5. SKILL DESCRIPTION AREA ==========
        const descY = scrollAreaY + visibleHeight + (this.skillMaxScrollY > 0 ? 20 : 8)
        const descWidth = cardWidth - 40

        this.skillDescContainer = new Container()
        this.skillDescContainer.position.set(this.centerX, descY)
        this.screenContainer.addChild(this.skillDescContainer)

        // Description background
        const descBg = new Graphics()
        descBg.roundRect(-descWidth / 2, 0, descWidth, 48, 8)
        descBg.fill({ color: 0x1a1a2e, alpha: 0.6 })
        descBg.roundRect(-descWidth / 2, 0, descWidth, 48, 8)
        descBg.stroke({ color: textMuted, width: 1, alpha: 0.2 })
        this.skillDescContainer.addChild(descBg)

        // Skill name text
        this.skillDescNameText = new Text({
            text: 'Select a skill to view details',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: textMuted,
            }),
        })
        this.skillDescNameText.anchor.set(0.5, 0)
        this.skillDescNameText.position.set(0, 8)
        this.skillDescContainer.addChild(this.skillDescNameText)

        // Skill description text
        this.skillDescText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,
                fill: textMuted,
                wordWrap: true,
                wordWrapWidth: descWidth - 20,
                align: 'center',
            }),
        })
        this.skillDescText.anchor.set(0.5, 0)
        this.skillDescText.position.set(0, 26)
        this.skillDescContainer.addChild(this.skillDescText)

        // ========== 6. ACTION BUTTONS ==========
        const btnY = cardY + cardHeight - 35
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
    }

    private showSkillDescription(skillDef: SkillDefinition, isUnlocked: boolean): void {
        if (isUnlocked) {
            this.skillDescNameText.text = `${skillDef.icon} ${t(skillDef.name, 'ko')}`
            this.skillDescNameText.style.fill = skillDef.color
            this.skillDescText.text = t(skillDef.description, 'ko')
            this.skillDescText.style.fill = 0xcccccc
        } else {
            this.skillDescNameText.text = `🔒 ${t(skillDef.name, 'ko')}`
            this.skillDescNameText.style.fill = 0x666666
            const formulaHint = skillDef.formulaId ? `(관련 공식을 학습하면 해금)` : '(잠금됨)'
            this.skillDescText.text = formulaHint
            this.skillDescText.style.fill = 0x666666
        }
    }

    private handleSelectCharacter(): void {
        this.hide()
        this.onSelectCharacter?.(this.getSelectedCharacter())
    }
}
