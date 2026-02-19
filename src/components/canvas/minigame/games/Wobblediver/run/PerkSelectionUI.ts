/**
 * PerkSelectionUI.ts - PixiJS UI for perk selection after stage completion
 *
 * Displays 3 perk cards for the player to choose from.
 * Styled to match the Wobblediver abyss theme.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { PerkDefinition } from './PerkConfig'
import i18n from '@/i18n'

// Abyss theme colors
const ABYSS = {
    bgDark: 0x0a0510,
    bgCard: 0x1a1025,
    bgCardHover: 0x2a1a35,
    border: 0x3a2a4a,
    borderHighlight: 0x6a4a8a,
    text: 0xccbbdd,
    textMuted: 0x8877aa,
    gold: 0xc9a227,
    purple: 0x9b59b6,
    cyan: 0x4ecdc4,
    red: 0xe85d4c,
}

// Rarity colors
const RARITY_COLORS = {
    common: 0x8899aa,
    rare: 0x5588dd,
    legendary: 0xffaa00,
}

const RARITY_GLOW = {
    common: 0x667788,
    rare: 0x3366bb,
    legendary: 0xff8800,
}

interface PerkCardData {
    container: Container
    graphics: Graphics
    perk: PerkDefinition
    index: number
    // Animation state
    targetX: number
    targetY: number
    startX: number
    startY: number
    startRotation: number
    landed: boolean
    bouncePhase: number
}

interface PerkSelectionUIOptions {
    width: number
    height: number
    onPerkSelected: (perkId: string) => void
}

export class PerkSelectionUI {
    public container: Container
    private options: PerkSelectionUIOptions
    private cards: PerkCardData[] = []
    private backgroundGraphics: Graphics
    private titleText: Text
    private subtitleText: Text
    private animationTime = 0
    private isVisible = false
    private selectedIndex = -1

    constructor(options: PerkSelectionUIOptions) {
        this.options = options
        this.container = new Container()
        this.container.visible = false

        // Background overlay
        this.backgroundGraphics = new Graphics()
        this.container.addChild(this.backgroundGraphics)

        // Title - positioned at top
        this.titleText = new Text({
            text: i18n.t('wobblediver.perkSelection.title'),
            style: new TextStyle({
                fontFamily: 'Arial Black, sans-serif',
                fontSize: 20,
                fontWeight: 'bold',
                fill: ABYSS.gold,
                stroke: { color: ABYSS.bgDark, width: 3 },
                letterSpacing: 2,
            }),
        })
        this.titleText.anchor.set(0.5)
        this.titleText.position.set(options.width / 2, 60)
        this.container.addChild(this.titleText)

        // Subtitle
        this.subtitleText = new Text({
            text: i18n.t('wobblediver.perkSelection.subtitle'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fill: ABYSS.textMuted,
            }),
        })
        this.subtitleText.anchor.set(0.5)
        this.subtitleText.position.set(options.width / 2, 85)
        this.container.addChild(this.subtitleText)

        this.drawBackground()
    }

    private drawBackground(): void {
        const g = this.backgroundGraphics
        g.clear()

        // Dark overlay
        g.rect(0, 0, this.options.width, this.options.height)
        g.fill({ color: ABYSS.bgDark, alpha: 0.95 })

        // Subtle gradient effect at edges
        const edgeWidth = 40
        for (let i = 0; i < edgeWidth; i++) {
            const alpha = 0.3 * (1 - i / edgeWidth)
            g.rect(i, 0, 1, this.options.height)
            g.fill({ color: 0x2a1a3a, alpha })
            g.rect(this.options.width - i - 1, 0, 1, this.options.height)
            g.fill({ color: 0x2a1a3a, alpha })
        }
    }

    /**
     * Show the perk selection UI with given options
     */
    public show(perks: PerkDefinition[]): void {
        this.isVisible = true
        this.container.visible = true
        this.selectedIndex = -1
        this.animationTime = 0

        // Clear existing cards
        for (const card of this.cards) {
            this.container.removeChild(card.container)
            card.container.destroy({ children: true })
        }
        this.cards = []

        // Create new cards - VERTICAL layout for mobile portrait
        const cardWidth = Math.min(280, this.options.width - 40)
        const cardHeight = 70
        const cardGap = 12
        const totalHeight = perks.length * cardHeight + (perks.length - 1) * cardGap
        const titleAreaHeight = 100 // Space for title and subtitle
        const availableHeight = this.options.height - titleAreaHeight
        const finalStartY = titleAreaHeight + (availableHeight - totalHeight) / 2
        const finalX = this.options.width / 2

        // Define entry directions for each card (슝슝슝 effect) - from sides
        const entryDirections = [
            { x: -250, y: 0, rotation: -0.5 }, // First card from left
            { x: 250, y: 0, rotation: 0.5 }, // Second card from right
            { x: -250, y: 0, rotation: -0.5 }, // Third card from left
        ]

        perks.forEach((perk, index) => {
            const card = this.createPerkCard(perk, index, cardWidth, cardHeight)

            // Calculate final position - vertical stack
            const targetX = finalX
            const targetY = finalStartY + index * (cardHeight + cardGap) + cardHeight / 2

            // Get entry direction (cycle if more than 3 cards)
            const entry = entryDirections[index % entryDirections.length]

            // Start position (off-screen with offset)
            const startX = targetX + entry.x + (Math.random() - 0.5) * 50
            const startY = entry.y + (Math.random() - 0.5) * 30
            const startRotation = entry.rotation + (Math.random() - 0.5) * 0.3

            // Store animation data
            card.targetX = targetX
            card.targetY = targetY
            card.startX = startX
            card.startY = startY
            card.startRotation = startRotation
            card.landed = false
            card.bouncePhase = 0

            // Set initial position (off-screen)
            card.container.position.set(startX, startY)
            card.container.rotation = startRotation
            card.container.alpha = 0
            card.container.pivot.set(cardWidth / 2, cardHeight / 2)

            this.container.addChild(card.container)
            this.cards.push(card)
        })
    }

    /**
     * Hide the perk selection UI
     */
    public hide(): void {
        this.isVisible = false
        this.container.visible = false
    }

    /**
     * Create a single perk card - HORIZONTAL layout (icon left, text right)
     */
    private createPerkCard(
        perk: PerkDefinition,
        index: number,
        width: number,
        height: number
    ): PerkCardData {
        const cardContainer = new Container()
        cardContainer.eventMode = 'static'
        cardContainer.cursor = 'pointer'

        const graphics = new Graphics()
        cardContainer.addChild(graphics)

        // Draw card base
        this.drawCard(graphics, perk, width, height, false)

        const iconAreaWidth = 60
        const textStartX = iconAreaWidth + 10

        // Icon (emoji) - left side
        const iconText = new Text({
            text: perk.icon,
            style: new TextStyle({
                fontSize: 32,
            }),
        })
        iconText.anchor.set(0.5)
        iconText.position.set(iconAreaWidth / 2, height / 2)
        cardContainer.addChild(iconText)

        // Rarity indicator - small badge near icon
        const rarityText = new Text({
            text: perk.rarity.charAt(0).toUpperCase(),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 9,
                fontWeight: 'bold',
                fill: RARITY_COLORS[perk.rarity],
            }),
        })
        rarityText.anchor.set(0.5)
        rarityText.position.set(iconAreaWidth / 2, height - 12)
        cardContainer.addChild(rarityText)

        // Name - right side, top (use i18n)
        const nameText = new Text({
            text: i18n.t(perk.nameKey),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: ABYSS.text,
            }),
        })
        nameText.anchor.set(0, 0.5)
        nameText.position.set(textStartX, height / 2 - 12)
        cardContainer.addChild(nameText)

        // Description - right side, bottom (use i18n)
        const descText = new Text({
            text: i18n.t(perk.descriptionKey),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 11,
                fill: ABYSS.textMuted,
            }),
        })
        descText.anchor.set(0, 0.5)
        descText.position.set(textStartX, height / 2 + 12)
        cardContainer.addChild(descText)

        // Interaction
        cardContainer.on('pointerover', () => {
            this.drawCard(graphics, perk, width, height, true)
        })

        cardContainer.on('pointerout', () => {
            this.drawCard(graphics, perk, width, height, false)
        })

        cardContainer.on('pointertap', () => {
            if (this.selectedIndex >= 0) return // Already selected

            this.selectedIndex = index
            this.animateSelection(index)

            // Delay callback to allow animation
            setTimeout(() => {
                this.options.onPerkSelected(perk.id)
            }, 400)
        })

        return {
            container: cardContainer,
            graphics,
            perk,
            index,
            // Animation state (will be set in show())
            targetX: 0,
            targetY: 0,
            startX: 0,
            startY: 0,
            startRotation: 0,
            landed: false,
            bouncePhase: 0,
        }
    }

    /**
     * Draw a card's graphics - HORIZONTAL layout
     */
    private drawCard(
        g: Graphics,
        perk: PerkDefinition,
        width: number,
        height: number,
        isHovered: boolean
    ): void {
        g.clear()

        const rarityColor = RARITY_COLORS[perk.rarity]
        const glowColor = RARITY_GLOW[perk.rarity]
        const bgColor = isHovered ? ABYSS.bgCardHover : ABYSS.bgCard
        const borderColor = isHovered ? ABYSS.borderHighlight : ABYSS.border

        // Outer glow for rare/legendary
        if (perk.rarity !== 'common') {
            const glowSize = isHovered ? 5 : 3
            g.roundRect(-glowSize, -glowSize, width + glowSize * 2, height + glowSize * 2, 10)
            g.fill({ color: glowColor, alpha: isHovered ? 0.4 : 0.2 })
        }

        // Card background
        g.roundRect(0, 0, width, height, 8)
        g.fill({ color: bgColor })
        g.stroke({ color: borderColor, width: 2 })

        // Left accent bar (rarity color) - vertical stripe on icon area
        g.roundRect(4, 8, 3, height - 16, 1.5)
        g.fill({ color: rarityColor, alpha: isHovered ? 1 : 0.7 })
    }

    /**
     * Animate the selection of a card
     */
    private animateSelection(selectedIndex: number): void {
        // Scale up selected, fade out others
        for (const card of this.cards) {
            if (card.index === selectedIndex) {
                // Selected card - pulse effect
                this.animateCard(card, 'selected')
            } else {
                // Other cards - fade out
                this.animateCard(card, 'dismissed')
            }
        }
    }

    /**
     * Animate a single card
     */
    private animateCard(card: PerkCardData, type: 'selected' | 'dismissed'): void {
        const startTime = performance.now()
        const duration = 300

        const animate = () => {
            const elapsed = performance.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3) // Ease out cubic

            if (type === 'selected') {
                card.container.scale.set(1 + eased * 0.1)
                // Glow effect handled by redraw
            } else {
                card.container.alpha = 1 - eased * 0.7
                card.container.scale.set(1 - eased * 0.1)
            }

            if (progress < 1) {
                requestAnimationFrame(animate)
            }
        }

        requestAnimationFrame(animate)
    }

    /**
     * Update animation (called every frame)
     */
    public update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animationTime += deltaSeconds

        // 슝슝슝 entrance animation for cards
        for (let i = 0; i < this.cards.length; i++) {
            const card = this.cards[i]

            // Skip if already selected
            if (this.selectedIndex >= 0) continue

            // Staggered delay for each card (슝... 슝... 슝...)
            const delay = i * 0.15
            const flyDuration = 0.4 // Time to fly in
            const bounceDuration = 0.3 // Time for bounce settle

            const timeSinceStart = this.animationTime - delay

            if (timeSinceStart < 0) {
                // Not started yet
                card.container.alpha = 0
                continue
            }

            if (timeSinceStart < flyDuration) {
                // Flying in phase
                const flyProgress = timeSinceStart / flyDuration

                // Ease out back for overshoot effect
                const overshoot = 1.2
                const eased = 1 - Math.pow(1 - flyProgress, 2) * (1 + overshoot * (1 - flyProgress))

                // Interpolate position
                card.container.x = card.startX + (card.targetX - card.startX) * eased
                card.container.y = card.startY + (card.targetY - card.startY) * eased

                // Rotation settles to 0
                card.container.rotation = card.startRotation * (1 - eased)

                // Fade in quickly
                card.container.alpha = Math.min(1, flyProgress * 3)

                // Scale slightly during flight (whoosh effect)
                const scaleWhoosh = 1 + Math.sin(flyProgress * Math.PI) * 0.15
                card.container.scale.set(scaleWhoosh)
            } else if (!card.landed) {
                // Just landed - start bounce
                card.landed = true
                card.bouncePhase = 0
                card.container.x = card.targetX
                card.container.y = card.targetY
                card.container.rotation = 0
                card.container.alpha = 1
            }

            if (card.landed) {
                // Bounce settle phase
                card.bouncePhase += deltaSeconds

                if (card.bouncePhase < bounceDuration) {
                    // Damped oscillation for bounce
                    const bounceProgress = card.bouncePhase / bounceDuration
                    const damping = Math.exp(-bounceProgress * 4)
                    const oscillation = Math.sin(bounceProgress * Math.PI * 3) * damping

                    // Apply bounce to scale and slight Y offset
                    const bounceScale = 1 + oscillation * 0.08
                    const bounceY = oscillation * 5

                    card.container.scale.set(bounceScale)
                    card.container.y = card.targetY + bounceY
                } else {
                    // Settled - subtle floating animation
                    card.container.scale.set(1)
                    const floatOffset = Math.sin(this.animationTime * 2 + i * 0.7) * 3
                    card.container.y = card.targetY + floatOffset
                }
            }
        }

        // Title pulse
        const titlePulse = 1 + Math.sin(this.animationTime * 3) * 0.02
        this.titleText.scale.set(titlePulse)
    }

    /**
     * Check if a point is within any card (for touch handling)
     */
    public handleTap(x: number, y: number): boolean {
        if (!this.isVisible || this.selectedIndex >= 0) return false

        for (const card of this.cards) {
            const bounds = card.container.getBounds()
            if (
                x >= bounds.x &&
                x <= bounds.x + bounds.width &&
                y >= bounds.y &&
                y <= bounds.y + bounds.height
            ) {
                // Trigger the card's tap event with a dummy event object
                card.container.emit('pointertap', { type: 'pointertap' } as any)
                return true
            }
        }

        return false
    }

    /**
     * Destroy the UI and clean up resources
     */
    public destroy(): void {
        for (const card of this.cards) {
            card.container.destroy({ children: true })
        }
        this.cards = []
        this.container.destroy({ children: true })
    }
}
