import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import {
    PlayerSkill,
    SkillDefinition,
    getSkillDefinition,
    getCurrentLevelDescription,
    getNextLevelDescription,
} from '../skills'
import { easeOutBack } from '../utils'
import { WaveText } from '../../WaveText'

export interface SkillSelectionContext {
    container: Container
    width: number
    height: number
}

export class SkillSelectionScreen {
    private screenContainer: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    // UI elements
    private levelUpBanner: Container | null = null
    private levelUpWaveText: WaveText | null = null
    private skillButtons: { container: Container; skill: PlayerSkill }[] = []

    // Animation state
    private animTime = 0
    private isVisible = false

    // Current skills being displayed
    private upgradeableSkills: PlayerSkill[] = []
    private currentLevel = 1

    // Callbacks
    onSkillSelected?: (skill: PlayerSkill, newLevel: number) => void
    onSelectionComplete?: () => void
    onImpact?: (x: number, y: number) => void

    constructor(context: SkillSelectionContext) {
        this.screenContainer = context.container
        this.width = context.width
        this.height = context.height
        this.centerX = context.width / 2
        this.centerY = context.height / 2
    }

    get visible(): boolean {
        return this.isVisible
    }

    /**
     * Show the skill selection screen
     */
    show(skills: PlayerSkill[], level: number): void {
        this.isVisible = true
        this.animTime = 0
        this.currentLevel = level
        this.screenContainer.visible = true

        // Clear previous
        this.screenContainer.removeChildren()
        this.skillButtons = []

        // Get upgradeable skills (skills below max level)
        this.upgradeableSkills = skills.filter((skill) => {
            const def = getSkillDefinition(skill.skillId)
            return def && skill.level < def.maxLevel
        })

        this.createUI()

        // Trigger impact effect
        this.onImpact?.(this.centerX, this.centerY)
    }

    /**
     * Hide the screen
     */
    hide(): void {
        this.isVisible = false
        this.screenContainer.visible = false
    }

    /**
     * Update animations
     */
    update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animTime += deltaSeconds

        // Update wave text animation
        if (this.levelUpWaveText) {
            this.levelUpWaveText.update(deltaSeconds)
        }

        // Animate level up banner (pop in with overshoot)
        if (this.levelUpBanner) {
            const bannerDelay = 0
            const bannerDuration = 0.3
            const bannerProgress = Math.max(0, (this.animTime - bannerDelay) / bannerDuration)

            if (bannerProgress < 1) {
                const elastic = easeOutBack(Math.min(1, bannerProgress))
                this.levelUpBanner.scale.set(elastic)
            } else {
                this.levelUpBanner.scale.set(1)
            }
        }

        // Animate skill buttons entrance (staggered)
        this.skillButtons.forEach((btn, i) => {
            const delay = 0.2 + i * 0.08
            const duration = 0.3
            const progress = Math.max(0, Math.min(1, (this.animTime - delay) / duration))

            if (progress < 1) {
                const eased = easeOutBack(progress)
                btn.container.scale.set(eased)
                btn.container.alpha = progress
            } else {
                btn.container.scale.set(1)
                btn.container.alpha = 1
            }
        })
    }

    /**
     * Reset the screen
     */
    reset(): void {
        this.hide()
        this.animTime = 0
        this.upgradeableSkills = []
        this.currentLevel = 1
    }

    private createUI(): void {
        // Balatro green felt overlay
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: 0x3d6b59, alpha: 0.85 })
        this.screenContainer.addChild(bg)

        // Level up banner at top
        this.levelUpBanner = new Container()
        this.levelUpBanner.position.set(this.centerX, 50)
        this.levelUpBanner.scale.set(0)
        this.screenContainer.addChild(this.levelUpBanner)

        // Banner background - Balatro style with thick black border
        const bannerBg = new Graphics()
        const bannerW = 160
        const bannerH = 40
        bannerBg.moveTo(-bannerW / 2, 0)
        bannerBg.lineTo(-bannerW / 2 + 15, -bannerH / 2)
        bannerBg.lineTo(bannerW / 2 - 15, -bannerH / 2)
        bannerBg.lineTo(bannerW / 2, 0)
        bannerBg.lineTo(bannerW / 2 - 15, bannerH / 2)
        bannerBg.lineTo(-bannerW / 2 + 15, bannerH / 2)
        bannerBg.closePath()
        bannerBg.fill(0x374244)
        bannerBg.stroke({ color: 0x1a1a1a, width: 4 })
        this.levelUpBanner.addChild(bannerBg)

        // Level up text - Balatro gold
        this.levelUpWaveText = new WaveText({
            text: `LEVEL ${this.currentLevel}!`,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                fontWeight: 'bold',
                fill: 0xc9a227,
                dropShadow: {
                    color: 0x1a1a1a,
                    blur: 4,
                    distance: 0,
                    alpha: 0.5,
                },
            },
            amplitude: 3,
            frequency: 5,
            phaseOffset: 0.4,
            letterSpacing: 3,
        })
        this.levelUpBanner.addChild(this.levelUpWaveText)

        // Subtitle
        const subtitleText = new Text({
            text: '스킬을 선택하여 강화하세요',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fill: 0xffffff,
            }),
        })
        subtitleText.anchor.set(0.5)
        subtitleText.position.set(this.centerX, 85)
        this.screenContainer.addChild(subtitleText)

        // Skill cards - vertical list
        const cardWidth = this.width - 40
        const cardHeight = 70
        const cardGap = 12
        const startY = 110

        this.upgradeableSkills.forEach((skill, index) => {
            const skillDef = getSkillDefinition(skill.skillId)
            if (!skillDef) return

            const cardY = startY + index * (cardHeight + cardGap)
            const card = this.createSkillCard(skill, skillDef, cardWidth, cardHeight, index)
            card.position.set(this.centerX, cardY + cardHeight / 2)
            card.scale.set(0)
            card.alpha = 0
            this.screenContainer.addChild(card)

            this.skillButtons.push({ container: card, skill })
        })

        // If no skills to upgrade, show message and auto-continue
        if (this.upgradeableSkills.length === 0) {
            const noSkillText = new Text({
                text: '모든 스킬이 최대 레벨입니다!',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 16,
                    fill: 0xffffff,
                    fontWeight: 'bold',
                }),
            })
            noSkillText.anchor.set(0.5)
            noSkillText.position.set(this.centerX, this.centerY)
            this.screenContainer.addChild(noSkillText)

            // Auto continue after delay
            setTimeout(() => {
                this.onSelectionComplete?.()
            }, 1000)
        }
    }

    private createSkillCard(
        skill: PlayerSkill,
        skillDef: SkillDefinition,
        cardWidth: number,
        cardHeight: number,
        index: number
    ): Container {
        const container = new Container()

        // Card shadow - Balatro style
        const shadow = new Graphics()
        shadow.roundRect(-cardWidth / 2 + 3, -cardHeight / 2 + 5, cardWidth, cardHeight, 12)
        shadow.fill({ color: 0x1a1a1a, alpha: 0.4 })
        container.addChild(shadow)

        // Card background - Balatro dark panel with thick border
        const cardBg = new Graphics()
        cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)
        cardBg.fill(0x374244)
        cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 12)
        cardBg.stroke({ color: 0x1a1a1a, width: 4 })
        container.addChild(cardBg)

        // Skill icon (left side)
        const iconBg = new Graphics()
        iconBg.circle(-cardWidth / 2 + 35, 0, 22)
        iconBg.fill({ color: skillDef.color, alpha: 0.15 })
        iconBg.circle(-cardWidth / 2 + 35, 0, 22)
        iconBg.stroke({ color: skillDef.color, width: 2 })
        container.addChild(iconBg)

        const iconText = new Text({
            text: skillDef.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fill: skillDef.color,
            }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(-cardWidth / 2 + 35, 0)
        container.addChild(iconText)

        // Skill name - white text for dark background
        const nameText = new Text({
            text: skillDef.nameKo,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        nameText.anchor.set(0, 0.5)
        nameText.position.set(-cardWidth / 2 + 70, -15)
        container.addChild(nameText)

        // Level indicator
        const levelText = new Text({
            text: `Lv.${skill.level}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: skillDef.color,
            }),
        })
        levelText.anchor.set(0, 0.5)
        levelText.position.set(-cardWidth / 2 + 70 + nameText.width + 8, -15)
        container.addChild(levelText)

        // Current effect - lighter text for dark background
        const currentEffect = getCurrentLevelDescription(skill.skillId, skill.level)
        const currentText = new Text({
            text: currentEffect,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: 0xaaaaaa,
            }),
        })
        currentText.anchor.set(0, 0.5)
        currentText.position.set(-cardWidth / 2 + 70, 8)
        container.addChild(currentText)

        // Next level preview (right side)
        const nextLevel = skill.level + 1
        const isMaxLevel = nextLevel > skillDef.maxLevel
        const _nextEffect = isMaxLevel ? 'MAX' : getNextLevelDescription(skill.skillId, skill.level)

        const nextContainer = new Container()
        nextContainer.position.set(cardWidth / 2 - 50, 0)
        container.addChild(nextContainer)

        const arrowText = new Text({
            text: '→',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fill: isMaxLevel ? 0x666666 : 0xc9a227,
            }),
        })
        arrowText.anchor.set(0.5)
        arrowText.position.set(-30, -8)
        nextContainer.addChild(arrowText)

        const nextLevelText = new Text({
            text: isMaxLevel ? 'MAX' : `Lv.${nextLevel}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fontWeight: 'bold',
                fill: isMaxLevel ? 0xc9a227 : 0x4a9eff,
            }),
        })
        nextLevelText.anchor.set(0.5)
        nextLevelText.position.set(10, -8)
        nextContainer.addChild(nextLevelText)

        // Make interactive
        container.eventMode = 'static'
        container.cursor = 'pointer'
        container.on('pointerdown', () => this.handleSkillSelect(index))

        // Hover effect - lighter panel on hover
        container.on('pointerover', () => {
            cardBg.tint = 0x4a5658
        })
        container.on('pointerout', () => {
            cardBg.tint = 0xffffff
        })

        return container
    }

    private handleSkillSelect(index: number): void {
        const skill = this.upgradeableSkills[index]
        if (!skill) return

        const def = getSkillDefinition(skill.skillId)
        if (!def || skill.level >= def.maxLevel) return

        const newLevel = skill.level + 1
        this.onSkillSelected?.(skill, newLevel)
        this.onSelectionComplete?.()
    }
}
