/**
 * WobblediverIntro.ts - Tutorial introduction for Wobblediver minigame
 *
 * Shows the new concept:
 * 1. Friendly jellyfish helper that pulses to swing the wobble
 * 2. Tentacle rope connecting jellyfish to wobble
 * 3. Wormhole escape portal
 * 4. Dangerous abyss with threatening eyes and tentacles
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Wobble } from '../../../Wobble'
import i18n from '@/i18n'

interface IntroStep {
    titleKey: string
    messageKey: string
    wobbleExpression: 'happy' | 'excited' | 'surprised' | 'worried'
    showJellyfish?: boolean
    showWormhole?: boolean
    showAbyss?: boolean
}

const INTRO_STEPS: IntroStep[] = [
    {
        titleKey: 'wobblediver.intro.title1',
        messageKey: 'wobblediver.intro.message1',
        wobbleExpression: 'worried',
        showJellyfish: false,
    },
    {
        titleKey: 'wobblediver.intro.title2',
        messageKey: 'wobblediver.intro.message2',
        wobbleExpression: 'surprised',
        showJellyfish: true,
    },
    {
        titleKey: 'wobblediver.intro.title3',
        messageKey: 'wobblediver.intro.message3',
        wobbleExpression: 'worried',
        showWormhole: true,
    },
    {
        titleKey: 'wobblediver.intro.title4',
        messageKey: 'wobblediver.intro.message4',
        wobbleExpression: 'worried',
        showAbyss: true,
    },
    {
        titleKey: 'wobblediver.intro.title5',
        messageKey: 'wobblediver.intro.message5',
        wobbleExpression: 'worried',
    },
]

// Text animation utilities
class TextAnimator {
    static typewriter(
        text: Text,
        fullText: string,
        duration: number,
        onComplete?: () => void
    ): { update: (delta: number) => void } {
        let elapsed = 0
        const charDuration = duration / fullText.length
        let currentLength = 0
        let completed = false

        return {
            update: (delta: number) => {
                if (completed) return

                elapsed += delta
                const targetLength = Math.min(Math.floor(elapsed / charDuration), fullText.length)

                if (targetLength !== currentLength) {
                    currentLength = targetLength
                    text.text = fullText.substring(0, currentLength)
                }

                if (currentLength >= fullText.length && !completed) {
                    completed = true
                    onComplete?.()
                }
            },
        }
    }

    static fadeSlideUp(
        container: Container,
        targetY: number,
        duration: number,
        delay: number = 0
    ): { update: (delta: number) => void } {
        let elapsed = 0
        const startY = targetY + 20
        container.y = startY
        container.alpha = 0

        return {
            update: (delta: number) => {
                elapsed += delta
                if (elapsed < delay) return

                const t = Math.min((elapsed - delay) / duration, 1)
                const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic

                container.y = startY + (targetY - startY) * eased
                container.alpha = eased
            },
        }
    }

    static pulse(container: Container): { update: (time: number) => void } {
        return {
            update: (time: number) => {
                const scale = 1 + Math.sin(time * 4) * 0.03
                container.scale.set(scale)
            },
        }
    }
}

// Mini jellyfish + wobble preview (replaces pendulum)
class MiniJellyfishDisplay extends Container {
    private wobble: Wobble
    private graphics: Graphics
    private displayWidth: number
    private displayHeight: number
    private time = 0
    private pulsePhase = 0
    private swingAngle = 0
    private angularVelocity = 0

    // Jellyfish colors
    private readonly jellyfishColor = 0x9b59b6
    private readonly glowColor = 0xe8d5f2

    // Jellyfish position
    private readonly jellyfishX: number
    private readonly jellyfishY = 35

    // Swing config
    private readonly ropeLength = 70

    // Speech bubble
    private speechText = ''
    private speechAlpha = 0

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.jellyfishX = width / 2
        this.graphics = new Graphics()
        this.wobble = new Wobble({
            size: 20,
            color: 0xf5b041,
            shape: 'circle',
            expression: 'happy',
        })
        this.setup()
    }

    private setup(): void {
        // Background - deep sea theme
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x0a1a20, alpha: 0.95 })
        bg.stroke({ color: 0x2dd4bf, width: 1, alpha: 0.3 })
        this.addChild(bg)

        // Bioluminescent particles
        for (let i = 0; i < 8; i++) {
            const particle = new Graphics()
            const x = 20 + Math.random() * (this.displayWidth - 40)
            const y = 20 + Math.random() * (this.displayHeight - 40)
            particle.circle(x, y, 1 + Math.random() * 1.5)
            particle.fill({ color: 0x2dd4bf, alpha: 0.2 + Math.random() * 0.2 })
            this.addChild(particle)
        }

        this.addChild(this.graphics)
        this.addChild(this.wobble)

        // Initial swing
        this.swingAngle = Math.PI / 5

        // Initial speech
        this.triggerSpeech("Iä~")
    }

    private triggerSpeech(text: string): void {
        this.speechText = text
        this.speechAlpha = 1
    }

    update(delta: number): void {
        this.time += delta
        this.pulsePhase += delta

        // Periodic pulse (like pressing the jellyfish)
        const pulseCycle = 2.5 // seconds between pulses
        if (Math.floor(this.pulsePhase / pulseCycle) > Math.floor((this.pulsePhase - delta) / pulseCycle)) {
            // Apply energy boost
            this.angularVelocity += (this.swingAngle >= 0 ? -1 : 1) * 1.5
            this.triggerSpeech(["Iä~", "Ph'nglui...", "Fhtagn~"][Math.floor(Math.random() * 3)])
        }

        // Pendulum physics
        const gravity = 9.8
        const angularAccel = (-gravity / this.ropeLength) * Math.sin(this.swingAngle)
        this.angularVelocity += angularAccel * delta * 15
        this.angularVelocity *= 0.995
        this.swingAngle += this.angularVelocity * delta

        // Calculate wobble position
        const wobbleX = this.jellyfishX + Math.sin(this.swingAngle) * this.ropeLength
        const wobbleY = this.jellyfishY + Math.cos(this.swingAngle) * this.ropeLength
        this.wobble.position.set(wobbleX, wobbleY)

        // Update wobble squash/stretch
        this.wobble.updateOptions({
            wobblePhase: this.time * 3,
            scaleX: 1 + Math.abs(this.angularVelocity) * 0.08,
            scaleY: 1 - Math.abs(this.angularVelocity) * 0.04,
        })

        // Fade speech
        if (this.speechAlpha > 0) {
            this.speechAlpha = Math.max(0, this.speechAlpha - delta * 0.5)
        }

        this.draw()
    }

    private draw(): void {
        const g = this.graphics
        g.clear()

        const jx = this.jellyfishX
        const jy = this.jellyfishY

        // Jellyfish pulse animation
        const pulseInCycle = (this.pulsePhase % 2.5) / 2.5
        const isPulsing = pulseInCycle < 0.15
        const pulseScale = isPulsing ? 1 - Math.sin(pulseInCycle / 0.15 * Math.PI) * 0.15 : 1
        const bellWidth = 28 * pulseScale
        const bellHeight = 18 * (2 - pulseScale)

        // Glow effect
        for (let i = 3; i >= 0; i--) {
            const glowScale = 1 + i * 0.2
            const alpha = 0.08 - i * 0.015
            g.ellipse(jx, jy, bellWidth * glowScale, bellHeight * glowScale * 0.7)
            g.fill({ color: this.glowColor, alpha })
        }

        // Bell dome
        g.ellipse(jx, jy, bellWidth, bellHeight * 0.7)
        g.fill({ color: this.jellyfishColor, alpha: 0.85 })

        // Bell highlight
        g.ellipse(jx - bellWidth * 0.2, jy - bellHeight * 0.2, bellWidth * 0.3, bellHeight * 0.2)
        g.fill({ color: 0xffffff, alpha: 0.25 })

        // Cute eyes
        const eyeY = jy + 2
        const eyeSpacing = 8
        // Left eye
        g.circle(jx - eyeSpacing, eyeY, 4)
        g.fill({ color: 0xffffff, alpha: 0.9 })
        g.circle(jx - eyeSpacing + 1, eyeY, 2)
        g.fill({ color: 0x2c3e50, alpha: 0.9 })
        // Right eye
        g.circle(jx + eyeSpacing, eyeY, 4)
        g.fill({ color: 0xffffff, alpha: 0.9 })
        g.circle(jx + eyeSpacing + 1, eyeY, 2)
        g.fill({ color: 0x2c3e50, alpha: 0.9 })

        // Smile (when pulsing, show happy expression)
        if (isPulsing) {
            g.arc(jx, eyeY + 6, 5, 0, Math.PI, false)
            g.stroke({ color: 0x2c3e50, width: 1.5, alpha: 0.7 })
        }

        // Tentacle rope connecting to wobble
        const wobbleX = this.wobble.x
        const wobbleY = this.wobble.y
        const tentacleStartY = jy + bellHeight * 0.5

        // Draw wavy tentacle rope
        const segments = 12
        const waveAmp = 3 + Math.sin(this.time * 2) * 1.5
        const baseWidth = 4

        for (let i = 0; i < segments; i++) {
            const t1 = i / segments
            const t2 = (i + 1) / segments

            const x1 = jx + (wobbleX - jx) * t1 + Math.sin(t1 * Math.PI * 3 + this.time * 4) * waveAmp * (1 - t1)
            const y1 = tentacleStartY + (wobbleY - tentacleStartY) * t1
            const x2 = jx + (wobbleX - jx) * t2 + Math.sin(t2 * Math.PI * 3 + this.time * 4) * waveAmp * (1 - t2)
            const y2 = tentacleStartY + (wobbleY - tentacleStartY) * t2

            const width = baseWidth * (1 - t1 * 0.5)

            // Glow
            g.moveTo(x1, y1)
            g.lineTo(x2, y2)
            g.stroke({ color: this.glowColor, width: width + 3, alpha: 0.15 })

            // Main tentacle
            g.moveTo(x1, y1)
            g.lineTo(x2, y2)
            g.stroke({ color: this.jellyfishColor, width: width, alpha: 0.9 })
        }

        // Glow nodes on tentacle
        for (let i = 1; i < 4; i++) {
            const t = i / 4
            const nx = jx + (wobbleX - jx) * t + Math.sin(t * Math.PI * 3 + this.time * 4) * waveAmp * (1 - t)
            const ny = tentacleStartY + (wobbleY - tentacleStartY) * t
            const pulse = 0.5 + Math.sin(this.time * 3 + i) * 0.5
            g.circle(nx, ny, 2 + pulse)
            g.fill({ color: this.glowColor, alpha: 0.4 * pulse })
        }

        // Decorative side tentacles (not connected to wobble)
        const sideTentacles = [-1, 1]
        for (const side of sideTentacles) {
            const startX = jx + side * bellWidth * 0.6
            const startY = tentacleStartY - 3

            g.moveTo(startX, startY)
            const endX = startX + side * 15 + Math.sin(this.time * 2.5 + side) * 5
            const endY = startY + 20 + Math.sin(this.time * 3) * 3
            const ctrlX = startX + side * 8
            const ctrlY = startY + 12
            g.quadraticCurveTo(ctrlX, ctrlY, endX, endY)
            g.stroke({ color: this.jellyfishColor, width: 2.5, alpha: 0.6 })
        }

        // Telepathic speech effect (below jellyfish)
        if (this.speechAlpha > 0) {
            const speechY = jy + bellHeight + 8

            // Wave rings
            for (let i = 0; i < 2; i++) {
                const phase = (this.time * 2 + i * 0.5) % 1
                const radius = 8 + phase * 12
                const alpha = (1 - phase) * 0.25 * this.speechAlpha
                g.ellipse(jx, speechY, radius, radius * 0.3)
                g.stroke({ color: this.jellyfishColor, width: 1, alpha })
            }

            // Text (using simple graphics since Text would be complex here)
            // Just draw a small glow to indicate speech
            g.ellipse(jx, speechY, 15, 5)
            g.fill({ color: this.jellyfishColor, alpha: 0.3 * this.speechAlpha })
        }
    }
}

// Mini wormhole preview
class MiniWormholeDisplay extends Container {
    private wormhole: Graphics
    private particles: { x: number; y: number; angle: number; speed: number; size: number }[] = []
    private time = 0
    private displayWidth: number
    private displayHeight: number

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.wormhole = new Graphics()
        this.setup()
    }

    private setup(): void {
        // Background - deep sea theme
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x0a1a20, alpha: 0.95 })
        bg.stroke({ color: 0x2dd4bf, width: 1, alpha: 0.3 })
        this.addChild(bg)

        // Initialize particles
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: 0,
                y: 0,
                angle: (Math.PI * 2 * i) / 12,
                speed: 0.5 + Math.random() * 0.5,
                size: 2 + Math.random() * 2,
            })
        }

        this.addChild(this.wormhole)
    }

    update(delta: number): void {
        this.time += delta

        const g = this.wormhole
        g.clear()

        const cx = this.displayWidth / 2
        const cy = this.displayHeight / 2 + 10
        const rx = 50
        const ry = 20

        // Outer glow
        for (let i = 3; i >= 0; i--) {
            const scale = 1 + i * 0.15
            const alpha = 0.1 - i * 0.02
            g.ellipse(cx, cy, rx * scale, ry * scale)
            g.fill({ color: 0x2dd4bf, alpha })
        }

        // Dark center (funnel)
        for (let i = 0; i < 8; i++) {
            const t = i / 8
            const layerRx = rx * (1 - t * 0.8)
            const layerRy = ry * (1 - t * 0.8)
            const layerY = cy + t * 15
            g.ellipse(cx, layerY, layerRx, layerRy)
            g.fill({ color: 0x042f2e, alpha: 0.3 + t * 0.4 })
        }

        // Inner rings
        for (let i = 0; i < 4; i++) {
            const t = (i + 1) / 5
            const ringRx = rx * (1 - t * 0.7)
            const ringRy = ry * (1 - t * 0.7)
            const pulse = 1 + Math.sin(this.time * 3 + i) * 0.1
            g.ellipse(cx, cy + t * 10, ringRx * pulse, ringRy * pulse)
            g.stroke({ color: 0x0d9488, width: 1.5, alpha: 0.4 - t * 0.2 })
        }

        // Outer ring
        const pulse = 1 + Math.sin(this.time * 2) * 0.05
        g.ellipse(cx, cy, rx * pulse, ry * pulse)
        g.stroke({ color: 0x2dd4bf, width: 3, alpha: 0.9 })

        // Swirling particles
        for (const p of this.particles) {
            p.angle += p.speed * delta * 2
            const orbitRx = rx * 0.8
            const orbitRy = ry * 0.8
            const px = cx + Math.cos(p.angle) * orbitRx
            const py = cy + Math.sin(p.angle) * orbitRy

            g.circle(px, py, p.size)
            g.fill({ color: 0x5eead4, alpha: 0.6 })
        }

        // Center bright spot
        const centerPulse = 0.7 + Math.sin(this.time * 4) * 0.3
        g.circle(cx, cy + 12, 4 * centerPulse)
        g.fill({ color: 0x99f6e4, alpha: 0.8 })

        // Arrow pointing to wormhole
        g.moveTo(cx, cy - 45)
        g.lineTo(cx - 8, cy - 55)
        g.lineTo(cx + 8, cy - 55)
        g.closePath()
        g.fill({ color: 0x2dd4bf, alpha: 0.8 })
    }
}

// Mini abyss preview with dangerous tentacles
class MiniAbyssDisplay extends Container {
    private abyss: Graphics
    private eyes: { x: number; y: number; size: number; blinkTimer: number; lookAngle: number }[] = []
    private time = 0
    private displayWidth: number
    private displayHeight: number

    constructor(width: number, height: number) {
        super()
        this.displayWidth = width
        this.displayHeight = height
        this.abyss = new Graphics()
        this.setup()
    }

    private setup(): void {
        // Background - deep sea theme
        const bg = new Graphics()
        bg.roundRect(0, 0, this.displayWidth, this.displayHeight, 12)
        bg.fill({ color: 0x0a1a20, alpha: 0.95 })
        bg.stroke({ color: 0x2dd4bf, width: 1, alpha: 0.3 })
        this.addChild(bg)

        // Initialize eyes (more menacing)
        for (let i = 0; i < 6; i++) {
            this.eyes.push({
                x: 25 + (this.displayWidth - 50) * (i / 5),
                y: this.displayHeight - 32 + Math.random() * 12,
                size: 5 + Math.random() * 5,
                blinkTimer: Math.random() * 3,
                lookAngle: Math.random() * Math.PI * 2,
            })
        }

        this.addChild(this.abyss)
    }

    update(delta: number): void {
        this.time += delta

        const g = this.abyss
        g.clear()

        const abyssTop = this.displayHeight - 55
        const abyssHeight = 50

        // Base layer - dark abyss
        g.rect(10, abyssTop, this.displayWidth - 20, abyssHeight)
        g.fill({ color: 0x0f172a, alpha: 0.95 })

        // Wave surface with more menacing feel
        g.moveTo(10, abyssTop)
        for (let x = 10; x <= this.displayWidth - 10; x += 5) {
            const wave1 = Math.sin(x * 0.04 + this.time * 2) * 5
            const wave2 = Math.sin(x * 0.08 + this.time * 3) * 3
            g.lineTo(x, abyssTop + wave1 + wave2)
        }
        g.lineTo(this.displayWidth - 10, abyssTop + abyssHeight)
        g.lineTo(10, abyssTop + abyssHeight)
        g.closePath()
        g.fill({ color: 0x1e1b4b, alpha: 0.9 })

        // Ominous purple glow from below
        for (let i = 0; i < 3; i++) {
            const alpha = 0.15 - i * 0.04
            g.rect(10, abyssTop + 10 + i * 8, this.displayWidth - 20, 20)
            g.fill({ color: 0x6b21a8, alpha })
        }

        // Surface highlight
        g.moveTo(10, abyssTop)
        for (let x = 10; x <= this.displayWidth - 10; x += 5) {
            const wave1 = Math.sin(x * 0.04 + this.time * 2) * 5
            const wave2 = Math.sin(x * 0.08 + this.time * 3) * 3
            g.lineTo(x, abyssTop + wave1 + wave2)
        }
        g.lineTo(this.displayWidth - 10, abyssTop + 8)
        g.lineTo(10, abyssTop + 8)
        g.closePath()
        g.fill({ color: 0x7c3aed, alpha: 0.25 })

        // Dangerous tentacles rising from abyss
        const tentacleConfigs = [
            { x: 35, phase: 0, height: 35, width: 6 },
            { x: this.displayWidth / 2, phase: 1.5, height: 45, width: 8 },
            { x: this.displayWidth - 35, phase: 3, height: 30, width: 5 },
            { x: 70, phase: 2, height: 25, width: 4 },
            { x: this.displayWidth - 70, phase: 4, height: 28, width: 5 },
        ]

        for (const config of tentacleConfigs) {
            const baseX = config.x
            const baseY = this.displayHeight - 5
            const waveOffset = Math.sin(this.time * 2.5 + config.phase) * 8
            const heightPulse = config.height + Math.sin(this.time * 1.5 + config.phase) * 8

            // Tentacle path using bezier
            const tipX = baseX + waveOffset
            const tipY = abyssTop + 15 - heightPulse * 0.5
            const ctrlX = baseX + waveOffset * 0.5
            const ctrlY = (baseY + tipY) / 2

            // Glow
            g.moveTo(baseX - config.width, baseY)
            g.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY)
            g.quadraticCurveTo(ctrlX + config.width, ctrlY, baseX + config.width, baseY)
            g.closePath()
            g.fill({ color: 0x9333ea, alpha: 0.3 })

            // Main tentacle
            g.moveTo(baseX - config.width * 0.6, baseY)
            g.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY)
            g.quadraticCurveTo(ctrlX + config.width * 0.6, ctrlY, baseX + config.width * 0.6, baseY)
            g.closePath()
            g.fill({ color: 0x581c87, alpha: 0.85 })

            // Suction cups / nodes
            for (let i = 1; i < 4; i++) {
                const t = i / 4
                const nodeX = baseX + waveOffset * t
                const nodeY = baseY - heightPulse * t * 0.6
                const nodeSize = config.width * 0.3 * (1 - t * 0.5)
                g.circle(nodeX, nodeY, nodeSize)
                g.fill({ color: 0x7e22ce, alpha: 0.6 })
            }
        }

        // Draw menacing eyes
        for (const eye of this.eyes) {
            eye.blinkTimer -= delta
            if (eye.blinkTimer <= 0) {
                eye.blinkTimer = 2 + Math.random() * 3
                eye.lookAngle = Math.random() * Math.PI * 2
            }

            const isBlinking = eye.blinkTimer > 2.8
            const blinkScale = isBlinking ? 0.15 : 1

            // Eye glow
            g.ellipse(eye.x, eye.y, eye.size * 1.3, eye.size * 0.6 * blinkScale)
            g.fill({ color: 0xef4444, alpha: 0.3 })

            // Eye outer
            g.ellipse(eye.x, eye.y, eye.size, eye.size * 0.45 * blinkScale)
            g.fill({ color: 0xdc2626, alpha: 0.8 })

            // Pupil (slit-like, more menacing)
            if (!isBlinking) {
                const pupilX = eye.x + Math.cos(eye.lookAngle) * eye.size * 0.25
                const pupilY = eye.y + Math.sin(eye.lookAngle) * eye.size * 0.1
                g.ellipse(pupilX, pupilY, eye.size * 0.15, eye.size * 0.35)
                g.fill({ color: 0x000000, alpha: 0.95 })
            }
        }

        // Warning indicator
        const warningPulse = 0.6 + Math.sin(this.time * 5) * 0.4
        g.roundRect(this.displayWidth / 2 - 20, abyssTop - 20, 40, 16, 4)
        g.fill({ color: 0xef4444, alpha: 0.7 * warningPulse })

        // Skull icon hint
        g.circle(this.displayWidth / 2, abyssTop - 12, 4)
        g.fill({ color: 0xffffff, alpha: 0.8 * warningPulse })
    }
}

export interface WobblediverIntroCallbacks {
    onStart: () => void
    onSkip: () => void
}

export class WobblediverIntro {
    private container: Container
    private width: number
    private height: number
    private centerX: number
    private centerY: number

    private currentStep = 0
    private wobble: Wobble | null = null
    private animPhase = 0
    private isVisible = false

    // UI elements
    private contentContainer!: Container
    private skipButton!: Container
    private nextButton!: Container
    private dotsContainer!: Container

    // Preview displays
    private miniJellyfish: MiniJellyfishDisplay | null = null
    private miniWormhole: MiniWormholeDisplay | null = null
    private miniAbyss: MiniAbyssDisplay | null = null

    // Animations
    private titleAnimator: { update: (delta: number) => void } | null = null
    private messageAnimator: { update: (delta: number) => void } | null = null
    private buttonAnimator: { update: (time: number) => void } | null = null
    private animationsComplete = false

    // Callbacks
    private callbacks: WobblediverIntroCallbacks

    constructor(
        container: Container,
        width: number,
        height: number,
        callbacks: WobblediverIntroCallbacks
    ) {
        this.container = container
        this.width = width
        this.height = height
        this.centerX = width / 2
        this.centerY = height / 2
        this.callbacks = callbacks
    }

    get visible(): boolean {
        return this.isVisible
    }

    show(): void {
        this.isVisible = true
        this.currentStep = 0
        this.animPhase = 0
        this.container.visible = true
        this.createUI()
    }

    hide(): void {
        this.isVisible = false
        this.container.visible = false
        this.container.removeChildren()
    }

    resize(width: number, height: number): void {
        this.width = width
        this.height = height
        this.centerX = width / 2
        this.centerY = height / 2

        if (this.isVisible) {
            this.createUI()
        }
    }

    update(deltaSeconds: number): void {
        if (!this.isVisible) return

        this.animPhase += deltaSeconds

        // Wobble animation
        if (this.wobble) {
            const breathe = Math.sin(this.animPhase * 2.5) * 0.05
            const bounce = Math.sin(this.animPhase * 1.5) * 3
            this.wobble.updateOptions({
                wobblePhase: this.animPhase,
                scaleX: 1 + breathe,
                scaleY: 1 - breathe,
            })

            const step = INTRO_STEPS[this.currentStep]
            const hasEmbed = step.showJellyfish || step.showWormhole || step.showAbyss
            const wobbleY = hasEmbed ? this.centerY - 140 : this.centerY - 80
            this.wobble.y = wobbleY + bounce
        }

        // Update preview displays
        if (this.miniJellyfish) {
            this.miniJellyfish.update(deltaSeconds)
        }
        if (this.miniWormhole) {
            this.miniWormhole.update(deltaSeconds)
        }
        if (this.miniAbyss) {
            this.miniAbyss.update(deltaSeconds)
        }

        // Update text animations
        if (this.titleAnimator) {
            this.titleAnimator.update(deltaSeconds)
        }
        if (this.messageAnimator) {
            this.messageAnimator.update(deltaSeconds)
        }
        if (this.buttonAnimator && this.animationsComplete) {
            this.buttonAnimator.update(this.animPhase)
        }
    }

    private createUI(): void {
        this.container.removeChildren()

        // Reset animation state
        this.miniJellyfish = null
        this.miniWormhole = null
        this.miniAbyss = null
        this.titleAnimator = null
        this.messageAnimator = null
        this.buttonAnimator = null
        this.animationsComplete = false

        const step = INTRO_STEPS[this.currentStep]
        const isLastStep = this.currentStep === INTRO_STEPS.length - 1
        const hasEmbed = step.showJellyfish || step.showWormhole || step.showAbyss

        // Theme colors - deep sea teal (matching depth 1)
        const bgColor = 0x051a1f
        const textColor = 0xcccccc
        const accentColor = 0x2dd4bf // Teal
        const cardColor = 0x0a2a30

        // Background
        const bg = new Graphics()
        bg.rect(0, 0, this.width, this.height)
        bg.fill(bgColor)
        this.container.addChild(bg)

        // Floating particles - bioluminescent
        for (let i = 0; i < 25; i++) {
            const particle = new Graphics()
            const x = Math.random() * this.width
            const y = Math.random() * this.height
            const size = Math.random() * 2 + 1
            const alpha = Math.random() * 0.3 + 0.1
            particle.circle(x, y, size)
            particle.fill({ color: 0x2dd4bf, alpha })
            this.container.addChild(particle)
        }

        // Gradient at bottom (the abyss below)
        const abyssGrad = new Graphics()
        for (let i = 0; i < 5; i++) {
            const y = this.height - 120 + i * 24
            const alpha = 0.1 + i * 0.15
            abyssGrad.rect(0, y, this.width, 24)
            abyssGrad.fill({ color: 0x0f172a, alpha })
        }
        this.container.addChild(abyssGrad)

        // Subtle eyes hint at bottom
        for (let i = 0; i < 3; i++) {
            const eyeX = this.width * (0.2 + i * 0.3)
            const eyeY = this.height - 25 - Math.random() * 15
            const eye = new Graphics()
            eye.ellipse(eyeX, eyeY, 5, 2.5)
            eye.fill({ color: 0xdc2626, alpha: 0.25 })
            eye.circle(eyeX, eyeY, 1.5)
            eye.fill({ color: 0x000000, alpha: 0.4 })
            this.container.addChild(eye)
        }

        // Content container
        this.contentContainer = new Container()
        this.container.addChild(this.contentContainer)

        // Wobble character
        const wobbleSize = hasEmbed ? 50 : 70
        const wobbleY = hasEmbed ? this.centerY - 140 : this.centerY - 80

        this.wobble = new Wobble({
            size: wobbleSize,
            shape: 'circle',
            expression: step.wobbleExpression,
            color: 0xf5b041,
            showShadow: true,
        })
        this.wobble.position.set(this.centerX, wobbleY)
        this.contentContainer.addChild(this.wobble)

        // Speech bubble / card
        const cardWidth = this.width - 60
        const cardHeight = hasEmbed ? 280 : 160
        const cardY = hasEmbed ? this.centerY - 50 : this.centerY + 40

        const card = new Graphics()
        card.roundRect(this.centerX - cardWidth / 2, cardY, cardWidth, cardHeight, 20)
        card.fill({ color: cardColor, alpha: 0.95 })
        card.stroke({ color: accentColor, width: 1, alpha: 0.3 })
        this.contentContainer.addChild(card)

        // Bubble pointer
        const pointer = new Graphics()
        pointer.moveTo(this.centerX - 15, cardY)
        pointer.lineTo(this.centerX, cardY - 20)
        pointer.lineTo(this.centerX + 15, cardY)
        pointer.closePath()
        pointer.fill({ color: cardColor, alpha: 0.95 })
        this.contentContainer.addChild(pointer)

        // Title
        const titleY = cardY + 24
        const title = new Text({
            text: '',
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: hasEmbed ? 15 : 17,
                fontWeight: 'bold',
                fill: accentColor,
            }),
        })
        title.anchor.set(0.5)
        title.position.set(this.centerX, titleY)
        this.contentContainer.addChild(title)

        // Typewriter animation for title
        const titleText = i18n.t(step.titleKey)
        this.titleAnimator = TextAnimator.typewriter(title, titleText, 0.6, () => {
            this.animationsComplete = true
        })

        // Embed display area
        let contentY = titleY + 24
        if (hasEmbed) {
            const embedWidth = cardWidth - 40
            const embedHeight = 130
            const embedY = contentY + 5

            if (step.showJellyfish) {
                this.miniJellyfish = new MiniJellyfishDisplay(embedWidth, embedHeight)
                this.miniJellyfish.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniJellyfish)
            } else if (step.showWormhole) {
                this.miniWormhole = new MiniWormholeDisplay(embedWidth, embedHeight)
                this.miniWormhole.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniWormhole)
            } else if (step.showAbyss) {
                this.miniAbyss = new MiniAbyssDisplay(embedWidth, embedHeight)
                this.miniAbyss.position.set(this.centerX - embedWidth / 2, embedY)
                this.contentContainer.addChild(this.miniAbyss)
            }

            contentY = embedY + embedHeight + 12
        }

        // Message container with fade-in animation
        const messageContainer = new Container()
        const messageText = i18n.t(step.messageKey)
        const message = new Text({
            text: messageText,
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 13,
                fill: textColor,
                align: 'center',
                lineHeight: 20,
            }),
        })
        message.anchor.set(0.5, 0)
        messageContainer.addChild(message)
        messageContainer.position.set(this.centerX, contentY)
        this.contentContainer.addChild(messageContainer)

        // Fade-in animation for message
        this.messageAnimator = TextAnimator.fadeSlideUp(messageContainer, contentY, 0.5, 0.3)

        // Progress dots
        this.dotsContainer = new Container()
        this.dotsContainer.position.set(this.centerX, cardY + cardHeight + 25)
        this.container.addChild(this.dotsContainer)

        const dotGap = 14
        const totalDotsWidth = (INTRO_STEPS.length - 1) * dotGap

        INTRO_STEPS.forEach((_, i) => {
            const dot = new Graphics()
            const dotX = -totalDotsWidth / 2 + i * dotGap
            const isCurrent = i === this.currentStep
            dot.circle(dotX, 0, isCurrent ? 5 : 3)
            dot.fill({
                color: isCurrent ? accentColor : textColor,
                alpha: isCurrent ? 1 : 0.4,
            })
            this.dotsContainer.addChild(dot)
        })

        // Skip button (top right) - always visible
        this.skipButton = new Container()
        this.skipButton.position.set(this.width - 50, 40)
        this.skipButton.eventMode = 'static'
        this.skipButton.cursor = 'pointer'

        const skipBg = new Graphics()
        skipBg.roundRect(-35, -14, 70, 28, 14)
        skipBg.fill({ color: 0x000000, alpha: 0.3 })
        this.skipButton.addChild(skipBg)

        const skipText = new Text({
            text: i18n.t('wobblediver.buttons.skip'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 12,
                fill: textColor,
            }),
        })
        skipText.anchor.set(0.5)
        this.skipButton.addChild(skipText)

        this.skipButton.on('pointerdown', () => {
            this.skipButton.scale.set(0.95)
        })
        this.skipButton.on('pointerup', () => {
            this.skipButton.scale.set(1)
            this.skip()
        })
        this.skipButton.on('pointerupoutside', () => {
            this.skipButton.scale.set(1)
        })
        this.container.addChild(this.skipButton)

        // Next/Start button
        const btnWidth = isLastStep ? 140 : 110
        const btnHeight = 40
        const btnY = this.height - 90

        this.nextButton = new Container()
        this.nextButton.position.set(this.centerX, btnY)
        this.nextButton.eventMode = 'static'
        this.nextButton.cursor = 'pointer'

        const btnBg = new Graphics()
        btnBg.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 20)
        btnBg.fill(accentColor)
        this.nextButton.addChild(btnBg)

        const btnText = new Text({
            text: isLastStep
                ? i18n.t('wobblediver.buttons.start')
                : i18n.t('wobblediver.buttons.next'),
            style: new TextStyle({
                fontFamily: 'Arial, sans-serif',
                fontSize: 14,
                fontWeight: 'bold',
                fill: 0x000000,
            }),
        })
        btnText.anchor.set(0.5)
        this.nextButton.addChild(btnText)

        // Button pulse animation
        this.buttonAnimator = TextAnimator.pulse(this.nextButton)

        this.nextButton.on('pointerdown', () => {
            this.nextButton.scale.set(0.95)
        })
        this.nextButton.on('pointerup', () => {
            this.nextButton.scale.set(1)
            if (isLastStep) {
                this.complete()
            } else {
                this.nextStep()
            }
        })
        this.nextButton.on('pointerupoutside', () => {
            this.nextButton.scale.set(1)
        })

        this.container.addChild(this.nextButton)

        // Tap anywhere to continue (except buttons)
        const tapArea = new Graphics()
        tapArea.rect(0, 60, this.width, this.height - 160)
        tapArea.fill({ color: 0x000000, alpha: 0.001 })
        tapArea.eventMode = 'static'
        tapArea.on('pointerup', () => {
            if (!isLastStep) {
                this.nextStep()
            }
        })
        this.container.addChildAt(tapArea, this.container.children.length - 2)
    }

    private nextStep(): void {
        if (this.currentStep < INTRO_STEPS.length - 1) {
            this.currentStep++
            this.createUI()
        }
    }

    private skip(): void {
        this.hide()
        this.callbacks.onSkip()
    }

    private complete(): void {
        this.hide()
        this.callbacks.onStart()
    }
}
