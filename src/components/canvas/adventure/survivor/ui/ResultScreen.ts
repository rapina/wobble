import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { RANK_CONFIGS, getRankFromTime } from '../types'
import { PlayerSkill, SKILL_DEFINITIONS } from '../skills'
import { easeOutQuad, easeOutBack } from '../utils'
import { shareGameResult } from '@/utils/share'

export interface ResultScreenContext {
    container: Container
    width: number
    height: number
}

export interface ResultData {
    gameTime: number
    score: number
    level: number
    skills: PlayerSkill[]
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

        // New structure:
        // 0: bg, 1: pattern, 2: cardShadow, 3: card, 4: title
        // 5: timeLabel, 6: resultTimeText
        // 7: killsLabel, 8: resultKillsText
        // 9: levelLabel, 10: resultWaveText
        // 11: divider
        // 12+: skill icons (variable count)
        // then: resultRankCard
        // then: resultButtons

        // Step 0: Fade in card and title (0.0s - 0.3s)
        if (this.animTime >= 0 && this.animStep === 0) {
            const progress = Math.min(1, this.animTime / 0.3)
            if (children[3]) children[3].alpha = progress // card
            if (children[4]) children[4].alpha = progress // title
            if (this.animTime >= 0.3) this.animStep = 1
        }

        // Step 1: Show time stat (0.3s - 0.6s)
        if (this.animTime >= 0.3 && this.animStep === 1) {
            const progress = Math.min(1, (this.animTime - 0.3) / 0.3)
            if (children[5]) children[5].alpha = progress // timeLabel
            this.resultTimeText.alpha = progress
            this.displayedTime = this.data.gameTime * easeOutQuad(progress)
            const mins = Math.floor(this.displayedTime / 60)
            const secs = Math.floor(this.displayedTime % 60)
            this.resultTimeText.text = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            if (progress >= 1) this.animStep = 2
        }

        // Step 2: Show kills stat (0.6s - 0.9s)
        if (this.animTime >= 0.6 && this.animStep === 2) {
            const progress = Math.min(1, (this.animTime - 0.6) / 0.3)
            if (children[7]) children[7].alpha = progress // killsLabel
            this.resultKillsText.alpha = progress
            const totalKills = Math.floor(this.data.score / 10)
            this.displayedKills = Math.floor(totalKills * easeOutQuad(progress))
            this.resultKillsText.text = this.displayedKills.toString()
            if (progress >= 1) this.animStep = 3
        }

        // Step 3: Show level stat (0.9s - 1.1s)
        if (this.animTime >= 0.9 && this.animStep === 3) {
            const progress = Math.min(1, (this.animTime - 0.9) / 0.2)
            if (children[9]) children[9].alpha = progress // levelLabel
            this.resultWaveText.alpha = progress
            if (progress >= 1) this.animStep = 4
        }

        // Step 4: Pop in skill icons (1.1s - 1.6s)
        if (this.animTime >= 1.1 && this.animStep === 4) {
            const skillStartIndex = 12 // After divider
            if (this.data.skills.length > 0) {
                for (let i = 0; i < this.data.skills.length; i++) {
                    const iconTime = 1.1 + i * 0.08
                    if (this.animTime >= iconTime) {
                        const icon = children[skillStartIndex + i] as Container
                        if (icon) {
                            const progress = Math.min(1, (this.animTime - iconTime) / 0.12)
                            icon.alpha = progress
                            icon.scale.set(easeOutBack(progress))
                        }
                    }
                }
            }
            const skillAnimDone = 1.1 + this.data.skills.length * 0.08 + 0.15
            if (this.animTime >= skillAnimDone) {
                this.animStep = 5
            }
        }

        // Step 5: Reveal rank card (1.6s - 2.0s)
        if (this.animTime >= 1.6 && this.animStep === 5) {
            const progress = Math.min(1, (this.animTime - 1.6) / 0.3)
            this.resultRankCard.scale.set(easeOutBack(progress))

            if (progress >= 1 && !this.rankRevealed) {
                this.rankRevealed = true
            }
            if (this.animTime >= 1.9) this.animStep = 6
        }

        // Step 6: Show buttons (1.9s+)
        if (this.animTime >= 1.9 && this.animStep === 6) {
            const progress = Math.min(1, (this.animTime - 1.9) / 0.2)
            this.resultButtons.alpha = progress
            if (progress >= 1) this.animStep = 7
        }

        // Rank card pulse animation
        if (this.rankRevealed) {
            const pulse = 1 + Math.sin(this.animTime * 4) * 0.03
            this.resultRankCard.scale.set(pulse)
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

    private createUI(): void {
        this.screenContainer.removeChildren()

        if (!this.data) return

        // Balatro green felt theme colors
        const bgTopColor = 0x3d6b59 // felt green
        const bgBottomColor = 0x2d5a4a // darker felt
        const cardBgColor = 0x374244 // dark panel
        const cardShadowColor = 0x1a1a1a // black shadow
        const textDark = 0xffffff // white text
        const textMuted = 0xaaaaaa // light gray
        const accentGold = 0xc9a227 // Balatro gold

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

        // Subtle dot pattern overlay (Balatro style)
        const pattern = new Graphics()
        for (let row = 0; row < 30; row++) {
            for (let col = 0; col < 20; col++) {
                const px = col * 25 + (row % 2) * 12
                const py = row * 25
                pattern.circle(px, py, 2)
                pattern.fill({ color: 0xffffff, alpha: 0.08 })
            }
        }
        this.screenContainer.addChild(pattern)

        // Main card container
        const cardWidth = this.width - 40
        const cardHeight = 360
        const cardY = 40
        const cardX = 20

        // Card shadow
        const cardShadow = new Graphics()
        cardShadow.roundRect(cardX + 4, cardY + 6, cardWidth, cardHeight, 16)
        cardShadow.fill({ color: cardShadowColor, alpha: 0.4 })
        this.screenContainer.addChild(cardShadow)

        // Main card background - Balatro style with thick black border
        const card = new Graphics()
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
        card.fill(cardBgColor)
        card.roundRect(cardX, cardY, cardWidth, cardHeight, 16)
        card.stroke({ color: 0x1a1a1a, width: 4 })
        card.alpha = 0
        this.screenContainer.addChild(card)

        // Title
        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 24,
            fontWeight: 'bold',
            fill: textDark,
            letterSpacing: 4,
        })
        const title = new Text({ text: 'SURVIVED', style: titleStyle })
        title.anchor.set(0.5)
        title.position.set(this.centerX, cardY + 40)
        title.alpha = 0
        this.screenContainer.addChild(title)

        // Stats section - clean text layout
        const statsY = cardY + 90
        const statGap = 50
        const labelX = this.centerX - 50
        const valueX = this.centerX + 50

        // Label style
        const labelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: textMuted,
            letterSpacing: 2,
        })

        // Value style
        const valueStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 22,
            fontWeight: 'bold',
            fill: textDark,
        })

        // Time stat
        const timeLabel = new Text({ text: 'TIME', style: labelStyle })
        timeLabel.anchor.set(1, 0.5)
        timeLabel.position.set(labelX, statsY)
        timeLabel.alpha = 0
        this.screenContainer.addChild(timeLabel)

        this.resultTimeText = new Text({ text: '00:00', style: valueStyle })
        this.resultTimeText.anchor.set(0, 0.5)
        this.resultTimeText.position.set(valueX, statsY)
        this.resultTimeText.alpha = 0
        this.screenContainer.addChild(this.resultTimeText)

        // Kills stat
        const killsLabel = new Text({ text: 'KILLS', style: labelStyle })
        killsLabel.anchor.set(1, 0.5)
        killsLabel.position.set(labelX, statsY + statGap)
        killsLabel.alpha = 0
        this.screenContainer.addChild(killsLabel)

        this.resultKillsText = new Text({ text: '0', style: valueStyle })
        this.resultKillsText.anchor.set(0, 0.5)
        this.resultKillsText.position.set(valueX, statsY + statGap)
        this.resultKillsText.alpha = 0
        this.screenContainer.addChild(this.resultKillsText)

        // Level stat
        const levelLabel = new Text({ text: 'LEVEL', style: labelStyle })
        levelLabel.anchor.set(1, 0.5)
        levelLabel.position.set(labelX, statsY + statGap * 2)
        levelLabel.alpha = 0
        this.screenContainer.addChild(levelLabel)

        this.resultWaveText = new Text({
            text: this.data.level.toString(),
            style: valueStyle,
        })
        this.resultWaveText.anchor.set(0, 0.5)
        this.resultWaveText.position.set(valueX, statsY + statGap * 2)
        this.resultWaveText.alpha = 0
        this.screenContainer.addChild(this.resultWaveText)

        // Divider line
        const divider = new Graphics()
        divider.moveTo(cardX + 30, statsY + statGap * 2.5 + 10)
        divider.lineTo(cardX + cardWidth - 30, statsY + statGap * 2.5 + 10)
        divider.stroke({ color: textMuted, width: 1, alpha: 0.3 })
        this.screenContainer.addChild(divider)

        // Skill icons row - clean pill badges
        const skillY = statsY + statGap * 3
        if (this.data.skills.length > 0) {
            const pillHeight = 28
            const pillGap = 6
            const pillPadding = 12

            // Calculate total width for centering
            let totalWidth = 0
            const skillWidths: number[] = []
            this.data.skills.forEach((playerSkill) => {
                const skillDef = SKILL_DEFINITIONS[playerSkill.skillId]
                if (!skillDef) return
                const text = `${skillDef.icon} Lv.${playerSkill.level}`
                const estimatedWidth = text.length * 8 + pillPadding * 2
                skillWidths.push(estimatedWidth)
                totalWidth += estimatedWidth
            })
            totalWidth += (skillWidths.length - 1) * pillGap

            let currentX = this.centerX - totalWidth / 2

            this.data.skills.forEach((playerSkill, i) => {
                const skillDef = SKILL_DEFINITIONS[playerSkill.skillId]
                if (!skillDef) return

                const iconContainer = new Container()
                iconContainer.position.set(currentX + skillWidths[i] / 2, skillY)
                iconContainer.alpha = 0
                iconContainer.scale.set(0)

                // Pill background
                const pill = new Graphics()
                pill.roundRect(
                    -skillWidths[i] / 2,
                    -pillHeight / 2,
                    skillWidths[i],
                    pillHeight,
                    pillHeight / 2
                )
                pill.fill({ color: textMuted, alpha: 0.15 })
                pill.roundRect(
                    -skillWidths[i] / 2,
                    -pillHeight / 2,
                    skillWidths[i],
                    pillHeight,
                    pillHeight / 2
                )
                pill.stroke({ color: textMuted, width: 1, alpha: 0.3 })
                iconContainer.addChild(pill)

                const iconText = new Text({
                    text: `${skillDef.icon} Lv.${playerSkill.level}`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 12,
                        fontWeight: 'bold',
                        fill: textDark,
                    }),
                })
                iconText.anchor.set(0.5)
                iconContainer.addChild(iconText)

                this.screenContainer.addChild(iconContainer)
                currentX += skillWidths[i] + pillGap
            })
        }

        // Rank card - clean rounded rectangle
        const rankY = this.data.skills.length > 0 ? cardY + cardHeight - 60 : statsY + statGap * 3
        this.resultRankCard = new Container()
        this.resultRankCard.position.set(this.centerX, rankY)
        this.resultRankCard.scale.set(0)
        this.screenContainer.addChild(this.resultRankCard)

        const rank = getRankFromTime(this.data.gameTime)
        const rankConfig = RANK_CONFIGS[rank]
        const rankBoxWidth = 80
        const rankBoxHeight = 60

        // Rank shadow
        const rankShadow = new Graphics()
        rankShadow.roundRect(
            -rankBoxWidth / 2 + 3,
            -rankBoxHeight / 2 + 4,
            rankBoxWidth,
            rankBoxHeight,
            12
        )
        rankShadow.fill({ color: cardShadowColor, alpha: 0.3 })
        this.resultRankCard.addChild(rankShadow)

        // Rank badge background - Balatro style with thick black border
        const rankBg = new Graphics()
        rankBg.roundRect(-rankBoxWidth / 2, -rankBoxHeight / 2, rankBoxWidth, rankBoxHeight, 12)
        rankBg.fill(cardBgColor)
        rankBg.roundRect(-rankBoxWidth / 2, -rankBoxHeight / 2, rankBoxWidth, rankBoxHeight, 12)
        rankBg.stroke({ color: 0x1a1a1a, width: 4 })
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
        this.resultRankCard.addChild(rankText)

        // Rank message below card
        const messageText = new Text({
            text: rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fontWeight: 'bold',
                fill: textMuted,
            }),
        })
        messageText.anchor.set(0.5)
        messageText.position.set(0, rankBoxHeight / 2 + 15)
        this.resultRankCard.addChild(messageText)

        // Action buttons - Balatro-style rounded rectangle buttons
        this.resultButtons = new Container()
        this.resultButtons.position.set(this.centerX, this.height - 60)
        this.resultButtons.alpha = 0
        this.screenContainer.addChild(this.resultButtons)

        // Retry button - Balatro blue
        const retryBtn = this.createTextButton('RETRY', -55, 0x4a9eff, () => {
            this.onRetry?.()
        })
        this.resultButtons.addChild(retryBtn)

        // Share button - Balatro gold
        const shareBtn = this.createTextButton('SHARE', 55, 0xc9a227, () => {
            if (!this.data) return
            const kills = Math.floor(this.data.score / 10)
            const rank = getRankFromTime(this.data.gameTime)
            shareGameResult(
                {
                    score: this.data.score,
                    kills,
                    time: this.data.gameTime,
                    level: this.data.level,
                    rank,
                },
                navigator.language.startsWith('ko') ? 'ko' : 'en'
            )
        })
        this.resultButtons.addChild(shareBtn)
    }

    private createTextButton(
        label: string,
        offsetX: number,
        color: number,
        onClick: () => void
    ): Container {
        const btn = new Container()
        btn.position.set(offsetX, 0)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        const btnWidth = 90
        const btnHeight = 40
        const cardShadowColor = 0x1a1a1a

        // Shadow
        const shadow = new Graphics()
        shadow.roundRect(-btnWidth / 2 + 2, -btnHeight / 2 + 4, btnWidth, btnHeight, 10)
        shadow.fill({ color: cardShadowColor, alpha: 0.5 })
        btn.addChild(shadow)

        // Colored background (like HomeScreen buttons)
        const bg = new Graphics()
        bg.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
        bg.fill(color)
        bg.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 10)
        bg.stroke({ color: 0x1a1a1a, width: 3 })
        btn.addChild(bg)

        // Text color based on background (black on gold, white on others)
        const text = new Text({
            text: label,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: color === 0xc9a227 ? 0x000000 : 0xffffff,
                letterSpacing: 1,
            }),
        })
        text.anchor.set(0.5)
        btn.addChild(text)

        btn.on('pointerdown', onClick)

        return btn
    }
}
