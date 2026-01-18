import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import {
    PlayerSkill,
    LegacySkillDefinition as SkillDefinition,
    getSkillDefinition,
    SKILL_DEFINITIONS,
    getPlayerTags,
    arePrerequisitesMet,
} from '../skills'
import { MAX_SKILLS } from '../types'
import { easeOutBack } from '../utils'
import { WaveText } from '../../WaveText'
import { t } from '@/utils/localization'
import {
    BALATRO_COLORS,
    BALATRO_DESIGN,
    drawBalatroCard,
    drawBalatroBadge,
    drawCornerDots,
} from './BalatroButton'

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
    targetY: number // Animation target Y position
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
    private decorDots: Graphics | null = null

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
     * Limits total skills to MAX_SKILLS (10) - won't offer new skills if at limit
     * At level 1, only base skills are offered (initial skill selection)
     * Modifier skills only appear when prerequisites are met
     */
    private pickRandomSkills(count: number): Array<{ skillId: string; currentLevel: number }> {
        // Get all unlocked skills, or all skills if none unlocked
        const pool =
            this.unlockedSkillIds.length > 0
                ? this.unlockedSkillIds
                : Object.keys(SKILL_DEFINITIONS)

        // Count current unique skills
        const currentSkillCount = this.currentSkills.size
        const atSkillLimit = currentSkillCount >= MAX_SKILLS

        // At level 1, only offer base skills for initial selection
        const isInitialSelection = this.currentLevel === 1 && currentSkillCount === 0

        // Starter skills: base skills that provide core functionality
        // These are active skills that can work independently
        const STARTER_SKILL_IDS = [
            'kinetic-shot', // 운동 탄환 - base projectile (enables projectile modifiers)
            'centripetal-pulse', // 원심력 펄스 - shockwave damage + knockback
            'wave-pulse', // 파동 펄스 - expanding wave damage
            'plasma-discharge', // 플라즈마 방전 - lightning laser damage
        ]

        // Get current player tags for prerequisite checking
        const currentSkillsArray: PlayerSkill[] = Array.from(this.currentSkills.entries()).map(
            ([skillId, level]) => ({ skillId, level })
        )
        const playerTags = getPlayerTags(currentSkillsArray)

        // Filter to skills that can be added or upgraded
        const available = pool.filter((id) => {
            const def = getSkillDefinition(id)
            if (!def) return false
            const currentLevel = this.currentSkills.get(id) || 0

            // If at max level, can't upgrade further
            if (currentLevel >= def.maxLevel) return false

            // If at skill limit and this is a new skill, don't include it
            if (atSkillLimit && currentLevel === 0) return false

            // At level 1 (initial selection), only allow starter skills
            if (isInitialSelection) {
                if (!STARTER_SKILL_IDS.includes(id)) return false
            } else {
                // For non-initial selection, check prerequisites
                // If skill has requirements, check if player has the required tags
                if (!arePrerequisitesMet(id, playerTags)) return false
            }

            return true
        })

        // Shuffle and pick
        const shuffled = [...available].sort(() => Math.random() - 0.5)
        const picked = shuffled.slice(0, count)

        return picked.map((skillId) => ({
            skillId,
            currentLevel: this.currentSkills.get(skillId) || 0,
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
        this.skillCards.forEach((card, i) => {
            const delay = 0.15 + i * 0.1
            const duration = 0.4
            const progress = Math.max(0, Math.min(1, (this.animTime - delay) / duration))
            const targetY = card.targetY

            if (progress < 1) {
                const eased = easeOutBack(progress)
                // Deal from above target position
                const startY = targetY - 150
                card.container.position.y = startY + (targetY - startY) * eased
                card.container.alpha = progress
                card.container.scale.set(0.8 + 0.2 * eased)
            } else {
                card.container.position.y = targetY
                card.container.alpha = 1
                card.container.scale.set(1)
            }

            // Hover wobble effect
            if (card.isHovered && progress >= 1) {
                const wobble = Math.sin(this.animTime * 8) * 0.02
                card.container.scale.set(1.05 + wobble)
            }
        })

        // Animate decorative dots
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
        this.currentLevel = 1
        this.currentSkills.clear()
    }

    private createUI(candidates: Array<{ skillId: string; currentLevel: number }>): void {
        // Dark background with Balatro feel
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill({ color: BALATRO_COLORS.bgDark, alpha: 0.95 })
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

        // Main card container for the selection area
        const mainCardWidth = Math.min(360, this.width - 30)
        const mainCardHeight = 300
        const mainCardX = this.centerX - mainCardWidth / 2
        const mainCardY = this.centerY - mainCardHeight / 2

        // Main card background
        const mainCard = new Graphics()
        drawBalatroCard(mainCard, mainCardX, mainCardY, mainCardWidth, mainCardHeight, {
            bgColor: BALATRO_COLORS.bgCard,
            borderColor: BALATRO_COLORS.gold,
            borderWidth: BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusLarge,
        })
        this.screenContainer.addChild(mainCard)

        // Decorative corner dots
        this.decorDots = new Graphics()
        drawCornerDots(this.decorDots, mainCardX, mainCardY, mainCardWidth, mainCardHeight)
        this.screenContainer.addChild(this.decorDots)

        // Level up banner - positioned above main card
        this.levelUpBanner = new Container()
        this.levelUpBanner.position.set(this.centerX, mainCardY - 8)
        this.levelUpBanner.scale.set(0)
        this.screenContainer.addChild(this.levelUpBanner)

        // Banner background - Balatro style badge
        const bannerW = 160
        const bannerH = 36
        const bannerBg = new Graphics()
        drawBalatroBadge(
            bannerBg,
            -bannerW / 2,
            -bannerH / 2,
            bannerW,
            bannerH,
            BALATRO_COLORS.gold
        )
        this.levelUpBanner.addChild(bannerBg)

        // Level up text - Black on gold
        this.levelUpWaveText = new WaveText({
            text: `LEVEL ${this.currentLevel}`,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: 0x000000,
                letterSpacing: BALATRO_DESIGN.letterSpacing,
            },
            amplitude: 2,
            frequency: 4,
            phaseOffset: 0.3,
            letterSpacing: 3,
        })
        this.levelUpBanner.addChild(this.levelUpWaveText)

        // Subtitle - inside main card
        const subtitleText = new Text({
            text: 'Choose a skill to upgrade',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fill: BALATRO_COLORS.textSecondary,
                letterSpacing: 1,
            }),
        })
        subtitleText.anchor.set(0.5)
        subtitleText.position.set(this.centerX, mainCardY + 35)
        this.screenContainer.addChild(subtitleText)

        // Card layout - 3 cards horizontal
        const cardWidth = 100
        const cardHeight = 220
        const cardGap = 10
        const totalWidth = candidates.length * cardWidth + (candidates.length - 1) * cardGap
        const startX = this.centerX - totalWidth / 2 + cardWidth / 2
        const cardCenterY = mainCardY + 50 + cardHeight / 2 // Position cards inside main card

        candidates.forEach((candidate, index) => {
            const def = getSkillDefinition(candidate.skillId)
            if (!def) return

            const cardContainer = new Container()
            cardContainer.position.set(startX + index * (cardWidth + cardGap), cardCenterY)
            cardContainer.alpha = 0
            this.screenContainer.addChild(cardContainer)

            const card = this.createSkillCard(
                candidate.skillId,
                candidate.currentLevel,
                def,
                cardWidth,
                cardHeight,
                index
            )
            cardContainer.addChild(card.container)

            this.skillCards.push({
                ...card,
                container: cardContainer,
                targetY: cardCenterY,
            })
        })

        // If no candidates, show message
        if (candidates.length === 0) {
            const noSkillCard = new Graphics()
            drawBalatroCard(noSkillCard, this.centerX - 120, this.centerY - 40, 240, 80, {
                borderColor: BALATRO_COLORS.textMuted,
            })
            this.screenContainer.addChild(noSkillCard)

            const noSkillText = new Text({
                text: 'All skills at max level!',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 14,
                    fill: BALATRO_COLORS.textPrimary,
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

    private createSkillCard(
        skillId: string,
        currentLevel: number,
        def: SkillDefinition,
        cardWidth: number,
        cardHeight: number,
        _index: number
    ): {
        container: Container
        cardBg: Graphics
        skillId: string
        currentLevel: number
        def: SkillDefinition
        isHovered: boolean
    } {
        const container = new Container()

        // Determine if this is a base skill (has tags) or modifier skill (has requires)
        const isBaseSkill = def.tags && def.tags.length > 0
        const isModifierSkill = def.requires && def.requires.length > 0

        // Base skill gets special glow effect
        if (isBaseSkill) {
            const glow = new Graphics()
            glow.roundRect(
                -cardWidth / 2 - 4,
                -cardHeight / 2 - 4,
                cardWidth + 8,
                cardHeight + 8,
                BALATRO_DESIGN.radiusMedium + 2
            )
            glow.fill({ color: BALATRO_COLORS.gold, alpha: 0.3 })
            container.addChild(glow)
        }

        // Card background with Balatro style
        const cardBg = new Graphics()
        const borderColor = isBaseSkill ? BALATRO_COLORS.gold : def.color
        drawBalatroCard(cardBg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, {
            bgColor: isBaseSkill ? 0x1f1a2e : BALATRO_COLORS.bgCard, // Slightly purple tint for base
            borderColor: borderColor,
            borderWidth: isBaseSkill ? 4 : BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusMedium,
        })
        container.addChild(cardBg)

        // Top banner with skill type indicator
        const isNewSkill = currentLevel === 0
        const nextLevel = currentLevel + 1

        // Banner color based on skill type and state
        let bannerColor: number
        let bannerText: string

        if (isBaseSkill) {
            bannerColor = BALATRO_COLORS.gold // Gold for base skills
            bannerText = isNewSkill ? '⭐ 기본' : `⭐ Lv.${nextLevel}`
        } else if (isModifierSkill) {
            bannerColor = BALATRO_COLORS.cyan // Cyan for modifier skills
            bannerText = isNewSkill ? '🔗 강화' : `🔗 Lv.${nextLevel}`
        } else {
            bannerColor = isNewSkill ? BALATRO_COLORS.green : BALATRO_COLORS.blue
            bannerText = isNewSkill ? 'NEW!' : `Lv.${currentLevel} → ${nextLevel}`
        }

        const topBanner = new Graphics()
        topBanner.roundRect(-cardWidth / 2 + 6, -cardHeight / 2 + 8, cardWidth - 12, 24, 4)
        topBanner.fill(bannerColor)
        topBanner.roundRect(-cardWidth / 2 + 6, -cardHeight / 2 + 8, cardWidth - 12, 24, 4)
        topBanner.stroke({ color: BALATRO_COLORS.border, width: 2 })
        container.addChild(topBanner)

        const levelLabel = new Text({
            text: bannerText,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fontWeight: 'bold',
                fill: bannerColor === BALATRO_COLORS.gold ? 0x000000 : 0xffffff,
            }),
        })
        levelLabel.anchor.set(0.5)
        levelLabel.position.set(0, -cardHeight / 2 + 20)
        container.addChild(levelLabel)

        // Skill icon (centered in upper area) - style based on skill type
        const iconY = -35
        const iconColor = isBaseSkill
            ? BALATRO_COLORS.gold
            : isModifierSkill
              ? BALATRO_COLORS.cyan
              : def.color
        const iconBg = new Graphics()

        // Base skills get a star burst effect behind icon
        if (isBaseSkill) {
            // Outer glow ring
            iconBg.circle(0, iconY, 36)
            iconBg.fill({ color: BALATRO_COLORS.gold, alpha: 0.15 })
        }

        iconBg.circle(0, iconY, 30)
        iconBg.fill({ color: iconColor, alpha: 0.2 })
        iconBg.circle(0, iconY, 30)
        iconBg.stroke({ color: iconColor, width: isBaseSkill ? 3 : 2 })
        container.addChild(iconBg)

        const iconText = new Text({
            text: def.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fill: iconColor,
            }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(0, iconY)
        container.addChild(iconText)

        // Skill name (centered)
        const nameText = new Text({
            text: t(def.name, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fontWeight: 'bold',
                fill: BALATRO_COLORS.textPrimary,
                wordWrap: true,
                wordWrapWidth: cardWidth - 14,
                align: 'center',
            }),
        })
        nameText.anchor.set(0.5)
        nameText.position.set(0, 15)
        container.addChild(nameText)

        // Short description
        const descText = new Text({
            text: t(def.description, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fill: BALATRO_COLORS.textSecondary,
                wordWrap: true,
                wordWrapWidth: cardWidth - 16,
                align: 'center',
                lineHeight: 14,
            }),
        })
        descText.anchor.set(0.5, 0)
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
            // Highlight effect - brighter version of original style
            cardBg.clear()
            drawBalatroCard(cardBg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, {
                bgColor: isBaseSkill ? 0x2a2540 : BALATRO_COLORS.bgCardLight,
                borderColor: BALATRO_COLORS.gold,
                borderWidth: isBaseSkill ? 4 : BALATRO_DESIGN.borderWidth,
                radius: BALATRO_DESIGN.radiusMedium,
            })
        })
        container.on('pointerout', () => {
            cardData.isHovered = false
            // Restore original style based on skill type
            cardBg.clear()
            drawBalatroCard(cardBg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, {
                bgColor: isBaseSkill ? 0x1f1a2e : BALATRO_COLORS.bgCard,
                borderColor: borderColor,
                borderWidth: isBaseSkill ? 4 : BALATRO_DESIGN.borderWidth,
                radius: BALATRO_DESIGN.radiusMedium,
            })
            // Reset scale when not hovered
            const card = this.skillCards.find((c) => c.skillId === skillId)
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
