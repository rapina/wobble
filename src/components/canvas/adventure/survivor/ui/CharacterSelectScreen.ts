import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble, WobbleShape, WOBBLE_CHARACTERS } from '../../../Wobble'
import { WOBBLE_STATS, PLAYABLE_CHARACTERS } from '../types'
import { SKILL_DEFINITIONS, PASSIVE_DEFINITIONS, getCharacterSkillConfig } from '../skills'
import { drawUIHexagon } from '../utils'

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

        // Card container subtle float animation
        if (this.characterCardContainer) {
            const float = Math.sin(this.animPhase * 1.5) * 3
            this.characterCardContainer.position.y = 130 + float
        }

        // Arrow buttons subtle pulse
        if (this.leftArrowBtn && this.rightArrowBtn) {
            const arrowPulse = 1 + Math.sin(this.animPhase * 3) * 0.03
            if (this.leftArrowBtn.scale.x >= 0.95) {
                this.leftArrowBtn.scale.set(arrowPulse)
            }
            if (this.rightArrowBtn.scale.x >= 0.95) {
                this.rightArrowBtn.scale.set(arrowPulse)
            }
        }

        // Pulse animation for start button
        if (this.startButton) {
            const pulse = 1 + Math.sin(this.animPhase * 4) * 0.05
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

        // === MUTED THEME COLOR PALETTE ===
        const bgTopColor = 0x7db8b0 // soft sage
        const bgBottomColor = 0x5a9a91 // muted teal
        const cardBgColor = 0xffffff
        const cardBorderColor = 0x78716c
        const titleColor = 0xffffff
        const subtitleColor = 0x422006
        const textColor = 0x57534e
        const accentColor = 0x5a9a91 // muted teal for shadows

        const selectedChar = WOBBLE_CHARACTERS[this.selectedCharacter]

        // Gradient background
        const bg = new Graphics()
        const bands = 6
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

        // Subtle hexagonal pattern
        const pattern = new Graphics()
        const hexSize = 25
        const rows = Math.ceil(this.height / (hexSize * 1.5)) + 1
        const cols = Math.ceil(this.width / (hexSize * 1.732)) + 1
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const px = col * hexSize * 1.732 + (row % 2) * hexSize * 0.866
                const py = row * hexSize * 1.5
                const points: number[] = []
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i - Math.PI / 2
                    points.push(px + hexSize * 0.35 * Math.cos(angle))
                    points.push(py + hexSize * 0.35 * Math.sin(angle))
                }
                pattern.poly(points)
                pattern.stroke({ color: 0xffffff, width: 1, alpha: 0.08 })
            }
        }
        this.screenContainer.addChild(pattern)

        // Title
        const titleY = 40
        const titleText = new Text({
            text: 'SELECT CHARACTER',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: titleColor,
                letterSpacing: 2,
                dropShadow: {
                    color: 0x4a8a82,
                    blur: 0,
                    distance: 2,
                    angle: Math.PI / 2,
                },
            }),
        })
        titleText.anchor.set(0.5)
        titleText.position.set(this.centerX, titleY)
        this.screenContainer.addChild(titleText)

        // Character card
        const charSectionY = 75
        const charCardWidth = 140
        const charCardHeight = 130

        // Card shadow
        const charCardShadow = new Graphics()
        charCardShadow.roundRect(
            this.centerX - charCardWidth / 2 + 3,
            charSectionY + 4,
            charCardWidth,
            charCardHeight,
            12
        )
        charCardShadow.fill({ color: 0x4a8a82, alpha: 0.4 })
        this.screenContainer.addChild(charCardShadow)

        // Card background
        const charCard = new Graphics()
        charCard.roundRect(
            this.centerX - charCardWidth / 2,
            charSectionY,
            charCardWidth,
            charCardHeight,
            12
        )
        charCard.fill(cardBgColor)
        charCard.roundRect(
            this.centerX - charCardWidth / 2,
            charSectionY,
            charCardWidth,
            charCardHeight,
            12
        )
        charCard.stroke({ color: cardBorderColor, width: 2 })
        this.screenContainer.addChild(charCard)

        // Character container
        this.characterCardContainer = new Container()
        this.characterCardContainer.position.set(this.centerX, charSectionY + 50)
        this.screenContainer.addChild(this.characterCardContainer)

        // Character wobble
        this.previewWobble = new Wobble({
            size: 60,
            shape: this.selectedCharacter,
            expression: 'happy',
            color: selectedChar.color,
            showShadow: true,
            shadowOffsetY: 6,
        })
        this.characterCardContainer.addChild(this.previewWobble)

        // Character name
        this.characterNameText = new Text({
            text: selectedChar.name.toUpperCase(),
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: subtitleColor,
            }),
        })
        this.characterNameText.anchor.set(0.5)
        this.characterNameText.position.set(0, 48)
        this.characterCardContainer.addChild(this.characterNameText)

        // Character description
        this.characterDescText = new Text({
            text: selectedChar.personalityKo,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: textColor,
            }),
        })
        this.characterDescText.anchor.set(0.5)
        this.characterDescText.position.set(this.centerX, charSectionY + charCardHeight + 15)
        this.screenContainer.addChild(this.characterDescText)

        // Arrow buttons
        this.leftArrowBtn = this.createArrowButton(
            '<',
            this.centerX - 100,
            charSectionY + 65,
            () => {
                this.selectPrevCharacter()
            }
        )
        this.screenContainer.addChild(this.leftArrowBtn)

        this.rightArrowBtn = this.createArrowButton(
            '>',
            this.centerX + 100,
            charSectionY + 65,
            () => {
                this.selectNextCharacter()
            }
        )
        this.screenContainer.addChild(this.rightArrowBtn)

        // Character indicator
        const charIndexText = new Text({
            text: `${PLAYABLE_CHARACTERS.indexOf(this.selectedCharacter) + 1}/${PLAYABLE_CHARACTERS.length}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: titleColor,
                dropShadow: { color: 0x4a8a82, blur: 0, distance: 1, angle: Math.PI / 2 },
            }),
        })
        charIndexText.anchor.set(0.5)
        charIndexText.position.set(this.centerX, charSectionY + charCardHeight + 32)
        this.screenContainer.addChild(charIndexText)

        // Divider
        const dividerY = charSectionY + charCardHeight + 50
        const divider = new Graphics()
        divider.moveTo(this.centerX - 80, dividerY)
        divider.lineTo(this.centerX + 80, dividerY)
        divider.stroke({ color: 0xffffff, width: 2, alpha: 0.3 })
        this.screenContainer.addChild(divider)

        // Skills & Passive section
        const skillSectionY = dividerY + 15
        const charConfig = getCharacterSkillConfig(this.selectedCharacter)

        // Starting Skills label
        const skillLabel = new Text({
            text: 'STARTING SKILLS',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: titleColor,
                letterSpacing: 1,
                dropShadow: { color: 0x4a8a82, blur: 0, distance: 1, angle: Math.PI / 2 },
            }),
        })
        skillLabel.anchor.set(0.5)
        skillLabel.position.set(this.centerX, skillSectionY)
        this.screenContainer.addChild(skillLabel)

        // Starting skills display
        this.skillPreviewContainer = new Container()
        this.skillPreviewContainer.position.set(this.centerX, skillSectionY + 30)
        this.screenContainer.addChild(this.skillPreviewContainer)

        const skillIconSize = 32
        const skillGap = 12
        const totalSkillsWidth =
            charConfig.startingSkills.length * skillIconSize +
            (charConfig.startingSkills.length - 1) * skillGap
        const skillStartX = -totalSkillsWidth / 2 + skillIconSize / 2

        charConfig.startingSkills.forEach((skillId, i) => {
            const skillDef = SKILL_DEFINITIONS[skillId]
            if (!skillDef) return

            const skillIcon = new Container()
            skillIcon.position.set(skillStartX + i * (skillIconSize + skillGap), 0)

            const hex = new Graphics()
            drawUIHexagon(hex, 0, 0, skillIconSize / 2 + 4, cardBgColor, skillDef.color, 2)
            skillIcon.addChild(hex)

            const iconText = new Text({
                text: skillDef.icon,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 18,
                    fontWeight: 'bold',
                    fill: skillDef.color,
                }),
            })
            iconText.anchor.set(0.5)
            skillIcon.addChild(iconText)

            this.skillPreviewContainer.addChild(skillIcon)
        })

        // Skill names
        const skillNames = charConfig.startingSkills
            .map((id) => SKILL_DEFINITIONS[id]?.nameKo || '')
            .join(' + ')
        const skillNameText = new Text({
            text: skillNames,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: subtitleColor,
            }),
        })
        skillNameText.anchor.set(0.5)
        skillNameText.position.set(this.centerX, skillSectionY + 58)
        this.screenContainer.addChild(skillNameText)

        // Passive label
        const passiveY = skillSectionY + 80
        const passiveLabel = new Text({
            text: 'PASSIVE',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: titleColor,
                letterSpacing: 1,
                dropShadow: { color: 0x4a8a82, blur: 0, distance: 1, angle: Math.PI / 2 },
            }),
        })
        passiveLabel.anchor.set(0.5)
        passiveLabel.position.set(this.centerX, passiveY)
        this.screenContainer.addChild(passiveLabel)

        // Passive info
        const passiveDef = PASSIVE_DEFINITIONS[charConfig.passive]
        if (passiveDef) {
            const passiveNameText = new Text({
                text: `${passiveDef.icon} ${passiveDef.nameKo}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 12,
                    fontWeight: 'bold',
                    fill: passiveDef.color,
                }),
            })
            passiveNameText.anchor.set(0.5)
            passiveNameText.position.set(this.centerX, passiveY + 20)
            this.screenContainer.addChild(passiveNameText)

            const passiveDescText = new Text({
                text: passiveDef.descriptionKo,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fill: textColor,
                    wordWrap: true,
                    wordWrapWidth: this.width - 60,
                    align: 'center',
                }),
            })
            passiveDescText.anchor.set(0.5)
            passiveDescText.position.set(this.centerX, passiveY + 40)
            this.screenContainer.addChild(passiveDescText)
        }

        // Hidden stats container for compatibility
        this.characterStatsContainer = new Container()
        this.characterStatsContainer.visible = false
        this.screenContainer.addChild(this.characterStatsContainer)

        // Start button
        const startBtnY = skillSectionY + 160
        this.startButton = this.createStartButton(this.centerX, startBtnY)
        this.screenContainer.addChild(this.startButton)

        // Footer
        const footerText = new Text({
            text: 'PHYSICS SURVIVOR',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: titleColor,
                letterSpacing: 1,
            }),
        })
        footerText.anchor.set(0.5)
        footerText.position.set(this.centerX, this.height - 25)
        footerText.alpha = 0.7
        this.screenContainer.addChild(footerText)
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

        const btnWidth = 36
        const btnHeight = 50

        const bgColor = 0xffffff
        const highlightColor = 0xf5f5f4
        const borderColor = 0x78716c
        const shadowColor = 0x4a8a82
        const arrowColor = 0x422006

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-btnWidth / 2 + 2, -btnHeight / 2 + 3, btnWidth, btnHeight, 8)
        shadow.fill({ color: shadowColor, alpha: 0.3 })
        btn.addChild(shadow)

        // Main button
        const bg = new Graphics()
        bg.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8)
        bg.fill(bgColor)
        btn.addChild(bg)

        // Highlight
        const highlight = new Graphics()
        highlight.roundRect(
            -btnWidth / 2 + 2,
            -btnHeight / 2 + 2,
            btnWidth - 4,
            btnHeight / 2 - 2,
            6
        )
        highlight.fill({ color: highlightColor, alpha: 0.8 })
        btn.addChild(highlight)

        // Border
        const border = new Graphics()
        border.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 8)
        border.stroke({ color: borderColor, width: 2 })
        btn.addChild(border)

        // Arrow symbol
        const arrow = new Text({
            text: symbol,
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: arrowColor,
            }),
        })
        arrow.anchor.set(0.5)
        btn.addChild(arrow)

        btn.on('pointerdown', () => {
            btn.scale.set(0.92)
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

        const width = 160
        const height = 48

        const bgColor = 0xfbbf24
        const highlightColor = 0xfcd34d
        const borderColor = 0x78716c
        const shadowColor = 0x4a8a82
        const textColor = 0x422006

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 3, -height / 2 + 4, width, height, 12)
        shadow.fill({ color: shadowColor, alpha: 0.4 })
        btn.addChild(shadow)

        // Main button
        const bg = new Graphics()
        bg.roundRect(-width / 2, -height / 2, width, height, 12)
        bg.fill(bgColor)
        btn.addChild(bg)

        // Highlight
        const highlight = new Graphics()
        highlight.roundRect(-width / 2 + 3, -height / 2 + 3, width - 6, height / 2 - 3, 10)
        highlight.fill({ color: highlightColor, alpha: 0.8 })
        btn.addChild(highlight)

        // Border
        const border = new Graphics()
        border.roundRect(-width / 2, -height / 2, width, height, 12)
        border.stroke({ color: borderColor, width: 2 })
        btn.addChild(border)

        // PLAY text
        const startText = new Text({
            text: 'PLAY',
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: textColor,
                dropShadow: {
                    color: 0xfef08a,
                    blur: 0,
                    distance: 1,
                    angle: Math.PI / 2,
                },
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
