import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { RANK_CONFIGS, getRankFromTime } from '../types'
import { PlayerSkill, SKILL_DEFINITIONS } from '../skills'
import { easeOutQuad, easeOutBack } from '../utils'
import { shareGameResult } from '@/utils/share'
import {
    BALATRO_COLORS,
    BALATRO_DESIGN,
    drawBalatroCard,
    drawBalatroBadge,
    drawCornerDots,
    createBalatroButton,
} from './BalatroButton'

export interface ResultScreenContext {
    container: Container
    width: number
    height: number
}

export interface PhysicsStats {
    totalMomentum: number // Total momentum transferred (Σ p = mv)
    elasticBounces: number // Number of projectile bounces
    mergedMass: number // Total mass from merges
    slingshotCount: number // Gravity slingshot maneuvers
}

export interface ResultData {
    gameTime: number
    score: number
    level: number
    skills: PlayerSkill[]
    physicsStats?: PhysicsStats // Optional for backwards compatibility
}

export class ResultScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number

    // Animation state
    private animTime = 0
    private animStep = 0
    private displayedTime = 0
    private displayedKills = 0
    private rankRevealed = false
    private isVisible = false

    // UI elements
    private resultTimeText!: Text
    private resultKillsText!: Text
    private resultWaveText!: Text
    private resultRankCard!: Container
    private resultButtons!: Container

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
    }

    get visible(): boolean {
        return this.isVisible
    }

    /**
     * Show the result screen with game data
     */
    show(data: ResultData): void {
        this.isVisible = true
        this.animTime = 0
        this.animStep = 0
        this.displayedTime = 0
        this.displayedKills = 0
        this.rankRevealed = false
        this.data = data

        this.screenContainer.visible = true
        this.createUI()
    }

    /**
     * Hide the screen
     */
    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
        this.screenContainer.removeChildren()
    }

    /**
     * Update animations
     */
    update(deltaSeconds: number): void {
        if (!this.isVisible || !this.data) return

        this.animTime += deltaSeconds
        const children = this.screenContainer.children

        // New Balatro structure:
        // 0: bg, 1: pattern, 2: card, 3: decorDots, 4: badge, 5: title
        // 6-8: stat box 1 (box, label, value)
        // 9-11: stat box 2 (box, label, value)
        // 12-14: stat box 3 (box, label, value)
        // 15+: skill label, skill icons (if skills > 0)
        // then: resultRankCard
        // then: physics card (if physicsStats)
        // then: resultButtons

        // Step 0: Fade in card, decorDots, badge, and title (0.0s - 0.3s)
        if (this.animTime >= 0 && this.animStep === 0) {
            const progress = Math.min(1, this.animTime / 0.3)
            if (children[2]) children[2].alpha = progress // card
            if (children[3]) children[3].alpha = progress // decorDots
            if (children[4]) children[4].alpha = progress // badge
            if (children[5]) children[5].alpha = progress // title
            if (this.animTime >= 0.3) this.animStep = 1
        }

        // Step 1: Show stat boxes with counting animation (0.3s - 0.9s)
        if (this.animTime >= 0.3 && this.animStep === 1) {
            const progress = Math.min(1, (this.animTime - 0.3) / 0.6)

            // Fade in stat boxes (indices 6-14)
            for (let i = 6; i <= 14; i++) {
                if (children[i]) children[i].alpha = Math.min(1, progress * 2)
            }

            // Animate time value
            this.displayedTime = this.data.gameTime * easeOutQuad(progress)
            const mins = Math.floor(this.displayedTime / 60)
            const secs = Math.floor(this.displayedTime % 60)
            if (this.resultTimeText) {
                this.resultTimeText.text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            }

            // Animate kills value
            const totalKills = Math.floor(this.data.score / 10)
            this.displayedKills = Math.floor(totalKills * easeOutQuad(progress))
            if (this.resultKillsText) {
                this.resultKillsText.text = this.displayedKills.toString()
            }

            if (progress >= 1) this.animStep = 2
        }

        // Step 2: Pop in skill icons (0.9s - 1.4s)
        if (this.animTime >= 0.9 && this.animStep === 2) {
            // Find skill icon containers (they have scale.set(0) initially)
            const skillIconStartIndex = this.data.skills.length > 0 ? 16 : -1 // After skill label

            if (skillIconStartIndex > 0 && this.data.skills.length > 0) {
                for (let i = 0; i < this.data.skills.length; i++) {
                    const iconTime = 0.9 + i * 0.08
                    if (this.animTime >= iconTime) {
                        const childIndex = skillIconStartIndex + i
                        const icon = children[childIndex] as Container
                        if (icon && icon.scale) {
                            const progress = Math.min(1, (this.animTime - iconTime) / 0.12)
                            icon.alpha = progress
                            icon.scale.set(easeOutBack(progress))
                        }
                    }
                }
            }

            const skillAnimDone = 0.9 + this.data.skills.length * 0.08 + 0.15
            if (this.animTime >= skillAnimDone) {
                this.animStep = 3
            }
        }

        // Step 3: Reveal rank card (1.4s - 1.8s)
        if (this.animTime >= 1.4 && this.animStep === 3) {
            const progress = Math.min(1, (this.animTime - 1.4) / 0.3)
            this.resultRankCard.scale.set(easeOutBack(progress))

            if (progress >= 1 && !this.rankRevealed) {
                this.rankRevealed = true
            }
            if (this.animTime >= 1.7) this.animStep = 4
        }

        // Step 4: Show buttons (1.7s+)
        if (this.animTime >= 1.7 && this.animStep === 4) {
            const progress = Math.min(1, (this.animTime - 1.7) / 0.2)
            this.resultButtons.alpha = progress
            if (progress >= 1) this.animStep = 5
        }

        // Rank card pulse animation
        if (this.rankRevealed) {
            const pulse = 1 + Math.sin(this.animTime * 4) * 0.03
            this.resultRankCard.scale.set(pulse)
        }

        // Decorative dots animation
        if (this.decorDots) {
            this.decorDots.alpha = 0.3 + Math.sin(this.animTime * 2) * 0.2
        }
    }

    /**
     * Reset the screen
     */
    reset(): void {
        this.hide()
        this.animTime = 0
        this.animStep = 0
        this.data = null
    }

    // Decorative dots for animation
    private decorDots: Graphics | null = null

    private createUI(): void {
        this.screenContainer.removeChildren()

        if (!this.data) return

        // Dark background with Balatro feel
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: BALATRO_COLORS.bgDark, alpha: 0.95 })
        this.screenContainer.addChild(bg)

        // Subtle dot pattern overlay (Balatro style)
        const pattern = new Graphics()
        for (let x = 0; x < this.width; x += 20) {
            for (let y = 0; y < this.height; y += 20) {
                pattern.circle(x, y, 1)
                pattern.fill({ color: 0xffffff, alpha: 0.03 })
            }
        }
        this.screenContainer.addChild(pattern)

        // Responsive card sizing
        const cardPadding = Math.min(20, this.width * 0.05)
        const cardWidth = this.width - cardPadding * 2
        const cardHeight = 360
        const cardY = 40
        const cardX = cardPadding

        // Main card background using Balatro utility
        const card = new Graphics()
        drawBalatroCard(card, cardX, cardY, cardWidth, cardHeight, {
            bgColor: BALATRO_COLORS.bgCard,
            borderColor: BALATRO_COLORS.gold,
            borderWidth: BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusLarge,
        })
        card.alpha = 0
        this.screenContainer.addChild(card)

        // Decorative corner dots
        this.decorDots = new Graphics()
        drawCornerDots(this.decorDots, cardX, cardY, cardWidth, cardHeight)
        this.screenContainer.addChild(this.decorDots)

        // Title badge
        const badgeW = 160
        const badgeH = 36
        const badge = new Graphics()
        drawBalatroBadge(badge, this.centerX - badgeW / 2, cardY - 18, badgeW, badgeH, BALATRO_COLORS.gold)
        this.screenContainer.addChild(badge)

        const title = new Text({
            text: 'SURVIVED',
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
        title.alpha = 0
        this.screenContainer.addChild(title)

        // Inner content
        const innerPadding = 14
        const contentX = cardX + innerPadding
        const contentWidth = cardWidth - innerPadding * 2

        // Stats section with stat boxes
        const statsY = cardY + 38
        const statBoxWidth = (contentWidth - 20) / 3
        const statBoxHeight = 58

        // Time stat box
        this.createStatBox(contentX, statsY, statBoxWidth, statBoxHeight, 'TIME', '00:00', BALATRO_COLORS.blue)

        // Kills stat box
        this.createStatBox(contentX + statBoxWidth + 10, statsY, statBoxWidth, statBoxHeight, 'KILLS', '0', BALATRO_COLORS.red)

        // Level stat box
        this.createStatBox(contentX + (statBoxWidth + 10) * 2, statsY, statBoxWidth, statBoxHeight, 'LEVEL', this.data.level.toString(), BALATRO_COLORS.gold)

        // Create hidden text elements for animation
        this.resultTimeText = this.screenContainer.children.find(
            (c) => c instanceof Text && (c as Text).text === '00:00'
        ) as Text
        this.resultKillsText = this.screenContainer.children.find(
            (c) => c instanceof Text && (c as Text).text === '0'
        ) as Text
        this.resultWaveText = this.screenContainer.children.find(
            (c) => c instanceof Text && (c as Text).text === this.data!.level.toString()
        ) as Text

        // Skills section
        const skillsY = statsY + statBoxHeight + 20
        if (this.data.skills.length > 0) {
            const skillsLabel = new Text({
                text: `SKILLS (${this.data.skills.length})`,
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

            // Skill pills row
            const pillY = skillsY + 22
            const pillHeight = 26
            const pillGap = 6

            // Calculate widths for centering
            let totalWidth = 0
            const skillWidths: number[] = []
            this.data.skills.forEach((playerSkill) => {
                const skillDef = SKILL_DEFINITIONS[playerSkill.skillId]
                if (!skillDef) return
                const text = `${skillDef.icon} Lv.${playerSkill.level}`
                const estimatedWidth = text.length * 7 + 16
                skillWidths.push(estimatedWidth)
                totalWidth += estimatedWidth
            })
            totalWidth += (skillWidths.length - 1) * pillGap

            let currentX = this.centerX - totalWidth / 2

            this.data.skills.forEach((playerSkill, i) => {
                const skillDef = SKILL_DEFINITIONS[playerSkill.skillId]
                if (!skillDef) return

                const iconContainer = new Container()
                iconContainer.position.set(currentX + skillWidths[i] / 2, pillY)
                iconContainer.alpha = 0
                iconContainer.scale.set(0)

                // Skill pill background with color accent
                const pill = new Graphics()
                pill.roundRect(-skillWidths[i] / 2, -pillHeight / 2, skillWidths[i], pillHeight, pillHeight / 2)
                pill.fill(BALATRO_COLORS.bgCardLight)
                pill.roundRect(-skillWidths[i] / 2, -pillHeight / 2, skillWidths[i], pillHeight, pillHeight / 2)
                pill.stroke({ color: skillDef.color, width: 2 })
                iconContainer.addChild(pill)

                const iconText = new Text({
                    text: `${skillDef.icon} Lv.${playerSkill.level}`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 10,
                        fontWeight: 'bold',
                        fill: BALATRO_COLORS.textPrimary,
                    }),
                })
                iconText.anchor.set(0.5)
                iconContainer.addChild(iconText)

                this.screenContainer.addChild(iconContainer)
                currentX += skillWidths[i] + pillGap
            })
        }

        // Rank card - positioned based on skills
        const rankY = this.data.skills.length > 0 ? cardY + cardHeight - 70 : statsY + statBoxHeight + 50
        this.resultRankCard = new Container()
        this.resultRankCard.position.set(this.centerX, rankY)
        this.resultRankCard.scale.set(0)
        this.screenContainer.addChild(this.resultRankCard)

        const rank = getRankFromTime(this.data.gameTime)
        const rankConfig = RANK_CONFIGS[rank]
        const rankBoxWidth = 90
        const rankBoxHeight = 70

        // Rank badge using Balatro card style
        const rankBg = new Graphics()
        drawBalatroCard(rankBg, -rankBoxWidth / 2, -rankBoxHeight / 2, rankBoxWidth, rankBoxHeight, {
            bgColor: BALATRO_COLORS.bgCardLight,
            borderColor: rankConfig.color,
            borderWidth: BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusMedium,
        })
        this.resultRankCard.addChild(rankBg)

        // Rank letter
        const rankText = new Text({
            text: rank,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 36,
                fontWeight: 'bold',
                fill: rankConfig.color,
            }),
        })
        rankText.anchor.set(0.5)
        rankText.position.set(0, -5)
        this.resultRankCard.addChild(rankText)

        // Rank message
        const messageText = new Text({
            text: rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textSecondary,
            }),
        })
        messageText.anchor.set(0.5)
        messageText.position.set(0, rankBoxHeight / 2 + 12)
        this.resultRankCard.addChild(messageText)

        // Physics stats section (below card, compact layout)
        if (this.data.physicsStats) {
            const physicsY = cardY + cardHeight + 15

            // Physics card
            const physicsCardWidth = cardWidth - 40
            const physicsCard = new Graphics()
            drawBalatroCard(physicsCard, cardX + 20, physicsY - 5, physicsCardWidth, 45, {
                bgColor: BALATRO_COLORS.bgCard,
                borderColor: BALATRO_COLORS.cyan,
                borderWidth: 2,
                radius: BALATRO_DESIGN.radiusSmall,
            })
            this.screenContainer.addChild(physicsCard)

            // Physics header
            const physicsHeader = new Text({
                text: '⚛ PHYSICS',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.cyan,
                    letterSpacing: 1,
                }),
            })
            physicsHeader.anchor.set(0.5)
            physicsHeader.position.set(this.centerX, physicsY + 8)
            this.screenContainer.addChild(physicsHeader)

            // Stats line
            const stats = this.data.physicsStats
            const momentum = (stats.totalMomentum / 1000).toFixed(1)
            const statsLine = `p=${momentum}k · bounces=${stats.elasticBounces} · m=${stats.mergedMass} · sling=${stats.slingshotCount}`

            const physicsText = new Text({
                text: statsLine,
                style: new TextStyle({
                    fontFamily: 'monospace, Courier, sans-serif',
                    fontSize: 9,
                    fontWeight: 'bold',
                    fill: BALATRO_COLORS.textSecondary,
                }),
            })
            physicsText.anchor.set(0.5)
            physicsText.position.set(this.centerX, physicsY + 25)
            this.screenContainer.addChild(physicsText)
        }

        // Action buttons using Balatro button utility
        this.resultButtons = new Container()
        this.resultButtons.position.set(0, 0)
        this.resultButtons.alpha = 0
        this.screenContainer.addChild(this.resultButtons)

        const btnY = this.height - 50
        const btnWidth = Math.min(100, (cardWidth - 30) / 2)
        const btnGap = 12

        // Retry button
        const retryBtn = createBalatroButton({
            label: 'RETRY',
            width: btnWidth,
            height: 40,
            color: BALATRO_COLORS.blue,
            onClick: () => this.onRetry?.(),
        })
        retryBtn.position.set(this.centerX - btnWidth / 2 - btnGap / 2, btnY)
        this.resultButtons.addChild(retryBtn)

        // Share button
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
        this.resultButtons.addChild(shareBtn)
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
        labelText.position.set(x + width / 2, y + 15)
        this.screenContainer.addChild(labelText)

        const valueText = new Text({
            text: value,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
            }),
        })
        valueText.anchor.set(0.5)
        valueText.position.set(x + width / 2, y + 38)
        this.screenContainer.addChild(valueText)
    }

}
