/**
 * AnchorWobble.ts - Friendly jellyfish helper that pulses to swing the rope
 *
 * A cute bioluminescent jellyfish friend. Periodically pulses/contracts
 * to add energy to the pendulum through its connected tentacle.
 *
 * Supports personality system with different behaviors:
 * - steady: Consistent timing (purple glow)
 * - eager: Fast, frequent pulses (red/pink glow)
 * - lazy: Slow but powerful (blue glow)
 * - rhythmic: Regular pattern with double-pulses (green glow)
 * - chaotic: Unpredictable (orange glow)
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { AnchorPersonalityConfig, ANCHOR_PERSONALITIES } from './StageConfig'

// Eye expression types for the jellyfish
type JellyfishExpression = 'happy' | 'excited' | 'sleepy' | 'focused' | 'surprised'

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
     * Get the current tentacle color for syncing with rope
     */
    getColor(): number {
        return this.baseColor
    }

    /**
     * Set the personality configuration
     */
    setPersonality(config: AnchorPersonalityConfig): void {
        this.personality = config
        this.baseColor = config.color
        this.resetCooldown()
    }

    /**
     * Reset cooldown timer based on personality
     */
    private resetCooldown(): void {
        const { cooldownMin, cooldownMax } = this.personality
        this.currentCooldown = cooldownMin + Math.random() * (cooldownMax - cooldownMin)
        this.pressTimer = 0
    }

    /**
     * Get expression based on emotion and personality
     */
    private getExpression(): JellyfishExpression {
        // Emotion state takes priority
        if (this.emotionState === 'celebrating') {
            return 'excited' // Big happy eyes!
        }
        if (this.emotionState === 'mourning') {
            return 'sleepy' // Sad droopy eyes
        }

        if (this.isPressing) {
            const pulseDuration = 0.15
            if (this.pressProgress < pulseDuration) {
                return 'focused'
            } else if (this.pressProgress < pulseDuration + 0.1) {
                return 'excited'
            }
            return 'happy'
        }

        if (this.pendingDoublePress) {
            return 'focused'
        }

        const timeToPress = this.currentCooldown - this.pressTimer
        if (timeToPress < 0.5) {
            return 'focused'
        }

        // Map personality idle expression to jellyfish expression
        const expr = this.personality.idleExpression
        if (expr === 'dizzy' || expr === 'struggle') return 'sleepy'
        if (expr === 'worried' || expr === 'surprised') return 'surprised'
        if (expr === 'happy' || expr === 'excited') return 'happy'
        return 'happy'
    }

    /**
     * Draw the jellyfish
     */
    private draw(): void {
        this.drawGlow()
        this.drawTentacles()
        this.drawBell()
        this.drawEyes()
    }

    private drawGlow(): void {
        const g = this.glowGraphics
        g.clear()

        // Pulsing glow intensity
        const glowPulse = 0.3 + Math.sin(this.time * 2) * 0.1 + this.pulseAmount * 0.3
        const glowRadius = this.bellRadius * (1.8 + this.pulseAmount * 0.3)

        // Outer glow
        g.circle(0, -10, glowRadius)
        g.fill({ color: this.baseColor, alpha: glowPulse * 0.15 })

        // Inner glow
        g.circle(0, -10, glowRadius * 0.6)
        g.fill({ color: this.baseColor, alpha: glowPulse * 0.2 })
    }

    private drawBell(): void {
        const g = this.bellGraphics
        g.clear()

        // Bell contracts when pulsing
        const contractX = 1 - this.pulseAmount * 0.25
        const contractY = 1 - this.pulseAmount * 0.15
        const bellWidth = this.bellRadius * contractX
        const bellHeight = this.bellRadius * 0.7 * contractY

        // Breathing animation
        const breathe = Math.sin(this.time * 1.5) * 2
        const currentWidth = bellWidth + breathe
        const currentHeight = bellHeight + breathe * 0.5

        // Bell dome (semi-ellipse)
        g.ellipse(0, -10 - currentHeight * 0.3, currentWidth, currentHeight)
        g.fill({ color: this.baseColor, alpha: 0.6 })

        // Inner bell (lighter)
        g.ellipse(0, -10 - currentHeight * 0.3, currentWidth * 0.7, currentHeight * 0.7)
        g.fill({ color: 0xffffff, alpha: 0.15 })

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

        // Bioluminescent spots
        const spotCount = 5
        for (let i = 0; i < spotCount; i++) {
            const angle = (i / spotCount) * Math.PI - Math.PI / 2
            const spotX = Math.cos(angle) * currentWidth * 0.5
            const spotY = -10 - currentHeight * 0.3 + Math.sin(angle) * currentHeight * 0.4
            const spotAlpha = 0.4 + Math.sin(this.time * 3 + i) * 0.2

            g.circle(spotX, spotY, 3)
            g.fill({ color: 0xffffff, alpha: spotAlpha })
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

        // Flapping makes tentacles wave faster and wider
        const baseSpeed = isMourning ? 0.5 : 2 // Slow when sad
        const flapSpeedBoost = this.flapSpeed * 8
        const currentSpeed = baseSpeed + flapSpeedBoost

        for (let i = 0; i < tentacleCount; i++) {
            const spread = (i - (tentacleCount - 1) / 2) / ((tentacleCount - 1) / 2)
            const startX = spread * this.bellRadius * 0.8
            const startY = bellBottom

            // Tentacle sways with time, pulse, and flapping
            const swayPhase = this.time * currentSpeed + i * 0.5

            // When mourning: minimal sway, droopy posture
            const baseSwayAmount = isMourning ? 3 : 8 + this.pulseAmount * 5
            const flapSwayBoost = this.flapIntensity * 15
            const swayAmount = baseSwayAmount + flapSwayBoost

            // Length - longer when mourning (droopy)
            const baseLength = 35 + Math.sin(this.time + i) * 5
            const flapLengthPulse =
                Math.sin(this.time * currentSpeed * 2 + i) * 8 * this.flapIntensity
            const mournDroop = mournProgress * 15 // Droop down when sad
            const length = baseLength + flapLengthPulse + mournDroop

            // Control points for bezier curve
            const flapWiggle = Math.sin(this.time * 15 + i * 2) * 5 * this.flapIntensity

            // Mourning: tentacles droop more to the sides and down
            const mournSag = mournProgress * 10 * Math.abs(spread) // Outer tentacles sag more
            const cp1x = startX + Math.sin(swayPhase) * swayAmount + flapWiggle + spread * mournSag
            const cp1y = startY + length * 0.4 + mournSag * 0.5
            const cp2x =
                startX +
                Math.sin(swayPhase + 1) * swayAmount * 1.2 -
                flapWiggle +
                spread * mournSag * 1.5
            const cp2y = startY + length * 0.7 + mournSag
            const endX = startX + Math.sin(swayPhase + 2) * swayAmount * 0.8 + spread * mournSag * 2
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
        }

        // Left eye
        this.drawEye(g, -eyeSpacing, eyeY, eyeHeight, pupilY, eyebrowAngle)
        // Right eye
        this.drawEye(g, eyeSpacing, eyeY, eyeHeight, pupilY, -eyebrowAngle)

        // Cute blush marks when happy/excited
        if (expression === 'happy' || expression === 'excited') {
            g.ellipse(-eyeSpacing - 6, eyeY + 5, 4, 2)
            g.fill({ color: 0xff9999, alpha: 0.4 })
            g.ellipse(eyeSpacing + 6, eyeY + 5, 4, 2)
            g.fill({ color: 0xff9999, alpha: 0.4 })
        }
    }

    private drawEye(
        g: Graphics,
        x: number,
        y: number,
        height: number,
        pupilOffsetY: number,
        eyebrowAngle: number
    ): void {
        // Eye white
        g.ellipse(x, y, 5, height)
        g.fill({ color: 0xffffff, alpha: 0.9 })

        // Pupil
        g.circle(x, y + pupilOffsetY, 3)
        g.fill({ color: 0x222233 })

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
     * Update animation
     */
    update(deltaSeconds: number): void {
        this.time += deltaSeconds
        this.pressTimer += deltaSeconds
        this.lastSpeechTime += deltaSeconds

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
