import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { PLAYABLE_CHARACTERS } from '../types'
import { SKILL_DEFINITIONS, PASSIVE_DEFINITIONS, getCharacterSkillConfig } from '../skills'

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

    // Selected character
    private selectedCharacter: WobbleShape = 'circle'

    // UI elements
    private characterCardContainer!: Container
    private previewWobble: Wobble | null = null
    private characterNameText!: Text
    private characterDescText!: Text
    private characterStatsContainer!: Container
    private skillPreviewContainer!: Container
    private leftArrowBtn!: Container
    private rightArrowBtn!: Container
    private startButton!: Container

    // Animation state
    private animPhase = 0
    private isVisible = false

    // Callbacks
    onStartGame?: (character: WobbleShape) => void

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
        return this.selectedCharacter
    }

    /**
     * Show the character selection screen
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

        // Animate preview wobble with breathing effect
        if (this.previewWobble) {
            const breathe = Math.sin(this.animPhase * 2.5) * 0.05
            this.previewWobble.updateOptions({
                wobblePhase: this.animPhase,
                scaleX: 1 + breathe,
                scaleY: 1 - breathe,
            })
        }

        // Card container subtle float animation (based on new layout: cardY=30, titleY=55, charAreaY=90)
        if (this.characterCardContainer) {
            const baseY = 30 + 25 + 35 + 45 // cardY + title offset + charAreaY offset + center offset
            const float = Math.sin(this.animPhase * 1.5) * 3
            this.characterCardContainer.position.y = baseY + float
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

        // Subtle pulse animation for start button
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
        this.selectedCharacter = 'circle'
        this.animPhase = 0
    }

    private selectCharacter(shape: WobbleShape): void {
        if (this.selectedCharacter === shape) return
        this.selectedCharacter = shape
        this.createUI() // Rebuild UI for clean selection state
    }

    private selectNextCharacter(): void {
        const currentIndex = PLAYABLE_CHARACTERS.indexOf(this.selectedCharacter)
        const nextIndex = (currentIndex + 1) % PLAYABLE_CHARACTERS.length
        this.selectCharacter(PLAYABLE_CHARACTERS[nextIndex])
    }

    private selectPrevCharacter(): void {
        const currentIndex = PLAYABLE_CHARACTERS.indexOf(this.selectedCharacter)
        const prevIndex =
            (currentIndex - 1 + PLAYABLE_CHARACTERS.length) % PLAYABLE_CHARACTERS.length
        this.selectCharacter(PLAYABLE_CHARACTERS[prevIndex])
    }

    private createUI(): void {
        this.screenContainer.removeChildren()

        // === BALATRO-STYLE MUTED THEME ===
        const bgTopColor = 0x7db8b0 // soft sage
        const bgBottomColor = 0x5a9a91 // muted teal
        const cardBgColor = 0xf5f0e8 // warm cream
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38
        const textMuted = 0x5a6b66
        const accentGold = 0xd4a574 // muted gold

        const selectedChar = WOBBLE_CHARACTERS[this.selectedCharacter]

        // Gradient background
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

        // Subtle dot pattern (Balatro style)
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
        card.stroke({ color: accentGold, width: 3 })
        this.screenContainer.addChild(card)

        // Title
        const titleY = cardY + 25
        const titleText = new Text({
            text: 'SELECT CHARACTER',
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

        // Character preview area
        const charAreaY = titleY + 35
        const charAreaHeight = 120

        // Character container (for wobble + name)
        this.characterCardContainer = new Container()
        this.characterCardContainer.position.set(this.centerX, charAreaY + 45)
        this.screenContainer.addChild(this.characterCardContainer)

        // Character wobble
        this.previewWobble = new Wobble({
            size: 55,
            shape: this.selectedCharacter,
            expression: 'happy',
            color: selectedChar.color,
            showShadow: true,
            shadowOffsetY: 5,
        })
        this.characterCardContainer.addChild(this.previewWobble)

        // Character name
        this.characterNameText = new Text({
            text: selectedChar.name.toUpperCase(),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: textDark,
                letterSpacing: 1,
            }),
        })
        this.characterNameText.anchor.set(0.5)
        this.characterNameText.position.set(0, 45)
        this.characterCardContainer.addChild(this.characterNameText)

        // Character description
        this.characterDescText = new Text({
            text: selectedChar.personalityKo,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: textMuted,
            }),
        })
        this.characterDescText.anchor.set(0.5)
        this.characterDescText.position.set(0, 62)
        this.characterCardContainer.addChild(this.characterDescText)

        // Arrow buttons
        this.leftArrowBtn = this.createArrowButton('<', this.centerX - 90, charAreaY + 45, () => {
            this.selectPrevCharacter()
        })
        this.screenContainer.addChild(this.leftArrowBtn)

        this.rightArrowBtn = this.createArrowButton('>', this.centerX + 90, charAreaY + 45, () => {
            this.selectNextCharacter()
        })
        this.screenContainer.addChild(this.rightArrowBtn)

        // Character indicator (page dots)
        const dotsY = charAreaY + charAreaHeight + 5
        const dotGap = 12
        const totalDotsWidth = (PLAYABLE_CHARACTERS.length - 1) * dotGap
        PLAYABLE_CHARACTERS.forEach((char, i) => {
            const isSelected = char === this.selectedCharacter
            const dot = new Graphics()
            const dotX = this.centerX - totalDotsWidth / 2 + i * dotGap
            dot.circle(dotX, dotsY, isSelected ? 4 : 3)
            dot.fill({ color: isSelected ? textDark : textMuted, alpha: isSelected ? 1 : 0.4 })
            this.screenContainer.addChild(dot)
        })

        // Divider
        const dividerY = dotsY + 18
        const divider = new Graphics()
        divider.moveTo(cardX + 25, dividerY)
        divider.lineTo(cardX + cardWidth - 25, dividerY)
        divider.stroke({ color: textMuted, width: 1, alpha: 0.3 })
        this.screenContainer.addChild(divider)

        // Skills section
        const skillSectionY = dividerY + 18
        const charConfig = getCharacterSkillConfig(this.selectedCharacter)

        // Section label style
        const sectionLabelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 11,
            fontWeight: 'bold',
            fill: textMuted,
            letterSpacing: 2,
        })

        // Starting Skills label
        const skillLabel = new Text({ text: 'SKILLS', style: sectionLabelStyle })
        skillLabel.anchor.set(0.5)
        skillLabel.position.set(this.centerX, skillSectionY)
        this.screenContainer.addChild(skillLabel)

        // Starting skills display as pills
        this.skillPreviewContainer = new Container()
        this.skillPreviewContainer.position.set(this.centerX, skillSectionY + 25)
        this.screenContainer.addChild(this.skillPreviewContainer)

        const pillHeight = 26
        const pillGap = 8
        const pillPadding = 10

        // Calculate pill widths
        const skillPillWidths: number[] = []
        let totalSkillWidth = 0
        charConfig.startingSkills.forEach((skillId) => {
            const skillDef = SKILL_DEFINITIONS[skillId]
            if (!skillDef) return
            const text = `${skillDef.icon} ${skillDef.nameKo}`
            const width = text.length * 7 + pillPadding * 2
            skillPillWidths.push(width)
            totalSkillWidth += width
        })
        totalSkillWidth += (skillPillWidths.length - 1) * pillGap

        let skillX = -totalSkillWidth / 2
        charConfig.startingSkills.forEach((skillId, i) => {
            const skillDef = SKILL_DEFINITIONS[skillId]
            if (!skillDef) return

            const pillWidth = skillPillWidths[i]
            const pill = new Container()
            pill.position.set(skillX + pillWidth / 2, 0)

            // Pill background
            const pillBg = new Graphics()
            pillBg.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, pillHeight / 2)
            pillBg.fill({ color: textMuted, alpha: 0.12 })
            pillBg.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, pillHeight / 2)
            pillBg.stroke({ color: skillDef.color, width: 1.5, alpha: 0.6 })
            pill.addChild(pillBg)

            const pillText = new Text({
                text: `${skillDef.icon} ${skillDef.nameKo}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: textDark,
                }),
            })
            pillText.anchor.set(0.5)
            pill.addChild(pillText)

            this.skillPreviewContainer.addChild(pill)
            skillX += pillWidth + pillGap
        })

        // Passive section
        const passiveY = skillSectionY + 60
        const passiveLabel = new Text({ text: 'PASSIVE', style: sectionLabelStyle })
        passiveLabel.anchor.set(0.5)
        passiveLabel.position.set(this.centerX, passiveY)
        this.screenContainer.addChild(passiveLabel)

        // Passive info as pill
        const passiveDef = PASSIVE_DEFINITIONS[charConfig.passive]
        if (passiveDef) {
            const passiveText = `${passiveDef.icon} ${passiveDef.nameKo}`
            const passivePillWidth = passiveText.length * 8 + pillPadding * 2

            const passivePill = new Graphics()
            passivePill.roundRect(
                this.centerX - passivePillWidth / 2,
                passiveY + 12,
                passivePillWidth,
                pillHeight,
                pillHeight / 2
            )
            passivePill.fill({ color: textMuted, alpha: 0.12 })
            passivePill.roundRect(
                this.centerX - passivePillWidth / 2,
                passiveY + 12,
                passivePillWidth,
                pillHeight,
                pillHeight / 2
            )
            passivePill.stroke({ color: passiveDef.color, width: 1.5, alpha: 0.6 })
            this.screenContainer.addChild(passivePill)

            const passiveNameText = new Text({
                text: passiveText,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: textDark,
                }),
            })
            passiveNameText.anchor.set(0.5)
            passiveNameText.position.set(this.centerX, passiveY + 25)
            this.screenContainer.addChild(passiveNameText)

            const passiveDescText = new Text({
                text: passiveDef.descriptionKo,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fill: textMuted,
                    wordWrap: true,
                    wordWrapWidth: cardWidth - 40,
                    align: 'center',
                }),
            })
            passiveDescText.anchor.set(0.5)
            passiveDescText.position.set(this.centerX, passiveY + 50)
            this.screenContainer.addChild(passiveDescText)
        }

        // Hidden stats container for compatibility
        this.characterStatsContainer = new Container()
        this.characterStatsContainer.visible = false
        this.screenContainer.addChild(this.characterStatsContainer)

        // Start button
        this.startButton = this.createStartButton(this.centerX, this.height - 55)
        this.screenContainer.addChild(this.startButton)
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

    private createStartButton(x: number, y: number): Container {
        const btn = new Container()
        btn.position.set(x, y)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        const width = 140
        const height = 44
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const accentColor = 0x5a9a91
        const textDark = 0x2d3b38

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 3, -height / 2 + 4, width, height, 12)
        shadow.fill({ color: cardShadowColor, alpha: 0.4 })
        btn.addChild(shadow)

        // Button background
        const bg = new Graphics()
        bg.roundRect(-width / 2, -height / 2, width, height, 12)
        bg.fill(cardBgColor)
        bg.roundRect(-width / 2, -height / 2, width, height, 12)
        bg.stroke({ color: accentColor, width: 3 })
        btn.addChild(bg)

        // PLAY text
        const startText = new Text({
            text: 'PLAY',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: textDark,
                letterSpacing: 3,
            }),
        })
        startText.anchor.set(0.5)
        btn.addChild(startText)

        btn.on('pointerdown', () => {
            btn.scale.set(0.95)
        })
        btn.on('pointerup', () => {
            btn.scale.set(1)
            this.handleStartGame()
        })
        btn.on('pointerupoutside', () => {
            btn.scale.set(1)
        })

        return btn
    }

    private handleStartGame(): void {
        this.hide()
        this.onStartGame?.(this.selectedCharacter)
    }
}
