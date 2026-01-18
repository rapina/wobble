import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import {
    PlayerSkill,
    SKILL_DEFINITIONS,
    getCurrentLevelDescription,
    getNextLevelDescription,
} from '../skills'
import { t } from '@/utils/localization'
import {
    BALATRO_COLORS,
    BALATRO_DESIGN,
    drawBalatroCard,
    drawBalatroBadge,
    drawCornerDots,
    createBalatroButton,
} from './BalatroButton'

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
    private centerY: number
    private isVisible = false
    private decorDots: Graphics | null = null
    private animTime = 0

    // Callbacks
    onResume?: () => void
    onExit?: () => void

    constructor(context: PauseScreenContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(data: PauseData): void {
        this.isVisible = true
        this.animTime = 0
        this.screenContainer.visible = true
        this.createUI(data)
    }

    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
        this.screenContainer.removeChildren()
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible) return
        this.animTime += deltaSeconds

        // Animate decorative dots
        if (this.decorDots) {
            this.decorDots.alpha = 0.3 + Math.sin(this.animTime * 2) * 0.2
        }
    }

    reset(): void {
        this.hide()
    }

    private createUI(data: PauseData): void {
        this.screenContainer.removeChildren()

        // Dark background with Balatro feel
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: BALATRO_COLORS.bgDark, alpha: 0.95 })
        bg.eventMode = 'static'
        bg.on('pointerdown', () => this.onResume?.())
        this.screenContainer.addChild(bg)

        // Subtle dot pattern
        const dots = new Graphics()
        for (let x = 0; x < this.width; x += 20) {
            for (let y = 0; y < this.height; y += 20) {
                dots.circle(x, y, 1)
                dots.fill({ color: 0xffffff, alpha: 0.03 })
            }
        }
        this.screenContainer.addChild(dots)

        // Responsive card sizing
        const cardPadding = Math.min(20, this.width * 0.05)
        const cardWidth = this.width - cardPadding * 2
        const hasSkills = data.skills.length > 0
        const skillRows = Math.min(data.skills.length, 5) // Max 5 skills shown
        const baseHeight = 170
        const skillItemHeight = 56
        const skillItemGap = 6
        const skillsHeight = hasSkills ? 26 + skillRows * (skillItemHeight + skillItemGap) : 0
        const buttonsHeight = 60
        const cardHeight = baseHeight + skillsHeight + buttonsHeight
        const cardX = cardPadding
        const cardY = (this.height - cardHeight) / 2

        // Main card background
        const card = new Graphics()
        drawBalatroCard(card, cardX, cardY, cardWidth, cardHeight, {
            bgColor: BALATRO_COLORS.bgCard,
            borderColor: BALATRO_COLORS.gold,
            borderWidth: BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusLarge,
        })
        card.eventMode = 'static'
        this.screenContainer.addChild(card)

        // Decorative corner dots
        this.decorDots = new Graphics()
        drawCornerDots(this.decorDots, cardX, cardY, cardWidth, cardHeight)
        this.screenContainer.addChild(this.decorDots)

        // Title badge
        const badgeW = 140
        const badgeH = 36
        const badge = new Graphics()
        drawBalatroBadge(
            badge,
            this.centerX - badgeW / 2,
            cardY - 18,
            badgeW,
            badgeH,
            BALATRO_COLORS.gold
        )
        this.screenContainer.addChild(badge)

        const title = new Text({
            text: 'PAUSED',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0x000000,
                letterSpacing: BALATRO_DESIGN.letterSpacing,
            }),
        })
        title.anchor.set(0.5)
        title.position.set(this.centerX, cardY)
        this.screenContainer.addChild(title)

        // Inner content
        const innerPadding = 14
        const contentX = cardX + innerPadding
        const contentWidth = cardWidth - innerPadding * 2

        // Stats section
        const statsY = cardY + 38
        const statBoxWidth = (contentWidth - 10) / 2
        const statBoxHeight = 48

        // Level box
        this.createStatBox(
            contentX,
            statsY,
            statBoxWidth,
            statBoxHeight,
            'LEVEL',
            `${data.level}`,
            BALATRO_COLORS.gold
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
            BALATRO_COLORS.blue
        )

        // XP Bar
        const xpBarY = statsY + statBoxHeight + 12
        const xpBarHeight = 22

        const xpLabel = new Text({
            text: 'EXP',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textSecondary,
            }),
        })
        xpLabel.anchor.set(0, 0.5)
        xpLabel.position.set(contentX, xpBarY + xpBarHeight / 2)
        this.screenContainer.addChild(xpLabel)

        const xpBarX = contentX + 32
        const xpBarWidth = contentWidth - 32

        // XP bar background
        const xpBarBg = new Graphics()
        xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 8)
        xpBarBg.fill(BALATRO_COLORS.bgCardLight)
        xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 8)
        xpBarBg.stroke({ color: 0x3a3a4e, width: 2 })
        this.screenContainer.addChild(xpBarBg)

        // XP bar fill
        const xpRatio = data.xp / (data.xp + data.xpToNextLevel)
        if (xpRatio > 0) {
            const xpBarFill = new Graphics()
            const fillWidth = Math.max(0, (xpBarWidth - 4) * xpRatio)
            xpBarFill.roundRect(xpBarX + 2, xpBarY + 2, fillWidth, xpBarHeight - 4, 6)
            xpBarFill.fill(BALATRO_COLORS.cyan)
            this.screenContainer.addChild(xpBarFill)
        }

        // XP text
        const xpText = new Text({
            text: `${data.xp} / ${data.xp + data.xpToNextLevel}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
            }),
        })
        xpText.anchor.set(0.5)
        xpText.position.set(xpBarX + xpBarWidth / 2, xpBarY + xpBarHeight / 2)
        this.screenContainer.addChild(xpText)

        // Skills section
        const skillsY = xpBarY + xpBarHeight + 14
        if (data.skills.length > 0) {
            const skillsLabel = new Text({
                text: `SKILLS (${data.skills.length})`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.textSecondary,
                    letterSpacing: 1,
                }),
            })
            skillsLabel.anchor.set(0.5)
            skillsLabel.position.set(this.centerX, skillsY)
            this.screenContainer.addChild(skillsLabel)

            const skillStartY = skillsY + 16
            const maxSkillsShown = 5

            data.skills.slice(0, maxSkillsShown).forEach((skill, i) => {
                const skillDef = SKILL_DEFINITIONS[skill.skillId]
                if (!skillDef) return

                const itemY = skillStartY + i * (skillItemHeight + skillItemGap)
                this.createSkillCard(
                    contentX,
                    itemY,
                    contentWidth,
                    skillItemHeight,
                    skill,
                    skillDef
                )
            })

            // Show "more skills" indicator if needed
            if (data.skills.length > maxSkillsShown) {
                const moreText = new Text({
                    text: `+${data.skills.length - maxSkillsShown} more...`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 10,
                        fill: BALATRO_COLORS.textMuted,
                        fontStyle: 'italic',
                    }),
                })
                moreText.anchor.set(0.5)
                moreText.position.set(
                    this.centerX,
                    skillStartY + maxSkillsShown * (skillItemHeight + skillItemGap)
                )
                this.screenContainer.addChild(moreText)
            }
        }

        // Action buttons
        const btnY = cardY + cardHeight - 35
        const btnWidth = Math.min(100, (contentWidth - 20) / 2)
        const btnGap = 12

        // Resume button
        const resumeBtn = createBalatroButton({
            label: 'RESUME',
            width: btnWidth,
            height: 40,
            color: BALATRO_COLORS.blue,
            onClick: () => this.onResume?.(),
        })
        resumeBtn.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        this.screenContainer.addChild(resumeBtn)

        // Exit button
        const exitBtn = createBalatroButton({
            label: 'EXIT',
            width: btnWidth,
            height: 40,
            color: BALATRO_COLORS.red,
            onClick: () => this.onExit?.(),
        })
        exitBtn.position.set(this.centerX + btnWidth / 2 + btnGap / 2, btnY)
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
        const box = new Graphics()
        drawBalatroCard(box, x, y, width, height, {
            bgColor: BALATRO_COLORS.bgCardLight,
            borderColor: accentColor,
            borderWidth: 2,
            radius: BALATRO_DESIGN.radiusSmall,
        })
        this.screenContainer.addChild(box)

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
        labelText.position.set(x + width / 2, y + 13)
        this.screenContainer.addChild(labelText)

        const valueText = new Text({
            text: value,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
            }),
        })
        valueText.anchor.set(0.5)
        valueText.position.set(x + width / 2, y + 32)
        this.screenContainer.addChild(valueText)
    }

    private createSkillCard(
        x: number,
        y: number,
        width: number,
        height: number,
        skill: PlayerSkill,
        skillDef: (typeof SKILL_DEFINITIONS)[string]
    ): void {
        // Skill card background
        const cardBg = new Graphics()
        drawBalatroCard(cardBg, x, y, width, height, {
            bgColor: BALATRO_COLORS.bgCardLight,
            borderColor: skillDef.color,
            borderWidth: 2,
            radius: BALATRO_DESIGN.radiusSmall,
        })
        this.screenContainer.addChild(cardBg)

        // Left accent bar
        const accentBar = new Graphics()
        accentBar.roundRect(x + 4, y + 6, 4, height - 12, 2)
        accentBar.fill(skillDef.color)
        this.screenContainer.addChild(accentBar)

        // Icon
        const iconText = new Text({
            text: skillDef.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: skillDef.color,
            }),
        })
        iconText.anchor.set(0, 0.5)
        iconText.position.set(x + 14, y + 13)
        this.screenContainer.addChild(iconText)

        // Name
        const nameText = new Text({
            text: t(skillDef.name, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
            }),
        })
        nameText.anchor.set(0, 0.5)
        nameText.position.set(x + 32, y + 13)
        this.screenContainer.addChild(nameText)

        // Level dots
        const maxLevel = 5
        const dotSize = 5
        const dotGap = 3
        const dotsStartX = x + width - 10 - maxLevel * (dotSize + dotGap)
        for (let lvl = 1; lvl <= maxLevel; lvl++) {
            const dot = new Graphics()
            const dotX = dotsStartX + (lvl - 1) * (dotSize + dotGap)
            dot.circle(dotX + dotSize / 2, y + 13, dotSize / 2)
            dot.fill(lvl <= skill.level ? skillDef.color : BALATRO_COLORS.textMuted)
            this.screenContainer.addChild(dot)
        }

        // Current effect
        const currentEffect = getCurrentLevelDescription(skill.skillId, skill.level)
        if (currentEffect) {
            const currentText = new Text({
                text: `▸ ${currentEffect}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fill: BALATRO_COLORS.textSecondary,
                }),
            })
            currentText.anchor.set(0, 0.5)
            currentText.position.set(x + 14, y + 30)
            this.screenContainer.addChild(currentText)
        }

        // Next level preview
        const nextEffect = getNextLevelDescription(skill.skillId, skill.level)
        if (nextEffect && skill.level < maxLevel) {
            const nextLabel = new Text({
                text: 'Next:',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 8,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.textMuted,
                }),
            })
            nextLabel.anchor.set(0, 0.5)
            nextLabel.position.set(x + 14, y + 44)
            this.screenContainer.addChild(nextLabel)

            const nextText = new Text({
                text: nextEffect,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 8,
                    fill: BALATRO_COLORS.green,
                }),
            })
            nextText.anchor.set(0, 0.5)
            nextText.position.set(x + 42, y + 44)
            this.screenContainer.addChild(nextText)
        } else if (skill.level >= maxLevel) {
            const maxText = new Text({
                text: '✦ MAX LEVEL',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 8,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.gold,
                }),
            })
            maxText.anchor.set(0, 0.5)
            maxText.position.set(x + 14, y + 44)
            this.screenContainer.addChild(maxText)
        }
    }
}
