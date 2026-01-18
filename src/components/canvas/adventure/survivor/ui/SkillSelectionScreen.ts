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
} from './BalatroButton'
import { HolographicFilter } from '@/components/canvas/filters/HolographicFilter'
import { getPhysicsCategory } from '../skills/types'

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
    isBaseSkill: boolean // Has tags (primary skill)
    sparkles?: Graphics // Sparkle effect container for base skills
    holoFilter?: HolographicFilter // Holographic filter for base skills
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

        // Clean up previous cards properly (remove event listeners, destroy filters)
        this.cleanupCards()
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

            // Update holographic filter for all cards
            if (card.holoFilter && progress >= 1) {
                card.holoFilter.time = this.animTime
            }

            // Sparkle animation only for base skills
            if (card.isBaseSkill && card.sparkles && progress >= 1) {
                this.drawSparkles(card.sparkles, this.animTime, 70, 100)
            }
        })

    }

    /**
     * Clean up skill cards - remove event listeners and destroy filters
     */
    private cleanupCards(): void {
        for (const card of this.skillCards) {
            // Remove event listeners
            card.container.removeAllListeners()

            // Destroy holographic filter
            if (card.holoFilter) {
                card.holoFilter.destroy()
            }

            // Destroy sparkles graphics
            if (card.sparkles) {
                card.sparkles.destroy()
            }
        }

        // Clean up wave text
        if (this.levelUpWaveText) {
            this.levelUpWaveText.destroy()
            this.levelUpWaveText = null
        }

        this.skillCards = []
    }

    /**
     * Reset the screen
     */
    reset(): void {
        this.cleanupCards()
        this.hide()
        this.animTime = 0
        this.currentLevel = 1
        this.currentSkills.clear()
    }

    /**
     * Destroy the screen and cleanup all resources
     */
    destroy(): void {
        this.cleanupCards()
        this.screenContainer.removeChildren()
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

        // Card layout dimensions
        const cardWidth = 100
        const cardHeight = 220
        const cardGap = 15
        const totalWidth = candidates.length * cardWidth + (candidates.length - 1) * cardGap
        const startX = this.centerX - totalWidth / 2 + cardWidth / 2
        const cardCenterY = this.centerY + 20 // Center cards vertically

        // Level up banner - positioned above cards
        this.levelUpBanner = new Container()
        this.levelUpBanner.position.set(this.centerX, cardCenterY - cardHeight / 2 - 50)
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

        // Subtitle - below banner
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
        subtitleText.position.set(this.centerX, cardCenterY - cardHeight / 2 - 15)
        this.screenContainer.addChild(subtitleText)

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
        isBaseSkill: boolean
        sparkles?: Graphics
        holoFilter?: HolographicFilter
    } {
        const container = new Container()

        // Determine if this is a base skill (has tags) or modifier skill (has requires)
        const isBaseSkill = !!(def.tags && def.tags.length > 0)
        const isModifierSkill = !!(def.requires && def.requires.length > 0)
        const isNewSkill = currentLevel === 0
        const nextLevel = currentLevel + 1

        // Get physics category for themed holographic effect
        const physicsCategory = getPhysicsCategory(def.formulaId)

        // Holographic filter and sparkle effect
        let sparkles: Graphics | undefined
        let holoFilter: HolographicFilter | undefined

        // Both base skills and modifier skills get holographic effects
        // Base skills: more vibrant, with sparkles and glow
        // Modifier skills: subtler holographic effect
        if (isBaseSkill) {
            sparkles = new Graphics()
            container.addChild(sparkles)

            // Outer glow for base skills
            const glow = new Graphics()
            glow.roundRect(
                -cardWidth / 2 - 6,
                -cardHeight / 2 - 6,
                cardWidth + 12,
                cardHeight + 12,
                BALATRO_DESIGN.radiusMedium + 4
            )
            glow.fill({ color: BALATRO_COLORS.gold, alpha: 0.25 })
            container.addChild(glow)
        }

        // Create holographic filter - Subtle Balatro style
        holoFilter = new HolographicFilter({
            theme: physicsCategory,
            isPrimary: isBaseSkill,
            rainbowIntensity: isBaseSkill ? 0.8 : 0.5,
            sparkleIntensity: isBaseSkill ? 0.4 : 0.2,
            sparkleSpeed: 1.5,
            shimmerSpeed: isBaseSkill ? 0.6 : 0.4,
            foilStrength: isBaseSkill ? 0.35 : 0.2,
        })
        holoFilter.setDimensions(cardWidth, cardHeight)

        // Card background - Balatro style dark purple/navy
        const cardBg = new Graphics()
        const borderColor = isBaseSkill ? BALATRO_COLORS.gold : isModifierSkill ? BALATRO_COLORS.cyan : def.color
        // Balatro-style dark backgrounds with slight color tint
        const bgColor = isBaseSkill ? 0x1e1a2e : isModifierSkill ? 0x1a2028 : BALATRO_COLORS.bgCard
        drawBalatroCard(cardBg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, {
            bgColor: bgColor,
            borderColor: borderColor,
            borderWidth: isBaseSkill ? 4 : isModifierSkill ? 3 : BALATRO_DESIGN.borderWidth,
            radius: BALATRO_DESIGN.radiusMedium,
        })
        container.addChild(cardBg)

        // Apply holographic filter to card background
        // All cards get holographic effect, but base skills are more vibrant
        if (holoFilter) {
            cardBg.filters = [holoFilter]
        }

        // NEW badge in top-left corner (for new skills only)
        if (isNewSkill) {
            const badgeWidth = 36
            const badgeHeight = 18
            const badgeX = -cardWidth / 2 + 8
            const badgeY = -cardHeight / 2 + 8

            const newBadge = new Graphics()
            // Badge shadow
            newBadge.roundRect(badgeX + 1, badgeY + 2, badgeWidth, badgeHeight, 4)
            newBadge.fill({ color: 0x000000, alpha: 0.3 })
            // Badge background
            newBadge.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 4)
            newBadge.fill(BALATRO_COLORS.green)
            newBadge.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 4)
            newBadge.stroke({ color: 0x1a5c2e, width: 2 })
            container.addChild(newBadge)

            const newText = new Text({
                text: 'NEW',
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: 0xffffff,
                }),
            })
            newText.anchor.set(0.5)
            newText.position.set(badgeX + badgeWidth / 2, badgeY + badgeHeight / 2)
            container.addChild(newText)
        }

        // Skill type badge in top-right corner
        const typeText = isBaseSkill ? '기본' : isModifierSkill ? '강화' : ''
        const typeColor = isBaseSkill ? BALATRO_COLORS.gold : BALATRO_COLORS.cyan
        const typeBgColor = isBaseSkill ? 0x3d2f00 : 0x0a3d4d

        if (typeText) {
            const typeBadgeWidth = 32
            const typeBadgeHeight = 16
            const typeBadgeX = cardWidth / 2 - typeBadgeWidth - 8
            const typeBadgeY = -cardHeight / 2 + 8

            const typeBadge = new Graphics()
            typeBadge.roundRect(typeBadgeX, typeBadgeY, typeBadgeWidth, typeBadgeHeight, 3)
            typeBadge.fill(typeBgColor)
            typeBadge.roundRect(typeBadgeX, typeBadgeY, typeBadgeWidth, typeBadgeHeight, 3)
            typeBadge.stroke({ color: typeColor, width: 1.5 })
            container.addChild(typeBadge)

            const typeLabel = new Text({
                text: typeText,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fontWeight: 'bold',
                    fill: typeColor,
                }),
            })
            typeLabel.anchor.set(0.5)
            typeLabel.position.set(typeBadgeX + typeBadgeWidth / 2, typeBadgeY + typeBadgeHeight / 2)
            container.addChild(typeLabel)
        }

        // Level indicator in center-top (only for upgrades)
        if (!isNewSkill) {
            const levelBadge = new Graphics()
            const lvBadgeWidth = 60
            const lvBadgeHeight = 18
            levelBadge.roundRect(-lvBadgeWidth / 2, -cardHeight / 2 + 6, lvBadgeWidth, lvBadgeHeight, 4)
            levelBadge.fill(BALATRO_COLORS.blue)
            levelBadge.stroke({ color: BALATRO_COLORS.border, width: 1.5 })
            container.addChild(levelBadge)

            const levelText = new Text({
                text: `Lv.${currentLevel} → ${nextLevel}`,
                style: new TextStyle({
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fontWeight: 'bold',
                    fill: 0xffffff,
                }),
            })
            levelText.anchor.set(0.5)
            levelText.position.set(0, -cardHeight / 2 + 15)
            container.addChild(levelText)
        }

        // Skill icon (centered in upper area)
        const iconY = -35
        const iconColor = isBaseSkill
            ? BALATRO_COLORS.gold
            : isModifierSkill
              ? BALATRO_COLORS.cyan
              : def.color
        const iconBg = new Graphics()

        // Base skills get a larger glowing ring behind icon
        if (isBaseSkill) {
            iconBg.circle(0, iconY, 40)
            iconBg.fill({ color: BALATRO_COLORS.gold, alpha: 0.15 })
        }

        // Icon background circle with stronger fill
        iconBg.circle(0, iconY, 30)
        iconBg.fill({ color: iconColor, alpha: 0.25 })
        iconBg.circle(0, iconY, 30)
        iconBg.stroke({ color: iconColor, width: isBaseSkill ? 3 : 2.5 })
        container.addChild(iconBg)

        const iconText = new Text({
            text: def.icon,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 30,
                fill: iconColor,
                dropShadow: {
                    color: 0x000000,
                    blur: 3,
                    distance: 1,
                    alpha: 0.5,
                },
            }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(0, iconY)
        container.addChild(iconText)

        // Skill name (centered) with shadow for readability
        const nameText = new Text({
            text: t(def.name, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0xffffff,
                wordWrap: true,
                wordWrapWidth: cardWidth - 14,
                align: 'center',
                dropShadow: {
                    color: 0x000000,
                    blur: 2,
                    distance: 1,
                    alpha: 0.8,
                },
            }),
        })
        nameText.anchor.set(0.5)
        nameText.position.set(0, 18)
        container.addChild(nameText)

        // Short description with shadow
        const descText = new Text({
            text: t(def.description, 'ko'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: 0xcccccc,
                wordWrap: true,
                wordWrapWidth: cardWidth - 14,
                align: 'center',
                lineHeight: 15,
                dropShadow: {
                    color: 0x000000,
                    blur: 2,
                    distance: 1,
                    alpha: 0.6,
                },
            }),
        })
        descText.anchor.set(0.5, 0)
        descText.position.set(0, 42)
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
            isBaseSkill,
            sparkles,
            holoFilter,
        }

        container.on('pointerdown', () => this.handleCardSelect(skillId, currentLevel))
        container.on('pointerover', () => {
            cardData.isHovered = true
            // Highlight effect - brighter Balatro style
            cardBg.clear()
            const hoverBgColor = isBaseSkill ? 0x2a2540 : isModifierSkill ? 0x252a35 : BALATRO_COLORS.bgCardLight
            drawBalatroCard(cardBg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, {
                bgColor: hoverBgColor,
                borderColor: BALATRO_COLORS.gold,
                borderWidth: isBaseSkill ? 5 : isModifierSkill ? 4 : 3,
                radius: BALATRO_DESIGN.radiusMedium,
            })
        })
        container.on('pointerout', () => {
            cardData.isHovered = false
            // Restore original style
            cardBg.clear()
            drawBalatroCard(cardBg, -cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, {
                bgColor: bgColor,
                borderColor: borderColor,
                borderWidth: isBaseSkill ? 4 : isModifierSkill ? 3 : BALATRO_DESIGN.borderWidth,
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

    /**
     * Draw sparkle effects for base skill cards
     */
    private drawSparkles(graphics: Graphics, time: number, width: number, height: number): void {
        graphics.clear()

        // Sparkle particles around the card
        const sparkleCount = 8
        for (let i = 0; i < sparkleCount; i++) {
            // Each sparkle has its own phase
            const phase = time * 2 + (i / sparkleCount) * Math.PI * 2
            const lifePhase = (Math.sin(phase) + 1) / 2 // 0 to 1

            // Position around the card edge
            const angle = (i / sparkleCount) * Math.PI * 2 + time * 0.5
            const radiusX = width + 5 + Math.sin(phase * 2) * 8
            const radiusY = height + 5 + Math.cos(phase * 2) * 8
            const x = Math.cos(angle) * radiusX
            const y = Math.sin(angle) * radiusY

            // Sparkle size pulsates
            const size = 2 + lifePhase * 3
            const alpha = lifePhase * 0.8

            // Draw diamond-shaped sparkle
            graphics.moveTo(x, y - size)
            graphics.lineTo(x + size * 0.5, y)
            graphics.lineTo(x, y + size)
            graphics.lineTo(x - size * 0.5, y)
            graphics.closePath()
            graphics.fill({ color: BALATRO_COLORS.gold, alpha })

            // Inner bright core
            if (lifePhase > 0.5) {
                const coreSize = size * 0.4
                graphics.circle(x, y, coreSize)
                graphics.fill({ color: 0xffffff, alpha: (lifePhase - 0.5) * 1.5 })
            }
        }

        // Central glow pulse
        const pulseAlpha = (Math.sin(time * 3) + 1) / 2 * 0.15
        graphics.circle(0, -30, 45)
        graphics.fill({ color: BALATRO_COLORS.gold, alpha: pulseAlpha })
    }
}
