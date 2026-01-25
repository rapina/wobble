/**
 * AnchorWobble.ts - Strange jellyfish friend/boss that pulses to swing the rope
 *
 * A mysterious bioluminescent jellyfish. It helps the player by swinging the rope,
 * but has limited patience. As patience decreases:
 * - Color shifts from calm purple → irritated orange → angry red
 * - Pulse speed increases (faster, more aggressive swinging)
 * - Expression becomes angrier
 * When patience reaches zero, it leaves (game over).
 *
 * It's both a helper and a boss - strange and unpredictable.
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { AnchorPersonalityConfig, ANCHOR_PERSONALITIES } from './StageConfig'

// Eye expression types for the jellyfish
type JellyfishExpression = 'happy' | 'excited' | 'sleepy' | 'focused' | 'surprised' | 'annoyed' | 'angry'

// Cthulhu-style eldritch language (friendly but eerie)
const CTHULHU_PHRASES = {
    pulse: [
        "Ph'nglui...",
        'Iä! Iä!',
        '...fhtagn!',
        "R'lyeh!",
        "Wgah'n...",
        "Ng'ha!",
        'Yog...',
        '...!',
        "Cth'aa!",
    ],
    success: ['Iä! Iä!', "Y'hah!", 'Nog shugg!', "Fhtagn 'ai!", "Yla'gn!", "Nglui'ya!"],
    death: [
        '...fhtagn',
        'Cthulhu fhtagn...',
        "R'lyeh wgah...",
        "Ng'ai...",
        "Y'bthnk...",
        "Ph'nglui mglw'nafh...",
    ],
    encourage: ["Wgah'nagl...", "Y'hah nog...", "Shugg'ya...", 'Vulgtm...', "N'gha..."],
    happy: ['Iä~', "Ng'ya~", 'Fhtagn~', 'Wgah~'],
    warning: ['Nog!', "Y'gth!", "Wgah'n!", "Cth'ulhu!"],
    annoyed: ["Grah'n...", "Nygh!", "Shthn'g...", "Mg'lw..."],
    angry: ["FHTAGN!", "NG'RYTH!", "CTHULHU!", "Y'GOLONAC!"],
}

export class AnchorWobble {
    public container: Container
    private bellGraphics: Graphics
    private tentacleGraphics: Graphics
    private eyeGraphics: Graphics
    private glowGraphics: Graphics

    // Speech bubble
    private speechContainer: Container
    private speechGraphics: Graphics
    private speechText: Text
    private speechTimer = 0
    private speechDuration = 0
    private isSpeaking = false
    private lastSpeechTime = 0
    private speechCooldown = 8 // Seconds between random speeches

    // Animation state
    private time = 0
    private pressTimer = 0
    private pressCooldown = 5.0
    private isPressing = false
    private pressProgress = 0
    private hasTriggeredCallback = false

    // Double press state
    private pendingDoublePress = false
    private doublePressTimer = 0

    // Pulse state (replaces lever angle)
    private pulseAmount = 0 // 0 = relaxed, 1 = contracted

    // Flapping animation (excited tentacle waving)
    private flapIntensity = 0 // 0 = calm, 1 = excited flapping
    private flapSpeed = 0 // Current flap animation speed multiplier

    // Emotion state for reactions
    private emotionState: 'idle' | 'celebrating' | 'mourning' = 'idle'
    private emotionTimer = 0
    private emotionDuration = 0

    // Position
    public x: number
    public y: number

    // Personality configuration
    private personality: AnchorPersonalityConfig = ANCHOR_PERSONALITIES.steady
    private currentCooldown = 5.0

    // Visual properties
    private bellRadius = 28
    private baseColor = 0x9b59b6

    // Patience system (1 = calm, 0 = leaving)
    private patience = 1.0
    private maxPatience = 1.0

    // Patience-based colors
    private readonly calmColor = 0x9b59b6 // Purple - friendly
    private readonly annoyedColor = 0xe67e22 // Orange - irritated
    private readonly angryColor = 0xe74c3c // Red - angry

    // Smooth color transition
    private targetColor = 0x9b59b6
    private displayColor = 0x9b59b6
    private colorTransitionSpeed = 2.0 // How fast color transitions (higher = faster)

    // Anger visual effects
    private angerIntensity = 0 // 0 = calm, 1 = max anger (derived from patience)
    private shakeAmount = 0 // Screen shake/jitter when angry
    private steamParticles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number }> = []
    private lastSteamSpawn = 0

    // Callbacks
    public onPress?: (energyAmount: number) => void

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.container = new Container()
        this.container.position.set(x, y)

        // Create glow layer (behind everything)
        this.glowGraphics = new Graphics()
        this.container.addChild(this.glowGraphics)

        // Create tentacles (behind bell)
        this.tentacleGraphics = new Graphics()
        this.container.addChild(this.tentacleGraphics)

        // Create bell/dome
        this.bellGraphics = new Graphics()
        this.container.addChild(this.bellGraphics)

        // Create eyes (on top)
        this.eyeGraphics = new Graphics()
        this.container.addChild(this.eyeGraphics)

        // Create speech bubble
        this.speechContainer = new Container()
        this.speechContainer.visible = false
        this.container.addChild(this.speechContainer)

        this.speechGraphics = new Graphics()
        this.speechContainer.addChild(this.speechGraphics)

        this.speechText = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 10,
                fontWeight: 'bold',
                fontStyle: 'italic',
                fill: 0xffffff,
                dropShadow: {
                    alpha: 0.8,
                    angle: Math.PI / 2,
                    blur: 8,
                    color: this.personality.color,
                    distance: 0,
                },
            }),
        })
        this.speechText.anchor.set(0.5)
        this.speechContainer.addChild(this.speechText)

        // Initial draw
        this.baseColor = this.personality.color
        this.draw()

        // Initialize cooldown
        this.resetCooldown()
    }

    /**
     * Get the current color (smoothly transitioning)
     * Purple (calm) → Orange (annoyed) → Red (angry)
     */
    getColor(): number {
        return this.displayColor
    }

    /**
     * Calculate color based on patience level
     */
    private calculatePatienceColor(): number {
        if (this.patience > 0.6) {
            // Calm zone: purple
            return this.calmColor
        } else if (this.patience > 0.3) {
            // Annoyed zone: purple → orange
            const t = (0.6 - this.patience) / 0.3
            return this.lerpColor(this.calmColor, this.annoyedColor, t)
        } else {
            // Angry zone: orange → red
            const t = (0.3 - this.patience) / 0.3
            return this.lerpColor(this.annoyedColor, this.angryColor, t)
        }
    }

    /**
     * Linear interpolation between two colors
     */
    private lerpColor(color1: number, color2: number, t: number): number {
        const r1 = (color1 >> 16) & 0xff
        const g1 = (color1 >> 8) & 0xff
        const b1 = color1 & 0xff
        const r2 = (color2 >> 16) & 0xff
        const g2 = (color2 >> 8) & 0xff
        const b2 = color2 & 0xff

        const r = Math.round(r1 + (r2 - r1) * t)
        const g = Math.round(g1 + (g2 - g1) * t)
        const b = Math.round(b1 + (b2 - b1) * t)

        return (r << 16) | (g << 8) | b
    }

    /**
     * Set patience level (0-1)
     * Called when player fails or succeeds
     */
    setPatience(value: number, max?: number): void {
        if (max !== undefined) {
            this.maxPatience = max
        }
        const previousPatience = this.patience
        this.patience = Math.max(0, Math.min(1, value / this.maxPatience))

        // Set target color (will smoothly transition)
        this.targetColor = this.calculatePatienceColor()

        // Calculate anger intensity (inverse of patience, amplified at low levels)
        // 0 at full patience, 1 at zero patience
        this.angerIntensity = Math.pow(1 - this.patience, 1.5)

        // Speak based on patience level change (only when decreasing)
        if (this.patience < previousPatience) {
            if (this.patience < 0.3 && previousPatience >= 0.3 && !this.isSpeaking) {
                this.speakRandom('angry')
            } else if (this.patience < 0.6 && previousPatience >= 0.6 && !this.isSpeaking) {
                this.speakRandom('annoyed')
            }
        }
    }

    /**
     * Get current patience (0-1)
     */
    getPatience(): number {
        return this.patience
    }

    /**
     * Set the personality configuration
     */
    setPersonality(config: AnchorPersonalityConfig): void {
        this.personality = config
        // Don't override baseColor - use patience-based color instead
        this.resetCooldown()
    }

    /**
     * Reset cooldown timer based on personality AND patience
     * Lower patience = faster pulses (more aggressive)
     */
    private resetCooldown(): void {
        const { cooldownMin, cooldownMax } = this.personality

        // Patience affects cooldown: low patience = faster pulses
        // At full patience: normal cooldown
        // At low patience: up to 50% faster
        const patienceSpeedMultiplier = 0.5 + this.patience * 0.5

        const baseCooldown = cooldownMin + Math.random() * (cooldownMax - cooldownMin)
        this.currentCooldown = baseCooldown * patienceSpeedMultiplier

        this.pressTimer = 0
    }

    /**
     * Get expression based on patience, emotion and personality
     */
    private getExpression(): JellyfishExpression {
        // Emotion state takes priority
        if (this.emotionState === 'celebrating') {
            return 'excited'
        }
        if (this.emotionState === 'mourning') {
            return 'sleepy'
        }

        // Patience-based expressions when idle
        if (!this.isPressing && !this.pendingDoublePress) {
            if (this.patience < 0.2) {
                return 'angry'
            } else if (this.patience < 0.4) {
                return 'annoyed'
            } else if (this.patience < 0.6) {
                return 'focused' // Getting impatient
            }
        }

        if (this.isPressing) {
            const pulseDuration = 0.15
            if (this.pressProgress < pulseDuration) {
                return this.patience < 0.4 ? 'angry' : 'focused'
            } else if (this.pressProgress < pulseDuration + 0.1) {
                return 'excited'
            }
            return this.patience < 0.5 ? 'annoyed' : 'happy'
        }

        if (this.pendingDoublePress) {
            return 'focused'
        }

        const timeToPress = this.currentCooldown - this.pressTimer
        if (timeToPress < 0.5) {
            return 'focused'
        }

        return 'happy'
    }

    /**
     * Draw the jellyfish
     */
    private draw(): void {
        // Apply shake offset when angry
        if (this.shakeAmount > 0) {
            const shakeX = (Math.random() - 0.5) * this.shakeAmount * 2
            const shakeY = (Math.random() - 0.5) * this.shakeAmount * 2
            this.bellGraphics.position.set(shakeX, shakeY)
            this.eyeGraphics.position.set(shakeX, shakeY)
        } else {
            this.bellGraphics.position.set(0, 0)
            this.eyeGraphics.position.set(0, 0)
        }

        this.drawGlow()
        this.drawTentacles()
        this.drawBell()
        this.drawEyes()
        this.drawSteamParticles()
    }

    /**
     * Draw steam/anger particles rising from the jellyfish
     */
    private drawSteamParticles(): void {
        const g = this.glowGraphics // Draw in glow layer for proper ordering

        for (const p of this.steamParticles) {
            const alpha = (p.life / p.maxLife) * 0.6
            const size = 3 + (1 - p.life / p.maxLife) * 4 // Grows as it rises

            // Angry steam is reddish-orange
            g.circle(p.x, p.y, size)
            g.fill({ color: 0xff6633, alpha })

            // Inner glow
            g.circle(p.x, p.y, size * 0.5)
            g.fill({ color: 0xffaa66, alpha: alpha * 0.5 })
        }
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        // Pulsing glow intensity - faster and more intense when angry
        const glowSpeed = 2 + this.angerIntensity * 4
        const baseGlow = 0.3 + this.angerIntensity * 0.15 // Brighter when angry
        const glowPulse = baseGlow + Math.sin(this.time * glowSpeed) * 0.1 + this.pulseAmount * 0.3
        const glowRadius = this.bellRadius * (1.8 + this.pulseAmount * 0.3 + this.angerIntensity * 0.2)

        // Outer glow
        g.circle(0, -10, glowRadius)
        g.fill({ color: this.baseColor, alpha: glowPulse * 0.15 })

        // Inner glow - redder when angry
        const innerGlowColor = this.angerIntensity > 0.3
            ? this.lerpColor(this.baseColor, 0xff4444, (this.angerIntensity - 0.3) * 0.5)
            : this.baseColor
        g.circle(0, -10, glowRadius * 0.6)
        g.fill({ color: innerGlowColor, alpha: glowPulse * 0.2 })

        // Angry outer ring when very angry
        if (this.angerIntensity > 0.6) {
            const ringPulse = (this.time * 5) % 1
            const ringAlpha = (1 - ringPulse) * (this.angerIntensity - 0.6) * 0.8
            const ringRadius = glowRadius * (1 + ringPulse * 0.5)
            g.circle(0, -10, ringRadius)
            g.stroke({ color: 0xff4444, width: 2, alpha: ringAlpha })
        }
    }

    private drawBell(): void {
        const g = this.bellGraphics
        g.clear()

        // Bell contracts when pulsing AND when angry
        const angerContract = this.angerIntensity * 0.15 // Tenser when angry
        const contractX = 1 - this.pulseAmount * 0.25 - angerContract
        const contractY = 1 - this.pulseAmount * 0.15 - angerContract * 0.5
        const bellWidth = this.bellRadius * contractX
        const bellHeight = this.bellRadius * 0.7 * contractY

        // Breathing animation - faster and more erratic when angry
        const breathSpeed = 1.5 + this.angerIntensity * 2
        const breathAmount = 2 - this.angerIntensity * 0.5 // Shallower breathing when angry
        const breathe = Math.sin(this.time * breathSpeed) * breathAmount
        const currentWidth = bellWidth + breathe
        const currentHeight = bellHeight + breathe * 0.5

        // Bell dome (semi-ellipse)
        g.ellipse(0, -10 - currentHeight * 0.3, currentWidth, currentHeight)
        g.fill({ color: this.baseColor, alpha: 0.6 })

        // Angry veins - visible when patience is low
        if (this.angerIntensity > 0.3) {
            const veinAlpha = (this.angerIntensity - 0.3) * 0.7
            const veinPulse = 1 + Math.sin(this.time * 8) * 0.3 // Pulsing veins

            // Draw multiple veins radiating from center
            const veinCount = 4
            for (let i = 0; i < veinCount; i++) {
                const baseAngle = (i / veinCount) * Math.PI - Math.PI / 2 + Math.PI / (veinCount * 2)
                const startX = 0
                const startY = -10

                // Branching vein path
                const midX = Math.cos(baseAngle) * currentWidth * 0.4
                const midY = -10 - currentHeight * 0.3 + Math.sin(baseAngle) * currentHeight * 0.3
                const endX = Math.cos(baseAngle) * currentWidth * 0.75
                const endY = -10 - currentHeight * 0.3 + Math.sin(baseAngle) * currentHeight * 0.55

                g.moveTo(startX, startY)
                g.quadraticCurveTo(midX * 0.5, midY, midX, midY)
                g.lineTo(endX, endY)
                g.stroke({ color: 0xff4444, width: 1.5 * veinPulse, alpha: veinAlpha })

                // Small branch
                const branchX = endX + Math.cos(baseAngle + 0.5) * 5
                const branchY = endY + Math.sin(baseAngle + 0.5) * 3
                g.moveTo(endX, endY)
                g.lineTo(branchX, branchY)
                g.stroke({ color: 0xff4444, width: 1 * veinPulse, alpha: veinAlpha * 0.7 })
            }
        }

        // Inner bell (lighter) - becomes more opaque when angry (tensing up)
        const innerAlpha = 0.15 + this.angerIntensity * 0.1
        g.ellipse(0, -10 - currentHeight * 0.3, currentWidth * 0.7, currentHeight * 0.7)
        g.fill({ color: 0xffffff, alpha: innerAlpha })

        // Bell edge (rim)
        g.ellipse(0, -10 + currentHeight * 0.5, currentWidth * 1.1, currentHeight * 0.3)
        g.fill({ color: this.baseColor, alpha: 0.8 })

        // Highlight
        g.ellipse(
            -currentWidth * 0.3,
            -10 - currentHeight * 0.5,
            currentWidth * 0.2,
            currentHeight * 0.3
        )
        g.fill({ color: 0xffffff, alpha: 0.3 })

        // Bioluminescent spots - redder and more erratic when angry
        const spotCount = 5
        for (let i = 0; i < spotCount; i++) {
            const angle = (i / spotCount) * Math.PI - Math.PI / 2
            const spotX = Math.cos(angle) * currentWidth * 0.5
            const spotY = -10 - currentHeight * 0.3 + Math.sin(angle) * currentHeight * 0.4

            // Flicker faster when angry
            const flickerSpeed = 3 + this.angerIntensity * 5
            const spotAlpha = 0.4 + Math.sin(this.time * flickerSpeed + i) * 0.2

            // Spots become redder when angry
            const spotColor = this.angerIntensity > 0.5
                ? this.lerpColor(0xffffff, 0xffaaaa, (this.angerIntensity - 0.5) * 2)
                : 0xffffff

            g.circle(spotX, spotY, 3)
            g.fill({ color: spotColor, alpha: spotAlpha })
        }
    }

    private drawTentacles(): void {
        const g = this.tentacleGraphics
        g.clear()

        const bellBottom = -10 + this.bellRadius * 0.4
        const tentacleCount = 6

        // Mourning makes tentacles droop and move slowly
        const isMourning = this.emotionState === 'mourning'
        const mournProgress = isMourning ? Math.min(1, this.emotionTimer / 0.5) : 0

        // Anger makes tentacles more tense and erratic
        const angerTension = this.angerIntensity * 0.3 // Shorter, stiffer tentacles

        // Flapping makes tentacles wave faster and wider
        // Anger also increases speed and erratic movement
        const baseSpeed = isMourning ? 0.5 : 2 + this.angerIntensity * 3
        const flapSpeedBoost = this.flapSpeed * 8
        const currentSpeed = baseSpeed + flapSpeedBoost

        for (let i = 0; i < tentacleCount; i++) {
            const spread = (i - (tentacleCount - 1) / 2) / ((tentacleCount - 1) / 2)
            const startX = spread * this.bellRadius * 0.8
            const startY = bellBottom

            // Tentacle sways with time, pulse, and flapping
            const swayPhase = this.time * currentSpeed + i * 0.5

            // Anger adds erratic high-frequency jitter
            const angerJitter = this.angerIntensity > 0.5
                ? Math.sin(this.time * 20 + i * 3) * 3 * (this.angerIntensity - 0.5) * 2
                : 0

            // When mourning: minimal sway, droopy posture
            // When angry: wider, more aggressive sway
            const baseSwayAmount = isMourning ? 3 : 8 + this.pulseAmount * 5 + this.angerIntensity * 6
            const flapSwayBoost = this.flapIntensity * 15
            const swayAmount = baseSwayAmount + flapSwayBoost

            // Length - longer when mourning (droopy), shorter when angry (tense)
            const baseLength = 35 + Math.sin(this.time + i) * 5
            const flapLengthPulse =
                Math.sin(this.time * currentSpeed * 2 + i) * 8 * this.flapIntensity
            const mournDroop = mournProgress * 15 // Droop down when sad
            const angerShorten = angerTension * 15 // Shorter when angry
            const length = baseLength + flapLengthPulse + mournDroop - angerShorten

            // Control points for bezier curve
            const flapWiggle = Math.sin(this.time * 15 + i * 2) * 5 * this.flapIntensity

            // Mourning: tentacles droop more to the sides and down
            const mournSag = mournProgress * 10 * Math.abs(spread) // Outer tentacles sag more

            // Anger jitter applied to all control points
            const cp1x = startX + Math.sin(swayPhase) * swayAmount + flapWiggle + spread * mournSag + angerJitter
            const cp1y = startY + length * 0.4 + mournSag * 0.5
            const cp2x =
                startX +
                Math.sin(swayPhase + 1) * swayAmount * 1.2 -
                flapWiggle +
                spread * mournSag * 1.5 -
                angerJitter * 0.5
            const cp2y = startY + length * 0.7 + mournSag
            const endX = startX + Math.sin(swayPhase + 2) * swayAmount * 0.8 + spread * mournSag * 2 + angerJitter * 0.8
            const endY = startY + length

            // Draw tentacle - dimmer when mourning
            const mournAlphaDim = mournProgress * 0.2
            g.moveTo(startX, startY)
            g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY)
            g.stroke({
                color: this.baseColor,
                width: 4 - i * 0.3,
                alpha: 0.7 - i * 0.05 - mournAlphaDim,
            })

            // Glowing tip - brighter when flapping
            const tipAlpha = 0.5 + Math.sin(this.time * 3 + i) * 0.2 + this.flapIntensity * 0.3
            g.circle(endX, endY, 2 + this.flapIntensity)
            g.fill({ color: 0xffffff, alpha: tipAlpha })
        }

        // Main connection tentacle (goes toward the player)
        this.drawConnectionTentacle(g, bellBottom)
    }

    private drawConnectionTentacle(g: Graphics, bellBottom: number): void {
        // This tentacle extends further, representing the rope connection
        const startX = 0
        const startY = bellBottom
        const swayPhase = this.time * 1.5
        const pulseStretch = this.pulseAmount * 15

        // Longer, thicker tentacle going down-right (toward swinging wobble)
        const cp1x = 20 + Math.sin(swayPhase) * 10
        const cp1y = startY + 30 + pulseStretch
        const cp2x = 35 + Math.sin(swayPhase + 0.5) * 8
        const cp2y = startY + 50 + pulseStretch
        const endX = 40
        const endY = startY + 70 + pulseStretch

        // Main tentacle stroke
        g.moveTo(startX, startY)
        g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY)
        g.stroke({
            color: this.baseColor,
            width: 6,
            alpha: 0.8,
        })

        // Inner glow
        g.moveTo(startX, startY)
        g.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY)
        g.stroke({
            color: 0xffffff,
            width: 2,
            alpha: 0.3,
        })

        // Glowing connection point
        const glowPulse = 0.6 + Math.sin(this.time * 4) * 0.2 + this.pulseAmount * 0.2
        g.circle(endX, endY, 5)
        g.fill({ color: this.baseColor, alpha: glowPulse })
        g.circle(endX, endY, 3)
        g.fill({ color: 0xffffff, alpha: 0.5 })
    }

    private drawEyes(): void {
        const g = this.eyeGraphics
        g.clear()

        const expression = this.getExpression()
        const eyeY = -15 - this.pulseAmount * 3
        const eyeSpacing = 10

        // Eye properties based on expression
        let eyeHeight = 6
        let pupilY = 0
        let eyebrowAngle = 0

        switch (expression) {
            case 'happy':
                eyeHeight = 5
                break
            case 'excited':
                eyeHeight = 8
                pupilY = -1
                break
            case 'sleepy':
                eyeHeight = 3
                pupilY = 1
                eyebrowAngle = 0.2
                break
            case 'focused':
                eyeHeight = 6
                pupilY = 1
                eyebrowAngle = -0.15
                break
            case 'surprised':
                eyeHeight = 9
                pupilY = -2
                break
            case 'annoyed':
                eyeHeight = 4
                pupilY = 0
                eyebrowAngle = -0.3 // Furrowed brow
                break
            case 'angry':
                eyeHeight = 5
                pupilY = 0
                eyebrowAngle = -0.5 // Very angry brow
                break
        }

        // Left eye
        this.drawEye(g, -eyeSpacing, eyeY, eyeHeight, pupilY, eyebrowAngle, expression)
        // Right eye
        this.drawEye(g, eyeSpacing, eyeY, eyeHeight, pupilY, -eyebrowAngle, expression)

        // Cute blush marks when happy/excited
        if (expression === 'happy' || expression === 'excited') {
            g.ellipse(-eyeSpacing - 6, eyeY + 5, 4, 2)
            g.fill({ color: 0xff9999, alpha: 0.4 })
            g.ellipse(eyeSpacing + 6, eyeY + 5, 4, 2)
            g.fill({ color: 0xff9999, alpha: 0.4 })
        }

        // Anger veins when angry
        if (expression === 'angry') {
            // Small angry vein marks near eyes
            g.moveTo(-eyeSpacing - 8, eyeY - 8)
            g.lineTo(-eyeSpacing - 5, eyeY - 5)
            g.moveTo(-eyeSpacing - 8, eyeY - 5)
            g.lineTo(-eyeSpacing - 5, eyeY - 8)
            g.stroke({ color: 0xe74c3c, width: 1.5, alpha: 0.7 })
        }
    }

    private drawEye(
        g: Graphics,
        x: number,
        y: number,
        height: number,
        pupilOffsetY: number,
        eyebrowAngle: number,
        expression: JellyfishExpression = 'happy'
    ): void {
        // Eye color tinted by anger
        const isAngry = expression === 'angry' || expression === 'annoyed'
        const eyeWhiteColor = isAngry ? 0xffeeee : 0xffffff

        // Eye white
        g.ellipse(x, y, 5, height)
        g.fill({ color: eyeWhiteColor, alpha: 0.9 })

        // Pupil - smaller and more intense when angry
        const pupilSize = isAngry ? 2.5 : 3
        g.circle(x, y + pupilOffsetY, pupilSize)
        g.fill({ color: expression === 'angry' ? 0x441111 : 0x222233 })

        // Eye shine
        g.circle(x - 1, y + pupilOffsetY - 1, 1.5)
        g.fill({ color: 0xffffff, alpha: 0.8 })

        // Eyebrow (subtle arc above eye)
        if (Math.abs(eyebrowAngle) > 0.1) {
            g.moveTo(x - 5, y - height - 2)
            g.lineTo(x + 5, y - height - 2 + eyebrowAngle * 10)
            g.stroke({ color: this.baseColor, width: 2, alpha: 0.5 })
        }
    }

    /**
     * Smoothly transition display color toward target color
     */
    private updateColorTransition(deltaSeconds: number): void {
        // Extract RGB components
        const dR = (this.displayColor >> 16) & 0xff
        const dG = (this.displayColor >> 8) & 0xff
        const dB = this.displayColor & 0xff
        const tR = (this.targetColor >> 16) & 0xff
        const tG = (this.targetColor >> 8) & 0xff
        const tB = this.targetColor & 0xff

        // Lerp each component
        const lerpFactor = 1 - Math.exp(-this.colorTransitionSpeed * deltaSeconds)
        const newR = Math.round(dR + (tR - dR) * lerpFactor)
        const newG = Math.round(dG + (tG - dG) * lerpFactor)
        const newB = Math.round(dB + (tB - dB) * lerpFactor)

        this.displayColor = (newR << 16) | (newG << 8) | newB
        this.baseColor = this.displayColor
    }

    /**
     * Update anger-related visual effects (steam particles, shake)
     */
    private updateAngerEffects(deltaSeconds: number): void {
        // Update shake amount (jittery when angry)
        if (this.angerIntensity > 0.5) {
            this.shakeAmount = (this.angerIntensity - 0.5) * 2 * 2 // Max 2px shake at max anger
        } else {
            this.shakeAmount = 0
        }

        // Spawn steam particles when very angry
        this.lastSteamSpawn += deltaSeconds
        if (this.angerIntensity > 0.6 && this.lastSteamSpawn > 0.15) {
            this.lastSteamSpawn = 0
            const spawnCount = this.angerIntensity > 0.8 ? 2 : 1
            for (let i = 0; i < spawnCount; i++) {
                this.steamParticles.push({
                    x: (Math.random() - 0.5) * this.bellRadius * 1.5,
                    y: -this.bellRadius * 0.5 - Math.random() * 10,
                    vx: (Math.random() - 0.5) * 20,
                    vy: -30 - Math.random() * 20,
                    life: 0.6 + Math.random() * 0.4,
                    maxLife: 0.6 + Math.random() * 0.4,
                })
            }
        }

        // Update existing steam particles
        for (let i = this.steamParticles.length - 1; i >= 0; i--) {
            const p = this.steamParticles[i]
            p.x += p.vx * deltaSeconds
            p.y += p.vy * deltaSeconds
            p.vy -= 50 * deltaSeconds // Rise up faster
            p.vx *= 0.98 // Slow horizontal movement
            p.life -= deltaSeconds

            if (p.life <= 0) {
                this.steamParticles.splice(i, 1)
            }
        }
    }

    /**
     * Update animation
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pressTimer += deltaSeconds
        this.lastSpeechTime += deltaSeconds

        // Smooth color transition
        this.updateColorTransition(deltaSeconds)

        // Update anger effects (steam, shake)
        this.updateAngerEffects(deltaSeconds)

        // Handle pending double press
        if (this.pendingDoublePress) {
            this.doublePressTimer -= deltaSeconds
            if (this.doublePressTimer <= 0) {
                this.pendingDoublePress = false
                this.startPress()
            }
        }

        // Check if it's time to pulse
        if (
            !this.isPressing &&
            !this.pendingDoublePress &&
            this.pressTimer >= this.currentCooldown
        ) {
            this.startPress()
        }

        // Update pulse animation
        if (this.isPressing) {
            this.updatePulse(deltaSeconds)
        } else {
            // Gradually return to relaxed state
            this.pulseAmount *= 0.9

            // Anticipation before pulse
            if (!this.pendingDoublePress) {
                const timeToPress = this.currentCooldown - this.pressTimer
                if (timeToPress < 0.5) {
                    // Slight expansion before contracting (inhale before pulse)
                    this.pulseAmount = -0.1 * (1 - timeToPress / 0.5)
                }
            }
        }

        // Update emotion state
        if (this.emotionState !== 'idle') {
            this.emotionTimer += deltaSeconds
            if (this.emotionTimer >= this.emotionDuration) {
                this.emotionState = 'idle'
            }
        }

        // Update flapping animation based on emotion and actions
        let targetFlapIntensity = 0
        if (this.emotionState === 'celebrating') {
            // Happy celebration - vigorous flapping!
            targetFlapIntensity = 1.0
        } else if (this.emotionState === 'mourning') {
            // Sad - minimal movement
            targetFlapIntensity = 0.0
        } else if (this.isPressing || this.isSpeaking) {
            // Normal pulse/speak flapping
            targetFlapIntensity = 0.7
        }

        const flapRampSpeed = targetFlapIntensity > this.flapIntensity ? 8.0 : 3.0
        this.flapIntensity +=
            (targetFlapIntensity - this.flapIntensity) * flapRampSpeed * deltaSeconds
        this.flapIntensity = Math.max(0, Math.min(1, this.flapIntensity))

        // Flap speed follows intensity
        this.flapSpeed = this.flapIntensity

        // Update speech bubble
        this.updateSpeech(deltaSeconds)

        // Random speech chance (very low probability) - not during emotions
        if (
            !this.isSpeaking &&
            this.lastSpeechTime > this.speechCooldown &&
            this.emotionState === 'idle'
        ) {
            if (Math.random() < 0.003) {
                this.speakRandom()
            }
        }

        // Redraw with updated state
        this.draw()
    }

    /**
     * Show speech bubble with text
     */
    speak(text: string, duration: number = 2.0): void {
        this.speechText.text = text
        this.speechDuration = duration
        this.speechTimer = 0
        this.isSpeaking = true
        this.lastSpeechTime = 0
        this.speechContainer.visible = true
        this.speechContainer.alpha = 1
        this.speechContainer.scale.set(0.3)
        this.drawSpeechBubble()
    }

    /**
     * Speak a random phrase from a category
     */
    speakRandom(category?: keyof typeof CTHULHU_PHRASES): void {
        const cat = category || this.getRandomCategory()
        const phrases = CTHULHU_PHRASES[cat]
        const phrase = phrases[Math.floor(Math.random() * phrases.length)]
        this.speak(phrase, 1.8)
    }

    /**
     * Speak when pulsing (always)
     */
    speakOnPulse(): void {
        if (!this.isSpeaking) {
            this.speakRandom('pulse')
        }
    }

    /**
     * Speak when player succeeds/clears stage - celebrate with happy flapping!
     */
    speakOnSuccess(): void {
        this.speakRandom('success')
        this.startEmotion('celebrating', 2.0)
    }

    /**
     * Speak when player dies - mourn with sad drooping
     */
    speakOnDeath(): void {
        this.speakRandom('death')
        this.startEmotion('mourning', 2.5)
    }

    /**
     * Start an emotion animation
     */
    private startEmotion(emotion: 'celebrating' | 'mourning', duration: number): void {
        this.emotionState = emotion
        this.emotionTimer = 0
        this.emotionDuration = duration
    }

    private getRandomCategory(): keyof typeof CTHULHU_PHRASES {
        const categories: (keyof typeof CTHULHU_PHRASES)[] = ['encourage', 'happy', 'warning']
        return categories[Math.floor(Math.random() * categories.length)]
    }

    private updateSpeech(deltaSeconds: number): void {
        if (!this.isSpeaking) return

        this.speechTimer += deltaSeconds

        // Fade-in animation
        const fadeInDuration = 0.3
        if (this.speechTimer < fadeInDuration) {
            const t = this.speechTimer / fadeInDuration
            this.speechContainer.alpha = t
            this.speechContainer.scale.set(0.8 + 0.2 * t)
        } else {
            this.speechContainer.alpha = 1
            this.speechContainer.scale.set(1)
        }

        // Position below the bell with gentle wave motion (telepathic feel)
        const waveX = Math.sin(this.time * 2) * 3
        const waveY = Math.sin(this.time * 3) * 2
        this.speechContainer.position.set(waveX, 50 + waveY) // Below the jellyfish

        // Redraw telepathic effect (updates wave animation)
        this.drawTelepathicEffect()

        // Fade out near end
        const fadeStart = this.speechDuration - 0.5
        if (this.speechTimer > fadeStart) {
            const fadeProgress = (this.speechTimer - fadeStart) / 0.5
            this.speechContainer.alpha = 1 - fadeProgress
        }

        // Hide when done
        if (this.speechTimer >= this.speechDuration) {
            this.isSpeaking = false
            this.speechContainer.visible = false
        }
    }

    private drawSpeechBubble(): void {
        this.drawTelepathicEffect()
    }

    private drawTelepathicEffect(): void {
        const g = this.speechGraphics
        g.clear()

        // Telepathic wave rings emanating from text
        const waveCount = 3
        for (let i = 0; i < waveCount; i++) {
            const phase = (this.time * 2 + i * 0.5) % 1
            const radius = 20 + phase * 30
            const alpha = (1 - phase) * 0.3

            g.ellipse(0, 0, radius * 1.5, radius * 0.4)
            g.stroke({ color: this.baseColor, width: 1.5, alpha })
        }

        // Inner glow behind text
        const glowPulse = 0.3 + Math.sin(this.time * 4) * 0.1
        g.ellipse(0, 0, 40, 12)
        g.fill({ color: this.baseColor, alpha: glowPulse })

        // Position text at center
        this.speechText.position.set(0, 0)
    }

    private easeOutBack(x: number): number {
        const c1 = 1.70158
        const c3 = c1 + 1
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
    }

    private startPress(): void {
        this.isPressing = true
        this.pressProgress = 0
        this.hasTriggeredCallback = false

        // Chance to speak when pulsing
        this.speakOnPulse()
    }

    private updatePulse(deltaSeconds: number): void {
        this.pressProgress += deltaSeconds

        const contractDuration = 0.15 // Quick contraction
        const holdDuration = 0.05 // Brief hold
        const releaseDuration = 0.3 // Slower release
        const totalDuration = contractDuration + holdDuration + releaseDuration

        if (this.pressProgress >= totalDuration) {
            this.isPressing = false
            this.pressProgress = 0
            this.pulseAmount = 0

            // Check for double pulse
            if (
                !this.pendingDoublePress &&
                this.personality.doublePressChance > 0 &&
                Math.random() < this.personality.doublePressChance
            ) {
                this.pendingDoublePress = true
                this.doublePressTimer = this.personality.doublePressDelay
            } else {
                this.resetCooldown()
            }
            return
        }

        if (this.pressProgress < contractDuration) {
            // Quick contraction
            const t = this.pressProgress / contractDuration
            this.pulseAmount = this.easeOutQuad(t)

            // Trigger callback at peak contraction
            if (t > 0.7 && this.onPress && !this.hasTriggeredCallback) {
                const energyAmount = this.personality.energyMultiplier
                this.onPress(energyAmount)
                this.hasTriggeredCallback = true
            }
        } else if (this.pressProgress < contractDuration + holdDuration) {
            // Hold at max contraction
            this.pulseAmount = 1
        } else {
            // Gradual release
            const t = (this.pressProgress - contractDuration - holdDuration) / releaseDuration
            this.pulseAmount = 1 - this.easeOutQuad(t)
        }
    }

    private easeOutQuad(t: number): number {
        return t * (2 - t)
    }

    /**
     * Set press cooldown (difficulty adjustment)
     */
    setPressCooldown(seconds: number): void {
        this.pressCooldown = seconds
    }

    destroy(): void {
        this.container.destroy({ children: true })
    }
}
