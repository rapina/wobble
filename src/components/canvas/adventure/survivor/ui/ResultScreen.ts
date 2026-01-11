import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { RANK_CONFIGS, getRankFromTime } from '../types'
import { PlayerSkill, SKILL_DEFINITIONS } from '../skills'
import { drawUIHexagon, easeOutQuad, easeOutBack } from '../utils'
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

        // Step 0: Fade in title banner and text (0.0s - 0.3s)
        if (this.animTime >= 0 && this.animStep === 0) {
            const progress = Math.min(1, this.animTime / 0.3)
            if (children[2]) children[2].alpha = progress
            if (children[3]) children[3].alpha = progress
            if (this.animTime >= 0.3) this.animStep = 1
        }

        // Step 1: Show time stat (0.3s - 0.6s)
        if (this.animTime >= 0.3 && this.animStep === 1) {
            const progress = Math.min(1, (this.animTime - 0.3) / 0.3)
            if (children[4]) children[4].alpha = progress
            if (children[5]) children[5].alpha = progress
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
            if (children[7]) children[7].alpha = progress
            if (children[8]) children[8].alpha = progress
            this.resultKillsText.alpha = progress
            const totalKills = Math.floor(this.data.score / 10)
            this.displayedKills = Math.floor(totalKills * easeOutQuad(progress))
            this.resultKillsText.text = this.displayedKills.toString()
            if (progress >= 1) this.animStep = 3
        }

        // Step 3: Show level stat (0.9s - 1.1s)
        if (this.animTime >= 0.9 && this.animStep === 3) {
            const progress = Math.min(1, (this.animTime - 0.9) / 0.2)
            if (children[10]) children[10].alpha = progress
            if (children[11]) children[11].alpha = progress
            this.resultWaveText.alpha = progress
            if (progress >= 1) this.animStep = 4
        }

        // Step 4: Pop in skill icons (1.1s - 1.6s)
        if (this.animTime >= 1.1 && this.animStep === 4) {
            const skillStartIndex = 13
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

        // Bright theme colors
        const bgTopColor = 0x2dd4bf
        const bgBottomColor = 0x14b8a6
        const cardBgColor = 0xffffff
        const cardShadowColor = 0x0d9488
        const textDark = 0x422006
        const accentGold = 0xfbbf24
        const timeColor = 0x0891b2
        const killColor = 0xdc2626
        const levelColor = 0x059669

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

        // Subtle hexagonal pattern overlay
        const pattern = new Graphics()
        for (let row = 0; row < 15; row++) {
            for (let col = 0; col < 10; col++) {
                const px = col * 45 + (row % 2) * 22
                const py = row * 40
                drawUIHexagon(pattern, px, py, 18, undefined, 0xffffff, 1)
            }
        }
        pattern.alpha = 0.1
        this.screenContainer.addChild(pattern)

        // Title banner
        const titleY = 50
        const titleBanner = new Graphics()
        titleBanner.roundRect(this.centerX - 70 + 2, titleY - 18 + 3, 140, 36, 8)
        titleBanner.fill({ color: cardShadowColor, alpha: 0.3 })
        titleBanner.roundRect(this.centerX - 70, titleY - 18, 140, 36, 8)
        titleBanner.fill(cardBgColor)
        titleBanner.roundRect(this.centerX - 70, titleY - 18, 140, 36, 8)
        titleBanner.stroke({ color: accentGold, width: 2 })
        titleBanner.alpha = 0
        this.screenContainer.addChild(titleBanner)

        const titleStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 18,
            fontWeight: 'bold',
            fill: textDark,
            letterSpacing: 3,
        })
        const title = new Text({ text: 'SURVIVED', style: titleStyle })
        title.anchor.set(0.5)
        title.position.set(this.centerX, titleY)
        title.alpha = 0
        this.screenContainer.addChild(title)

        // Stats section
        const statsY = 115
        const statGap = 60

        // Time stat
        this.createStatBadge(this.centerX - 70, statsY, 'time', timeColor)
        this.resultTimeText = new Text({
            text: '00:00',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        this.resultTimeText.anchor.set(0, 0.5)
        this.resultTimeText.position.set(this.centerX - 40, statsY)
        this.resultTimeText.alpha = 0
        this.screenContainer.addChild(this.resultTimeText)

        // Kills stat
        this.createStatBadge(this.centerX - 70, statsY + statGap, 'kill', killColor)
        this.resultKillsText = new Text({
            text: '0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        this.resultKillsText.anchor.set(0, 0.5)
        this.resultKillsText.position.set(this.centerX - 40, statsY + statGap)
        this.resultKillsText.alpha = 0
        this.screenContainer.addChild(this.resultKillsText)

        // Level stat
        this.createStatBadge(this.centerX - 70, statsY + statGap * 2, 'level', levelColor)
        this.resultWaveText = new Text({
            text: `Lv.${this.data.level}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        this.resultWaveText.anchor.set(0, 0.5)
        this.resultWaveText.position.set(this.centerX - 40, statsY + statGap * 2)
        this.resultWaveText.alpha = 0
        this.screenContainer.addChild(this.resultWaveText)

        // Skill icons row
        const skillY = statsY + statGap * 3
        if (this.data.skills.length > 0) {
            const hexSize = 22
            const iconGap = 8
            const totalWidth =
                this.data.skills.length * (hexSize * 2) + (this.data.skills.length - 1) * iconGap
            const startX = this.centerX - totalWidth / 2 + hexSize

            this.data.skills.forEach((playerSkill, i) => {
                const skillDef = SKILL_DEFINITIONS[playerSkill.skillId]
                if (!skillDef) return

                const iconContainer = new Container()
                iconContainer.position.set(startX + i * (hexSize * 2 + iconGap), skillY)
                iconContainer.alpha = 0
                iconContainer.scale.set(0)

                const iconBg = new Graphics()
                drawUIHexagon(iconBg, 0, 0, hexSize, cardBgColor, skillDef.color, 2)
                iconContainer.addChild(iconBg)

                const iconText = new Text({
                    text: `${skillDef.icon}${playerSkill.level}`,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 14,
                        fontWeight: 'bold',
                        fill: textDark,
                    }),
                })
                iconText.anchor.set(0.5)
                iconContainer.addChild(iconText)

                this.screenContainer.addChild(iconContainer)
            })
        }

        // Rank card
        const rankY = this.data.skills.length > 0 ? skillY + 100 : statsY + statGap * 3 + 20
        this.resultRankCard = new Container()
        this.resultRankCard.position.set(this.centerX, rankY)
        this.resultRankCard.scale.set(0)
        this.screenContainer.addChild(this.resultRankCard)

        const rank = getRankFromTime(this.data.gameTime)
        const rankConfig = RANK_CONFIGS[rank]
        const rankHexSize = 50

        // Rank shadow
        const rankHexShadow = new Graphics()
        drawUIHexagon(rankHexShadow, 2, 4, rankHexSize, cardShadowColor)
        rankHexShadow.alpha = 0.3
        this.resultRankCard.addChild(rankHexShadow)

        // Rank badge
        const rankHexInner = new Graphics()
        drawUIHexagon(rankHexInner, 0, 0, rankHexSize, cardBgColor, rankConfig.color, 3)
        this.resultRankCard.addChild(rankHexInner)

        // Rank letter
        const rankText = new Text({
            text: rank,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 48,
                fontWeight: 'bold',
                fill: rankConfig.color,
            }),
        })
        rankText.anchor.set(0.5)
        this.resultRankCard.addChild(rankText)

        // Rank message
        const messageText = new Text({
            text: rankConfig.message,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: textDark,
            }),
        })
        messageText.anchor.set(0.5)
        messageText.position.set(0, 70)
        this.resultRankCard.addChild(messageText)

        // Action buttons
        this.resultButtons = new Container()
        this.resultButtons.position.set(this.centerX, this.height - 70)
        this.resultButtons.alpha = 0
        this.screenContainer.addChild(this.resultButtons)

        // Retry button
        const retryBtn = this.createButtonWithIcon('play', -70, levelColor, () => {
            this.onRetry?.()
        })
        this.resultButtons.addChild(retryBtn)

        // Share button
        const shareBtn = this.createButtonWithIcon('share', 0, timeColor, () => {
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

        // Exit button
        const exitBtn = this.createButtonWithIcon('close', 70, killColor, () => {
            this.onExit?.()
        })
        this.resultButtons.addChild(exitBtn)
    }

    private createStatBadge(
        x: number,
        y: number,
        iconType: 'time' | 'kill' | 'level',
        color: number
    ): void {
        const cardBgColor = 0xffffff
        const cardShadowColor = 0x0d9488

        // Shadow
        const shadow = new Graphics()
        drawUIHexagon(shadow, x + 2, y + 3, 18, cardShadowColor)
        shadow.alpha = 0.2
        this.screenContainer.addChild(shadow)

        // Badge
        const badge = new Graphics()
        drawUIHexagon(badge, x, y, 18, cardBgColor, color, 2)
        badge.alpha = 0
        this.screenContainer.addChild(badge)

        // Icon
        const icon = new Graphics()
        const s = 8

        switch (iconType) {
            case 'time':
                icon.circle(x, y, s)
                icon.stroke({ width: 2, color })
                icon.moveTo(x, y)
                icon.lineTo(x, y - s * 0.5)
                icon.stroke({ width: 2, color })
                icon.moveTo(x, y)
                icon.lineTo(x + s * 0.6, y)
                icon.stroke({ width: 2, color })
                break

            case 'kill':
                icon.circle(x, y, s)
                icon.stroke({ width: 2, color })
                icon.circle(x, y, s * 0.4)
                icon.fill(color)
                icon.moveTo(x - s - 3, y)
                icon.lineTo(x + s + 3, y)
                icon.stroke({ width: 2, color })
                icon.moveTo(x, y - s - 3)
                icon.lineTo(x, y + s + 3)
                icon.stroke({ width: 2, color })
                break

            case 'level':
                const points = 5
                const outerR = s + 2
                const innerR = s * 0.4
                icon.moveTo(x + outerR * Math.sin(0), y - outerR * Math.cos(0))
                for (let i = 0; i < points * 2; i++) {
                    const r = i % 2 === 0 ? outerR : innerR
                    const angle = (Math.PI * i) / points
                    icon.lineTo(x + r * Math.sin(angle), y - r * Math.cos(angle))
                }
                icon.closePath()
                icon.fill(color)
                break
        }

        icon.alpha = 0
        this.screenContainer.addChild(icon)
    }

    private createButtonWithIcon(
        iconType: 'play' | 'share' | 'close',
        offsetX: number,
        color: number,
        onClick: () => void
    ): Container {
        const btn = new Container()
        btn.position.set(offsetX, 0)
        btn.eventMode = 'static'
        btn.cursor = 'pointer'

        const hexSize = 26
        const cardBgColor = 0xffffff
        const cardShadowColor = 0x0d9488

        // Shadow
        const shadow = new Graphics()
        drawUIHexagon(shadow, 2, 3, hexSize, cardShadowColor)
        shadow.alpha = 0.3
        btn.addChild(shadow)

        // Button
        const bg = new Graphics()
        drawUIHexagon(bg, 0, 0, hexSize, cardBgColor, color, 2)
        btn.addChild(bg)

        // Icon
        const icon = new Graphics()
        if (iconType === 'play') {
            icon.moveTo(-6, -10)
            icon.lineTo(-6, 10)
            icon.lineTo(10, 0)
            icon.closePath()
            icon.fill(color)
        } else if (iconType === 'share') {
            icon.moveTo(-8, 8)
            icon.lineTo(8, -8)
            icon.stroke({ color, width: 3 })
            icon.moveTo(0, -8)
            icon.lineTo(8, -8)
            icon.lineTo(8, 0)
            icon.stroke({ color, width: 3 })
        } else if (iconType === 'close') {
            icon.moveTo(-7, -7)
            icon.lineTo(7, 7)
            icon.stroke({ color, width: 3 })
            icon.moveTo(7, -7)
            icon.lineTo(-7, 7)
            icon.stroke({ color, width: 3 })
        }
        btn.addChild(icon)

        btn.on('pointerdown', onClick)

        return btn
    }
}
