import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { PlayerSkill, SKILL_DEFINITIONS, getCurrentLevelDescription } from '../skills'

export interface PauseScreenContext {
    container: Container
    width: number
    height: number
}

export interface PauseData {
    level: number
    xp: number
    xpToNextLevel: number
    gameTime: number
    skills: PlayerSkill[]
    health: number
    maxHealth: number
}

export class PauseScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number
    private isVisible = false

    // Callbacks
    onResume?: () => void
    onExit?: () => void

    constructor(context: PauseScreenContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(data: PauseData): void {
        this.isVisible = true
        this.screenContainer.visible = true
        this.createUI(data)
    }

    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
        this.screenContainer.removeChildren()
    }

    update(_deltaSeconds: number): void {
        // No animation needed for pause screen
    }

    reset(): void {
        this.hide()
    }

    private createUI(data: PauseData): void {
        this.screenContainer.removeChildren()

        // Theme colors (matching ResultScreen)
        const bgColor = 0x1a1a2e
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56
        const textDark = 0x2d3b38
        const textMuted = 0x5a6b66
        const accentGold = 0xd4a574
        const accentGreen = 0x5a9a91
        const accentRed = 0xc75050

        // Semi-transparent dark background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: bgColor, alpha: 0.85 })
        bg.eventMode = 'static'
        bg.on('pointerdown', () => this.onResume?.())
        this.screenContainer.addChild(bg)

        // Responsive card sizing
        const cardPadding = Math.min(24, this.width * 0.06)
        const cardWidth = this.width - cardPadding * 2
        const cardHeight = Math.min(320, this.height * 0.55)
        const cardX = cardPadding
        const cardY = (this.height - cardHeight) / 2 - 30

        // Card shadow
        const cardShadow = new Graphics()
        cardShadow.roundRect(cardX + 3, cardY + 5, cardWidth, cardHeight, 14)
        cardShadow.fill({ color: cardShadowColor, alpha: 0.4 })
        this.screenContainer.addChild(cardShadow)

        // Card background
        const card = new Graphics()
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 14)
        card.fill(cardBgColor)
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 14)
        card.stroke({ color: accentGold, width: 3 })
        card.eventMode = 'static'
        this.screenContainer.addChild(card)

        // Title
        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: Math.min(20, this.width * 0.055),
            fontWeight: 'bold',
            fill: textDark,
            letterSpacing: 2,
        })
        const title = new Text({ text: 'PAUSED', style: titleStyle })
        title.anchor.set(0.5)
        title.position.set(this.centerX, cardY + 32)
        this.screenContainer.addChild(title)

        // Inner content padding
        const innerPadding = Math.min(16, cardWidth * 0.05)
        const contentX = cardX + innerPadding
        const contentWidth = cardWidth - innerPadding * 2

        // Stats section - horizontal layout for Level and Time
        const statsY = cardY + 65
        const statBoxWidth = (contentWidth - 10) / 2
        const statBoxHeight = 50

        // Level box
        this.createStatBox(
            contentX,
            statsY,
            statBoxWidth,
            statBoxHeight,
            'LEVEL',
            `Lv. ${data.level}`,
            textMuted,
            textDark,
            cardShadowColor
        )

        // Time box
        const mins = Math.floor(data.gameTime / 60)
        const secs = Math.floor(data.gameTime % 60)
        this.createStatBox(
            contentX + statBoxWidth + 10,
            statsY,
            statBoxWidth,
            statBoxHeight,
            'TIME',
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
            textMuted,
            textDark,
            cardShadowColor
        )

        // XP Bar - full width below stats
        const xpBarY = statsY + statBoxHeight + 12
        const xpBarHeight = 20

        // XP label
        const xpLabelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            fill: textMuted,
        })
        const xpLabel = new Text({ text: 'EXP', style: xpLabelStyle })
        xpLabel.anchor.set(0, 0.5)
        xpLabel.position.set(contentX, xpBarY + xpBarHeight / 2)
        this.screenContainer.addChild(xpLabel)

        // XP bar background
        const xpBarX = contentX + 35
        const xpBarWidth = contentWidth - 35
        const xpBarBg = new Graphics()
        xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 10)
        xpBarBg.fill({ color: textMuted, alpha: 0.15 })
        xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 10)
        xpBarBg.stroke({ color: textMuted, width: 1, alpha: 0.3 })
        this.screenContainer.addChild(xpBarBg)

        // XP bar fill
        const xpRatio = data.xp / (data.xp + data.xpToNextLevel)
        if (xpRatio > 0) {
            const xpBarFill = new Graphics()
            xpBarFill.roundRect(
                xpBarX + 2,
                xpBarY + 2,
                Math.max(0, (xpBarWidth - 4) * xpRatio),
                xpBarHeight - 4,
                8
            )
            xpBarFill.fill(0x2ecc71)
            this.screenContainer.addChild(xpBarFill)
        }

        // Skills section
        const skillsY = xpBarY + xpBarHeight + 15
        if (data.skills.length > 0) {
            const skillsLabelStyle = new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: textMuted,
                letterSpacing: 1,
            })
            const skillsLabel = new Text({
                text: `SKILLS (${data.skills.length})`,
                style: skillsLabelStyle,
            })
            skillsLabel.anchor.set(0.5)
            skillsLabel.position.set(this.centerX, skillsY)
            this.screenContainer.addChild(skillsLabel)

            // Skill items
            const skillItemHeight = 26
            const skillItemGap = 4
            const skillStartY = skillsY + 20
            const maxVisibleSkills = 3

            const visibleSkills = data.skills.slice(0, maxVisibleSkills)
            visibleSkills.forEach((skill, i) => {
                const skillDef = SKILL_DEFINITIONS[skill.skillId]
                if (!skillDef) return

                const itemY = skillStartY + i * (skillItemHeight + skillItemGap)
                const itemWidth = contentWidth
                const itemX = contentX

                // Skill pill background
                const pillBg = new Graphics()
                pillBg.roundRect(itemX, itemY, itemWidth, skillItemHeight, skillItemHeight / 2)
                pillBg.fill({ color: skillDef.color, alpha: 0.15 })
                pillBg.roundRect(itemX, itemY, itemWidth, skillItemHeight, skillItemHeight / 2)
                pillBg.stroke({ color: skillDef.color, width: 1, alpha: 0.4 })
                this.screenContainer.addChild(pillBg)

                // Skill icon
                const iconText = new Text({
                    text: skillDef.icon,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 12,
                        fill: skillDef.color,
                    }),
                })
                iconText.anchor.set(0.5)
                iconText.position.set(itemX + 16, itemY + skillItemHeight / 2)
                this.screenContainer.addChild(iconText)

                // Skill name and level
                const skillNameText = new Text({
                    text: `${skillDef.nameKo} Lv.${skill.level}`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fill: textDark,
                    }),
                })
                skillNameText.anchor.set(0, 0.5)
                skillNameText.position.set(itemX + 30, itemY + skillItemHeight / 2)
                this.screenContainer.addChild(skillNameText)

                // Skill effect (only show if there's enough space)
                if (itemWidth > 180) {
                    const effectDesc = getCurrentLevelDescription(skill.skillId, skill.level)
                    if (effectDesc) {
                        const effectText = new Text({
                            text: effectDesc,
                            style: new TextStyle({
                                fontFamily: 'Arial, sans-serif',
                                fontSize: 9,
                                fill: textMuted,
                            }),
                        })
                        effectText.anchor.set(1, 0.5)
                        effectText.position.set(itemX + itemWidth - 10, itemY + skillItemHeight / 2)
                        this.screenContainer.addChild(effectText)
                    }
                }
            })

            // Show "+N more" if there are more skills
            if (data.skills.length > maxVisibleSkills) {
                const moreY = skillStartY + maxVisibleSkills * (skillItemHeight + skillItemGap)
                const moreText = new Text({
                    text: `+${data.skills.length - maxVisibleSkills} more`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 9,
                        fill: textMuted,
                    }),
                })
                moreText.anchor.set(0.5)
                moreText.position.set(this.centerX, moreY + 3)
                this.screenContainer.addChild(moreText)
            }
        }

        // Action buttons - responsive sizing
        const btnY = cardY + cardHeight + 25
        const btnWidth = Math.min(85, (contentWidth - 20) / 2)
        const btnGap = 15

        // Resume button (primary)
        const resumeBtn = this.createButton('RESUME', -btnWidth / 2 - btnGap / 2, btnWidth, accentGreen, () => {
            this.onResume?.()
        })
        resumeBtn.position.y = btnY
        this.screenContainer.addChild(resumeBtn)

        // Exit button (secondary)
        const exitBtn = this.createButton('EXIT', btnWidth / 2 + btnGap / 2, btnWidth, accentRed, () => {
            this.onExit?.()
        })
        exitBtn.position.y = btnY
        this.screenContainer.addChild(exitBtn)
    }

    private createStatBox(
        x: number,
        y: number,
        width: number,
        height: number,
        label: string,
        value: string,
        labelColor: number,
        valueColor: number,
        shadowColor: number
    ): void {
        // Box shadow
        const shadow = new Graphics()
        shadow.roundRect(x + 2, y + 3, width, height, 10)
        shadow.fill({ color: shadowColor, alpha: 0.15 })
        this.screenContainer.addChild(shadow)

        // Box background
        const boxBg = new Graphics()
        boxBg.roundRect(x, y, width, height, 10)
        boxBg.fill({ color: 0xffffff, alpha: 0.5 })
        boxBg.roundRect(x, y, width, height, 10)
        boxBg.stroke({ color: labelColor, width: 1, alpha: 0.3 })
        this.screenContainer.addChild(boxBg)

        // Label
        const labelText = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,
                fontWeight: 'bold',
                fill: labelColor,
                letterSpacing: 1,
            }),
        })
        labelText.anchor.set(0.5)
        labelText.position.set(x + width / 2, y + 14)
        this.screenContainer.addChild(labelText)

        // Value
        const valueText = new Text({
            text: value,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: valueColor,
            }),
        })
        valueText.anchor.set(0.5)
        valueText.position.set(x + width / 2, y + 34)
        this.screenContainer.addChild(valueText)
    }

    private createButton(
        label: string,
        offsetX: number,
        width: number,
        color: number,
        onClick: () => void
    ): Container {
        const btn = new Container()
        btn.position.set(this.centerX + offsetX, 0)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        const btnHeight = 40
        const cardBgColor = 0xf5f0e8
        const cardShadowColor = 0x3d5c56

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 2, -btnHeight / 2 + 3, width, btnHeight, 10)
        shadow.fill({ color: cardShadowColor, alpha: 0.3 })
        btn.addChild(shadow)

        // Button background
        const bg = new Graphics()
        bg.roundRect(-width / 2, -btnHeight / 2, width, btnHeight, 10)
        bg.fill(cardBgColor)
        bg.roundRect(-width / 2, -btnHeight / 2, width, btnHeight, 10)
        bg.stroke({ color, width: 2 })
        btn.addChild(bg)

        // Button text
        const text = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fontWeight: 'bold',
                fill: color,
                letterSpacing: 1,
            }),
        })
        text.anchor.set(0.5)
        btn.addChild(text)

        btn.on('pointerdown', onClick)

        return btn
    }
}
