import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import {
    PlayerSkill,
    SkillDefinition,
    getSkillDefinition,
    SKILL_DEFINITIONS,
} from '../skills'
import { easeOutBack } from '../utils'
import { WaveText } from '../../WaveText'
import { t } from '@/utils/localization'

export interface SkillSelectionContext {
    container: Container
    width: number
    height: number
}

interface SkillCard {
    container: Container
    skillId: string
    currentLevel: number // 0 = new skill, 1-4 = existing skill to upgrade
    def: SkillDefinition
    cardBg: Graphics
    isHovered: boolean
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
    private skillCards: SkillCard[] = []

    // Animation state
    private animTime = 0
    private isVisible = false
    private currentLevel = 1

    // Skill pool for selection
    private unlockedSkillIds: string[] = []
    private currentSkills: Map<string, number> = new Map() // skillId -> level

    // Callbacks
    onSkillSelected?: (skillId: string, newLevel: number) => void
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
     * Set the pool of unlocked skills (from character/collection)
     */
    setUnlockedSkills(skillIds: string[]): void {
        this.unlockedSkillIds = skillIds
    }

    /**
     * Set current skills the player has (for upgrade display)
     */
    setCurrentSkills(skills: PlayerSkill[]): void {
        this.currentSkills.clear()
        for (const skill of skills) {
            this.currentSkills.set(skill.skillId, skill.level)
        }
    }

    /**
     * Show the skill selection screen with 3 random skill cards
     */
    show(skills: PlayerSkill[], level: number): void {
        this.isVisible = true
        this.animTime = 0
        this.currentLevel = level
        this.screenContainer.visible = true
        this.setCurrentSkills(skills)

        // Clear previous
        this.screenContainer.removeChildren()
        this.skillCards = []

        // Pick 3 random skills from pool
        const candidates = this.pickRandomSkills(3)

        this.createUI(candidates)

        // Trigger impact effect
        this.onImpact?.(this.centerX, this.centerY)
    }

    /**
     * Pick N random skills from the unlocked pool
     * Prioritizes skills that can be upgraded (not at max level)
     */
    private pickRandomSkills(count: number): Array<{ skillId: string; currentLevel: number }> {
        // Get all unlocked skills, or all skills if none unlocked
        const pool = this.unlockedSkillIds.length > 0
            ? this.unlockedSkillIds
            : Object.keys(SKILL_DEFINITIONS)

        // Filter to skills that can be added or upgraded
        const available = pool.filter(id => {
            const def = getSkillDefinition(id)
            if (!def) return false
            const currentLevel = this.currentSkills.get(id) || 0
            return currentLevel < def.maxLevel
        })

        // Shuffle and pick
        const shuffled = [...available].sort(() => Math.random() - 0.5)
        const picked = shuffled.slice(0, count)

        return picked.map(skillId => ({
            skillId,
            currentLevel: this.currentSkills.get(skillId) || 0
        }))
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

        // Animate skill cards (deal from top with stagger)
        const cardTargetY = this.centerY + 20
        this.skillCards.forEach((card, i) => {
            const delay = 0.15 + i * 0.1
            const duration = 0.4
            const progress = Math.max(0, Math.min(1, (this.animTime - delay) / duration))

            if (progress < 1) {
                const eased = easeOutBack(progress)
                // Deal from above target position
                const startY = cardTargetY - 200
                card.container.position.y = startY + (cardTargetY - startY) * eased
                card.container.alpha = progress
                card.container.scale.set(0.8 + 0.2 * eased)
            } else {
                card.container.position.y = cardTargetY
                card.container.alpha = 1
                card.container.scale.set(1)
            }

            // Hover wobble effect
            if (card.isHovered && progress >= 1) {
                const wobble = Math.sin(this.animTime * 8) * 0.02
                card.container.scale.set(1.05 + wobble)
            }
        })
    }

    /**
     * Reset the screen
     */
    reset(): void {
        this.hide()
        this.animTime = 0
        this.currentLevel = 1
        this.currentSkills.clear()
    }

    private createUI(candidates: Array<{ skillId: string; currentLevel: number }>): void {
        // Dark space overlay
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: 0x0a0a1a, alpha: 0.92 })
        this.screenContainer.addChild(bg)

        // Stars in background
        this.drawStars(bg)

        // Level up banner - centered above cards
        this.levelUpBanner = new Container()
        this.levelUpBanner.position.set(this.centerX, this.centerY - 120)
        this.levelUpBanner.scale.set(0)
        this.screenContainer.addChild(this.levelUpBanner)

        // Banner background - Balatro style hexagonal
        const bannerBg = new Graphics()
        const bannerW = 180
        const bannerH = 45
        bannerBg.moveTo(-bannerW / 2, 0)
        bannerBg.lineTo(-bannerW / 2 + 20, -bannerH / 2)
        bannerBg.lineTo(bannerW / 2 - 20, -bannerH / 2)
        bannerBg.lineTo(bannerW / 2, 0)
        bannerBg.lineTo(bannerW / 2 - 20, bannerH / 2)
        bannerBg.lineTo(-bannerW / 2 + 20, bannerH / 2)
        bannerBg.closePath()
        bannerBg.fill(0x1a1a2e)
        bannerBg.stroke({ color: 0xc9a227, width: 3 })
        this.levelUpBanner.addChild(bannerBg)

        // Level up text - Gold
        this.levelUpWaveText = new WaveText({
            text: `LEVEL ${this.currentLevel}`,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: 0xc9a227,
                dropShadow: {
                    color: 0x000000,
                    blur: 4,
                    distance: 0,
                    alpha: 0.8,
                },
            },
            amplitude: 3,
            frequency: 5,
            phaseOffset: 0.4,
            letterSpacing: 4,
        })
        this.levelUpBanner.addChild(this.levelUpWaveText)

        // Subtitle - below banner, above cards
        const subtitleText = new Text({
            text: 'Choose a skill to upgrade',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fill: 0x88ccff,
            }),
        })
        subtitleText.anchor.set(0.5)
        subtitleText.position.set(this.centerX, this.centerY - 75)
        this.screenContainer.addChild(subtitleText)

        // Card layout - 3 cards horizontal (compact for mobile)
        const cardWidth = 85
        const cardHeight = 125
        const cardGap = 10
        const totalWidth = candidates.length * cardWidth + (candidates.length - 1) * cardGap
        const startX = this.centerX - totalWidth / 2 + cardWidth / 2

        candidates.forEach((candidate, index) => {
            const def = getSkillDefinition(candidate.skillId)
            if (!def) return

            const cardContainer = new Container()
            cardContainer.position.set(startX + index * (cardWidth + cardGap), this.centerY + 20)
            cardContainer.alpha = 0
            this.screenContainer.addChild(cardContainer)

            const card = this.createSkillCard(candidate.skillId, candidate.currentLevel, def, cardWidth, cardHeight, index)
            cardContainer.addChild(card.container)

            this.skillCards.push({
                ...card,
                container: cardContainer,
            })
        })

        // If no candidates, show message
        if (candidates.length === 0) {
            const noSkillText = new Text({
                text: 'All skills at max level!',
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

            setTimeout(() => {
                this.onSelectionComplete?.()
            }, 1000)
        }
    }

    private drawStars(bg: Graphics): void {
        // Simple procedural stars
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.width
            const y = Math.random() * this.height
            const size = Math.random() < 0.8 ? 1 : 2
            const alpha = 0.3 + Math.random() * 0.5
            bg.circle(x, y, size)
            bg.fill({ color: 0xffffff, alpha })
        }
    }

    private createSkillCard(
        skillId: string,
        currentLevel: number,
        def: SkillDefinition,
        cardWidth: number,
        cardHeight: number,
        index: number
    ): { container: Container; cardBg: Graphics; skillId: string; currentLevel: number; def: SkillDefinition; isHovered: boolean } {
        const container = new Container()

        // Card shadow
        const shadow = new Graphics()
        shadow.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 6, cardWidth, cardHeight, 8)
        shadow.fill({ color: 0x000000, alpha: 0.5 })
        container.addChild(shadow)

        // Card background - Balatro style with thick border
        const cardBg = new Graphics()
        // Main card
        cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8)
        cardBg.fill(0x1a1a2e)
        // Border
        cardBg.roundRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 8)
        cardBg.stroke({ color: def.color, width: 3 })
        // Inner highlight
        cardBg.roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight - 8, 6)
        cardBg.stroke({ color: 0x2a2a3e, width: 1 })
        container.addChild(cardBg)

        // Top banner with level
        const isNewSkill = currentLevel === 0
        const nextLevel = currentLevel + 1
        const topBanner = new Graphics()
        topBanner.roundRect(-cardWidth / 2 + 6, -cardHeight / 2 + 6, cardWidth - 12, 22, 4)
        topBanner.fill(isNewSkill ? 0x2e7d32 : 0x1565c0)
        container.addChild(topBanner)

        const levelLabel = new Text({
            text: isNewSkill ? 'NEW!' : `Lv.${currentLevel} → ${nextLevel}`,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: 0xffffff,
            }),
        })
        levelLabel.anchor.set(0.5)
        levelLabel.position.set(0, -cardHeight / 2 + 17)
        container.addChild(levelLabel)

        // Skill icon (centered, scaled for smaller card)
        const iconBg = new Graphics()
        iconBg.circle(0, -18, 22)
        iconBg.fill({ color: def.color, alpha: 0.2 })
        iconBg.circle(0, -18, 22)
        iconBg.stroke({ color: def.color, width: 2 })
        container.addChild(iconBg)

        const iconText = new Text({
            text: def.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 22,
                fill: def.color,
            }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(0, -18)
        container.addChild(iconText)

        // Skill name
        const nameText = new Text({
            text: t(def.name, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fill: 0xffffff,
                wordWrap: true,
                wordWrapWidth: cardWidth - 12,
                align: 'center',
            }),
        })
        nameText.anchor.set(0.5)
        nameText.position.set(0, 18)
        container.addChild(nameText)

        // Short description
        const descText = new Text({
            text: t(def.description, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 7,
                fill: 0xaaaaaa,
                wordWrap: true,
                wordWrapWidth: cardWidth - 12,
                align: 'center',
            }),
        })
        descText.anchor.set(0.5)
        descText.position.set(0, 38)
        container.addChild(descText)

        // Make interactive
        container.eventMode = 'static'
        container.cursor = 'pointer'

        const cardData = {
            container,
            cardBg,
            skillId,
            currentLevel,
            def,
            isHovered: false,
        }

        container.on('pointerdown', () => this.handleCardSelect(skillId, currentLevel))
        container.on('pointerover', () => {
            cardData.isHovered = true
            cardBg.tint = 0xcccccc
        })
        container.on('pointerout', () => {
            cardData.isHovered = false
            cardBg.tint = 0xffffff
            // Reset scale when not hovered
            const card = this.skillCards.find(c => c.skillId === skillId)
            if (card && this.animTime > 0.5) {
                card.container.scale.set(1)
            }
        })

        return cardData
    }

    private handleCardSelect(skillId: string, currentLevel: number): void {
        const def = getSkillDefinition(skillId)
        if (!def) return

        const newLevel = currentLevel + 1
        if (newLevel > def.maxLevel) return

        this.onSkillSelected?.(skillId, newLevel)
        this.onSelectionComplete?.()
    }
}
