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

        // Balatro theme colors
        const bgColor = 0x3d6b59 // Felt green background
        const cardBgColor = 0x374244 // Dark panel
        const cardShadowColor = 0x1a1a1a // Black shadow
        const accentGold = 0xc9a227 // Balatro gold
        const accentBlue = 0x4a9eff // Balatro blue
        const accentRed = 0xe85d4c // Balatro red

        // Semi-transparent felt background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: bgColor, alpha: 0.92 })
        bg.eventMode = 'static'
        bg.on('pointerdown', () => this.onResume?.())
        this.screenContainer.addChild(bg)

        // Vignette effect
        const vignette = new Graphics()
        for (let i = 0; i < 5; i++) {
            const alpha = 0.12 * (1 - i / 5)
            vignette.rect(0, i * 30, this.width, 30)
            vignette.fill({ color: 0x000000, alpha })
            vignette.rect(0, this.height - (i + 1) * 30, this.width, 30)
            vignette.fill({ color: 0x000000, alpha })
        }
        this.screenContainer.addChild(vignette)

        // Responsive card sizing - compact to fit content
        const cardPadding = Math.min(24, this.width * 0.06)
        const cardWidth = this.width - cardPadding * 2
        // Calculate height based on content: stats + xp + skills + buttons
        const hasSkills = data.skills.length > 0
        const skillRows = Math.min(3, data.skills.length)
        const baseHeight = 180 // Stats + XP bar
        const skillsHeight = hasSkills ? 30 + skillRows * 33 : 0
        const buttonsHeight = 60
        const cardHeight = baseHeight + skillsHeight + buttonsHeight
        const cardX = cardPadding
        const cardY = (this.height - cardHeight) / 2 - 10

        // Card shadow
        const cardShadow = new Graphics()
        cardShadow.roundRect(cardX + 3, cardY + 6, cardWidth, cardHeight, 14)
        cardShadow.fill({ color: cardShadowColor, alpha: 0.5 })
        this.screenContainer.addChild(cardShadow)

        // Card background - Balatro style with thick black border
        const card = new Graphics()
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 14)
        card.fill(cardBgColor)
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 14)
        card.stroke({ color: 0x1a1a1a, width: 4 })
        card.eventMode = 'static'
        this.screenContainer.addChild(card)

        // Title badge (like HomeScreen)
        const badgeWidth = 140
        const badgeHeight = 36
        const badgeShadow = new Graphics()
        badgeShadow.roundRect(this.centerX - badgeWidth / 2 + 2, cardY - 18 + 3, badgeWidth, badgeHeight, 8)
        badgeShadow.fill({ color: cardShadowColor, alpha: 0.5 })
        this.screenContainer.addChild(badgeShadow)

        const badge = new Graphics()
        badge.roundRect(this.centerX - badgeWidth / 2, cardY - 18, badgeWidth, badgeHeight, 8)
        badge.fill(accentGold)
        badge.roundRect(this.centerX - badgeWidth / 2, cardY - 18, badgeWidth, badgeHeight, 8)
        badge.stroke({ color: 0x1a1a1a, width: 3 })
        this.screenContainer.addChild(badge)

        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 16,
            fontWeight: 'bold',
            fill: 0x000000,
            letterSpacing: 3,
        })
        const title = new Text({ text: 'PAUSED', style: titleStyle })
        title.anchor.set(0.5)
        title.position.set(this.centerX, cardY)
        this.screenContainer.addChild(title)

        // Inner content padding
        const innerPadding = Math.min(16, cardWidth * 0.05)
        const contentX = cardX + innerPadding
        const contentWidth = cardWidth - innerPadding * 2

        // Stats section - horizontal layout for Level and Time
        const statsY = cardY + 35
        const statBoxWidth = (contentWidth - 10) / 2
        const statBoxHeight = 50

        // Level box (gold accent)
        this.createStatBox(
            contentX,
            statsY,
            statBoxWidth,
            statBoxHeight,
            'LEVEL',
            `Lv. ${data.level}`,
            accentGold
        )

        // Time box (blue accent)
        const mins = Math.floor(data.gameTime / 60)
        const secs = Math.floor(data.gameTime % 60)
        this.createStatBox(
            contentX + statBoxWidth + 10,
            statsY,
            statBoxWidth,
            statBoxHeight,
            'TIME',
            `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`,
            accentBlue
        )

        // XP Bar - full width below stats
        const xpBarY = statsY + statBoxHeight + 12
        const xpBarHeight = 24

        // XP label
        const xpLabelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            fill: 0xaaaaaa,
        })
        const xpLabel = new Text({ text: 'EXP', style: xpLabelStyle })
        xpLabel.anchor.set(0, 0.5)
        xpLabel.position.set(contentX, xpBarY + xpBarHeight / 2)
        this.screenContainer.addChild(xpLabel)

        // XP bar background
        const xpBarX = contentX + 35
        const xpBarWidth = contentWidth - 35
        const xpBarBg = new Graphics()
        xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 12)
        xpBarBg.fill({ color: 0x2d3b38, alpha: 1 })
        xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 12)
        xpBarBg.stroke({ color: 0x1a1a1a, width: 2 })
        this.screenContainer.addChild(xpBarBg)

        // XP bar fill - Balatro green
        const xpRatio = data.xp / (data.xp + data.xpToNextLevel)
        if (xpRatio > 0) {
            const xpBarFill = new Graphics()
            xpBarFill.roundRect(
                xpBarX + 3,
                xpBarY + 3,
                Math.max(0, (xpBarWidth - 6) * xpRatio),
                xpBarHeight - 6,
                9
            )
            xpBarFill.fill(0x3d6b59)
            this.screenContainer.addChild(xpBarFill)
        }

        // XP text
        const xpText = new Text({
            text: `${data.xp} / ${data.xp + data.xpToNextLevel}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        xpText.anchor.set(0.5)
        xpText.position.set(xpBarX + xpBarWidth / 2, xpBarY + xpBarHeight / 2)
        this.screenContainer.addChild(xpText)

        // Skills section
        const skillsY = xpBarY + xpBarHeight + 15
        if (data.skills.length > 0) {
            const skillsLabelStyle = new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: 0xaaaaaa,
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
            const skillItemHeight = 28
            const skillItemGap = 5
            const skillStartY = skillsY + 20
            const maxVisibleSkills = 3

            const visibleSkills = data.skills.slice(0, maxVisibleSkills)
            visibleSkills.forEach((skill, i) => {
                const skillDef = SKILL_DEFINITIONS[skill.skillId]
                if (!skillDef) return

                const itemY = skillStartY + i * (skillItemHeight + skillItemGap)
                const itemWidth = contentWidth
                const itemX = contentX

                // Skill pill shadow
                const pillShadow = new Graphics()
                pillShadow.roundRect(itemX + 2, itemY + 3, itemWidth, skillItemHeight, skillItemHeight / 2)
                pillShadow.fill({ color: 0x1a1a1a, alpha: 0.3 })
                this.screenContainer.addChild(pillShadow)

                // Skill pill background
                const pillBg = new Graphics()
                pillBg.roundRect(itemX, itemY, itemWidth, skillItemHeight, skillItemHeight / 2)
                pillBg.fill({ color: 0x2d3b38, alpha: 1 })
                pillBg.roundRect(itemX, itemY, itemWidth, skillItemHeight, skillItemHeight / 2)
                pillBg.stroke({ color: skillDef.color, width: 2, alpha: 0.8 })
                this.screenContainer.addChild(pillBg)

                // Skill icon
                const iconText = new Text({
                    text: skillDef.icon,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 13,
                        fill: skillDef.color,
                    }),
                })
                iconText.anchor.set(0.5)
                iconText.position.set(itemX + 18, itemY + skillItemHeight / 2)
                this.screenContainer.addChild(iconText)

                // Skill name and level
                const skillNameText = new Text({
                    text: `${skillDef.nameKo} Lv.${skill.level}`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 11,
                        fontWeight: 'bold',
                        fill: 0xffffff,
                    }),
                })
                skillNameText.anchor.set(0, 0.5)
                skillNameText.position.set(itemX + 34, itemY + skillItemHeight / 2)
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
                                fill: 0xaaaaaa,
                            }),
                        })
                        effectText.anchor.set(1, 0.5)
                        effectText.position.set(itemX + itemWidth - 12, itemY + skillItemHeight / 2)
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
                        fill: 0xaaaaaa,
                    }),
                })
                moreText.anchor.set(0.5)
                moreText.position.set(this.centerX, moreY + 3)
                this.screenContainer.addChild(moreText)
            }
        }

        // Action buttons - inside card at bottom
        const btnY = cardY + cardHeight - 30
        const btnWidth = Math.min(100, (contentWidth - 20) / 2)
        const btnGap = 15

        // Resume button (primary - blue)
        const resumeBtn = this.createButton('RESUME', -btnWidth / 2 - btnGap / 2, btnWidth, accentBlue, () => {
            this.onResume?.()
        })
        resumeBtn.position.y = btnY
        this.screenContainer.addChild(resumeBtn)

        // Exit button (secondary - red)
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
        accentColor: number
    ): void {
        // Box shadow
        const shadow = new Graphics()
        shadow.roundRect(x + 2, y + 3, width, height, 10)
        shadow.fill({ color: 0x1a1a1a, alpha: 0.3 })
        this.screenContainer.addChild(shadow)

        // Box background - Balatro darker panel
        const boxBg = new Graphics()
        boxBg.roundRect(x, y, width, height, 10)
        boxBg.fill({ color: 0x2d3b38, alpha: 1 })
        boxBg.roundRect(x, y, width, height, 10)
        boxBg.stroke({ color: accentColor, width: 2, alpha: 0.8 })
        this.screenContainer.addChild(boxBg)

        // Label
        const labelText = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,
                fontWeight: 'bold',
                fill: accentColor,
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
                fill: 0xffffff,
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
        const cardShadowColor = 0x1a1a1a

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-width / 2 + 2, -btnHeight / 2 + 4, width, btnHeight, 10)
        shadow.fill({ color: cardShadowColor, alpha: 0.5 })
        btn.addChild(shadow)

        // Colored background (like HomeScreen buttons)
        const bg = new Graphics()
        bg.roundRect(-width / 2, -btnHeight / 2, width, btnHeight, 10)
        bg.fill(color)
        bg.roundRect(-width / 2, -btnHeight / 2, width, btnHeight, 10)
        bg.stroke({ color: 0x1a1a1a, width: 3 })
        btn.addChild(bg)

        // Text color based on background
        const text = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fontWeight: 'bold',
                fill: 0xffffff, // White text on colored background
                letterSpacing: 1,
            }),
        })
        text.anchor.set(0.5)
        btn.addChild(text)

        btn.on('pointerdown', onClick)

        return btn
    }
}
