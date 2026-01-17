import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { PlayerProgress, getXpForLevel, GAME_DURATION_SECONDS } from '../types'
import { PlayerSkill, getSkillDefinition } from '../skills'
import { ComboState } from '../ComboSystem'
import {
    BALATRO_COLORS,
    BALATRO_DESIGN,
    drawBalatroCard,
    drawBalatroBadge,
} from './BalatroButton'

export interface HudContext {
    uiContainer: Container
    width: number
    height: number
}

export interface SkillCooldown {
    skillId: string
    current: number // Current cooldown time remaining
    max: number // Max cooldown time
}

export interface HudState {
    health: number
    maxHealth: number
    progress: PlayerProgress
    gameTime: number
    skills: PlayerSkill[]
    cooldowns?: SkillCooldown[] // Cooldown states for active skills
}

export class HudSystem {
    private uiContainer: Container
    private width: number
    private height: number

    // Main HUD card container
    private hudCard!: Container
    private hudCardBg!: Graphics

    // Health display
    private healthContainer!: Container
    private healthBar!: Graphics

    // XP display
    private xpBarBg!: Graphics
    private xpBarFill!: Graphics
    private levelBadge!: Graphics
    private levelText!: Text

    // Timer
    private timerContainer!: Container
    private timerBg!: Graphics
    private timeText!: Text

    // Skill list
    private skillListContainer!: Container

    // Combo display
    private comboContainer!: Container
    private comboCountText!: Text
    private comboMultiplierText!: Text
    private comboTimerBar!: Graphics
    private comboAnimPhase = 0

    // Internal state for comparison
    private lastState: HudState | null = null

    constructor(context: HudContext) {
        this.uiContainer = context.uiContainer
        this.width = context.width
        this.height = context.height
        this.setup()
    }

    private setup(): void {
        // === Top-left HUD Card ===
        this.hudCard = new Container()
        this.hudCard.position.set(10, 10)
        this.uiContainer.addChild(this.hudCard)

        // HUD card background
        this.hudCardBg = new Graphics()
        drawBalatroCard(this.hudCardBg, 0, 0, 200, 70, {
            bgColor: BALATRO_COLORS.bgCard,
            borderColor: BALATRO_COLORS.gold,
            borderWidth: 2,
            radius: BALATRO_DESIGN.radiusMedium,
        })
        this.hudCard.addChild(this.hudCardBg)

        // === Health Section ===
        this.healthContainer = new Container()
        this.healthContainer.position.set(12, 12)
        this.hudCard.addChild(this.healthContainer)

        // Health icon badge
        const healthBadge = new Graphics()
        drawBalatroBadge(healthBadge, 0, 0, 28, 28, BALATRO_COLORS.red)
        this.healthContainer.addChild(healthBadge)

        // Heart symbol
        const heartText = new Text({
            text: '♥',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fill: 0xffffff,
            }),
        })
        heartText.anchor.set(0.5)
        heartText.position.set(14, 14)
        this.healthContainer.addChild(heartText)

        // Health hearts display
        this.healthBar = new Graphics()
        this.healthBar.position.set(36, 0)
        this.healthContainer.addChild(this.healthBar)

        // === Level & XP Section ===
        const xpY = 42

        // Level badge
        this.levelBadge = new Graphics()
        drawBalatroBadge(this.levelBadge, 12, xpY, 28, 20, BALATRO_COLORS.gold)
        this.hudCard.addChild(this.levelBadge)

        // Level text
        this.levelText = new Text({
            text: '1',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: 0x000000,
            }),
        })
        this.levelText.anchor.set(0.5)
        this.levelText.position.set(26, xpY + 10)
        this.hudCard.addChild(this.levelText)

        // XP bar background
        this.xpBarBg = new Graphics()
        this.xpBarBg.roundRect(48, xpY + 2, 100, 16, 6)
        this.xpBarBg.fill(BALATRO_COLORS.bgCardLight)
        this.xpBarBg.roundRect(48, xpY + 2, 100, 16, 6)
        this.xpBarBg.stroke({ color: 0x3a3a4e, width: 2 })
        this.hudCard.addChild(this.xpBarBg)

        // XP bar fill
        this.xpBarFill = new Graphics()
        this.hudCard.addChild(this.xpBarFill)

        // === Timer (Top-center) ===
        this.timerContainer = new Container()
        this.timerContainer.position.set(this.width / 2 - 30, 10)
        this.uiContainer.addChild(this.timerContainer)

        // Timer background
        this.timerBg = new Graphics()
        drawBalatroCard(this.timerBg, 0, 0, 60, 36, {
            bgColor: BALATRO_COLORS.bgCard,
            borderColor: BALATRO_COLORS.blue,
            borderWidth: 2,
            radius: BALATRO_DESIGN.radiusSmall,
        })
        this.timerContainer.addChild(this.timerBg)

        // Timer text
        this.timeText = new Text({
            text: '10:00',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
                letterSpacing: 1,
            }),
        })
        this.timeText.anchor.set(0.5)
        this.timeText.position.set(30, 18)
        this.timerContainer.addChild(this.timeText)

        // === Skill List (Below HUD Card) ===
        this.skillListContainer = new Container()
        this.skillListContainer.position.set(10, 90)
        this.uiContainer.addChild(this.skillListContainer)

        // === Combo Display (Top-right, below timer) ===
        this.comboContainer = new Container()
        this.comboContainer.position.set(this.width - 70, 55)
        this.comboContainer.visible = false
        this.uiContainer.addChild(this.comboContainer)

        // Combo count
        this.comboCountText = new Text({
            text: '0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.gold,
                stroke: { color: BALATRO_COLORS.border, width: 3 },
            }),
        })
        this.comboCountText.anchor.set(0.5)
        this.comboContainer.addChild(this.comboCountText)

        // Combo label
        const comboLabel = new Text({
            text: 'COMBO',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textSecondary,
                letterSpacing: 1,
            }),
        })
        comboLabel.anchor.set(0.5)
        comboLabel.position.set(0, 20)
        this.comboContainer.addChild(comboLabel)

        // Multiplier text
        this.comboMultiplierText = new Text({
            text: 'x1.0',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.blue,
            }),
        })
        this.comboMultiplierText.anchor.set(0.5)
        this.comboMultiplierText.position.set(0, 34)
        this.comboContainer.addChild(this.comboMultiplierText)

        // Timer bar
        this.comboTimerBar = new Graphics()
        this.comboTimerBar.position.set(-25, 46)
        this.comboContainer.addChild(this.comboTimerBar)
    }

    /**
     * Update HUD display
     */
    update(state: HudState): void {
        this.updateHealthBar(state.health, state.maxHealth)
        this.updateXpBar(state.progress)
        this.updateTimer(state.gameTime)
        this.updateLevel(state.progress.level)
        this.updateSkillList(state.skills, state.cooldowns || [])
        this.lastState = state
    }

    private updateHealthBar(health: number, maxHealth: number): void {
        this.healthBar.clear()

        // Calculate hearts (max 6)
        const maxHearts = 6
        const healthPerHeart = maxHealth / maxHearts
        const fullHearts = Math.floor(health / healthPerHeart)
        const partialHeart = (health % healthPerHeart) / healthPerHeart

        const heartSize = 16
        const heartGap = 4

        for (let i = 0; i < maxHearts; i++) {
            const x = i * (heartSize + heartGap)
            const y = 6

            let fillColor: number
            let fillAlpha = 1

            if (i < fullHearts) {
                fillColor = BALATRO_COLORS.red
            } else if (i === fullHearts && partialHeart > 0) {
                fillColor = BALATRO_COLORS.red
                fillAlpha = 0.3 + partialHeart * 0.7
            } else {
                fillColor = BALATRO_COLORS.bgCardLight
            }

            // Draw heart-shaped indicator
            this.healthBar.roundRect(x, y, heartSize, heartSize, 4)
            this.healthBar.fill({ color: fillColor, alpha: fillAlpha })
            this.healthBar.roundRect(x, y, heartSize, heartSize, 4)
            this.healthBar.stroke({ color: BALATRO_COLORS.border, width: 1.5 })
        }
    }

    private updateXpBar(progress: PlayerProgress): void {
        const currentLevel = progress.level
        const currentLevelXp = getXpForLevel(currentLevel)
        const nextLevelXp = getXpForLevel(currentLevel + 1)
        const xpInLevel = progress.xp - currentLevelXp
        const xpNeeded = nextLevelXp - currentLevelXp
        const progressRatio = Math.min(1, xpInLevel / xpNeeded)

        const barX = 50
        const barY = 44
        const barWidth = 96
        const barHeight = 12

        this.xpBarFill.clear()
        const fillWidth = Math.max(0, barWidth * progressRatio)
        if (fillWidth > 0) {
            this.xpBarFill.roundRect(barX, barY, fillWidth, barHeight, 4)
            this.xpBarFill.fill(BALATRO_COLORS.cyan)
        }
    }

    private updateTimer(gameTime: number): void {
        const remainingTime = Math.max(0, GAME_DURATION_SECONDS - gameTime)
        const minutes = Math.floor(remainingTime / 60)
        const seconds = Math.floor(remainingTime % 60)
        this.timeText.text = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`

        // Update timer card border color based on urgency
        this.timerBg.clear()
        let borderColor = BALATRO_COLORS.blue
        if (remainingTime <= 30) {
            const flash = Math.sin(gameTime * 10) > 0
            borderColor = flash ? BALATRO_COLORS.red : 0xff6666
            this.timeText.style.fill = BALATRO_COLORS.red
        } else if (remainingTime <= 60) {
            borderColor = BALATRO_COLORS.gold
            this.timeText.style.fill = BALATRO_COLORS.gold
        } else {
            this.timeText.style.fill = BALATRO_COLORS.textPrimary
        }

        drawBalatroCard(this.timerBg, 0, 0, 60, 36, {
            bgColor: BALATRO_COLORS.bgCard,
            borderColor,
            borderWidth: 2,
            radius: BALATRO_DESIGN.radiusSmall,
        })
    }

    private updateLevel(level: number): void {
        this.levelText.text = `${level}`
    }

    private updateSkillList(skills: PlayerSkill[], cooldowns: SkillCooldown[]): void {
        this.skillListContainer.removeChildren()

        // Vertical list layout
        const rowHeight = 22
        const maxVisibleSkills = 10

        const visibleSkills = skills.slice(0, maxVisibleSkills)

        visibleSkills.forEach((skill, index) => {
            const skillDef = getSkillDefinition(skill.skillId)
            if (!skillDef) return

            const rowContainer = new Container()
            rowContainer.position.set(0, index * rowHeight)

            // Find cooldown
            const cooldown = cooldowns.find((cd) => cd.skillId === skill.skillId)
            const isOnCooldown = cooldown && cooldown.current > 0
            const cooldownRatio = cooldown ? cooldown.current / cooldown.max : 0

            // Skill row background
            const rowBg = new Graphics()
            rowBg.roundRect(0, 0, 60, 20, 4)
            rowBg.fill({ color: BALATRO_COLORS.bgCard, alpha: 0.9 })
            rowBg.roundRect(0, 0, 60, 20, 4)
            rowBg.stroke({
                color: isOnCooldown ? BALATRO_COLORS.textMuted : skillDef.color,
                width: 1.5,
            })
            rowContainer.addChild(rowBg)

            // Cooldown overlay
            if (isOnCooldown && cooldownRatio > 0) {
                const overlay = new Graphics()
                const fillWidth = 60 * cooldownRatio
                overlay.roundRect(0, 0, fillWidth, 20, 4)
                overlay.fill({ color: 0x000000, alpha: 0.5 })
                rowContainer.addChild(overlay)
            }

            // Skill icon
            const iconText = new Text({
                text: skillDef.icon,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fill: isOnCooldown ? BALATRO_COLORS.textMuted : skillDef.color,
                }),
            })
            iconText.anchor.set(0.5)
            iconText.position.set(12, 10)
            rowContainer.addChild(iconText)

            // Level text
            const levelText = new Text({
                text: `Lv${skill.level}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fontWeight: 'bold',
                    fill: isOnCooldown ? BALATRO_COLORS.textMuted : BALATRO_COLORS.textPrimary,
                }),
            })
            levelText.anchor.set(0, 0.5)
            levelText.position.set(24, 10)
            rowContainer.addChild(levelText)

            // Cooldown timer
            if (isOnCooldown) {
                const cdText = new Text({
                    text: cooldown!.current.toFixed(1),
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 8,
                        fontWeight: 'bold',
                        fill: BALATRO_COLORS.gold,
                    }),
                })
                cdText.anchor.set(1, 0.5)
                cdText.position.set(56, 10)
                rowContainer.addChild(cdText)
            }

            this.skillListContainer.addChild(rowContainer)
        })
    }

    /**
     * Update combo display
     */
    updateCombo(_state: ComboState, _maxWindow: number): void {
        // Multi-kill mode: combo display hidden
        this.comboContainer.visible = false
    }

    /**
     * Reset HUD to initial state
     */
    reset(): void {
        this.lastState = null
        this.comboContainer.visible = false
        this.comboAnimPhase = 0
        this.update({
            health: 100,
            maxHealth: 100,
            progress: { xp: 0, level: 1, pendingLevelUps: 0 },
            gameTime: 0,
            skills: [],
        })
    }
}
