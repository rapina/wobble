/**
 * ResultScreen - Balatro-style result screen
 * Matches the visual style of LoadingScreen
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { RANK_CONFIGS, getRankFromTime } from '../types'
import { PlayerSkill, SKILL_DEFINITIONS } from '../skills'
import { easeOutBack, easeOutQuad } from '../utils'
import { shareGameResult } from '@/utils/share'
import { BALATRO_COLORS, createBalatroButton } from './BalatroButton'

export interface ResultScreenContext {
    container: Container
    width: number
    height: number
}

export interface PhysicsStats {
    totalMomentum: number
    elasticBounces: number
    mergedMass: number
    slingshotCount: number
}

export interface ResultData {
    gameTime: number
    score: number
    level: number
    skills: PlayerSkill[]
    physicsStats?: PhysicsStats
}

export class ResultScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    // Animation state
    private animTime = 0
    private isVisible = false
    private displayedTime = 0
    private displayedKills = 0

    // UI elements
    private card: Container | null = null
    private resultTimeText: Text | null = null
    private resultKillsText: Text | null = null
    private rankContainer: Container | null = null
    private buttonsContainer: Container | null = null
    private decorDots: Graphics[] = []

    // Card dimensions
    private cardWidth = 0
    private cardHeight = 0
    private cardX = 0
    private cardY = 0

    // Data
    private data: ResultData | null = null

    // Callbacks
    onRetry?: () => void
    onExit?: () => void

    constructor(context: ResultScreenContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(data: ResultData): void {
        this.isVisible = true
        this.animTime = 0
        this.displayedTime = 0
        this.displayedKills = 0
        this.data = data
        this.decorDots = []

        this.screenContainer.visible = true
        this.screenContainer.removeChildren()
        this.createUI()
    }

    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible || !this.data) return

        this.animTime += deltaSeconds

        // Card pop-in animation (like LoadingScreen)
        if (this.card) {
            const cardDelay = 0.1
            const cardDuration = 0.4
            const cardProgress = Math.max(0, (this.animTime - cardDelay) / cardDuration)

            if (cardProgress < 1) {
                const scale = easeOutBack(Math.min(1, cardProgress))
                this.card.scale.set(scale)
                this.card.alpha = cardProgress
            } else {
                this.card.scale.set(1)
                this.card.alpha = 1
            }
        }

        // Animate time counting (0.4s - 1.0s)
        if (this.animTime >= 0.4 && this.animTime < 1.0) {
            const progress = Math.min(1, (this.animTime - 0.4) / 0.6)
            this.displayedTime = this.data.gameTime * easeOutQuad(progress)
            const mins = Math.floor(this.displayedTime / 60)
            const secs = Math.floor(this.displayedTime % 60)
            if (this.resultTimeText) {
                this.resultTimeText.text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            }

            const totalKills = Math.floor(this.data.score / 10)
            this.displayedKills = Math.floor(totalKills * easeOutQuad(progress))
            if (this.resultKillsText) {
                this.resultKillsText.text = this.displayedKills.toString()
            }
        }

        // Rank pop-in (1.0s - 1.3s)
        if (this.rankContainer && this.animTime >= 1.0) {
            const rankProgress = Math.min(1, (this.animTime - 1.0) / 0.3)
            this.rankContainer.scale.set(easeOutBack(rankProgress))
            this.rankContainer.alpha = rankProgress

            // Pulse after reveal
            if (rankProgress >= 1) {
                const pulse = 1 + Math.sin(this.animTime * 4) * 0.03
                this.rankContainer.scale.set(pulse)
            }
        }

        // Buttons fade-in (1.3s+)
        if (this.buttonsContainer && this.animTime >= 1.3) {
            const btnProgress = Math.min(1, (this.animTime - 1.3) / 0.2)
            this.buttonsContainer.alpha = btnProgress
        }

        // Animate decorative dots
        this.decorDots.forEach((dot, i) => {
            const phase = this.animTime * 2 + i * 0.3
            dot.alpha = 0.3 + Math.sin(phase) * 0.2
        })
    }

    reset(): void {
        this.hide()
        this.animTime = 0
        this.data = null
        this.decorDots = []
    }

    private createUI(): void {
        if (!this.data) return

        // Dark background (same as LoadingScreen)
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(0x0f0f1a)
        this.screenContainer.addChild(bg)

        // Subtle dot pattern (Balatro style)
        const dots = new Graphics()
        for (let x = 0; x < this.width; x += 20) {
            for (let y = 0; y < this.height; y += 20) {
                dots.circle(x, y, 1)
                dots.fill({ color: 0xffffff, alpha: 0.03 })
            }
        }
        this.screenContainer.addChild(dots)

        // Main card container (centered like LoadingScreen)
        this.card = new Container()
        this.card.position.set(this.centerX, this.centerY)
        this.card.scale.set(0)
        this.card.alpha = 0
        this.screenContainer.addChild(this.card)

        // Card dimensions
        this.cardWidth = Math.min(320, this.width - 40)
        this.cardHeight = 340
        this.cardX = -this.cardWidth / 2
        this.cardY = -this.cardHeight / 2

        // Card shadow
        const cardShadow = new Graphics()
        cardShadow.roundRect(this.cardX + 4, this.cardY + 6, this.cardWidth, this.cardHeight, 16)
        cardShadow.fill(0x000000)
        this.card.addChild(cardShadow)

        // Card background
        const cardBg = new Graphics()
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.fill(0x1a1a2e)
        cardBg.roundRect(this.cardX, this.cardY, this.cardWidth, this.cardHeight, 16)
        cardBg.stroke({ color: BALATRO_COLORS.gold, width: 3 })
        this.card.addChild(cardBg)

        // Title badge (like LoadingScreen)
        const badgeWidth = 140
        const badgeHeight = 32
        const badgeShadow = new Graphics()
        badgeShadow.roundRect(-badgeWidth / 2 + 2, this.cardY - 12 + 4, badgeWidth, badgeHeight, 8)
        badgeShadow.fill(0x000000)
        this.card.addChild(badgeShadow)

        const badge = new Graphics()
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.fill(BALATRO_COLORS.gold)
        badge.roundRect(-badgeWidth / 2, this.cardY - 12, badgeWidth, badgeHeight, 8)
        badge.stroke({ color: 0x1a1a1a, width: 3 })
        this.card.addChild(badge)

        const titleText = new Text({
            text: 'SURVIVED',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0x000000,
                letterSpacing: 3,
            }),
        })
        titleText.anchor.set(0.5)
        titleText.position.set(0, this.cardY + 4)
        this.card.addChild(titleText)

        // Stats section
        const statsY = this.cardY + 50

        // Time stat
        this.createStatRow(0, statsY, 'TIME', '00:00', BALATRO_COLORS.blue)
        this.resultTimeText = this.card.children[this.card.children.length - 1] as Text

        // Kills stat
        this.createStatRow(0, statsY + 45, 'KILLS', '0', BALATRO_COLORS.red)
        this.resultKillsText = this.card.children[this.card.children.length - 1] as Text

        // Level stat
        this.createStatRow(0, statsY + 90, 'LEVEL', this.data.level.toString(), BALATRO_COLORS.cyan)

        // Skills section (if any)
        if (this.data.skills.length > 0) {
            const skillsY = statsY + 140

            const skillsLabel = new Text({
                text: `SKILLS (${this.data.skills.length})`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: 0x888899,
                    letterSpacing: 1,
                }),
            })
            skillsLabel.anchor.set(0.5)
            skillsLabel.position.set(0, skillsY)
            this.card.addChild(skillsLabel)

            // Skill icons row
            const skillIconsY = skillsY + 22
            const iconSize = 24
            const iconGap = 6
            const totalIconsWidth =
                this.data.skills.length * iconSize + (this.data.skills.length - 1) * iconGap
            let iconX = -totalIconsWidth / 2 + iconSize / 2

            this.data.skills.forEach((playerSkill) => {
                const skillDef = SKILL_DEFINITIONS[playerSkill.skillId]
                if (!skillDef) return

                const iconBg = new Graphics()
                iconBg.roundRect(
                    iconX - iconSize / 2,
                    skillIconsY - iconSize / 2,
                    iconSize,
                    iconSize,
                    4
                )
                iconBg.fill(0x2a2a3e)
                iconBg.roundRect(
                    iconX - iconSize / 2,
                    skillIconsY - iconSize / 2,
                    iconSize,
                    iconSize,
                    4
                )
                iconBg.stroke({ color: skillDef.color, width: 1.5 })
                this.card!.addChild(iconBg)

                const iconText = new Text({
                    text: skillDef.icon,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 12,
                    }),
                })
                iconText.anchor.set(0.5)
                iconText.position.set(iconX, skillIconsY)
                this.card!.addChild(iconText)

                iconX += iconSize + iconGap
            })
        }

        // Rank display
        const rank = getRankFromTime(this.data.gameTime)
        const rankConfig = RANK_CONFIGS[rank]
        const rankY = this.data.skills.length > 0 ? statsY + 200 : statsY + 150

        this.rankContainer = new Container()
        this.rankContainer.position.set(0, rankY)
        this.rankContainer.scale.set(0)
        this.rankContainer.alpha = 0
        this.card.addChild(this.rankContainer)

        const rankBoxSize = 60
        const rankShadow = new Graphics()
        rankShadow.roundRect(
            -rankBoxSize / 2 + 2,
            -rankBoxSize / 2 + 4,
            rankBoxSize,
            rankBoxSize,
            12
        )
        rankShadow.fill(0x000000)
        this.rankContainer.addChild(rankShadow)

        const rankBg = new Graphics()
        rankBg.roundRect(-rankBoxSize / 2, -rankBoxSize / 2, rankBoxSize, rankBoxSize, 12)
        rankBg.fill(0x2a2a3e)
        rankBg.roundRect(-rankBoxSize / 2, -rankBoxSize / 2, rankBoxSize, rankBoxSize, 12)
        rankBg.stroke({ color: rankConfig.color, width: 3 })
        this.rankContainer.addChild(rankBg)

        const rankText = new Text({
            text: rank,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 32,
                fontWeight: 'bold',
                fill: rankConfig.color,
            }),
        })
        rankText.anchor.set(0.5)
        this.rankContainer.addChild(rankText)

        const rankMessage = new Text({
            text: rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: 0x888899,
            }),
        })
        rankMessage.anchor.set(0.5)
        rankMessage.position.set(0, rankBoxSize / 2 + 12)
        this.rankContainer.addChild(rankMessage)

        // Decorative corner dots
        this.addDecorativeElements()

        // Action buttons (outside card, at bottom)
        this.buttonsContainer = new Container()
        this.buttonsContainer.alpha = 0
        this.screenContainer.addChild(this.buttonsContainer)

        const btnY = this.centerY + this.cardHeight / 2 + 40
        const btnWidth = 100
        const btnGap = 16

        const retryBtn = createBalatroButton({
            label: 'RETRY',
            width: btnWidth,
            height: 40,
            color: BALATRO_COLORS.blue,
            onClick: () => this.onRetry?.(),
        })
        retryBtn.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        this.buttonsContainer.addChild(retryBtn)

        const shareBtn = createBalatroButton({
            label: 'SHARE',
            width: btnWidth,
            height: 40,
            color: BALATRO_COLORS.gold,
            onClick: () => {
                if (!this.data) return
                const kills = Math.floor(this.data.score / 10)
                const rankValue = getRankFromTime(this.data.gameTime)
                shareGameResult(
                    {
                        score: this.data.score,
                        kills,
                        time: this.data.gameTime,
                        level: this.data.level,
                        rank: rankValue,
                    },
                    navigator.language.startsWith('ko') ? 'ko' : 'en'
                )
            },
        })
        shareBtn.position.set(this.centerX + btnWidth / 2 + btnGap / 2, btnY)
        this.buttonsContainer.addChild(shareBtn)
    }

    private createStatRow(x: number, y: number, label: string, value: string, color: number): void {
        if (!this.card) return

        const labelText = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: color,
                letterSpacing: 1,
            }),
        })
        labelText.anchor.set(0.5)
        labelText.position.set(x, y)
        this.card.addChild(labelText)

        const valueText = new Text({
            text: value,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 22,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        valueText.anchor.set(0.5)
        valueText.position.set(x, y + 20)
        this.card.addChild(valueText)
    }

    private addDecorativeElements(): void {
        if (!this.card) return

        const corners = [
            { x: this.cardX + 20, y: this.cardY + 25 },
            { x: this.cardX + this.cardWidth - 20, y: this.cardY + 25 },
            { x: this.cardX + 20, y: this.cardY + this.cardHeight - 20 },
            { x: this.cardX + this.cardWidth - 20, y: this.cardY + this.cardHeight - 20 },
        ]

        corners.forEach((pos) => {
            const dot = new Graphics()
            dot.circle(pos.x, pos.y, 4)
            dot.fill(BALATRO_COLORS.gold)
            dot.alpha = 0.5
            this.card!.addChild(dot)
            this.decorDots.push(dot)
        })
    }
}
