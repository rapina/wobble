import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { PLAYABLE_CHARACTERS, WOBBLE_STATS } from '../types'
import {
    SKILL_DEFINITIONS,
    PASSIVE_DEFINITIONS,
    getCharacterSkillConfig,
    LegacySkillDefinition as SkillDefinition,
} from '../skills'
import { useCollectionStore } from '@/stores/collectionStore'
import { useProgressStore, isSkillUnlocked } from '@/stores/progressStore'
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

        // Animate decorative dots
        if (this.decorDots) {
            this.decorDots.alpha = 0.3 + Math.sin(this.animPhase * 2) * 0.2
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

    // Decorative dots for animation
    private decorDots: Graphics | null = null

    private createUI(): void {
        this.screenContainer.removeChildren()

        const selectedShape = this.getSelectedCharacter()
        const selectedChar = WOBBLE_CHARACTERS[selectedShape]
        const skillConfig = getCharacterSkillConfig(selectedShape)
        const charStats = WOBBLE_STATS[selectedShape]

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
            borderColor: BALATRO_COLORS.gold,
            borderWidth: BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusLarge,
        })
        this.screenContainer.addChild(card)

        // Decorative corner dots
        this.decorDots = new Graphics()
        drawCornerDots(this.decorDots, cardX, cardY, cardWidth, cardHeight)
        this.screenContainer.addChild(this.decorDots)

        // Title badge
        const badgeW = 180
        const badgeH = 32
        const badge = new Graphics()
        drawBalatroBadge(
            badge,
            this.centerX - badgeW / 2,
            cardY - 16,
            badgeW,
            badgeH,
            BALATRO_COLORS.gold
        )
        this.screenContainer.addChild(badge)

        const titleText = new Text({
            text: 'SELECT CHARACTER',
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

        // ========== 1. CHARACTER SECTION (LARGE, CENTERED) ==========
        const charCenterY = 100

        this.characterCardContainer = new Container()
        this.characterCardContainer.position.set(this.centerX, charCenterY)
        this.screenContainer.addChild(this.characterCardContainer)

        // Character wobble (LARGER)
        this.previewWobble = new Wobble({
            size: 100,
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
                fill: BALATRO_COLORS.textPrimary,
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

            // Use Balatro card style for passive pill
            const passivePill = new Graphics()
            passivePill.roundRect(-passivePillWidth / 2, 0, passivePillWidth, passivePillHeight, 14)
            passivePill.fill(BALATRO_COLORS.bgCardLight)
            passivePill.roundRect(-passivePillWidth / 2, 0, passivePillWidth, passivePillHeight, 14)
            passivePill.stroke({ color: passiveDef.color, width: 2 })
            passiveContainer.addChild(passivePill)

            const passiveText = new Text({
                text: `${passiveDef.icon} ${t(passiveDef.name, 'ko')}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.textPrimary,
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
                    fill: BALATRO_COLORS.textSecondary,
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
                color: isSelected ? charColor : BALATRO_COLORS.textMuted,
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
            { label: 'HP', value: charStats.healthMultiplier, color: BALATRO_COLORS.green },
            { label: 'DMG', value: charStats.damageMultiplier, color: BALATRO_COLORS.red },
            { label: 'RATE', value: charStats.fireRateMultiplier, color: BALATRO_COLORS.gold },
            { label: 'SPD', value: charStats.moveSpeedMultiplier, color: BALATRO_COLORS.blue },
            { label: 'KNOCK', value: charStats.knockbackMultiplier, color: BALATRO_COLORS.cyan },
        ]

        statItems.forEach((stat, index) => {
            const y = statsY + index * barGap

            const label = new Text({
                text: stat.label,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.textSecondary,
                }),
            })
            label.anchor.set(0, 0.5)
            label.position.set(statsStartX, y)
            this.screenContainer.addChild(label)

            const barBgX = statsStartX + 50
            const barWidth = statsWidth - 80
            const barBg = new Graphics()
            barBg.roundRect(barBgX, y - barHeight / 2, barWidth, barHeight, 4)
            barBg.fill(BALATRO_COLORS.bgCardLight)
            this.screenContainer.addChild(barBg)

            const normalizedValue = Math.min(1, Math.max(0, (stat.value - 0.5) / 1.5))
            const fillWidth = barWidth * normalizedValue
            if (fillWidth > 0) {
                const barFill = new Graphics()
                barFill.roundRect(barBgX, y - barHeight / 2, fillWidth, barHeight, 4)
                barFill.fill(stat.color)
                this.screenContainer.addChild(barFill)
            }

            const valueText = new Text({
                text: stat.value.toFixed(1),
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.textPrimary,
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
                fill: BALATRO_COLORS.textSecondary,
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
                this.skillScrollY = Math.max(
                    0,
                    Math.min(this.skillMaxScrollY, this.dragStartScrollY - deltaY)
                )
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
            bg.roundRect(0, 0, skillIconSize, skillIconSize, BALATRO_DESIGN.radiusSmall)
            if (isUnlocked) {
                bg.fill(BALATRO_COLORS.bgCardLight)
                bg.roundRect(0, 0, skillIconSize, skillIconSize, BALATRO_DESIGN.radiusSmall)
                bg.stroke({ color: skillDef.color, width: 2 })
            } else {
                bg.fill({ color: BALATRO_COLORS.bgCard, alpha: 0.5 })
                bg.roundRect(0, 0, skillIconSize, skillIconSize, BALATRO_DESIGN.radiusSmall)
                bg.stroke({ color: BALATRO_COLORS.textMuted, width: 1, alpha: 0.3 })
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
                        fill: BALATRO_COLORS.textMuted,
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
                style: new TextStyle({ fontSize: 8, fill: BALATRO_COLORS.textMuted }),
            })
            upArrow.anchor.set(0.5)
            upArrow.position.set(-15, 0)
            upArrow.alpha = 0.5
            indicatorContainer.addChild(upArrow)

            // Scroll hint
            const scrollHint = new Text({
                text: 'scroll',
                style: new TextStyle({ fontSize: 8, fill: BALATRO_COLORS.textMuted }),
            })
            scrollHint.anchor.set(0.5)
            scrollHint.position.set(0, 0)
            scrollHint.alpha = 0.5
            indicatorContainer.addChild(scrollHint)

            // Down arrow
            const downArrow = new Text({
                text: '▼',
                style: new TextStyle({ fontSize: 8, fill: BALATRO_COLORS.textMuted }),
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

        // Description background using Balatro card style
        const descBg = new Graphics()
        descBg.roundRect(-descWidth / 2, 0, descWidth, 48, BALATRO_DESIGN.radiusSmall)
        descBg.fill(BALATRO_COLORS.bgCardLight)
        descBg.roundRect(-descWidth / 2, 0, descWidth, 48, BALATRO_DESIGN.radiusSmall)
        descBg.stroke({ color: BALATRO_COLORS.textMuted, width: 1, alpha: 0.3 })
        this.skillDescContainer.addChild(descBg)

        // Skill name text
        this.skillDescNameText = new Text({
            text: 'Select a skill to view details',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textSecondary,
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
                fill: BALATRO_COLORS.textSecondary,
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
            this.skillDescText.style.fill = BALATRO_COLORS.textSecondary
        } else {
            this.skillDescNameText.text = `🔒 ${t(skillDef.name, 'ko')}`
            this.skillDescNameText.style.fill = BALATRO_COLORS.textMuted
            const formulaHint = skillDef.formulaId ? `(관련 공식을 학습하면 해금)` : '(잠금됨)'
            this.skillDescText.text = formulaHint
            this.skillDescText.style.fill = BALATRO_COLORS.textMuted
        }
    }

    private handleSelectCharacter(): void {
        this.hide()
        this.onSelectCharacter?.(this.getSelectedCharacter())
    }
}
