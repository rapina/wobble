import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { PlayerProgress, getXpForLevel, GAME_DURATION_SECONDS } from '../types'
import type { PlayerSkill } from '../skills'
import { getSkillDefinition } from '../skills/registry'
import type { SkillDefinition } from '../skills/types'
import { ComboState } from '../ComboSystem'
import {
    BALATRO_COLORS,
    BALATRO_DESIGN,
    drawBalatroCard,
    drawBalatroBadge,
} from './BalatroButton'
import { t, DEFAULT_LANGUAGE } from '@/utils/localization'

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

export interface SkillStats {
    skillId: string
    totalDamage: number // Accumulated damage dealt by this skill
    activations: number // Number of times the skill was activated/triggered
    // Special effect stats
    slowTime?: number // Total time enemies were slowed (Time Warp)
    deflections?: number // Number of deflections (Magnetic Shield)
    pushForce?: number // Total push force applied (Static Repulsion)
    pullForce?: number // Total pull force applied (Magnetic Pull, Flow Stream)
    chaosApplied?: number // Chaos effect applied (Chaos Field)
    bounces?: number // Number of bounces (Elastic Bounce)
    pierces?: number // Number of pierces (Momentum Pierce)
}

export interface HudState {
    health: number
    maxHealth: number
    progress: PlayerProgress
    gameTime: number
    skills: PlayerSkill[]
    cooldowns?: SkillCooldown[] // Cooldown states for active skills
    skillStats?: SkillStats[] // Accumulated stats per skill
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

    // Skill flash animation state
    private skillFlashTimers: Map<string, number> = new Map()
    private previousSkillStats: Map<string, number> = new Map() // Track previous stat values

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
        this.updateSkillList(state.skills, state.cooldowns || [], state.skillStats || [])
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

    private updateSkillList(skills: PlayerSkill[], cooldowns: SkillCooldown[], skillStats: SkillStats[]): void {
        this.skillListContainer.removeChildren()

        // Update flash timers (decay)
        const now = Date.now()
        for (const [skillId, startTime] of this.skillFlashTimers) {
            if (now - startTime > 500) {
                this.skillFlashTimers.delete(skillId)
            }
        }

        // Vertical list layout with skill name + level + cooldown gauge + stats on right
        const rowHeight = 32
        const rowWidth = 90
        const statsWidth = 55 // Extra space for stats on the right
        const maxVisibleSkills = 8

        const visibleSkills = skills.slice(0, maxVisibleSkills)

        visibleSkills.forEach((skill, index) => {
            const skillDef = getSkillDefinition(skill.skillId) as SkillDefinition | undefined
            if (!skillDef) return

            const rowContainer = new Container()
            rowContainer.position.set(0, index * rowHeight)

            // Find cooldown and stats
            const cooldown = cooldowns.find((cd) => cd.skillId === skill.skillId)
            const stats = skillStats.find((s) => s.skillId === skill.skillId)
            const hasCooldown = cooldown !== undefined
            const isOnCooldown = cooldown && cooldown.current > 0
            const cooldownRatio = cooldown ? 1 - cooldown.current / cooldown.max : 1 // Progress ratio (fills up)

            // Check for stat changes to trigger flash
            const statDisplay = this.getSkillStatDisplay(skill.skillId, stats)
            const currentStatValue = this.getSkillStatValue(skill.skillId, stats)
            const previousStatValue = this.previousSkillStats.get(skill.skillId) ?? 0

            if (currentStatValue > previousStatValue && previousStatValue > 0) {
                // Stat increased - trigger flash
                this.skillFlashTimers.set(skill.skillId, now)
            }
            this.previousSkillStats.set(skill.skillId, currentStatValue)

            // Check if currently flashing
            const flashStartTime = this.skillFlashTimers.get(skill.skillId)
            const isFlashing = flashStartTime !== undefined
            const flashProgress = isFlashing ? (now - flashStartTime) / 500 : 0 // 0 to 1 over 500ms
            const flashAlpha = isFlashing ? Math.max(0, 1 - flashProgress) : 0

            // Determine skill type indicator color
            const isActiveSkill = skillDef.activationType === 'active'
            const isAuraSkill = skillDef.activationType === 'aura'
            const typeColor = isAuraSkill ? 0x9b59b6 : isActiveSkill ? 0xe74c3c : skillDef.color

            // Flash overlay (behind everything else in the row)
            if (isFlashing) {
                const flashOverlay = new Graphics()
                flashOverlay.roundRect(0, 0, rowWidth, 28, 5)
                flashOverlay.fill({ color: 0xffffff, alpha: flashAlpha * 0.4 })
                rowContainer.addChild(flashOverlay)
            }

            // Skill row background
            const rowBg = new Graphics()
            rowBg.roundRect(0, 0, rowWidth, 28, 5)
            rowBg.fill({ color: BALATRO_COLORS.bgCard, alpha: 0.92 })
            rowBg.roundRect(0, 0, rowWidth, 28, 5)
            rowBg.stroke({
                color: isFlashing ? 0xffffff : (isOnCooldown ? BALATRO_COLORS.textMuted : typeColor),
                width: isFlashing ? 2 : 1.5,
            })
            rowContainer.addChild(rowBg)

            // Left color indicator bar (shows skill type)
            const typeIndicator = new Graphics()
            typeIndicator.roundRect(2, 2, 4, 24, 2)
            typeIndicator.fill({ color: typeColor, alpha: isOnCooldown ? 0.4 : 1 })
            rowContainer.addChild(typeIndicator)

            // Skill name (using nameShort for compact display)
            const skillName = t(skillDef.nameShort, DEFAULT_LANGUAGE)
            const nameText = new Text({
                text: skillName,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: isOnCooldown ? BALATRO_COLORS.textMuted : BALATRO_COLORS.textPrimary,
                }),
            })
            nameText.anchor.set(0, 0.5)
            nameText.position.set(10, 9)
            rowContainer.addChild(nameText)

            // Level badge
            const levelBadge = new Graphics()
            levelBadge.roundRect(rowWidth - 22, 2, 18, 12, 3)
            levelBadge.fill({ color: isOnCooldown ? BALATRO_COLORS.textMuted : BALATRO_COLORS.gold })
            rowContainer.addChild(levelBadge)

            const levelText = new Text({
                text: `${skill.level}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fontWeight: 'bold',
                    fill: 0x000000,
                }),
            })
            levelText.anchor.set(0.5)
            levelText.position.set(rowWidth - 13, 8)
            rowContainer.addChild(levelText)

            // Cooldown gauge bar (show if skill has cooldown tracking)
            if (hasCooldown) {
                const gaugeWidth = rowWidth - 12
                const gaugeHeight = 3
                const gaugeY = 22

                // Gauge background
                const gaugeBg = new Graphics()
                gaugeBg.roundRect(8, gaugeY, gaugeWidth, gaugeHeight, 1.5)
                gaugeBg.fill({ color: BALATRO_COLORS.bgCardLight })
                rowContainer.addChild(gaugeBg)

                // Gauge fill (progress)
                if (cooldownRatio > 0) {
                    const gaugeFill = new Graphics()
                    const fillWidth = Math.max(0, gaugeWidth * cooldownRatio)
                    gaugeFill.roundRect(8, gaugeY, fillWidth, gaugeHeight, 1.5)
                    gaugeFill.fill({ color: cooldownRatio >= 1 ? BALATRO_COLORS.cyan : BALATRO_COLORS.gold })
                    rowContainer.addChild(gaugeFill)
                }
            }
            // Aura indicator (persistent glow effect indicator) - only if no cooldown
            else if (isAuraSkill) {
                const auraIndicator = new Graphics()
                auraIndicator.circle(rowWidth - 30, 20, 3)
                auraIndicator.fill({ color: 0x9b59b6, alpha: 0.8 })
                // Pulsing glow effect
                const pulsePhase = (Date.now() / 1000) * 2
                const pulseAlpha = 0.3 + 0.3 * Math.sin(pulsePhase)
                auraIndicator.circle(rowWidth - 30, 20, 5)
                auraIndicator.fill({ color: 0x9b59b6, alpha: pulseAlpha })
                rowContainer.addChild(auraIndicator)
            }

            // Accumulated stats display (on the RIGHT side of the skill row)
            if (statDisplay) {
                const statText = new Text({
                    text: statDisplay.text,
                    style: new TextStyle({
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 9,
                        fontWeight: 'bold',
                        fill: isFlashing ? 0xffffff : statDisplay.color,
                    }),
                })
                statText.anchor.set(0, 0.5)
                statText.position.set(rowWidth + 6, 14)
                rowContainer.addChild(statText)
            }

            this.skillListContainer.addChild(rowContainer)
        })
    }

    /**
     * Get the numeric value of a skill's primary stat for change detection
     */
    private getSkillStatValue(skillId: string, stats: SkillStats | undefined): number {
        if (!stats) return 0

        // Return the primary stat value based on skill type
        if (stats.totalDamage > 0) return stats.totalDamage
        if (stats.slowTime !== undefined && stats.slowTime > 0) return stats.slowTime
        if (stats.deflections !== undefined && stats.deflections > 0) return stats.deflections
        if (stats.pushForce !== undefined && stats.pushForce > 0) return stats.pushForce
        if (stats.pullForce !== undefined && stats.pullForce > 0) return stats.pullForce
        if (stats.chaosApplied !== undefined && stats.chaosApplied > 0) return stats.chaosApplied
        if (stats.bounces !== undefined && stats.bounces > 0) return stats.bounces
        if (stats.pierces !== undefined && stats.pierces > 0) return stats.pierces
        if (stats.activations > 0) return stats.activations

        return 0
    }

    /**
     * Get the appropriate stat display for a skill
     */
    private getSkillStatDisplay(skillId: string, stats: SkillStats | undefined): { text: string; color: number } | null {
        if (!stats) return null

        // Damage-based skills
        if (stats.totalDamage > 0) {
            const damageSkills = [
                'radiant-aura', 'wave-pulse', 'torque-slash', 'beat-pulse',
                'orbital-strike', 'plasma-discharge', 'centripetal-pulse',
                'quantum-tunnel', 'decay-chain', 'heat-chain', 'buoyant-bomb'
            ]
            if (damageSkills.includes(skillId)) {
                return { text: `${this.formatNumber(stats.totalDamage)} dmg`, color: BALATRO_COLORS.red }
            }
        }

        // Time Warp - slow time
        if (skillId === 'time-warp' && stats.slowTime !== undefined && stats.slowTime > 0) {
            return { text: `${stats.slowTime.toFixed(1)}s slow`, color: 0x2c3e50 }
        }

        // Magnetic Shield - deflections
        if (skillId === 'magnetic-shield' && stats.deflections !== undefined && stats.deflections > 0) {
            return { text: `${this.formatNumber(stats.deflections)} deflect`, color: 0x3498db }
        }

        // Static Repulsion - push force
        if (skillId === 'static-repulsion' && stats.pushForce !== undefined && stats.pushForce > 0) {
            return { text: `${this.formatNumber(stats.pushForce)} push`, color: 0xf1c40f }
        }

        // Magnetic Pull - pull force
        if (skillId === 'magnetic-pull' && stats.pullForce !== undefined && stats.pullForce > 0) {
            return { text: `${this.formatNumber(stats.pullForce)} pull`, color: 0x34495e }
        }

        // Flow Stream - pull/suction
        if (skillId === 'flow-stream' && stats.pullForce !== undefined && stats.pullForce > 0) {
            return { text: `${this.formatNumber(stats.pullForce)} suction`, color: 0x1abc9c }
        }

        // Chaos Field - chaos applied
        if (skillId === 'chaos-field' && stats.chaosApplied !== undefined && stats.chaosApplied > 0) {
            return { text: `${this.formatNumber(stats.chaosApplied)} chaos`, color: 0x9b59b6 }
        }

        // Elastic Bounce - bounces
        if (skillId === 'elastic-bounce' && stats.bounces !== undefined && stats.bounces > 0) {
            return { text: `${this.formatNumber(stats.bounces)} bounce`, color: 0x3498db }
        }

        // Momentum Pierce - pierces
        if (skillId === 'momentum-pierce' && stats.pierces !== undefined && stats.pierces > 0) {
            return { text: `${this.formatNumber(stats.pierces)} pierce`, color: 0xe74c3c }
        }

        // Fallback to damage if available
        if (stats.totalDamage > 0) {
            return { text: `${this.formatNumber(stats.totalDamage)} dmg`, color: BALATRO_COLORS.red }
        }

        // Activations as fallback
        if (stats.activations > 0) {
            return { text: `${this.formatNumber(stats.activations)}x`, color: BALATRO_COLORS.textSecondary }
        }

        return null
    }

    /**
     * Format number for compact display (e.g., 1234 -> 1.2k)
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'm'
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k'
        }
        return Math.round(num).toString()
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
