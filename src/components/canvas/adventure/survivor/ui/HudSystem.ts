import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { PlayerProgress, getXpForLevel } from '../types'
import { PlayerSkill, getSkillDefinition } from '../skills'
import { drawUIHexagon, drawHeartShape } from '../utils'

export interface HudContext {
    uiContainer: Container
    width: number
    height: number
}

export interface HudState {
    health: number
    maxHealth: number
    progress: PlayerProgress
    gameTime: number
    skills: PlayerSkill[]
}

export class HudSystem {
    private uiContainer: Container
    private width: number
    private height: number

    // Health display
    private healthBarBg!: Graphics
    private healthBar!: Graphics

    // XP display
    private xpBarBg!: Graphics
    private xpBarFill!: Graphics
    private levelText!: Text

    // Timer
    private timeText!: Text

    // Skill icons
    private skillIconsContainer!: Container

    // Internal state for comparison
    private lastState: HudState | null = null

    constructor(context: HudContext) {
        this.uiContainer = context.uiContainer
        this.width = context.width
        this.height = context.height
        this.setup()
    }

    private setup(): void {
        // === UI Color Palette (bright theme) ===
        const uiBgColor = 0xffffff // Clean white background
        const uiBorderColor = 0x78716c // Warm gray border
        const uiShadowColor = 0x292524 // Soft shadow
        const healthColor = 0xef4444 // Vibrant red
        const levelColor = 0xfbbf24 // Golden yellow

        // === Top-left: Health display as hexagonal hearts ===
        // Health badge shadow
        const healthShadow = new Graphics()
        drawUIHexagon(healthShadow, 29, 30, 20, uiShadowColor)
        healthShadow.alpha = 0.3
        this.uiContainer.addChild(healthShadow)

        // Health badge container (hexagon with heart inside)
        this.healthBarBg = new Graphics()
        drawUIHexagon(this.healthBarBg, 28, 28, 20, uiBgColor, uiBorderColor, 2)
        this.uiContainer.addChild(this.healthBarBg)

        // Heart icon inside health badge
        const heartIcon = new Graphics()
        drawHeartShape(heartIcon, 28, 26, 8, healthColor)
        this.uiContainer.addChild(heartIcon)

        // Health hearts container (individual heart icons)
        this.healthBar = new Graphics()
        this.healthBar.position.set(55, 18)
        this.uiContainer.addChild(this.healthBar)

        // === Below HP: XP Bar ===
        const xpBarX = 55
        const xpBarY = 58
        const xpBarWidth = 120
        const xpBarHeight = 12

        // XP bar shadow
        const xpBarShadow = new Graphics()
        xpBarShadow.roundRect(xpBarX + 1, xpBarY + 2, xpBarWidth, xpBarHeight, 6)
        xpBarShadow.fill({ color: uiShadowColor, alpha: 0.2 })
        this.uiContainer.addChild(xpBarShadow)

        // XP bar background
        this.xpBarBg = new Graphics()
        this.xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 6)
        this.xpBarBg.fill(uiBgColor)
        this.xpBarBg.roundRect(xpBarX, xpBarY, xpBarWidth, xpBarHeight, 6)
        this.xpBarBg.stroke({ color: uiBorderColor, width: 2 })
        this.uiContainer.addChild(this.xpBarBg)

        // XP bar fill
        this.xpBarFill = new Graphics()
        this.xpBarFill.position.set(xpBarX + 2, xpBarY + 2)
        this.uiContainer.addChild(this.xpBarFill)

        // Timer text
        const timerStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 10,
            fontWeight: 'bold',
            fill: uiShadowColor,
            dropShadow: {
                color: 0xffffff,
                blur: 2,
                distance: 0,
                alpha: 0.8,
            },
        })
        this.timeText = new Text({ text: '00:00', style: timerStyle })
        this.timeText.anchor.set(0, 0.5)
        this.timeText.position.set(xpBarX + xpBarWidth + 8, xpBarY + xpBarHeight / 2)
        this.uiContainer.addChild(this.timeText)

        // === Top-right: Level indicator ===
        const levelX = this.width - 35
        const levelY = 28

        // Level badge shadow
        const levelShadow = new Graphics()
        drawUIHexagon(levelShadow, levelX + 1, levelY + 2, 20, uiShadowColor)
        levelShadow.alpha = 0.3
        this.uiContainer.addChild(levelShadow)

        // Level badge main
        const levelBadge = new Graphics()
        drawUIHexagon(levelBadge, levelX, levelY, 20, uiBgColor, levelColor, 2)
        this.uiContainer.addChild(levelBadge)

        // Level number
        const levelStyle = new TextStyle({
            fontFamily: 'Arial, sans-serif',
            fontSize: 14,
            fontWeight: 'bold',
            fill: uiShadowColor,
        })
        this.levelText = new Text({ text: '1', style: levelStyle })
        this.levelText.anchor.set(0.5)
        this.levelText.position.set(levelX, levelY)
        this.uiContainer.addChild(this.levelText)

        // "LV" label above level
        const lvLabel = new Text({
            text: 'LV',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 8,
                fontWeight: 'bold',
                fill: levelColor,
            }),
        })
        lvLabel.anchor.set(0.5)
        lvLabel.position.set(levelX, levelY - 18)
        this.uiContainer.addChild(lvLabel)

        // === Bottom-left: Skill icons ===
        this.skillIconsContainer = new Container()
        this.skillIconsContainer.position.set(15, this.height - 50)
        this.uiContainer.addChild(this.skillIconsContainer)
    }

    /**
     * Update HUD display
     */
    update(state: HudState): void {
        this.updateHealthBar(state.health, state.maxHealth)
        this.updateXpBar(state.progress)
        this.updateTimer(state.gameTime)
        this.updateLevel(state.progress.level)
        this.updateSkillIcons(state.skills)
        this.lastState = state
    }

    private updateHealthBar(health: number, maxHealth: number): void {
        this.healthBar.clear()

        // Calculate hearts to display (max 6 hearts)
        const maxHearts = 6
        const healthPerHeart = maxHealth / maxHearts
        const fullHearts = Math.floor(health / healthPerHeart)
        const partialHeart = (health % healthPerHeart) / healthPerHeart

        const heartSize = 12
        const heartGap = 4

        // Bright theme colors
        const fullHeartColor = 0xef4444
        const fullHeartStroke = 0xdc2626
        const emptyHeartColor = 0xffffff
        const emptyHeartStroke = 0xd6d3d1

        for (let i = 0; i < maxHearts; i++) {
            const x = i * (heartSize * 2 + heartGap)
            const y = 0

            let fillColor: number
            let strokeColor: number
            let fillAlpha = 1

            if (i < fullHearts) {
                fillColor = fullHeartColor
                strokeColor = fullHeartStroke
            } else if (i === fullHearts && partialHeart > 0) {
                fillColor = fullHeartColor
                strokeColor = fullHeartStroke
                fillAlpha = 0.3 + partialHeart * 0.7
            } else {
                fillColor = emptyHeartColor
                strokeColor = emptyHeartStroke
            }

            // Draw hexagonal heart container
            const points: number[] = []
            const cx = x + heartSize
            const cy = y + heartSize
            for (let j = 0; j < 6; j++) {
                const angle = (Math.PI / 3) * j - Math.PI / 2
                points.push(cx + heartSize * Math.cos(angle))
                points.push(cy + heartSize * Math.sin(angle))
            }
            this.healthBar.poly(points)
            this.healthBar.fill({ color: fillColor, alpha: fillAlpha })
            this.healthBar.poly(points)
            this.healthBar.stroke({ color: strokeColor, width: 2 })
        }
    }

    private updateXpBar(progress: PlayerProgress): void {
        const currentLevel = progress.level
        const currentLevelXp = getXpForLevel(currentLevel)
        const nextLevelXp = getXpForLevel(currentLevel + 1)
        const xpInLevel = progress.xp - currentLevelXp
        const xpNeeded = nextLevelXp - currentLevelXp
        const progressRatio = Math.min(1, xpInLevel / xpNeeded)

        const barWidth = 116
        const barHeight = 10

        this.xpBarFill.clear()
        if (progressRatio > 0) {
            this.xpBarFill.roundRect(0, 0, barWidth * progressRatio, barHeight, 5)
            this.xpBarFill.fill(0x2ecc71)
        }
    }

    private updateTimer(gameTime: number): void {
        const minutes = Math.floor(gameTime / 60)
        const seconds = Math.floor(gameTime % 60)
        this.timeText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    private updateLevel(level: number): void {
        this.levelText.text = `${level}`
    }

    private updateSkillIcons(skills: PlayerSkill[]): void {
        this.skillIconsContainer.removeChildren()

        const hexSize = 20
        const iconGap = 6

        skills.forEach((skill, index) => {
            const skillDef = getSkillDefinition(skill.skillId)
            if (!skillDef) return

            const iconContainer = new Container()
            const x = index * (hexSize * 2 + iconGap) + hexSize
            iconContainer.position.set(x, hexSize)

            // Hexagon background
            const bg = new Graphics()
            drawUIHexagon(bg, 0, 0, hexSize, 0xffffff, skillDef.color, 2)
            iconContainer.addChild(bg)

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
            iconText.position.set(0, -3)
            iconContainer.addChild(iconText)

            // Level number
            const levelText = new Text({
                text: `${skill.level}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 8,
                    fontWeight: 'bold',
                    fill: 0x422006,
                }),
            })
            levelText.anchor.set(0.5)
            levelText.position.set(0, 10)
            iconContainer.addChild(levelText)

            this.skillIconsContainer.addChild(iconContainer)
        })
    }

    /**
     * Reset HUD to initial state
     */
    reset(): void {
        this.lastState = null
        this.update({
            health: 100,
            maxHealth: 100,
            progress: { xp: 0, level: 1, pendingLevelUps: 0 },
            gameTime: 0,
            skills: [],
        })
    }
}
